"""
Synthetic Cybercrime Complaint Dataset Generator

Generates 5,000 synthetic complaint records for academic evaluation by
performing template-based augmentation on the 5 seed complaints from
data/sample_complaints.json.

Methodology:
    - Load 5 hand-crafted Hinglish complaint templates
    - Define pools of realistic Indian phone numbers, UPI IDs, URLs,
      UTR references, officer names, amounts, and dates
    - For each of 5,000 records: pick a weighted-random template,
      substitute all forensic artefacts with randomly sampled values,
      apply minor textual variations (sentence reordering, omission)
    - Assign unique case_id and random submitted_by
    - Save to data/synthetic_dataset_5000.json

NOTE: Generated following methodology of Rani et al. 2024 —
      LLM-style augmentation using template variation.

Usage:
    cd backend
    python generate_dataset.py

This script is intended to be run MANUALLY by the developer.
"""

import json
import random
import re
import string
import os
from datetime import datetime, timedelta


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

SEED = 42
NUM_RECORDS = 5000
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "synthetic_dataset_5000.json")
TEMPLATE_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "sample_complaints.json")

random.seed(SEED)


# ---------------------------------------------------------------------------
# Fake data pools
# ---------------------------------------------------------------------------

def _generate_phone_numbers(n=200):
    """Generate n fake Indian 10-digit mobile numbers."""
    numbers = set()
    while len(numbers) < n:
        prefix = random.choice([7, 8, 9])
        number = f"{prefix}" + "".join(random.choices(string.digits, k=9))
        numbers.add(number)
    return list(numbers)


def _generate_upi_ids(n=100):
    """Generate n fake UPI VPA handles."""
    first_names = [
        "rahul", "priya", "amit", "neha", "suresh", "deepak", "anita", "vijay",
        "sunita", "rajesh", "pooja", "manoj", "kavita", "arun", "meena", "sanjay",
        "rekha", "vikram", "lata", "ashok", "ritu", "mohan", "sneha", "gopal",
        "divya", "kiran", "naveen", "swati", "ramesh", "geeta",
    ]
    handles = ["ybl", "paytm", "okaxis", "oksbi", "icici", "upi", "ibl", "hdfcbank"]
    ids = set()
    while len(ids) < n:
        name = random.choice(first_names)
        suffix = random.choice(["", str(random.randint(1, 99)), str(random.randint(2020, 2024))])
        handle = random.choice(handles)
        upi = f"{name}{suffix}@{handle}"
        ids.add(upi)
    return list(ids)


def _generate_urls(n=100):
    """Generate n fake phishing URLs."""
    domains = [
        "sbi-secure-kyc", "axis-bank-update", "hdfc-kyc-verify", "icici-net-banking",
        "paytm-reward-claim", "amazon-task-earning", "flipkart-job-offer",
        "fedex-india-tracking", "dhl-customs-verify", "ipo-guaranteed-returns",
        "stockpro-ai-trading", "crypto-invest-india", "rbi-kyc-mandate",
        "aadhaar-link-update", "pan-verification-gov", "income-tax-refund-claim",
        "whatsapp-prize-winner", "google-lucky-draw", "jio-free-recharge",
        "myntra-cashback-offer",
    ]
    tlds = [".in", ".co", ".net", ".com", ".org", ".info"]
    paths = ["/verify", "/update", "/register", "/login", "/claim", "/apply", "/secure", "/track"]

    urls = set()
    while len(urls) < n:
        domain = random.choice(domains)
        tld = random.choice(tlds)
        path = random.choice(paths)
        url = f"https://{domain}{tld}{path}"
        urls.add(url)
    return list(urls)


def _generate_utrs(n=100):
    """Generate n fake UTR / transaction reference IDs."""
    prefixes = ["UTIB", "SBIN", "HDFC", "ICIC", "AXIS", "UBIN", "PUNB", "BARB"]
    utrs = set()
    while len(utrs) < n:
        prefix = random.choice(prefixes)
        digits = "".join(random.choices(string.digits, k=random.randint(12, 16)))
        utrs.add(f"{prefix}{digits}")
    return list(utrs)


def _generate_officer_names(n=50):
    """Generate n fake officer names with ranks."""
    ranks = ["SI", "ASI", "Inspector", "Const.", "HC", "SHO", "DSP", "ACP"]
    first_names = [
        "Rajesh", "Priya", "Suresh", "Deepak", "Anita", "Vijay", "Kavita",
        "Manoj", "Sunita", "Arun", "Rekha", "Vikram", "Meena", "Sanjay",
        "Ritu", "Ashok", "Pooja", "Gopal", "Sneha", "Naveen",
    ]
    last_names = [
        "Kumar", "Sharma", "Patil", "Shetty", "Rao", "Reddy", "Naik",
        "Patel", "Singh", "Gupta", "Verma", "Joshi", "Nair", "Menon",
        "Desai", "Kulkarni", "Hegde", "Bhat", "Kamath", "Pai",
    ]
    names = set()
    while len(names) < n:
        rank = random.choice(ranks)
        first = random.choice(first_names)
        last = random.choice(last_names)
        names.add(f"{rank} {first} {last}")
    return list(names)


def _random_amount(low=500, high=500000):
    """Generate a random amount string in various Indian formats."""
    amount = random.randint(low, high)
    # Round to nice numbers
    if amount > 1000:
        amount = round(amount, -2)
    formats = [
        f"₹{amount:,}",
        f"Rs.{amount:,}",
        f"Rs {amount:,}",
        f"INR {amount:,}",
        f"₹{amount}",
        f"{amount:,} rupees",
    ]
    return random.choice(formats)


def _random_date_2023_2024():
    """Generate a random date string in 2023-2024."""
    start = datetime(2023, 1, 1)
    end = datetime(2024, 12, 31)
    delta = end - start
    rand_date = start + timedelta(days=random.randint(0, delta.days))

    formats = [
        rand_date.strftime("%d/%m/%Y"),
        rand_date.strftime("%d-%m-%Y"),
        rand_date.strftime("%d %B %Y"),
        rand_date.strftime("%d %b %Y"),
    ]
    return random.choice(formats)


def _random_bank_account():
    """Generate a fake bank account number (9-16 digits)."""
    length = random.randint(9, 16)
    return "".join(random.choices(string.digits, k=length))


# ---------------------------------------------------------------------------
# Pre-generate pools
# ---------------------------------------------------------------------------

PHONE_POOL = _generate_phone_numbers(200)
UPI_POOL = _generate_upi_ids(100)
URL_POOL = _generate_urls(100)
UTR_POOL = _generate_utrs(100)
OFFICER_POOL = _generate_officer_names(50)


# ---------------------------------------------------------------------------
# Substitution engine
# ---------------------------------------------------------------------------

# Regex patterns to find existing artefacts in templates
_PHONE_RE = re.compile(r"(?:\+91[-\s]?)?[6-9]\d{9}")
_UPI_RE = re.compile(
    r"[a-zA-Z0-9._-]+@(?:okaxis|oksbi|ybl|paytm|upi|ibl|axl|icici|hdfcbank|kotak)"
)
_URL_RE = re.compile(r"https?://[^\s<>\"]+")
_UTR_RE = re.compile(r"[A-Z]{4}\d{12,20}")
_AMOUNT_RE = re.compile(r"(?:₹|Rs\.?|INR)\s?[\d,]+(?:\.\d{2})?|\d[\d,]+\s?rupees")
_DATE_RE = re.compile(
    r"\d{1,2}[/\-]\d{1,2}[/\-]\d{4}"
    r"|\d{1,2}\s(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s\d{4}"
    r"|(?:January|February|March|April|May|June|July|August|September|"
    r"October|November|December)\s\d{1,2},?\s\d{4}"
)
_BANK_ACC_RE = re.compile(r"\b\d{9,18}\b")


def _substitute_artefacts(text):
    """Replace all forensic artefacts in a template with random values."""

    # Track replacements to avoid re-replacing already substituted text
    # Replace URLs first (they contain digits that other patterns might match)
    urls_found = _URL_RE.findall(text)
    for url in urls_found:
        text = text.replace(url, random.choice(URL_POOL), 1)

    # Replace UTRs
    utrs_found = _UTR_RE.findall(text)
    for utr in utrs_found:
        text = text.replace(utr, random.choice(UTR_POOL), 1)

    # Replace UPI IDs
    upis_found = _UPI_RE.findall(text)
    for upi in upis_found:
        text = text.replace(upi, random.choice(UPI_POOL), 1)

    # Replace amounts
    amounts_found = _AMOUNT_RE.findall(text)
    for amt in amounts_found:
        text = text.replace(amt, _random_amount(), 1)

    # Replace dates
    dates_found = _DATE_RE.findall(text)
    for d in dates_found:
        text = text.replace(d, _random_date_2023_2024(), 1)

    # Replace phone numbers (do this after URLs/UTRs to avoid partial matches)
    phones_found = _PHONE_RE.findall(text)
    for ph in phones_found:
        text = text.replace(ph, random.choice(PHONE_POOL), 1)

    return text


def _apply_variation(text):
    """Apply minor random variations to the text."""
    sentences = text.split(". ")
    if len(sentences) < 3:
        return text

    variation = random.random()

    if variation < 0.3:
        # Swap two adjacent sentences
        if len(sentences) >= 4:
            idx = random.randint(1, len(sentences) - 3)
            sentences[idx], sentences[idx + 1] = sentences[idx + 1], sentences[idx]

    elif variation < 0.5:
        # Drop a random non-first, non-last sentence
        if len(sentences) >= 5:
            idx = random.randint(1, len(sentences) - 2)
            sentences.pop(idx)

    elif variation < 0.65:
        # Duplicate a sentence (as if complainant repeated themselves)
        idx = random.randint(0, len(sentences) - 1)
        sentences.insert(idx + 1, sentences[idx])

    return ". ".join(sentences)


# ---------------------------------------------------------------------------
# Main generator
# ---------------------------------------------------------------------------

def generate_dataset():
    """Generate the synthetic dataset and save to disk."""

    # Load templates
    with open(TEMPLATE_PATH, "r", encoding="utf-8") as f:
        templates = json.load(f)

    if len(templates) < 5:
        raise ValueError(f"Expected 5 templates, got {len(templates)}")

    # Weighted distribution — templates 0 and 3 (UPI OTP fraud and Bank KYC)
    # are more common in real life
    weights = [0.25, 0.18, 0.15, 0.25, 0.17]

    records = []

    for i in range(NUM_RECORDS):
        # Pick template
        template_idx = random.choices(range(5), weights=weights, k=1)[0]
        template = templates[template_idx]

        # Substitute artefacts
        augmented_text = _substitute_artefacts(template["text"])

        # Apply variation
        augmented_text = _apply_variation(augmented_text)

        # Build record
        case_id = f"SYN-{i+1:05d}"
        submitted_by = random.choice(OFFICER_POOL)

        records.append({
            "case_id": case_id,
            "text": augmented_text,
            "submitted_by": submitted_by,
            "template_source": template_idx + 1,
            "generated_at": datetime.utcnow().isoformat() + "Z",
        })

    # Save
    os.makedirs(os.path.dirname(os.path.abspath(OUTPUT_PATH)), exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(records, f, indent=2, ensure_ascii=False)

    print(f"Generated {NUM_RECORDS} synthetic complaints.")
    print(f"Saved to {os.path.abspath(OUTPUT_PATH)}")
    print(f"\nTemplate distribution:")
    from collections import Counter
    dist = Counter(r["template_source"] for r in records)
    for t_id in sorted(dist):
        scenarios = {
            1: "UPI OTP Fraud",
            2: "Fake WhatsApp Job",
            3: "FedEx Parcel Scam",
            4: "Bank KYC Phishing",
            5: "Fake Trading App",
        }
        print(f"  Template {t_id} ({scenarios.get(t_id, 'Unknown')}): {dist[t_id]} records")


if __name__ == "__main__":
    generate_dataset()
