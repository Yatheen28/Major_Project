"""
Regex-based Named Entity Recognition (NER) engine — Phase I.

Extracts forensic artefacts from Hinglish cybercrime complaint text using
hand-crafted regular expressions. Handles informal Indian English, Hindi
transliterations, and common misspellings found in real FIR/complaint data.

Phase II will augment this with IndicBERT transformer-based NER.
"""

import re
from app.models import EntityOut


# ---------------------------------------------------------------------------
# Pattern definitions
# ---------------------------------------------------------------------------

_PHONE_PATTERNS = [
    # +91 prefix with optional separator
    (r"\+91[-\s]?[6-9]\d{9}", 0.95),
    # 91 prefix (no plus) glued to number
    (r"\b91[6-9]\d{9}\b", 0.95),
    # 10-digit standalone (most common in Indian complaints)
    (r"\b[6-9]\d{9}\b", 0.95),
    # With internal hyphens or spaces: 98765-43210 or 98765 43210
    (r"\b[6-9]\d{4}[-\s]\d{5}\b", 0.93),
    (r"\b[6-9]\d{2}[-\s]\d{3}[-\s]\d{4}\b", 0.91),
]

_UPI_PATTERNS = [
    # Standard UPI VPA handles
    (
        r"\b[a-zA-Z0-9._-]+@(?:okaxis|oksbi|ybl|paytm|upi|ibl|axl|icici|"
        r"hdfcbank|kotak|rbl|aubank|fbl|okicici|okhdfcbank|apl|waicici|"
        r"jupiteraxis|sliceaxis)\b",
        0.92,
    ),
    # Phone-based UPI IDs
    (r"\b[6-9]\d{9}@(?:ybl|paytm|upi|okaxis|oksbi|ibl)\b", 0.92),
]

_URL_PATTERNS = [
    (r"https?://[^\s<>\"']+", 0.97),
    (r"\bwww\.[a-zA-Z0-9][-a-zA-Z0-9]*\.[a-z]{2,}[^\s]*", 0.97),
]

_TRANSACTION_PATTERNS = [
    # UTR / Ref / TXN keyword followed by alphanumeric ID
    (
        r"(?:UTR|utr|Utr|Ref|ref|REF|TXN|txn|Txn|transaction[\s._-]?id|"
        r"reference[\s._-]?(?:no|number|id)?|ref[\s._-]?(?:no|number|id)?)"
        r"[\s:.\-#]*([A-Za-z0-9]{12,22})",
        0.85,
    ),
    # Standalone UTR-style patterns: UTIB... or numeric 12-20 digits after keyword context
    (r"\b[A-Z]{4}\d{12,18}\b", 0.80),
]

_AMOUNT_PATTERNS = [
    # ₹ symbol
    (r"₹\s?[\d,]+(?:\.\d{1,2})?", 0.90),
    # Rs / INR prefix
    (r"(?:Rs\.?|INR|rs\.?)\s?[\d,]+(?:\.\d{1,2})?", 0.90),
    # Trailing keywords: rupees / rupaya / /-
    (r"\b\d[\d,]+\s?(?:rupees|rupaya|rupes|/-)", 0.88),
]

_DATE_PATTERNS = [
    # DD/MM/YYYY or DD-MM-YYYY
    (r"\b\d{1,2}[/\-]\d{1,2}[/\-]\d{4}\b", 0.88),
    # 12 Jan 2024, 5 March 2024
    (
        r"\b\d{1,2}\s(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)"
        r"[a-z]*\s\d{4}\b",
        0.88,
    ),
    # January 12, 2024
    (
        r"\b(?:January|February|March|April|May|June|July|August|September|"
        r"October|November|December)\s\d{1,2},?\s\d{4}\b",
        0.88,
    ),
    # Relative / informal Hindi dates
    (r"\b(?:kal|aaj|parso)\b", 0.60),
]

_BANK_ACCOUNT_PATTERNS = [
    (
        r"(?:account|a/c|ac\s?no|bank\s?account|savings\s?account|acct)"
        r"[\s:.\-#]*(\d{9,18})",
        0.80,
    ),
]


# ---------------------------------------------------------------------------
# Master pattern registry
# ---------------------------------------------------------------------------

_ENTITY_PATTERNS: list[tuple[str, list[tuple[str, float]]]] = [
    ("PHONE_NUMBER", _PHONE_PATTERNS),
    ("UPI_ID", _UPI_PATTERNS),
    ("URL", _URL_PATTERNS),
    ("TRANSACTION_ID", _TRANSACTION_PATTERNS),
    ("AMOUNT", _AMOUNT_PATTERNS),
    ("DATE", _DATE_PATTERNS),
    ("BANK_ACCOUNT", _BANK_ACCOUNT_PATTERNS),
]


# ---------------------------------------------------------------------------
# Extraction engine
# ---------------------------------------------------------------------------

def _extract_raw(text: str) -> list[EntityOut]:
    """Run all regex patterns and collect raw (possibly overlapping) matches."""
    results: list[EntityOut] = []

    for entity_type, patterns in _ENTITY_PATTERNS:
        for pattern, confidence in patterns:
            for match in re.finditer(pattern, text, re.IGNORECASE):
                # If there is a capturing group, use group(1) — otherwise group(0)
                if match.lastindex and match.lastindex >= 1:
                    value = match.group(1).strip()
                    start_idx = match.start(1)
                    end_idx = match.end(1)
                else:
                    value = match.group(0).strip()
                    start_idx = match.start(0)
                    end_idx = match.end(0)

                if not value:
                    continue

                results.append(
                    EntityOut(
                        entity_type=entity_type,
                        value=value,
                        confidence=confidence,
                        start_idx=start_idx,
                        end_idx=end_idx,
                    )
                )

    return results


def _dedup_by_value(entities: list[EntityOut]) -> list[EntityOut]:
    """If the same value appears multiple times, keep the one with higher confidence."""
    best: dict[str, EntityOut] = {}
    for ent in entities:
        key = (ent.entity_type, ent.value)
        if key not in best or ent.confidence > best[key].confidence:
            best[key] = ent
    return list(best.values())


def _remove_overlapping_spans(entities: list[EntityOut]) -> list[EntityOut]:
    """
    Remove overlapping spans — if two entity spans overlap in the source text,
    keep the longer match. If same length, keep higher confidence.
    """
    # Sort by start index, then by span length descending
    sorted_ents = sorted(entities, key=lambda e: (e.start_idx, -(e.end_idx - e.start_idx)))
    result: list[EntityOut] = []

    for ent in sorted_ents:
        overlapping = False
        for existing in result:
            # Check if spans overlap
            if ent.start_idx < existing.end_idx and ent.end_idx > existing.start_idx:
                # There is overlap — keep the longer one
                existing_len = existing.end_idx - existing.start_idx
                new_len = ent.end_idx - ent.start_idx
                if new_len > existing_len or (
                    new_len == existing_len and ent.confidence > existing.confidence
                ):
                    result.remove(existing)
                    result.append(ent)
                overlapping = True
                break
        if not overlapping:
            result.append(ent)

    return result


def extract_entities(text: str) -> list[EntityOut]:
    """
    Extract all forensic entities from a complaint text.

    Pipeline:
        1. Run all regex patterns to get raw matches
        2. Deduplicate by (entity_type, value), keeping highest confidence
        3. Remove overlapping spans, keeping longer matches
        4. Sort by start_idx for stable output order

    Args:
        text: Raw Hinglish complaint text.

    Returns:
        Deduplicated, non-overlapping list of EntityOut sorted by position.
    """
    raw = _extract_raw(text)
    deduped = _dedup_by_value(raw)
    non_overlapping = _remove_overlapping_spans(deduped)
    non_overlapping.sort(key=lambda e: e.start_idx)
    return non_overlapping
