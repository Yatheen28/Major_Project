"""
Unit tests for the async repository layer.

Tests run against the real Supabase PostgreSQL database configured via
DATABASE_URL in .env.  Each test uses a fresh transaction that is
rolled back at the end, keeping the DB clean.
"""

from __future__ import annotations

import uuid
import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal, engine
from app.db_models import Base
from app.models import CaseOut, EntityOut, TimelineEvent as TimelineEventSchema
from app import repository


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture
async def db() -> AsyncSession:
    """
    Provide a transactional DB session.

    Opens a connection, begins a transaction, binds a session to it,
    then rolls back after the test — so nothing is permanently written.
    """
    async with engine.connect() as connection:
        transaction = await connection.begin()
        session = AsyncSession(bind=connection, expire_on_commit=False)
        try:
            yield session
        finally:
            await session.close()
            await transaction.rollback()


def _make_case(
    *,
    case_id: str | None = None,
    raw_text: str = "Someone stole my UPI credentials via a phishing link sent on WhatsApp.",
    submitted_by: str = "officer_test",
    entities: list[EntityOut] | None = None,
    timeline: list[TimelineEventSchema] | None = None,
) -> CaseOut:
    """Build a minimal CaseOut for testing."""
    if case_id is None:
        case_id = "CYB-" + uuid.uuid4().hex[:8].upper()

    if entities is None:
        entities = [
            EntityOut(
                entity_type="UPI_ID",
                value="victim@upi",
                confidence=0.95,
                start_idx=20,
                end_idx=30,
            ),
            EntityOut(
                entity_type="PHONE_NUMBER",
                value="9876543210",
                confidence=0.9,
                start_idx=50,
                end_idx=60,
            ),
        ]

    if timeline is None:
        timeline = [
            TimelineEventSchema(
                timestamp="2026-07-15",
                action_context="Received phishing link on WhatsApp",
                entities_referenced=["victim@upi"],
                is_uncertain=False,
                uncertainty_reason="",
            ),
        ]

    entity_counts: dict[str, int] = {}
    for e in entities:
        entity_counts[e.entity_type] = entity_counts.get(e.entity_type, 0) + 1

    return CaseOut(
        case_id=case_id,
        sha256_hash="a" * 64,
        submitted_at="2026-07-30T12:00:00Z",
        submitted_by=submitted_by,
        raw_text=raw_text,
        entities=entities,
        timeline=timeline,
        entity_counts=entity_counts,
        status="PROCESSED",
    )


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_save_and_get_case(db: AsyncSession):
    """save_case() followed by get_case() should return an identical record."""
    case_in = _make_case()

    await repository.save_case(db, case_in)
    result = await repository.get_case(db, case_in.case_id)

    assert result is not None
    assert result.case_id == case_in.case_id
    assert result.sha256_hash == case_in.sha256_hash
    assert result.submitted_by == case_in.submitted_by
    assert result.raw_text == case_in.raw_text
    assert result.status == case_in.status

    # Entities round-trip
    assert len(result.entities) == len(case_in.entities)
    result_entity_values = {e.value for e in result.entities}
    input_entity_values = {e.value for e in case_in.entities}
    assert result_entity_values == input_entity_values

    # Timeline round-trip
    assert len(result.timeline) == len(case_in.timeline)
    assert result.timeline[0].action_context == case_in.timeline[0].action_context


@pytest.mark.asyncio
async def test_get_case_not_found(db: AsyncSession):
    """get_case() for a non-existent ID should return None."""
    result = await repository.get_case(db, "CYB-NONEXISTENT")
    assert result is None


@pytest.mark.asyncio
async def test_get_all_cases_ordering(db: AsyncSession):
    """get_all_cases() should return summaries newest-first."""
    case1 = _make_case(case_id="CYB-FIRST001")
    case1_dict = case1.model_dump()
    case1_dict["submitted_at"] = "2026-07-01T10:00:00Z"
    case1 = CaseOut(**case1_dict)

    case2 = _make_case(case_id="CYB-SECOND02")
    case2_dict = case2.model_dump()
    case2_dict["submitted_at"] = "2026-07-30T10:00:00Z"
    case2 = CaseOut(**case2_dict)

    await repository.save_case(db, case1)
    await repository.save_case(db, case2)

    summaries = await repository.get_all_cases(db)
    assert len(summaries) >= 2

    # The second case (newer) should appear first
    case_ids = [s.case_id for s in summaries]
    idx1 = case_ids.index("CYB-FIRST001")
    idx2 = case_ids.index("CYB-SECOND02")
    assert idx2 < idx1, "Newer case should appear before older case"


@pytest.mark.asyncio
async def test_get_all_cases_preview_text(db: AsyncSession):
    """CaseSummary.preview_text should be first 200 chars of raw_text."""
    long_text = "A" * 300
    case = _make_case(raw_text=long_text, entities=[], timeline=[])
    await repository.save_case(db, case)

    summaries = await repository.get_all_cases(db)
    target = [s for s in summaries if s.case_id == case.case_id]
    assert len(target) == 1
    assert len(target[0].preview_text) == 200
    assert target[0].preview_text == "A" * 200


@pytest.mark.asyncio
async def test_get_stats(db: AsyncSession):
    """get_stats() should aggregate entity counts across all cases."""
    case1 = _make_case(
        case_id="CYB-STATS001",
        entities=[
            EntityOut(entity_type="PHONE_NUMBER", value="1111111111",
                      confidence=0.9, start_idx=0, end_idx=10),
        ],
        timeline=[],
    )
    case2 = _make_case(
        case_id="CYB-STATS002",
        entities=[
            EntityOut(entity_type="PHONE_NUMBER", value="2222222222",
                      confidence=0.9, start_idx=0, end_idx=10),
            EntityOut(entity_type="UPI_ID", value="test@upi",
                      confidence=0.85, start_idx=20, end_idx=30),
        ],
        timeline=[],
    )

    await repository.save_case(db, case1)
    await repository.save_case(db, case2)

    stats = await repository.get_stats(db)
    assert stats.total_cases >= 2
    assert stats.total_entities >= 3
    assert stats.by_type.get("PHONE_NUMBER", 0) >= 2
    assert stats.by_type.get("UPI_ID", 0) >= 1


@pytest.mark.asyncio
async def test_get_total_cases(db: AsyncSession):
    """get_total_cases() should return the correct count."""
    initial_count = await repository.get_total_cases(db)

    case = _make_case()
    await repository.save_case(db, case)

    new_count = await repository.get_total_cases(db)
    assert new_count == initial_count + 1


@pytest.mark.asyncio
async def test_search_cases_stub(db: AsyncSession):
    """search_cases() stub should return an empty list (Phase 3 placeholder)."""
    results = await repository.search_cases(db, query="anything")
    assert results == []


@pytest.mark.asyncio
async def test_iso8601_trailing_z_parsing(db: AsyncSession):
    """Explicitly test that submitted_at strings ending in 'Z' are parsed correctly."""
    # This prevents regressions if the custom parsing logic in save_case is removed.
    case = _make_case(case_id="CYB-TIMEZONE-Z")
    case_dict = case.model_dump()
    case_dict["submitted_at"] = "2026-07-30T12:34:56Z"
    case = CaseOut(**case_dict)
    
    saved_case = await repository.save_case(db, case)
    
    # Verify the datetime was parsed into postgres correctly and is timezone-aware
    assert saved_case.submitted_at.tzinfo is not None
    # Verify we can get it back without errors
    retrieved = await repository.get_case(db, "CYB-TIMEZONE-Z")
    assert retrieved is not None
    assert retrieved.submitted_at == "2026-07-30T12:34:56Z"
