"""
BSA 2023 Section 63 Part B — Evidence Integrity Module

Computes and verifies SHA-256 cryptographic hashes for all ingested artefacts.
Every piece of digital evidence processed by the system receives a unique
cryptographic fingerprint at the point of ingestion, ensuring tamper-evidence
and chain-of-custody compliance under the Bharatiya Sakshya Adhiniyam 2023.
"""

import hashlib


def compute_sha256(text: str) -> str:
    """
    Compute the SHA-256 hash of a given text string.

    Args:
        text: The raw text to hash (UTF-8 encoded).

    Returns:
        Uppercase hexadecimal SHA-256 digest string (64 characters).
    """
    return hashlib.sha256(text.encode("utf-8")).hexdigest().upper()


def verify_sha256(text: str, expected_hash: str) -> bool:
    """
    Verify that a text string matches an expected SHA-256 hash.

    Args:
        text: The raw text to verify.
        expected_hash: The expected SHA-256 hex digest to compare against.

    Returns:
        True if the computed hash matches the expected hash (case-insensitive).
    """
    return compute_sha256(text) == expected_hash.upper()
