Scope
- Move tutorial personalization context construction fully server-side.
- Add a concrete shared Postgres setup path for both eval persistence and product persistence.
- Document the current persistence surface and deployment setup.

Constraints
- Keep anonymous profile continuity intact.
- Do not weaken the current precision gate or move raw photo processing server-side.
- Keep personalization advisory; face-fit and selected look rules still win.
- Reuse the existing Postgres connection path instead of adding parallel DB config.

Verification
- npm run build
- npm run lint
- npm run db:migrate on a configured database or dry-run review of the script

Exit Criteria
- `/api/generate-tutorial` derives personalization from the saved profile server-side.
- The client no longer needs to send derived preference memory for tutorial generation.
- There is one documented DB setup path for evals and product persistence.
- The repo includes a runnable migration command for Postgres.
