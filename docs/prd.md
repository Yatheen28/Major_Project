# PRD — AI-Assisted Cybercrime Investigation & Forensic Intelligence System
Group 14 · 22CDS66 · SJEC Mangaluru

## 1. Problem (honest version)
Indian cyber cell officers manually read Hinglish complaint narratives to extract forensic
entities (phone numbers, UPI IDs, URLs, transaction IDs, dates, amounts), cannot see when the
same entity appears across complaints filed by other officers/states, and have no automated
way to generate the BSA 2023 Section 63 dual evidence certificate.

**Do not claim these problems are unsolved.** They are partially solved by:
- Entity extraction: an I4C-hackathon Hinglish classifier already exists (Rani et al., deployment-ready).
- Cross-case correlation: Pratibimb (national, phone-number + geospatial, 6,046 arrests) and
  Samanvaya already do this at government scale. Commercial link-analysis tools (i2 Analyst's
  Notebook, Maltego) do this globally.
- BSA certificate generation: Chat2Evidence (commercial) and e-Sakshya (NIC, in development)
  already automate this.

## 2. Honest value proposition
This is a **small-scale, open, reproducible academic prototype** — not a replacement for any of
the above. Its narrow, defensible claim:
- Correlates on **UPI IDs, transaction IDs, and URLs** — entity types Pratibimb's public
  description does not emphasize (it's phone-number/geospatial-centric).
- Is **fully explainable** — every link traces to a specific shared entity, no black-box ML
  correlation (matters for evidentiary defensibility, unlike opaque commercial tools).
- Combines extraction + correlation + BSA certification in **one open pipeline**, which no
  single reviewed source does end-to-end.

Never claim "no one has done this before." Claim "here is what's different about doing it this way."

## 3. Users
- **Primary: Investigating Officer** — submits complaints, views extracted entities, views the
  correlation graph, generates the evidence certificate.
- **Secondary: Certifying Technical Expert** — reviews/signs BSA Part B.
- **Supervisor** — cross-team case oversight, workload distribution, analytics access (RBAC).
- **Victim (public-facing)** — interacts with the help-bot for crime identification, prevention
  guidance, and guided complaint submission (no auth required).

## 4. In-scope crime categories (memorize — this is what got you in trouble last time)
Phishing · Online financial/UPI/banking fraud · Identity-theft scams · Social-media scams.

**Explicitly excluded: ransomware.** Reason to give if asked: ransomware evidence is
binary/log/malware-artifact based, not narrative-text based — out of scope for an NLP-on-
complaint-text pipeline. Don't freelance a different answer under pressure.

**Also explicitly excluded: job scams, investment fraud.** These were identified as scope creep
beyond the approved category rationale (financial/digital fraud types with narrative-text
evidence). Do not reintroduce without explicit approval.

**Scope-consistent expansion candidates** (for final presentation, if time allows — require
explicit approval before implementation): SIM swap fraud, online harassment/stalking, banking
fraud. These are plausibly similar to the existing four categories in evidence type and
investigation workflow.

## 5. Out of scope (say this proactively, don't wait to be asked)
Crime prevention. Real-time monitoring/surveillance. Predictive policing. This is
post-incident investigation support only.

Exception: the victim help-bot provides **post-incident prevention guidance** (tips to avoid
repeat victimization — e.g., never share OTPs, verify caller identity). This is reactive
education, not proactive crime prevention or surveillance.

## 6. Final presentation success criteria
- **Implementation %**: Full feature set — PostgreSQL persistence, RBAC, search, analytics
  dashboards, OCR expansion, crime classification, victim help-bot with prevention guidance.
- **Demo Q&A**: every team member can explain *why* each design choice was made, not just what
  it does. Prepared answers for: crime categories, extraction abstraction, JWT-in-localStorage
  tradeoff, Supabase vs self-hosted PG, rule-based vs LLM help-bot.
- **Diary**: submit honestly and on time.

## 7. Feature scope — final presentation
**In (committed, 20-day plan):**
- PostgreSQL persistence via Supabase (replace in-memory store)
- RBAC: Officer + Supervisor roles, JWT auth
- Full-text case search with filters
- Manual case leads → Neo4j correlation
- Analytics/insights dashboard (recharts): crime distribution, temporal trends, entity
  recurrence, supervisor workload
- OCR expansion for printed/typed complaints (Tesseract with preprocessing)
- Crime category auto-classification (keyword-based, 4 core categories)
- Victim help-bot: rule-based decision tree with crime identification, immediate steps,
  prevention guidance, and guided complaint submission
- Bulk complaint upload (multi-file picker, each PDF processed independently)
- Deployment: frontend on Vercel, backend on Render (deployed early after Phase 1)
- UI polish pass

**Out (future work, documented):**
- Handwriting OCR (requires CNN/Transformer + GPU lab)
- Neo4j GDS algorithms (WCC, Louvain, PageRank — pending GDS availability)
- NLP model integration into live app (training separately in Colab)
- Real-time notifications (WebSocket)
- Audit log / chain-of-custody
- Category expansion beyond core 4 (requires approval)
- Docker/full cloud deployment beyond the Vercel+Render demo setup
