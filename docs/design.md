# Design — Data Model & API Surface (Post-Review)

## Existing Pydantic models (in `models.py` — keep as-is)

```
ComplaintIn:
    text: str              # min_length=20
    submitted_by: str

CaseOut:
    case_id: str
    sha256_hash: str
    submitted_at: str
    submitted_by: str
    raw_text: str
    entities: list[EntityOut]
    timeline: list[TimelineEvent]
    entity_counts: dict[str, int]
    status: str

CaseSummary, TimelineEvent, EntityOut, StatsResponse, HealthResponse
LinkedCase, RiskScoreOut, CertificateOut
```

## New models — Phase 1+ (add to `models.py` or `db_models.py` as appropriate)

### SQLAlchemy ORM Models (`db_models.py` [NEW])

```
Case (table):
    id: int (PK, auto)
    case_id: str (unique, indexed)
    sha256_hash: str
    submitted_at: datetime
    submitted_by: str
    raw_text: text
    entity_counts: JSON
    status: str
    user_id: int (FK → User, nullable — wired in Phase 2)
    crime_category: str (nullable — wired in Phase 5)

Entity (table):
    id: int (PK, auto)
    case_id: int (FK → Case)
    entity_type: str
    value: str
    start: int
    end: int

TimelineEvent (table):
    id: int (PK, auto)
    case_id: int (FK → Case)
    timestamp: str
    event_type: str
    description: str
    source_entity: str (nullable)

User (table — Phase 2):
    id: int (PK, auto)
    username: str (unique)
    hashed_password: str
    role: enum (OFFICER, SUPERVISOR)
    full_name: str
    badge_id: str (nullable)
    created_at: datetime

Lead (table — Phase 3):
    id: int (PK, auto)
    case_id: int (FK → Case)
    entity_type: str
    value: str
    added_by: int (FK → User)
    added_at: datetime
    source: enum (EXTRACTED, MANUAL)
```

### Crime Category Enum (Phase 5)

```
CrimeCategory:
    PHISHING
    UPI_FRAUD
    IDENTITY_THEFT
    SOCIAL_MEDIA_SCAM
```

**Approved in-scope categories only.** Expansion candidates (SIM_SWAP, ONLINE_HARASSMENT,
BANKING_FRAUD) require explicit approval. RANSOMWARE, JOB_SCAM, INVESTMENT_FRAUD are
explicitly excluded.

## API Endpoints — Full Surface

### Existing (Phase I/II — already built)
- `POST /api/ingest` → `CaseOut`
- `POST /api/ingest/upload` → `CaseOut` (OCR)
- `GET  /api/cases` → `list[CaseSummary]`
- `GET  /api/cases/{id}` → `CaseOut`
- `GET  /api/cases/{id}/verify` → hash verification
- `GET  /api/cases/{id}/links` → `list[LinkedCase]`
- `GET  /api/cases/{id}/risk` → `list[RiskScoreOut]`
- `GET  /api/cases/{id}/certificate` → PDF
- `GET  /api/stats` → `StatsResponse`
- `GET  /api/health` → `HealthResponse`

### New — Phase 1 (PostgreSQL)
- `POST /api/admin/resync-graph` — rebuild Neo4j from all PG cases

### New — Phase 2 (RBAC)
- `POST /api/auth/register` — create user account
- `POST /api/auth/login` → JWT token
- `GET  /api/auth/me` → current user info
- `GET  /api/supervisor/workload` → case counts per officer, status breakdown

### New — Phase 3 (Search + Leads)
- `GET  /api/cases/search?q=...&category=...&from=...&to=...` → filtered case results
- `POST /api/cases/{id}/leads` — add manual lead entity

### New — Phase 4 (Analytics)
- `GET /api/analytics/crime-distribution` — case counts by crime category
- `GET /api/analytics/timeline-trend` — cases per week/month
- `GET /api/analytics/entity-recurrence` — top recurring entities
- `GET /api/analytics/resolution-rate` — solved vs in-progress ratio

### New — Phase 5 (Help-Bot)
- `POST /api/helpbot/message` — rule-based decision tree chatbot interaction

## Graph schema (Neo4j AuraDB Free — unchanged)
- Nodes: `:Complaint` (case_id, ingested_at), `:PhoneNumber`, `:UPI_ID`, `:URL`,
  `:TransactionID`, `:BankAccount` (each with a `value` property)
- Relationships: `(:Complaint)-[:CONTAINS]->(entity)`
- Ingestion uses `MERGE`, not `CREATE`.
- Risk score formula: `risk_score = min(100, case_count * 15)` via plain Cypher COUNT.

## Frontend additions (by phase)

### Phase 2
- `LoginPage.jsx` — login form (JWT stored in localStorage — deliberate simplification)
- `AuthContext.jsx` — auth state provider, route protection
- `SupervisorDashboard.jsx` — workload table, case counts per officer

### Phase 3
- `SearchPage.jsx` — search bar with filters, results table with highlighting
- "Add Lead" form integrated into `CaseDetail.jsx`
- Visual indicator on `EntityDisplay.jsx` distinguishing manual leads from extracted entities

### Phase 4
- `InsightsPage.jsx` — recharts-powered analytics: donut (crime distribution), area (temporal
  trend), horizontal bar (entity recurrence), heatmap (entity × crime category matrix)
- Summary stat cards (total cases, avg entities/case, most common crime type)

### Phase 5
- `HelpBot.jsx` — chat-style interface at `/help` (no auth, public-facing, welcoming tone).
  Prevention tips rendered as expandable cards with actionable bullet points.
- **Bulk upload**: multi-file picker on `ComplaintForm.jsx` / `FileUploadForm.jsx`. Each PDF
  processed as an independent case (looped client-side, one API call per file). No backend
  endpoint changes. Never combine into one case/one hash.

### Deployment Configuration
- Frontend API base URL: `VITE_API_BASE_URL` env var (Vercel sets this per environment).
- `client.js` reads `import.meta.env.VITE_API_BASE_URL` instead of hardcoded localhost.
- Same codebase works in local dev (points to `localhost:8000`) and deployed (points to Render URL).

## BSA Certificate PDF layout (unchanged)
- Part A (auto-filled): case ID, hash algorithm (SHA-256), hash value, timestamp of ingestion,
  system identity.
- Part B: blank signature block with expert name/designation/date fields — never auto-fill.
