Scope
- Add the first MEDUSA product persistence slice.
- Persist anonymous profiles, analysis runs, and tutorial runs in Postgres.
- Return durable run ids from the API flow and wire server-side storage for the current flow.

Constraints
- Keep client-side-first photo processing intact.
- Do not weaken or bypass the current precision gate.
- Reuse the existing Postgres pattern used by eval persistence.
- Keep the product working when DATABASE_URL is not set.
- Do not make raw photo storage a requirement for this phase.

Verification
- npm run build
- npm run lint

Exit Criteria
- A migration exists for product persistence tables.
- The server can create or reuse an anonymous profile id via cookie.
- /api/analyze-face persists analysis output and returns an analysisRunId when persistence is available.
- /api/generate-tutorial persists tutorial output and returns a tutorialRunId when persistence is available.
- The increment is committed and pushed to both configured GitHub repos.
