# Architecture — Post-Review (Final Presentation)

## Already built (per GRAPH_REPORT.md + Phase I/II — verified, don't rebuild)
- **Backend Entry Point** — FastAPI app (`main.py`)
- **Data Models** — Pydantic v2: `ComplaintIn`, `CaseOut`, `CaseSummary`, `TimelineEvent`, `EntityOut`, `StatsResponse`, `HealthResponse`, `LinkedCase`, `RiskScoreOut`, `CertificateOut`
- **Entity Extractor** (`backend/app/extractor.py`) — regex NER: `extract_entities()`, `_extract_raw()`, `_dedup_by_value()`, overlap resolution
- **Case Data Storage** (`backend/app/case_store.py`) — thread-safe singleton `_CaseStore` (to be replaced by PostgreSQL in Phase 1)
- **Data Hashing Utils** — `compute_sha256()`, `verify_sha256()` (BSA Part B integrity module)
- **Timeline** (`backend/app/timeline.py`) — `build_timeline()`
- **Dataset Generator** — `generate_dataset()` + helpers (officer names, phone numbers, UPI IDs, URLs, UTRs)
- **Correlation Engine** (`backend/app/graph_engine.py`) — Neo4j AuraDB: `sync_case_to_graph()`, `find_linked_cases()`, `compute_risk_scores()` with MERGE-based ingestion
- **BSA Certificate** (`backend/app/certificate.py`) — PDF generation via fpdf2: Part A auto-filled, Part B blank signature block
- **OCR Engine** (`backend/app/ocr_engine.py`) — Tesseract + PyMuPDF for image/PDF text extraction
- **Frontend** — React + axios: Dashboard, ComplaintForm, FileUploadForm, CaseList, CaseDetail, EntityDisplay, TimelineView, HashDisplay, LinkedCasesTable

## Extraction Abstraction (design constraint — all phases)
Entity extraction sits behind a **swappable interface**: `extract_entities(text: str) -> list[EntityOut]`. The current `extractor.py` uses regex; an NLP model trained separately will eventually plug in via this same interface. Never couple downstream code to regex internals.

## New — Phase 1: PostgreSQL Persistence

### Database: Supabase (cloud-managed PostgreSQL)
- **Why Supabase**: `supabase 2.28.0` already installed in pip environment. Provides hosted PG with zero local setup, connection pooling, and a web dashboard.
- **ORM**: SQLAlchemy (async) + asyncpg driver
- **Migrations**: Alembic
- **Schema**: `Case`, `Entity`, `TimelineEvent` tables mirroring current Pydantic models. `user_id` column on `Case` (nullable initially, wired in Phase 2). `crime_category` column on `Case` (nullable initially, wired in Phase 5).
- **Repository pattern**: `backend/app/repository.py` — async CRUD matching the `_CaseStore` interface, injected via `Depends(get_db)`.
- **Disaster recovery**: `POST /api/admin/resync-graph` rebuilds Neo4j from all PG cases.

## New — Phase 2: RBAC + JWT Authentication

### Auth: JWT tokens (python-jose + passlib)
- **Roles**: `OFFICER` (own-case access), `SUPERVISOR` (all-case access + workload analytics)
- **Token storage**: JWT in localStorage.
  > **Deliberate simplification for academic prototype.** localStorage is vulnerable to XSS (any injected script can read the token). Production would use httpOnly cookies + CSRF tokens. For a demo with no real user data, localStorage is acceptable and simpler. This is a stated design decision, not an oversight.
- **User model**: `id`, `username`, `hashed_password`, `role`, `full_name`, `badge_id`, `created_at`
- **Endpoints**: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- **Enforcement**: `Depends(get_current_user)` on all case endpoints. Officer sees own cases only; Supervisor sees all.
- **Supervisor**: `GET /api/supervisor/workload` — case counts per officer, status breakdown.

## New — Phase 3: Search + Case Leads

### Search
- PostgreSQL full-text search (`to_tsvector`/`to_tsquery` or `ILIKE`) across `raw_text`, `case_id`, `submitted_by`, entity values.
- Filters: date range, crime category, status.
- Endpoint: `GET /api/cases/search?q=...&category=...&from=...&to=...`

### Case Leads
- **Lead model**: `id`, `case_id` (FK), `entity_type`, `value`, `added_by` (FK to User), `added_at`, `source` (EXTRACTED / MANUAL).
- Endpoint: `POST /api/cases/{case_id}/leads` — validates entity format using existing regex patterns.
- On creation: syncs to Neo4j via `graph_engine.sync_lead_to_graph()` — same MERGE pattern. Leads become first-class correlation nodes.

## New — Phase 4: Insights & Analytics Dashboard

### Chart library: recharts
- **Endpoints** (`backend/app/routes/analytics_routes.py`):
  - `GET /api/analytics/crime-distribution` — case counts by crime category
  - `GET /api/analytics/timeline-trend` — cases per week/month
  - `GET /api/analytics/entity-recurrence` — top recurring entities
  - `GET /api/analytics/resolution-rate` — solved vs in-progress ratio
- **Frontend**: `InsightsPage.jsx` — donut chart (crime distribution), area chart (temporal trend), horizontal bar chart (entity recurrence), heatmap (entity-type × crime-category matrix).
- **Supervisor view**: workload distribution bar chart (cases per officer, stacked by status).

## New — Phase 5: OCR Expansion + Crime Categories + Help-Bot

### OCR Expansion
- Image preprocessing: grayscale, adaptive thresholding (OpenCV), deskewing.
- Bilingual: `lang="eng+hin"` Tesseract option.
- Handwriting OCR: **explicit stretch goal** — requires CNN/Transformer model, not Tesseract.

### Crime Category Classification
- **Approved categories**: `PHISHING`, `UPI_FRAUD`, `IDENTITY_THEFT`, `SOCIAL_MEDIA_SCAM` (per prd.md §4).
- **Classifier** (`backend/app/classifier.py`): keyword-based, swappable interface (same pattern as entity extractor).
- Auto-assigned on ingestion, manual override via API.
- **Excluded**: RANSOMWARE, JOB_SCAM, INVESTMENT_FRAUD — see prd.md §4 for rationale.

### Victim Help-Bot (rule-based decision tree — NOT LLM)
- **Backend**: `helpbot_routes.py` + `helpbot_flows.py` — structured dialogue trees.
- **Flow**: crime identification → immediate steps → **prevention guidance** → complaint collection → auto-submit to ingest pipeline.
- **Prevention guidance node**: per-crime-type tips on avoiding repeat victimization (never share OTPs, verify caller identity, enable 2FA, etc.). This is reactive education, not proactive prevention.
- **Frontend**: `HelpBot.jsx` — chat-style interface at `/help` (no auth required). Visually distinct from officer dashboard.

## Deployment Architecture

### Hosting: Vercel (frontend) + Render (backend)
- **Why Render for backend**: Supports persistent processes. Neo4j driver connection pooling and SQLAlchemy/Supabase connection pool both need a long-lived process. Vercel's serverless model is a poor fit.
- **Why Vercel for frontend**: Zero-config React deployment, automatic HTTPS, global CDN.
- **Deploy early**: Initial deployment happens right after Phase 1 merge (not at the end). This surfaces env var, CORS, and build config issues early.
- **CORS**: Locked to the actual Vercel frontend origin (not wildcard). Required for PII-handling tool.
- **Environment-based config**: `VITE_API_BASE_URL` (frontend), `DATABASE_URL`, `NEO4J_*`, `JWT_SECRET` (backend) — all from env vars per environment, not hardcoded.
- **Cold-start risk**: Render free tier sleeps after ~15 min inactivity (30–50s cold start). Warm up before demos.

### Bulk Upload (Phase 5 frontend addition)
- Multi-file picker on the upload form. Each PDF processed as an **independent case** through the existing single-file ingest endpoint (looped client-side). No backend changes. Never combine multiple PDFs into one case/one hash (chain-of-custody ambiguity).

## Graph schema (Neo4j AuraDB Free — unchanged from Phase II)
- Nodes: `:Complaint`, `:PhoneNumber`, `:UPI_ID`, `:URL`, `:TransactionID`, `:BankAccount`
- Relationships: `(:Complaint)-[:CONTAINS]->(entity)`
- Risk formula: `risk_score = min(100, case_count * 15)` via plain Cypher COUNT.
- GDS algorithms (WCC, Louvain, centrality): future work, not this cycle.

## Explicitly deferred (document as "Future Work")
Handwriting OCR · Neo4j GDS algorithms · NLP model integration into live app · real-time
WebSocket notifications · audit log / chain-of-custody · self-hosted Neo4j · category expansion
beyond the core 4 (SIM swap, online harassment, banking fraud are scope-consistent candidates
requiring explicit approval) · Docker/full cloud deployment beyond Vercel+Render demo setup.
