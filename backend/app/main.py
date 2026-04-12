"""
CyberIntel API — FastAPI Application

AI-Assisted Cybercrime Investigation and Forensic Intelligence System
Phase I — Regex NER Pipeline, SHA-256 Evidence Hashing, In-Memory Storage

Endpoints:
    POST /api/ingest          — Ingest a complaint and extract entities
    GET  /api/cases           — List all cases (summaries, newest first)
    GET  /api/cases/{case_id} — Retrieve full case record
    GET  /api/cases/{case_id}/verify — Verify SHA-256 hash integrity
    GET  /api/stats           — Aggregate entity statistics
    GET  /api/health          — Health check
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import uuid

from app import models, hasher, extractor, timeline
from app.case_store import store


# ---------------------------------------------------------------------------
# Application factory
# ---------------------------------------------------------------------------

app = FastAPI(
    title="CyberIntel API",
    description=(
        "AI-Assisted Cybercrime Investigation and Forensic Intelligence System — Phase I. "
        "Provides regex-based Named Entity Recognition for Hinglish cybercrime complaints, "
        "SHA-256 evidence hashing (BSA 2023 §63), and chronological timeline reconstruction."
    ),
    version="0.1.0",
)

# CORS — allow the Vite dev server and common local origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# POST /api/ingest
# ---------------------------------------------------------------------------

@app.post("/api/ingest", response_model=models.CaseOut)
async def ingest_complaint(complaint: models.ComplaintIn):
    """
    Ingest a cybercrime complaint.

    Pipeline:
        1. Validate text length (≥20 characters enforced by Pydantic)
        2. Generate unique case ID
        3. Compute SHA-256 hash of the raw text
        4. Extract entities using the regex NER engine
        5. Aggregate entity counts by type
        6. Build chronological timeline
        7. Persist and return the full case record
    """
    # Step 1–2: Generate case ID
    case_id = "CYB-" + uuid.uuid4().hex[:8].upper()

    # Step 3: Evidence hash
    sha256_hash = hasher.compute_sha256(complaint.text)

    # Step 4: Entity extraction
    entities = extractor.extract_entities(complaint.text)

    # Step 5: Aggregate counts
    entity_counts: dict[str, int] = {}
    for entity in entities:
        entity_counts[entity.entity_type] = entity_counts.get(entity.entity_type, 0) + 1

    # Step 6: Timeline reconstruction
    tl = timeline.build_timeline(complaint.text, entities)

    # Step 7: Build case record
    submitted_at = datetime.utcnow().isoformat() + "Z"

    case = models.CaseOut(
        case_id=case_id,
        sha256_hash=sha256_hash,
        submitted_at=submitted_at,
        submitted_by=complaint.submitted_by,
        raw_text=complaint.text,
        entities=entities,
        timeline=tl,
        entity_counts=entity_counts,
        status="PROCESSED",
    )

    store.save_case(case)
    return case


# ---------------------------------------------------------------------------
# GET /api/cases
# ---------------------------------------------------------------------------

@app.get("/api/cases", response_model=list[models.CaseSummary])
async def list_cases():
    """Return all cases as lightweight summaries, newest first."""
    return store.get_all_cases()


# ---------------------------------------------------------------------------
# GET /api/cases/{case_id}
# ---------------------------------------------------------------------------

@app.get("/api/cases/{case_id}", response_model=models.CaseOut)
async def get_case(case_id: str):
    """Retrieve the full case record by ID."""
    case = store.get_case(case_id)
    if case is None:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found")
    return case


# ---------------------------------------------------------------------------
# GET /api/cases/{case_id}/verify
# ---------------------------------------------------------------------------

@app.get("/api/cases/{case_id}/verify")
async def verify_case_hash(
    case_id: str,
    expected_hash: str = Query(..., description="SHA-256 hash to verify against"),
):
    """
    Verify the integrity of a case's evidence hash.

    Compares the stored SHA-256 hash with a user-provided hash to confirm
    that the complaint text has not been tampered with since ingestion.
    """
    case = store.get_case(case_id)
    if case is None:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found")

    verified = case.sha256_hash.upper() == expected_hash.strip().upper()

    return {
        "verified": verified,
        "case_id": case_id,
        "stored_hash": case.sha256_hash,
        "provided_hash": expected_hash.strip().upper(),
    }


# ---------------------------------------------------------------------------
# GET /api/stats
# ---------------------------------------------------------------------------

@app.get("/api/stats", response_model=models.StatsResponse)
async def get_stats():
    """Return aggregate entity statistics across all cases."""
    return store.get_stats()


# ---------------------------------------------------------------------------
# GET /api/health
# ---------------------------------------------------------------------------

@app.get("/api/health", response_model=models.HealthResponse)
async def health_check():
    """API health check and system status."""
    return models.HealthResponse(
        status="ok",
        version="0.1.0",
        total_cases=store.total_cases,
    )
