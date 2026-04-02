# MEDUSA Evals

This repo now records production-grade inference evals for both server-side model flows:

- `face_analysis`
- `tutorial_generation`

## What gets stored

Each run stores:

- workflow name
- model
- prompt version
- schema version
- selected look (for tutorials)
- sanitized request summary
- response summary
- latency and other metrics
- automatic pass/fail score
- automatic issue rows for each validation failure

Raw photo bytes are intentionally not stored in the eval tables.

## Database setup

Apply the migration in `db/migrations/001_inference_evals.sql` against Postgres and set:

- `DATABASE_URL`

When `DATABASE_URL` is not set, the app still works, but eval persistence is disabled and a warning is logged once.

## Automatic eval coverage

Face analysis checks:

- retry vs complete payload shape
- 3-photo cap handling
- tone/undertone ranked options
- required list sizes
- basic direct-address quality

Tutorial checks:

- step counts by look
- required and forbidden zones by look
- step sequencing
- first-step skin prep
- under-eye coverage
- brows + mascara coverage
- highlighter and setting-spray expectations
- false-lash requirements
- bold-lip prep
- monochromatic color-story language

## Human review readiness

The migration also creates `medusa_inference_reviews` so a reviewer tool or admin panel can be added without reshaping the data model later.
