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

- `CLAUDE_CODE_OAUTH_TOKEN` or `ANTHROPIC_API_KEY`
- `DATABASE_URL` for production eval persistence

## Evals

Production eval persistence is backed by Postgres.

Apply:

```bash
db/migrations/001_inference_evals.sql
```

Then set:

```bash
DATABASE_URL=postgres://...
```

When `DATABASE_URL` is not set, the product still runs, but eval rows are not persisted.

Detailed notes live in `docs/evals.md`.
