# Rules — Use / Avoid

## Branch Discipline (mandatory — all phases)
- Every phase is developed on a **dedicated branch** (`feature/postgres-migration`, `feature/rbac`,
  `feature/search-leads`, `feature/insights-analytics`, `feature/ocr-categories-helpbot`,
  `feature/ui-polish`).
- Merging to `main` requires **USER-confirmed manual verification** — the agent reports results,
  the user personally confirms pass/fail before the merge happens.
- No merge to `main` without explicit user approval. The agent asks and waits.
- If verification fails, fixes happen on the same phase branch. No merge until verified.

## Use
- Python 3.10+, FastAPI, Pydantic v2 (already the stack — extend, don't replace)
- Regex/rule-based extraction for structured entities (phone, UPI, URL, transaction ID, amount,
  date) — this is correct engineering, not a shortcut. Keep it.
- **Extraction abstraction**: all downstream code calls `extract_entities(text) -> list[EntityOut]`.
  Never couple to regex internals. The NLP model will plug into this same interface.
- **Neo4j AuraDB Free** for graph correlation (mentor-confirmed) — cloud-managed, sign-up only,
  no local install. Reuse the Chapter-4-approved node/relationship schema, don't invent a new one.
- **Supabase** for PostgreSQL hosting (cloud-managed, `supabase 2.28.0` already installed).
  Connection via async SQLAlchemy + asyncpg. Alembic for migrations.
- `fpdf2` for the BSA certificate PDF
- **recharts** for analytics charts (confirmed choice — simpler API, React-native)
- React + axios (existing frontend — extend with new pages, don't restructure)
- Faker (extended with real Indian entity-format seeds from the UPI/online-fraud datasets) + an
  LLM for Hinglish narrative templates, for synthetic NER training data
- HuggingFace `Trainer` with `eval_strategy="epoch"`, `load_best_model_at_end=True`, and
  `EarlyStoppingCallback` for IndicBERT fine-tuning — this IS the "don't over/underfit" harness,
  no custom loop needed
- **JWT auth** with localStorage storage (deliberate simplification — see below)
- **Rule-based decision tree** for help-bot (not LLM, not API-backed)
- **Synthetic test images** for OCR testing (don't source real photos)
- **Vercel** for frontend deployment, **Render** for backend deployment (persistent process,
  not serverless — connection pooling needs it). Deploy early after Phase 1, not at the end.
- **Environment-based config**: `VITE_API_BASE_URL` (frontend), `DATABASE_URL`, `NEO4J_*`,
  `JWT_SECRET` (backend) — all from env vars, not hardcoded. Same codebase works local + deployed.

## Deliberate Simplifications (stated decisions, not oversights)
- **JWT in localStorage**: vulnerable to XSS, but simpler than httpOnly cookies + CSRF for an
  academic prototype with no real user data. Production would use httpOnly cookies. This is
  documented in the plan (Day 8.1) and architecture.md.
- **Keyword-based crime classifier**: swappable interface — ML classifier can replace it later.
  Same abstraction pattern as the entity extractor.
- **Risk score formula** (`min(100, case_count * 15)`): simple and defensible. Full
  centrality/WCC/Louvain via GDS is future work.

## Avoid (this cycle — revisit after final presentation)
- Self-hosting Neo4j (Docker/local install) — use Aura Free instead, zero deployment risk
- Depending on the Neo4j GDS plugin (WCC/Louvain/centrality) — availability on Aura Free is
  unconfirmed; use plain Cypher COUNT aggregation for the risk score
- Wiring IndicBERT fine-tuning into the live demo app — train separately in Colab, demo as
  "Phase II, in progress"
- **Reintroducing excluded crime categories**: RANSOMWARE (different evidence type), JOB_SCAM,
  INVESTMENT_FRAUD (scope creep). The approved categories are: Phishing, UPI Fraud, Identity
  Theft, Social-Media Scams. Expansion candidates (SIM swap, online harassment, banking fraud)
  require explicit approval.
- Adding any new tool/repo/skill not already integrated (Graphify, Context7 excepted) without
  checking first — every new dependency is a new failure mode
- Editing Chapters 1–3 of the report — they're approved, low ROI to touch
- Fabricating diary entries — going forward, log only what was actually built, even if it's less
  than planned
- **Wildcard CORS** (`*`) in production — CORS must be locked to the actual Vercel frontend origin.
  This is a PII-handling tool, not a public API.
- **Combining multiple PDFs into one case** — chain-of-custody hash ambiguity, explicitly out of scope.
  Bulk upload loops the single-file endpoint, one case per PDF.

## Process rules for the agent
- Work in small, independently testable increments. After each change: run it, confirm it
  works, then move on. Do not implement multiple modules before testing any of them.
- If a design decision in architecture.md seems wrong once you're in the code, flag it and ask
  before deviating — don't silently improvise scope.
- Cite the specific file/function you're changing before changing it (matches how GRAPH_REPORT.md
  already maps the codebase — use it as ground truth for what exists).
- **Never merge a phase branch to main without user confirmation** (see Branch Discipline above).

---

## Cross-Model Coding Consistency

This project is worked on across multiple models in Antigravity — primarily Claude Opus, with
fallback to Gemini 3.1 Pro or others when a model's quota runs out mid-session. Different
models can default to different conventions (naming, error handling style, import ordering,
how they structure similar logic), which risks inconsistent code across the same codebase
depending on which model happened to write which part. To prevent this:

1. **Before writing any new code in a session, read the existing patterns in the file(s) being
   touched and in 2–3 recently-modified related files** — match established naming
   conventions, error handling style, and structural patterns already in use, rather than
   defaulting to this session's model's own instincts. Do not introduce a new pattern for
   something an existing pattern already handles (e.g. a different async error-handling style,
   a different way of structuring Pydantic models) just because it's a different model's
   default preference.
2. **Adopt automated formatting/linting as the actual enforcement mechanism, not model
   judgment.** Set up `black` + `ruff` (or `isort`) for the Python backend and `prettier` +
   `eslint` for the React frontend, configured once, run automatically (e.g. as a pre-commit
   step or explicitly before every commit). This normalizes style mechanically regardless of
   which model wrote the code — don't rely on each model to "remember" the house style from
   context alone.
3. **When a new model session picks up mid-phase**, it should start by reading the last 2–3
   commits and the current state of the relevant files — not just the plan/docs — before
   writing new code, so it continues the existing implementation rather than restarting with
   its own approach.
4. If a model notices an existing inconsistency left by a prior session (different pattern in
   two similar places), flag it rather than silently adding a third pattern — ask whether to
   normalize it now or note it for later cleanup.

## Testing — Optimize, Don't Eliminate

Testing has been consuming a disproportionate amount of token budget. Keep testing, but scope
it deliberately:
- Write focused automated tests only for logic where a silent failure would be costly or hard
  to catch manually: auth/permission checks, the hashing/verification logic, entity-to-graph
  sync correctness, and anything touching the certificate generation (legal-integrity-critical
  paths). Do not write exhaustive test suites for simple CRUD getters or straightforward UI
  components — those are already covered by the per-phase Manual Verification step the user
  performs personally.
- When re-testing during iteration, run only the specific test file/module relevant to the
  current change, not the full suite, unless it's the final pre-merge check for that phase.
- Don't regenerate or rewrite existing passing tests unless the underlying code actually
  changed. Trust prior green tests unless you have reason to suspect they're stale.
- The user-gated Manual Verification checklist at the end of each phase remains the primary
  correctness gate — automated tests support that, they don't need to duplicate it exhaustively.

## Manual Task Offloading — Flag What the User Should Do

To conserve token budget for actual implementation, explicitly call out (at the start of each
day/session, as a short checklist) any task that's better done by the user directly rather than
by the agent — especially anything involving external service setup, one-time manual commands,
or things prone to environment-specific failure (like the earlier Tesseract install issue on
Windows). Examples of what should be flagged to the user instead of attempted agentically:
- Installing system-level packages/binaries (anything beyond `pip install`/`npm install` that
  needs OS-level setup)
- Creating accounts or projects on external services (Supabase project creation, obtaining
  connection strings/API keys)
- Running one-time setup commands the user can execute faster themselves once told exactly
  what to run
- Any GPU lab access/setup steps, since that requires faculty coordination outside the agent's
  reach
- Anything that previously failed silently in an agent-driven attempt (e.g. Tesseract on
  Windows) — hand these to the user with exact instructions rather than re-attempting
  automated installation repeatedly

Format this as a short "Do this yourself" list at relevant points in the plan, with exact
commands/steps, rather than the agent spending its own tokens attempting environment setup it
can't reliably verify anyway.
