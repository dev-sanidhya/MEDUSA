Scope
- Add an internal operations dashboard for persistence and eval visibility.
- Surface high-signal production metrics from Postgres inside the app.
- Gate the dashboard so user data is not public by default.

Constraints
- Do not expose raw face photos.
- Read directly from the existing Postgres schema; do not add new tables.
- Keep the route internal-facing and operational, not consumer-facing.

Verification
- npm run build
- npm run lint

Exit Criteria
- A protected `/ops` route exists.
- The dashboard shows persistence volume, recent runs, eval health, and common issue codes.
- The route degrades clearly when DB or dashboard access config is missing.
