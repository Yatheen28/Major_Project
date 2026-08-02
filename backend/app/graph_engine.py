"""
Neo4j Aura correlation engine — Phase A2.

Manages the Neo4j graph that connects complaints to shared forensic entities.
Uses MERGE (not CREATE) so re-ingesting the same phone/UPI ID reuses the
existing node, making cross-case correlation automatic.

Graph schema (Chapter 4, mentor-confirmed):
    Nodes:  :Complaint, :PhoneNumber, :UPI_ID, :URL, :TransactionID, :BankAccount
    Rels:   (:Complaint)-[:CONTAINS]->(:entity)
"""

import os
import logging
from dotenv import load_dotenv
from neo4j import GraphDatabase
from neo4j.exceptions import DriverError, Neo4jError

from app.models import CaseOut, LinkedCase, RiskScoreOut

logger = logging.getLogger(__name__)

# Load .env from backend/ directory
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

# ---------------------------------------------------------------------------
# Entity type → Neo4j label mapping
# ---------------------------------------------------------------------------
_ENTITY_TYPE_TO_LABEL: dict[str, str] = {
    "PHONE_NUMBER": "PhoneNumber",
    "UPI_ID": "UPI_ID",
    "URL": "URL",
    "TRANSACTION_ID": "TransactionID",
    "BANK_ACCOUNT": "BankAccount",
}

# Entity types that participate in correlation (exclude DATE, AMOUNT —
# they're too common to be meaningful link indicators)
_CORRELATABLE_TYPES = set(_ENTITY_TYPE_TO_LABEL.keys())


# ---------------------------------------------------------------------------
# Driver singleton
# ---------------------------------------------------------------------------
_driver = None


def _get_driver():
    """Return a singleton Neo4j driver instance."""
    global _driver
    if _driver is None:
        uri = os.getenv("NEO4J_URI")
        user = os.getenv("NEO4J_USERNAME")
        password = os.getenv("NEO4J_PASSWORD")
        if not all([uri, user, password]):
            raise RuntimeError(
                "Missing NEO4J_URI / NEO4J_USERNAME / NEO4J_PASSWORD in .env"
            )
        _driver = GraphDatabase.driver(
            uri,
            auth=(user, password),
            connection_timeout=5,              # 5s TCP connect (default 30s)
            max_transaction_retry_time=3,      # 3s retry ceiling (default 30s)
            connection_acquisition_timeout=5,  # 5s pool wait  (default 60s)
        )
        logger.info("Neo4j driver created for %s (fast-fail timeouts)", uri)
    return _driver


def close_driver():
    """Close the Neo4j driver — call on application shutdown."""
    global _driver
    if _driver is not None:
        _driver.close()
        _driver = None
        logger.info("Neo4j driver closed")


# ---------------------------------------------------------------------------
# Graph ingestion
# ---------------------------------------------------------------------------

def sync_case_to_graph(case: CaseOut) -> None:
    """
    MERGE a Complaint node and its extracted entities into the Neo4j graph.

    For each correlatable entity extracted from the complaint:
      1. MERGE the entity node (by label + value) — reuses if already exists
      2. MERGE a :CONTAINS relationship from the Complaint to the entity

    This is what makes cross-case correlation automatic: if two complaints
    share a phone number, they both point to the same :PhoneNumber node.
    """
    driver = _get_driver()
    database = os.getenv("NEO4J_DATABASE", "neo4j")

    # MERGE the Complaint node
    driver.execute_query(
        "MERGE (c:Complaint {case_id: $case_id}) "
        "SET c.ingested_at = $ingested_at, c.submitted_by = $submitted_by",
        case_id=case.case_id,
        ingested_at=case.submitted_at,
        submitted_by=case.submitted_by,
        database_=database,
    )

    # MERGE each correlatable entity + CONTAINS relationship
    for entity in case.entities:
        if entity.entity_type not in _CORRELATABLE_TYPES:
            continue

        label = _ENTITY_TYPE_TO_LABEL[entity.entity_type]

        # Use a parameterized Cypher with dynamic label via APOC-free approach:
        # We build separate queries per label (safe — labels come from our own
        # constant map, not user input).
        query = (
            f"MERGE (e:{label} {{value: $value}}) "
            f"WITH e "
            f"MATCH (c:Complaint {{case_id: $case_id}}) "
            f"MERGE (c)-[:CONTAINS]->(e)"
        )
        driver.execute_query(
            query,
            value=entity.value,
            case_id=case.case_id,
            database_=database,
        )

    logger.info("Synced case %s to Neo4j (%d entities)", case.case_id, len(case.entities))


# ---------------------------------------------------------------------------
# Correlation queries
# ---------------------------------------------------------------------------

def find_linked_cases(case_id: str) -> list[LinkedCase]:
    """
    Find other cases that share at least one entity with the given case.

    Cypher: match the case's entities, find other Complaint nodes connected
    to the same entity nodes, compute risk score per shared entity.
    """
    driver = _get_driver()
    database = os.getenv("NEO4J_DATABASE", "neo4j")

    query = """
    MATCH (c:Complaint {case_id: $case_id})-[:CONTAINS]->(e)<-[:CONTAINS]-(other:Complaint)
    WHERE other.case_id <> $case_id
    WITH other.case_id AS linked_case_id, e.value AS entity_value, labels(e) AS entity_labels, e
    // Count how many distinct complaints reference this entity (for risk score)
    OPTIONAL MATCH (e)<-[:CONTAINS]-(all_c:Complaint)
    WITH linked_case_id, entity_value, entity_labels,
         count(DISTINCT all_c) AS case_count
    RETURN linked_case_id, entity_value, entity_labels, case_count
    ORDER BY case_count DESC
    """

    records, _, _ = driver.execute_query(
        query, case_id=case_id, database_=database
    )

    results: list[LinkedCase] = []
    for record in records:
        # Map Neo4j label back to our entity type string
        labels = record["entity_labels"]
        entity_type = _label_to_entity_type(labels)
        case_count = record["case_count"]
        risk = min(100.0, case_count * 15.0)

        results.append(LinkedCase(
            case_id=record["linked_case_id"],
            shared_entity_value=record["entity_value"],
            shared_entity_type=entity_type,
            risk_score=risk,
        ))

    return results


def compute_risk_scores(case_id: str) -> list[RiskScoreOut]:
    """
    Compute risk scores for all correlatable entities in the given case.

    Risk formula (v1, simple and defensible):
        risk_score = min(100, case_count * 15)
    where case_count = number of distinct complaints referencing this entity.
    """
    driver = _get_driver()
    database = os.getenv("NEO4J_DATABASE", "neo4j")

    query = """
    MATCH (c:Complaint {case_id: $case_id})-[:CONTAINS]->(e)
    OPTIONAL MATCH (e)<-[:CONTAINS]-(all_c:Complaint)
    WITH e.value AS entity_value, labels(e) AS entity_labels,
         count(DISTINCT all_c) AS case_count
    RETURN entity_value, entity_labels, case_count
    ORDER BY case_count DESC
    """

    records, _, _ = driver.execute_query(
        query, case_id=case_id, database_=database
    )

    results: list[RiskScoreOut] = []
    for record in records:
        labels = record["entity_labels"]
        entity_type = _label_to_entity_type(labels)
        case_count = record["case_count"]
        risk = min(100.0, case_count * 15.0)
        # degree_centrality: fraction of all complaints that reference this entity
        # (approximation — uses case_count as numerator; total complaints as denominator)
        # We'll compute total complaints inline for simplicity
        degree = case_count  # raw degree; normalized later if needed

        results.append(RiskScoreOut(
            entity_value=record["entity_value"],
            entity_type=entity_type,
            case_count=case_count,
            degree_centrality=float(degree),
            risk_score=risk,
        ))

    return results


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _label_to_entity_type(labels: list[str]) -> str:
    """Convert Neo4j node labels back to our entity type string."""
    # Reverse lookup from our mapping
    label_to_type = {v: k for k, v in _ENTITY_TYPE_TO_LABEL.items()}
    for label in labels:
        if label in label_to_type:
            return label_to_type[label].lower()
    return "unknown"
