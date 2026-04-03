# MEDUSA Database Setup

MEDUSA uses a single Postgres database for two things:

- eval persistence for model runs
- product persistence for anonymous profiles, analysis runs, tutorial runs, and feedback

## What is already in the repo

Schema migrations:

- `db/migrations/001_inference_evals.sql`
- `db/migrations/002_product_persistence.sql`

Migration command:

```bash
npm run db:migrate
```

The current SQL migrations are written to be idempotent, so rerunning the command is safe for the existing schema files.

Shared connection path:

- `src/lib/db/postgres.ts`

That shared pool is used by both:

- `src/lib/evals/store.ts`
- `src/lib/persistence/store.ts`

## Required env

Set this in local development and in deployment:

```bash
DATABASE_URL=postgres://...
```

`CLAUDE_CODE_OAUTH_TOKEN` is still required for the model-backed routes, but it is separate from database setup.

## Local setup

1. Create a Postgres database.
2. Put the connection string in `.env.local` as `DATABASE_URL`.
3. Run:

```bash
npm run db:migrate
```

4. Start the app:

```bash
npm run dev
```

## Render recommendation

Yes, setting this up on Render is a reasonable default if you are already deploying the app there.

Recommended layout:

- Next.js web service on Render
- managed Postgres on Render
- one `DATABASE_URL` injected into the web service

Deployment steps:

1. Create a Render Postgres instance.
2. Copy its internal or external connection string into the web service as `DATABASE_URL`.
3. Add `CLAUDE_CODE_OAUTH_TOKEN` to the same service.
4. Run `npm run db:migrate` against that database before or during first deploy.

If you want a clean deployment path, add a predeploy migration step in Render so schema updates happen before the new build serves traffic.

## Blueprint Setup

The repo now includes [`render.yaml`](/C:/CS/Medusa/render.yaml) so the Render setup is versioned with the app.

What the blueprint does:

- provisions one Node web service
- provisions one managed Postgres database
- injects `DATABASE_URL` from that Postgres instance into the web service
- prompts for `CLAUDE_CODE_OAUTH_TOKEN`
- runs `npm run db:migrate` as a predeploy step before the app starts

Important caveat:

- If you already have a Render web service for MEDUSA, update the `name` fields in [`render.yaml`](/C:/CS/Medusa/render.yaml) to match your existing Render resource names before syncing the Blueprint.
- If you leave the names as-is and sync a Blueprint against an existing deployment with different resource names, Render will try to create new resources instead of adopting the current ones.

Recommended production flow:

1. In Render, either:
   - create a new Blueprint from [`render.yaml`](/C:/CS/Medusa/render.yaml), or
   - use Render's "generate Blueprint from existing services" flow and align the generated file with this repo
2. Set `CLAUDE_CODE_OAUTH_TOKEN` in the web service
3. Confirm `DATABASE_URL` is sourced from the managed Postgres instance
4. Trigger a deploy and confirm the predeploy migration step succeeds
5. Open the deployed app and run one full persistence loop end to end

## What persistence exists today

Current product persistence covers:

- anonymous profile creation via cookie
- analysis run storage
- tutorial run storage
- feedback event storage
- profile history reads
- lightweight derived preference memory from saved feedback

Current eval persistence covers:

- face analysis runs
- tutorial generation runs
- automatic eval scores and issues
- human review table scaffolding

## Current limitation

There is no account auth yet. Persistence is currently anchored to an anonymous profile cookie, so continuity works on the same browser/device but not yet across devices.
