# Phases — 20-Day Post-Review Plan (Final Presentation)

Budget: ~20 effective working days across a ~40-day calendar window.
Branch discipline: every phase on a dedicated branch, USER-confirmed verification before merge.

## Phase 1 — PostgreSQL Migration (Days 1–4)

**Branch**: `feature/postgres-migration`

**Goal**: Replace in-memory `_CaseStore` with Supabase-hosted PostgreSQL. Every existing
endpoint works identically after migration. Foundation for all subsequent phases.

- Day 1: Schema + SQLAlchemy models + Alembic init + Supabase connection
- Day 2: Repository layer (async CRUD matching `_CaseStore` interface) + unit tests
- Day 3: Wire `main.py` to repository via `Depends(get_db)`, all endpoints migrated
- Day 4: Neo4j sync hardening, `POST /api/admin/resync-graph`, remove old `case_store.py`

**Verification gate**: Ingest complaint → restart server → case persists in Supabase PG.
USER confirms → merge to `main`.

### Deployment Checkpoint (after Phase 1 merge, before Phase 2)

**Hosting**: Frontend on **Vercel**, backend on **Render** (persistent process needed for
connection pooling). Deploy early to surface env var/CORS/build issues while there's time
to fix them.

- Deploy backend to Render, set env vars (DATABASE_URL, NEO4J_*, JWT_SECRET)
- Deploy frontend to Vercel, set VITE_API_BASE_URL pointing to Render
- Lock CORS to actual Vercel origin (not wildcard)
- Environment-based config: same codebase works local + deployed without manual edits
- Smoke test on deployed URLs

**Cold-start risk**: Render free tier sleeps after ~15 min (30–50s cold start). Warm up
before demos. Paid tier ($7/mo) eliminates this for presentation week.

USER confirms deployment works → proceed to Phase 2.

## Phase 2 — RBAC + JWT Authentication (Days 5–8)

**Branch**: `feature/rbac`

**Goal**: Two roles — Officer (own-case access) and Supervisor (cross-team view + workload).
JWT-based auth. JWT stored in localStorage (deliberate academic simplification — XSS tradeoff
documented).

- Day 5: User model + `auth.py` (JWT creation/verification, password hashing, role enum)
- Day 6: Auth endpoints (`register`, `login`, `me`) + user seed script
- Day 7: `Depends(get_current_user)` on all case endpoints + supervisor workload endpoint
- Day 8: Frontend auth flow (LoginPage, AuthContext, route protection, SupervisorDashboard)

**Verification gate**: Officer creates case → only visible to that officer. Supervisor sees all.
USER confirms → merge to `main`.

## Phase 3 — Search + Case Leads (Days 9–11)

**Branch**: `feature/search-leads`

**Goal**: Full-text search over historical cases. Manual case leads that feed into Neo4j
correlation (same MERGE pattern as extracted entities).

- Day 9: Search backend (PG full-text or ILIKE + filters) + SearchPage frontend
- Day 10: Lead model + `POST /api/cases/{id}/leads` + `sync_lead_to_graph()`
- Day 11: Lead UI in CaseDetail + visual indicator in EntityDisplay + integration test

**Verification gate**: Search returns results. Manual lead creates Neo4j correlation link.
USER confirms → merge to `main`.

## Phase 4 — Insights & Analytics Dashboard (Days 12–15)

**Branch**: `feature/insights-analytics`

**Goal**: recharts-powered analytics showcasing Data Science skills. Crime distribution,
temporal trends, entity recurrence, supervisor workload visualization.

- Day 12: Install recharts + analytics backend endpoints (4 aggregation queries)
- Day 13: Crime distribution donut chart + temporal trend area chart
- Day 14: Entity recurrence bar chart + entity-crime heatmap (stretch)
- Day 15: Supervisor workload chart + summary stat cards + nav wiring

**Verification gate**: All charts render with seeded data. Supervisor vs officer views correct.
USER confirms → merge to `main`.

## Phase 5 — OCR Expansion + Crime Categories + Help-Bot (Days 16–19)

**Branch**: `feature/ocr-categories-helpbot`

**Goal**: OCR preprocessing for printed complaints. Auto-classification into 4 approved crime
categories. Victim help-bot with crime identification, immediate steps, prevention guidance,
and guided complaint submission.

- Day 16: OCR preprocessing (grayscale, thresholding, deskewing, eng+hin) + synthetic test images
- Day 17: Crime category enum (PHISHING, UPI_FRAUD, IDENTITY_THEFT, SOCIAL_MEDIA_SCAM) +
  keyword classifier + ingest integration + backfill migration
- Day 18: Help-bot backend — rule-based dialogue trees with explicit prevention guidance node
  (per-crime-type tips: never share OTPs, verify caller identity, enable 2FA, etc.)
- Day 19: Help-bot frontend — chat UI at `/help` (no auth), prevention tips as expandable cards;
  **bulk complaint upload** — multi-file picker (each PDF processed independently, no combining)

**Crime categories — scope fence**:
- ✅ Approved: Phishing, UPI Fraud, Identity Theft, Social-Media Scams
- ⏳ Expansion candidates (need approval): SIM swap, online harassment, banking fraud
- ❌ Excluded: ransomware, job scams, investment fraud

**Verification gate**: OCR extracts text from synthetic image. Classifier assigns correct
category. Help-bot flow reaches prevention tips for all 4 crime types. Complaint auto-submits.
Bulk upload 3 PDFs → 3 independent cases with distinct hashes.
USER confirms → merge to `main`.

## Phase 6 — UI Polish & Integration Testing (Day 20 + Ongoing)

**Branch**: `feature/ui-polish`

**Goal**: Navigation overhaul, responsive pass, loading states, error handling, About page
update, **final deployment update**, 3-laptop demo verification, full demo dry-run.

- Day 20: Sidebar update (all new pages, role-conditional), responsive check, skeleton
  loaders, Toast component, About page revision; redeploy Vercel + Render with all changes;
  3-laptop demo verification against deployed URLs (victim/help-bot, officer, supervisor);
  full demo dry-run recording against deployed URLs

**Ongoing polish thread** (across all phases): dark theme consistency, micro-animations,
status badges, table sorting/pagination, print-friendly certificate, accessibility.

**Verification gate**: Full demo dry-run against deployed URLs — every feature exercised.
3-laptop verification: victim, officer, supervisor views all work on separate devices.
No broken routes, no console errors. USER confirms → merge to `main`.

---

## Explicitly deferred (document as "Future Work" in presentation)
- Handwriting OCR (CNN/Transformer + GPU lab)
- Neo4j GDS algorithms (WCC, Louvain, PageRank)
- NLP model integration into live app
- Real-time WebSocket notifications
- Audit log / chain-of-custody
- Category expansion beyond core 4
- Docker/full cloud deployment beyond the Vercel+Render demo setup
