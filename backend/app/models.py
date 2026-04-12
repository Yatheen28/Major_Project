"""
Pydantic v2 models for the CyberIntel API.

Defines request/response schemas for complaint ingestion, entity extraction,
timeline reconstruction, and case management.
"""

from pydantic import BaseModel, Field
from typing import Optional


# ---------------------------------------------------------------------------
# Entity & Timeline models
# ---------------------------------------------------------------------------

class EntityOut(BaseModel):
    """A single extracted named entity with span information and confidence."""
    entity_type: str = Field(..., description="Category of the entity, e.g. PHONE_NUMBER, UPI_ID")
    value: str = Field(..., description="The extracted entity value")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Extraction confidence score")
    start_idx: int = Field(..., description="Start character index in the source text")
    end_idx: int = Field(..., description="End character index in the source text")


class TimelineEvent(BaseModel):
    """A single event on the reconstructed investigation timeline."""
    timestamp: str = Field(..., description="Date/time string extracted from the complaint")
    action_context: str = Field(..., description="Surrounding text providing context for the event")
    entities_referenced: list[str] = Field(default_factory=list, description="Entity values mentioned in the context window")
    is_uncertain: bool = Field(default=False, description="Whether the date is ambiguous or relative")
    uncertainty_reason: str = Field(default="", description="Explanation of why the date is uncertain")


# ---------------------------------------------------------------------------
# Case models
# ---------------------------------------------------------------------------

class CaseOut(BaseModel):
    """Full case record returned after ingestion or individual case retrieval."""
    case_id: str = Field(..., description="Unique case identifier, e.g. CYB-A1B2C3D4")
    sha256_hash: str = Field(..., description="SHA-256 digest of the raw complaint text")
    submitted_at: str = Field(..., description="ISO-8601 UTC timestamp of ingestion")
    submitted_by: str = Field(..., description="Name or badge of the submitting officer")
    raw_text: str = Field(..., description="Original complaint text as submitted")
    entities: list[EntityOut] = Field(default_factory=list, description="All extracted entities")
    timeline: list[TimelineEvent] = Field(default_factory=list, description="Reconstructed event timeline")
    entity_counts: dict[str, int] = Field(default_factory=dict, description="Count of entities grouped by type")
    status: str = Field(default="PROCESSED", description="Processing status of the case")


class CaseSummary(BaseModel):
    """Abbreviated case record for list views."""
    case_id: str
    sha256_hash: str
    submitted_at: str
    submitted_by: str
    preview_text: str = Field(..., description="First 200 characters of the complaint text")
    entity_counts: dict[str, int] = Field(default_factory=dict)
    status: str = Field(default="PROCESSED")


# ---------------------------------------------------------------------------
# Request models
# ---------------------------------------------------------------------------

class ComplaintIn(BaseModel):
    """Incoming complaint submission payload."""
    text: str = Field(..., min_length=20, description="Raw complaint text (minimum 20 characters)")
    submitted_by: str = Field(default="investigator", description="Submitting officer name or badge ID")


# ---------------------------------------------------------------------------
# System / utility response models
# ---------------------------------------------------------------------------

class HealthResponse(BaseModel):
    """API health check response."""
    status: str = Field(default="ok")
    version: str = Field(default="0.1.0")
    total_cases: int = Field(default=0)


class StatsResponse(BaseModel):
    """Aggregate statistics across all cases."""
    total_cases: int = Field(default=0, description="Total number of ingested cases")
    total_entities: int = Field(default=0, description="Sum of all extracted entities across cases")
    by_type: dict[str, int] = Field(default_factory=dict, description="Entity counts aggregated by type")
