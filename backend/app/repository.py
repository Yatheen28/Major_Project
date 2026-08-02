"""
Async repository layer for CyberIntel — PostgreSQL persistence.

Provides async CRUD functions that mirror the _CaseStore interface
so the transition from in-memory to PG is a swap, not a rewrite.

All functions accept an AsyncSession injected via FastAPI's Depends(get_db).
"""

from __future__ import annotations

from typing import Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db_models import Case, Entity, TimelineEvent
from app.models import (
    CaseOut,
    CaseSummary,
    EntityOut,
    StatsResponse,
    TimelineEvent as TimelineEventSchema,
)


# ---------------------------------------------------------------------------
# Internal helpers — ORM ↔ Pydantic conversion
# ---------------------------------------------------------------------------

def _orm_entity_to_schema(entity: Entity) -> EntityOut:
    """Convert an ORM Entity row to a Pydantic EntityOut."""
    return EntityOut(
        entity_type=entity.entity_type,
        value=entity.value,
        confidence=entity.confidence,
        start_idx=entity.start_idx,
        end_idx=entity.end_idx,
    )


def _orm_timeline_to_schema(event: TimelineEvent) -> TimelineEventSchema:
    """Convert an ORM TimelineEvent row to a Pydantic TimelineEvent."""
    return TimelineEventSchema(
        timestamp=event.timestamp,
        action_context=event.action_context,
        entities_referenced=event.entities_referenced or [],
        is_uncertain=event.is_uncertain,
        uncertainty_reason=event.uncertainty_reason or "",
    )


def _orm_case_to_full(case: Case) -> CaseOut:
    """Convert an ORM Case (with eagerly loaded relations) to CaseOut."""
    return CaseOut(
        case_id=case.case_id,
        sha256_hash=case.sha256_hash,
        submitted_at=(
            case.submitted_at.isoformat() + "Z"
            if hasattr(case.submitted_at, "isoformat")
            else str(case.submitted_at)
        ),
        submitted_by=case.submitted_by,
        raw_text=case.raw_text,
        entities=[_orm_entity_to_schema(e) for e in case.entities],
        timeline=[_orm_timeline_to_schema(t) for t in case.timeline_events],
        entity_counts=case.entity_counts or {},
        status=case.status or "PROCESSED",
    )


def _orm_case_to_summary(case: Case) -> CaseSummary:
    """Convert an ORM Case to a lightweight CaseSummary."""
    return CaseSummary(
        case_id=case.case_id,
        sha256_hash=case.sha256_hash,
        submitted_at=(
            case.submitted_at.isoformat() + "Z"
            if hasattr(case.submitted_at, "isoformat")
            else str(case.submitted_at)
        ),
        submitted_by=case.submitted_by,
        preview_text=(case.raw_text or "")[:200],
        entity_counts=case.entity_counts or {},
        status=case.status or "PROCESSED",
    )


# ---------------------------------------------------------------------------
# Write operations
# ---------------------------------------------------------------------------

async def save_case(db: AsyncSession, case: CaseOut) -> Case:
    """
    Persist a CaseOut (Pydantic) into PostgreSQL.

    Creates the Case row plus related Entity and TimelineEvent rows
    in a single transaction.  Mirrors _CaseStore.save_case().
    """
    from datetime import datetime
    
    if isinstance(case.submitted_at, str):
        # Handle trailing Z for Python versions that don't support it natively in fromisoformat
        dt_str = case.submitted_at.replace("Z", "+00:00")
        submitted_at_dt = datetime.fromisoformat(dt_str)
    else:
        submitted_at_dt = case.submitted_at

    db_case = Case(
        case_id=case.case_id,
        sha256_hash=case.sha256_hash,
        submitted_at=submitted_at_dt,
        submitted_by=case.submitted_by,
        raw_text=case.raw_text,
        entity_counts=case.entity_counts,
        status=case.status,
    )

    # Child rows — Entity
    for entity in case.entities:
        db_case.entities.append(
            Entity(
                entity_type=entity.entity_type,
                value=entity.value,
                confidence=entity.confidence,
                start_idx=entity.start_idx,
                end_idx=entity.end_idx,
            )
        )

    # Child rows — TimelineEvent
    for event in case.timeline:
        db_case.timeline_events.append(
            TimelineEvent(
                timestamp=event.timestamp,
                action_context=event.action_context,
                entities_referenced=event.entities_referenced,
                is_uncertain=event.is_uncertain,
                uncertainty_reason=event.uncertainty_reason,
            )
        )

    db.add(db_case)
    await db.commit()
    await db.refresh(db_case)
    return db_case


# ---------------------------------------------------------------------------
# Read operations
# ---------------------------------------------------------------------------

async def get_case(db: AsyncSession, case_id: str) -> Optional[CaseOut]:
    """
    Retrieve a full case record by its string case_id.

    Eagerly loads entities and timeline_events to avoid lazy-load
    issues outside the session scope.  Mirrors _CaseStore.get_case().
    """
    stmt = (
        select(Case)
        .where(Case.case_id == case_id)
        .options(
            selectinload(Case.entities),
            selectinload(Case.timeline_events),
        )
    )
    result = await db.execute(stmt)
    db_case = result.scalar_one_or_none()
    if db_case is None:
        return None
    return _orm_case_to_full(db_case)


async def get_all_cases(db: AsyncSession) -> list[CaseSummary]:
    """
    Return all cases as lightweight summaries, newest first.

    Mirrors _CaseStore.get_all_cases().
    """
    stmt = select(Case).order_by(Case.submitted_at.desc())
    result = await db.execute(stmt)
    cases = result.scalars().all()
    return [_orm_case_to_summary(c) for c in cases]


async def get_stats(db: AsyncSession) -> StatsResponse:
    """
    Compute aggregate statistics across all stored cases.

    Uses a single query to pull all entity_counts JSONB values
    and aggregates in Python — same logic as _CaseStore.get_stats()
    but reading from PG.
    """
    stmt = select(Case.entity_counts)
    result = await db.execute(stmt)
    rows = result.scalars().all()

    total_cases = len(rows)
    total_entities = 0
    by_type: dict[str, int] = {}

    for entity_counts in rows:
        if entity_counts:
            for entity_type, count in entity_counts.items():
                total_entities += count
                by_type[entity_type] = by_type.get(entity_type, 0) + count

    return StatsResponse(
        total_cases=total_cases,
        total_entities=total_entities,
        by_type=by_type,
    )


async def get_total_cases(db: AsyncSession) -> int:
    """Quick count of stored cases.  Mirrors _CaseStore.total_cases."""
    stmt = select(func.count(Case.id))
    result = await db.execute(stmt)
    return result.scalar_one()


# ---------------------------------------------------------------------------
# Search — stub for Phase 3
# ---------------------------------------------------------------------------

async def search_cases(
    db: AsyncSession,
    *,
    query: str = "",
    category: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
) -> list[CaseSummary]:
    """
    Full-text / filtered search over cases.

    Phase 3 will implement PostgreSQL ILIKE or ts_vector/ts_query.
    For now returns an empty list — placeholder contract.
    """
    # TODO: Phase 3 — implement PG full-text search
    return []
