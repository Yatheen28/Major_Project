"""
Timeline reconstruction module.

Builds a chronological sequence of events from extracted DATE entities and
their surrounding textual context. Flags uncertain / relative dates.
"""

import re
from datetime import datetime
from app.models import EntityOut, TimelineEvent


# Date formats to attempt parsing (ordered by specificity)
_DATE_FORMATS = [
    "%d/%m/%Y",
    "%d-%m-%Y",
    "%m/%d/%Y",
    "%d %B %Y",
    "%d %b %Y",
    "%B %d, %Y",
    "%B %d %Y",
    "%b %d, %Y",
    "%b %d %Y",
]

# Relative / informal date tokens
_RELATIVE_TOKENS = {"kal", "aaj", "parso", "today", "yesterday", "tomorrow"}


def _try_parse_date(value: str) -> datetime | None:
    """Attempt to parse a date string into a datetime object."""
    cleaned = value.strip().replace(",", ", ").replace("  ", " ")
    for fmt in _DATE_FORMATS:
        try:
            return datetime.strptime(cleaned, fmt)
        except ValueError:
            continue
    return None


def _is_relative_date(value: str) -> bool:
    """Check if the date value is a relative / informal reference."""
    lower = value.lower().strip()
    return lower in _RELATIVE_TOKENS


def _has_year(value: str) -> bool:
    """Check if the date string contains a 4-digit year."""
    return bool(re.search(r"\d{4}", value))


def build_timeline(text: str, entities: list[EntityOut]) -> list[TimelineEvent]:
    """
    Build a chronological timeline from DATE entities in the complaint.

    For each DATE entity:
      - Extract a context window of surrounding text
      - Find all other entity values mentioned in that context
      - Flag uncertain dates (relative tokens, missing year)
      - Attempt to parse and sort chronologically

    Args:
        text: The full complaint text.
        entities: All extracted entities (filters to DATE type internally).

    Returns:
        Sorted list of TimelineEvent objects.
    """
    date_entities = [e for e in entities if e.entity_type == "DATE"]

    if not date_entities:
        return []

    # Collect all non-date entity values for cross-referencing
    all_entity_values = [e.value for e in entities if e.entity_type != "DATE"]

    events: list[tuple[datetime | None, TimelineEvent]] = []

    for date_ent in date_entities:
        # Build context window: 40 chars before, 80 chars after
        context_start = max(0, date_ent.start_idx - 40)
        context_end = min(len(text), date_ent.end_idx + 80)
        action_context = text[context_start:context_end].strip().replace("\n", " ")

        # Find entities referenced in this context window
        referenced: list[str] = []
        for val in all_entity_values:
            if val in action_context:
                referenced.append(val)

        # Determine uncertainty
        is_uncertain = False
        uncertainty_reason = ""

        if _is_relative_date(date_ent.value):
            is_uncertain = True
            uncertainty_reason = "Relative date reference"
        elif not _has_year(date_ent.value):
            is_uncertain = True
            uncertainty_reason = "No year specified"

        # Attempt to parse for sorting
        parsed_dt = _try_parse_date(date_ent.value)

        event = TimelineEvent(
            timestamp=date_ent.value,
            action_context=action_context,
            entities_referenced=referenced,
            is_uncertain=is_uncertain,
            uncertainty_reason=uncertainty_reason,
        )

        events.append((parsed_dt, event))

    # Sort: parsed dates first (chronologically), then unparsed ones at the end
    def sort_key(item: tuple[datetime | None, TimelineEvent]):
        dt, _ = item
        if dt is not None:
            return (0, dt.isoformat())
        return (1, "")

    events.sort(key=sort_key)

    return [event for _, event in events]
