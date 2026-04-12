"""
Thread-safe in-memory case store.

Phase I uses a simple Python dict guarded by a threading lock.
Phase II will migrate to Neo4j for cross-case graph queries.
"""

import threading
from app.models import CaseOut, CaseSummary, StatsResponse


class _CaseStore:
    """Singleton-style in-memory store for investigation cases."""

    def __init__(self) -> None:
        self._cases: dict[str, CaseOut] = {}
        self._lock = threading.Lock()

    # ------------------------------------------------------------------
    # Write operations
    # ------------------------------------------------------------------

    def save_case(self, case: CaseOut) -> None:
        """Persist a case record (thread-safe)."""
        with self._lock:
            self._cases[case.case_id] = case

    # ------------------------------------------------------------------
    # Read operations
    # ------------------------------------------------------------------

    def get_case(self, case_id: str) -> CaseOut | None:
        """Retrieve a single case by ID, or None if not found."""
        with self._lock:
            return self._cases.get(case_id)

    def get_all_cases(self) -> list[CaseSummary]:
        """
        Return all cases as lightweight summaries, newest first.

        The preview_text field contains the first 200 characters of the
        raw complaint text.
        """
        with self._lock:
            summaries: list[CaseSummary] = []
            for case in self._cases.values():
                summaries.append(
                    CaseSummary(
                        case_id=case.case_id,
                        sha256_hash=case.sha256_hash,
                        submitted_at=case.submitted_at,
                        submitted_by=case.submitted_by,
                        preview_text=case.raw_text[:200],
                        entity_counts=case.entity_counts,
                        status=case.status,
                    )
                )
            # Sort newest first by submitted_at (ISO-8601 strings sort lexicographically)
            summaries.sort(key=lambda s: s.submitted_at, reverse=True)
            return summaries

    def get_stats(self) -> StatsResponse:
        """Compute aggregate statistics across all stored cases."""
        with self._lock:
            total_cases = len(self._cases)
            total_entities = 0
            by_type: dict[str, int] = {}

            for case in self._cases.values():
                for entity_type, count in case.entity_counts.items():
                    total_entities += count
                    by_type[entity_type] = by_type.get(entity_type, 0) + count

            return StatsResponse(
                total_cases=total_cases,
                total_entities=total_entities,
                by_type=by_type,
            )

    @property
    def total_cases(self) -> int:
        """Quick count of stored cases."""
        with self._lock:
            return len(self._cases)


# Module-level singleton — imported by main.py and other modules
store = _CaseStore()
