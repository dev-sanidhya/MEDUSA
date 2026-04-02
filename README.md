# MEDUSA

MEDUSA is a Next.js beauty intelligence app that:

- captures face geometry client-side with MediaPipe
- analyzes the face with Claude Sonnet
- generates look-specific makeup tutorials
- overlays those steps back onto the user’s own face

## Local Setup

Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

Runtime env:

- `CLAUDE_CODE_OAUTH_TOKEN`
- `DATABASE_URL` for eval persistence and product persistence

## Database

MEDUSA uses one Postgres database for both:

- production eval persistence
- anonymous profile persistence, run history, and feedback memory

Apply all migrations:

```bash
npm run db:migrate
```

Then set:

```bash
DATABASE_URL=postgres://...
```

When `DATABASE_URL` is not set, the product still runs, but eval rows, profiles, runs, and feedback are not persisted.

Migrations included:

- `db/migrations/001_inference_evals.sql`
- `db/migrations/002_product_persistence.sql`

Setup and deployment notes live in `docs/database.md`.

## Evals

Detailed notes live in `docs/evals.md`.
