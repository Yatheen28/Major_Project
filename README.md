# CyberIntel (AI-Assisted Cybercrime Investigation Platform)

An officer-facing forensic intelligence prototype designed to automate the extraction of critical artifacts from Indian cybercrime complaints, correlate shared entities across cases, and generate chain-of-custody documentation.

**Academic Context:** Built as a Major Project (22CDS66/22AIM75) by Yatheen Shetty B (USN 4SO23CD063) and team, SJEC Mangaluru, BE CSDS 7th sem. Guide: Tejas Raghu Pujari.

---

## 1. Project Overview

CyberIntel addresses the manual bottleneck in cybercrime investigation where officers must read unstructured Hinglish/English complaints to cross-reference entities. 

**The Pipeline:**
1. **Ingestion:** Plain text or PDF document uploads.
2. **Entity Extraction (NER):** A robust regex-based extraction pipeline identifies Phone Numbers, UPI IDs, URLs, Transaction IDs, Dates, and Monetary Amounts.
3. **Graph Correlation:** Shared entities are passed to a Neo4j Graph Database to find 1-hop intersections (e.g., the same UPI ID appearing in cases across different jurisdictions) and compute a Network Centrality Risk Score.
4. **Evidentiary Compliance:** The system generates an immutable SHA-256 hash at the moment of ingestion and auto-generates a BSA 2023 §63 (Part A) PDF evidence certificate.

**Scope & Positioning:**
This project is an open, reproducible, and fully explainable narrow prototype. It is explicitly designed to handle specific high-volume crime vectors:
- **In-Scope Categories:** Phishing, UPI/Financial Fraud, Identity Theft, and Social-Media Scams.
- **Out-of-Scope:** Ransomware, predictive policing, and real-time surveillance.
This tool does not replace government-scale infrastructure (like Pratibimb) or commercial link-analysis tools (like Maltego), but rather demonstrates how extraction, graph correlation, and BSA certification can be unified in a single explainable pipeline.

---

## 2. Technical Implementation & Features (100% MVP Complete)

The core architecture is fully functional and verified:
* **Backend:** FastAPI (Python), Pydantic v2 models, thread-safe case store.
* **Extraction:** Production-ready Regex NER engine.
* **Integrity:** SHA-256 chain-of-custody hashing (`hasher.py`).
* **Ingestion:** OCR & File upload via PyMuPDF for native PDF text (`ocr_engine.py`).
* **Timeline Builder:** Reconstructs chronological event sequences automatically from extracted `DATE` entities (`timeline.py`).
* **Graph Engine:** Neo4j Aura correlation engine using Cypher queries (`graph_engine.py`).
* **Certificate Generation:** Dynamic PDF generation using `fpdf2` (`certificate.py`).

---

## 3. The ML Post-Mortem: Why We Pivoted to Regex

*A note on our NLP approach and dataset limitations.*

**Phase 1 (Synthetic Data - Success):**
We initially fine-tuned an mBERT Named Entity Recognition (NER) model on 2,500 synthetic Hinglish samples. Training ran for 5 epochs and achieved a **95.6% F1 Score**. However, because the train/val/test splits used the same underlying templates, this score reflected structural memorization rather than true real-world generalization.

**Phase 2 (Real Data - The Erasure Wall):**
To achieve an honest evaluation, we acquired an I4C hackathon dataset containing 93,686 real, unstemmed Indian cybercrime narratives. We attempted to silver-label this dataset using our production regex patterns. 
*Result:* 0 matches across a 10,000-row sample.
*Diagnosis:* The dataset authors anonymized the narratives by **deleting** the entities (phone numbers, UPI IDs, amounts) entirely, rather than masking them. Because the target entities physically do not exist in the text, it is mathematically impossible to train an NER model on this file. 

**The Pivot:**
We recognized this insurmountable dataset limitation and pivoted to a highly robust **Regex + Neo4j Pipeline** for our live deployment. This guarantees a flawlessly working, explainable system for real-world text while demonstrating rigorous data engineering awareness. The intact labels from the anonymized dataset will be repurposed for a Crime Type Classification model in future work.
