"""
CyberIntel API — FastAPI Application

AI-Assisted Cybercrime Investigation and Forensic Intelligence System
Phase I+II — Regex NER Pipeline, SHA-256 Evidence Hashing, Neo4j Correlation

Endpoints:
    POST /api/ingest                  — Ingest a complaint and extract entities
    GET  /api/cases                   — List all cases (summaries, newest first)
    GET  /api/cases/{case_id}         — Retrieve full case record
    GET  /api/cases/{case_id}/verify  — Verify SHA-256 hash integrity
    GET  /api/cases/{case_id}/links   — Find cases linked via shared entities
    GET  /api/cases/{case_id}/risk    — Risk scores for entities in this case
    GET  /api/stats                   — Aggregate entity statistics
    GET  /api/health                  — Health check
"""

from fastapi import FastAPI, File, Form, HTTPException, Query, UploadFile, Depends
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
import logging
import uuid

from app import models, hasher, extractor, timeline, graph_engine, certificate, ocr_engine
from app import repository
from app.database import get_db
from app.case_store import store  # kept as fallback until all routes are verified on PG

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Application factory
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(application: FastAPI):
    """Startup/shutdown lifecycle — closes Neo4j driver on exit."""
    yield
    graph_engine.close_driver()


app = FastAPI(
    title="CyberIntel API",
    description=(
        "AI-Assisted Cybercrime Investigation and Forensic Intelligence System — Phase I+II. "
        "Provides regex-based Named Entity Recognition for Hinglish cybercrime complaints, "
        "SHA-256 evidence hashing (BSA 2023 §63), chronological timeline reconstruction, "
        "and Neo4j-based cross-case entity correlation."
    ),
    version="0.2.0",
    lifespan=lifespan,
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
async def ingest_complaint(complaint: models.ComplaintIn, db: AsyncSession = Depends(get_db)):
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

    await repository.save_case(db, case)

    # Step 8: Sync to Neo4j graph for cross-case correlation
    try:
        graph_engine.sync_case_to_graph(case)
    except Exception as exc:
        # Non-fatal — the case is already saved locally; log and continue
        logger.warning("Neo4j sync failed for %s: %s", case_id, exc)

    return case


# ---------------------------------------------------------------------------
# POST /api/ingest/upload  (OCR — photo/PDF ingestion)
# ---------------------------------------------------------------------------

@app.post("/api/ingest/upload", response_model=models.CaseOut)
async def ingest_upload(
    file: UploadFile = File(..., description="Photo (JPEG/PNG) or PDF of a complaint"),
    submitted_by: str = Form(default="investigator", description="Submitting officer"),
    db: AsyncSession = Depends(get_db),
):
    """
    Ingest a complaint from an uploaded photo or PDF.

    Extracts text via OCR (images) or PDF text extraction, then feeds
    the result into the same pipeline as POST /api/ingest.
    """
    # Read file bytes
    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    # Extract text
    try:
        extracted_text = ocr_engine.extract_text_from_file(
            file_bytes,
            content_type=file.content_type or "",
            filename=file.filename or "unknown",
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        logger.error("OCR extraction failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"OCR extraction failed: {exc}")

    if len(extracted_text) < 20:
        raise HTTPException(
            status_code=422,
            detail=f"Extracted text too short ({len(extracted_text)} chars). "
                   f"Minimum 20 characters required. The file may not contain readable text.",
        )

    # Feed into the SAME pipeline as text-based ingest
    case_id = "CYB-" + uuid.uuid4().hex[:8].upper()
    sha256_hash = hasher.compute_sha256(extracted_text)
    entities = extractor.extract_entities(extracted_text)

    entity_counts: dict[str, int] = {}
    for entity in entities:
        entity_counts[entity.entity_type] = entity_counts.get(entity.entity_type, 0) + 1

    tl = timeline.build_timeline(extracted_text, entities)
    submitted_at = datetime.utcnow().isoformat() + "Z"

    case = models.CaseOut(
        case_id=case_id,
        sha256_hash=sha256_hash,
        submitted_at=submitted_at,
        submitted_by=submitted_by,
        raw_text=extracted_text,
        entities=entities,
        timeline=tl,
        entity_counts=entity_counts,
        status="PROCESSED",
    )

    await repository.save_case(db, case)

    try:
        graph_engine.sync_case_to_graph(case)
    except Exception as exc:
        logger.warning("Neo4j sync failed for %s: %s", case_id, exc)

    return case


# ---------------------------------------------------------------------------
# GET /api/cases
# ---------------------------------------------------------------------------

@app.get("/api/cases", response_model=list[models.CaseSummary])
async def list_cases(db: AsyncSession = Depends(get_db)):
    """Return all cases as lightweight summaries, newest first."""
    return await repository.get_all_cases(db)


# ---------------------------------------------------------------------------
# GET /api/cases/{case_id}
# ---------------------------------------------------------------------------

@app.get("/api/cases/{case_id}", response_model=models.CaseOut)
async def get_case(case_id: str, db: AsyncSession = Depends(get_db)):
    """Retrieve the full case record by ID."""
    case = await repository.get_case(db, case_id)
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
    db: AsyncSession = Depends(get_db)
):
    """
    Verify the integrity of a case's evidence hash.

    Compares the stored SHA-256 hash with a user-provided hash to confirm
    that the complaint text has not been tampered with since ingestion.
    """
    case = await repository.get_case(db, case_id)
    if case is None:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found")

    verified = case.sha256_hash.upper() == expected_hash.strip().upper()

    return {
        "verified": verified,
        "case_id": case_id,
        "stored_hash": case.sha256_hash,
        "provided_hash": expected_hash.strip().upper(),
    }


@app.get("/api/stats", response_model=models.StatsResponse)
async def get_stats(db: AsyncSession = Depends(get_db)):
    """Return aggregate entity statistics across all cases."""
    return await repository.get_stats(db)


# ---------------------------------------------------------------------------
# GET /api/health
# ---------------------------------------------------------------------------

@app.get("/api/health", response_model=models.HealthResponse)
async def health_check(db: AsyncSession = Depends(get_db)):
    """API health check and system status."""
    total = await repository.get_total_cases(db)
    return models.HealthResponse(
        status="ok",
        version="0.2.0",
        total_cases=total,
    )


# ---------------------------------------------------------------------------
# GET /api/cases/{case_id}/links
# ---------------------------------------------------------------------------

@app.get("/api/cases/{case_id}/links", response_model=list[models.LinkedCase])
async def get_linked_cases(case_id: str, db: AsyncSession = Depends(get_db)):
    """Find cases linked via shared forensic entities."""
    case = await repository.get_case(db, case_id)
    if case is None:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found")
    try:
        return graph_engine.find_linked_cases(case_id)
    except Exception as exc:
        logger.error("Neo4j query failed for links on %s: %s", case_id, exc)
        raise HTTPException(status_code=503, detail="Graph database unavailable")


# ---------------------------------------------------------------------------
# GET /api/cases/{case_id}/risk
# ---------------------------------------------------------------------------

@app.get("/api/cases/{case_id}/risk", response_model=list[models.RiskScoreOut])
async def get_risk_scores(case_id: str, db: AsyncSession = Depends(get_db)):
    """Risk scores for all correlatable entities in this case."""
    case = await repository.get_case(db, case_id)
    if case is None:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found")
    try:
        return graph_engine.compute_risk_scores(case_id)
    except Exception as exc:
        logger.error("Neo4j query failed for risk on %s: %s", case_id, exc)
        raise HTTPException(status_code=503, detail="Graph database unavailable")


# ---------------------------------------------------------------------------
# GET /api/cases/{case_id}/certificate
# ---------------------------------------------------------------------------

@app.get("/api/cases/{case_id}/certificate")
async def get_certificate(case_id: str, db: AsyncSession = Depends(get_db)):
    """
    Generate and return a BSA 2023 §63 evidence certificate as PDF.

    Part A is auto-filled with case metadata and SHA-256 hash.
    Part B is a blank signature block for the certifying expert.
    """
    case = await repository.get_case(db, case_id)
    if case is None:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found")

    pdf_bytes = certificate.generate_certificate(case)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'inline; filename="BSA_Certificate_{case_id}.pdf"'
        },
    )
