# MEDUSA

MEDUSA is an AI makeup guidance product that reads a user's face from selfie photos, understands their visible features, and turns that analysis into a personalized step-by-step makeup tutorial.

The product is built for users who are not makeup experts. Instead of dumping technical beauty language on them, MEDUSA:

- reads face geometry from uploaded photos
- estimates skin tone and undertone from the photos
- gives a quick, easy-to-understand face read
- lets the user choose a look direction
- generates a tutorial that is specific to that user's face
- paints the tutorial zones back onto the user's own photo

MEDUSA is no longer one-shot only. The app now includes:

- anonymous profile persistence
- saved analysis and tutorial runs
- feedback capture
- lightweight profile preference onboarding
- server-side look recommendations based on saved taste signals plus the current face read

## What The Product Does

At a high level, MEDUSA combines three systems:

1. Client-side face capture and geometry extraction
2. Claude-powered face analysis and tutorial generation
3. Visual tutorial overlays mapped back onto the user's face

The goal is not generic "beauty tips". The goal is:

- personalized guidance
- readable explanations
- strong visual teaching
- a tutorial that feels like it was built for one real face, not a template

## User Journey

The current flow is:

1. The user uploads a selfie.
2. MediaPipe runs on the client and extracts facial landmarks plus geometry signals.
3. MEDUSA decides whether the photo is usable or whether another photo is needed.
4. Claude analyzes the face and returns a concise face read.
5. MEDUSA selects a skin tone and undertone match automatically from the photos.
6. If the user disagrees, they can override the tone/undertone manually.
7. The user picks a look:
   - Natural
   - Soft Glam
   - Evening
   - Bold Lip
   - Monochromatic
   - Editorial
8. If the user picks Editorial, they must choose a subtype:
   - Sharp
   - Glossy
   - Messy
   - Soft
9. Claude generates a full tutorial for that exact face + chosen look.
10. MEDUSA shows each tutorial step with:
   - what product to use
   - where to place it
   - how to apply it
   - what to avoid
   - a highlighted visual zone on the user's own face

## Editorial Makeup Support

Editorial is treated as a broad category with sub-directions, not a single look.

Current editorial subtypes:

- `sharp`: crisp lines, graphic precision, high contrast, clean structure
- `glossy`: reflective shine, fresh skin, wet-look textures, controlled glow
- `messy`: smudged, lived-in, grungy, intentionally undone texture
- `soft`: diffused, airy, hazy, low-harshness editorial finish

When a user selects `Editorial`, the app asks for one of these directions before generating the tutorial. The tutorial prompt then teaches Claude to build that specific editorial style instead of a generic editorial face.

## Core Product Principles

MEDUSA is designed around a few rules:

- Face-first, not trend-first
  The tutorial should fit the user's features before it follows a trend.

- Beginner-readable output
  The user should not need to be a makeup artist to understand the analysis or tutorial.

- Trust through specificity
  The app should give enough easy-to-understand reasoning that the user believes the system actually saw their face.

- Visual teaching matters
  The overlay should reinforce the written instruction clearly and directionally.

- Avoid generic AI output
  The product should not feel like a beauty blog or a random LLM paragraph generator.

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Framer Motion
- MediaPipe Tasks Vision
- Claude Agent / Claude-backed internal helpers
- Postgres for eval persistence and profile history
- Render blueprint support for app + Postgres deployment

## App Structure

Important paths:

- `src/app/page.tsx`
  Marketing / landing page

- `src/app/app/page.tsx`
  Main product flow and app state machine

- `src/components/PhotoCapture.tsx`
  Photo upload, MediaPipe processing, and capture UX

- `src/components/FaceAnalysisDisplay.tsx`
  Quick-read analysis UI

- `src/components/LookSelector.tsx`
  Look selection UI

- `src/components/TutorialDisplay.tsx`
  Tutorial step UI

- `src/components/FaceZoneCanvas.tsx`
  Paints tutorial zones and motion guides over the user's face photo

- `src/lib/face-zone-painter.ts`
  Zone fill shapes, highlight colors, and motion arrow logic

- `src/lib/medusa/analyze-face.ts`
  Core face analysis prompt, schema, and orchestration

- `src/lib/medusa/generate-tutorial.ts`
  Tutorial generation prompt, schema, validation, and repair loop

- `src/app/api/analyze-face/route.ts`
  API route for face analysis

- `src/app/api/generate-tutorial/route.ts`
  API route for tutorial generation

- `src/app/api/feedback/route.ts`
  Feedback ingestion

- `src/app/api/profile/history/route.ts`
  Profile history / persistence API

- `src/app/api/profile/preferences/route.ts`
  Explicit profile preference onboarding API

- `src/lib/persistence/store.ts`
  Persistence, history derivation, and server-side recommendation logic

- `render.yaml`
  Render blueprint for managed Postgres + web service deployment

## Analysis Pipeline

The face-analysis flow works like this:

1. The client uploads a photo.
2. MediaPipe detects landmarks.
3. MEDUSA calculates geometry:
   - face shape ratios
   - eye shape / set
   - lip structure
   - brow and cheekbone traits
4. A precision score decides whether the image is usable.
5. If the image is weak, the app asks for another one.
6. If it is usable, Claude returns:
   - a concise face read
   - feature explanations
   - beauty highlights
   - key makeup priorities
   - skin tone and undertone estimate
   - simple do / don't guidance

## Tutorial Generation Pipeline

The tutorial generation system takes:

- the final face analysis
- the user-selected look
- the optional editorial subtype
- the saved personalization profile derived from explicit preferences, history, and feedback

It then produces:

- a look name and description
- a structured list of tutorial steps
- product guidance
- placement instructions
- technique directions
- avoid rules
- a closing note

There is also a validation / repair loop in the tutorial generator to make sure the generated tutorial actually fits the selected look.

For example:

- `bold-lip` should not accidentally become a full smoky-eye tutorial
- `natural` should stay minimal
- `editorial` should feel directional and fashion-led

## Persistence And Personalization

MEDUSA now persists product state in Postgres and uses that history to influence the next recommendation pass.

Current persistence includes:

- anonymous profile creation via cookie
- saved face analysis runs
- saved tutorial runs
- feedback events
- explicit profile preferences
- profile history reads

Current personalization includes:

- explicit preferences such as skill level, intensity, feature focus, preferred looks, and disliked looks
- inferred preference memory from ratings and tags
- server-side ranked look recommendations for the active face analysis
- tutorial generation conditioned on the saved profile

Current limitation:

- there is still no auth-based account system, so persistence is device/browser scoped for now

## Visual Tutorial Overlay

The tutorial is not text-only. MEDUSA also highlights the correct zone on the user's own photo.

This overlay system supports:

- zone-specific fills
- motion arrows
- directional stroke hints
- more visible color overlays for most face zones
- preserved specialized styling for eyes and brows where that already worked well

The purpose is to make application direction obvious at a glance.

## Local Setup

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

Build production output:

```bash
npm run build
```

Run lint:

```bash
npm run lint
```

## Environment Variables

Runtime environment variables:

- `CLAUDE_CODE_OAUTH_TOKEN`
- `DATABASE_URL` for eval persistence and product persistence
- `MEDUSA_OPS_ACCESS_KEY` for the internal `/ops` dashboard

### `CLAUDE_CODE_OAUTH_TOKEN`

Used for Claude-backed face analysis and tutorial generation.

### `DATABASE_URL`

Used for:

- production eval persistence
- product persistence / profile history

If `DATABASE_URL` is not set, the app can still run, but persistence-backed functionality will be limited or disabled depending on the route.

### `MEDUSA_OPS_ACCESS_KEY`

Used to protect the internal operations dashboard at `/ops`.

Open the dashboard with:

```bash
/ops?key=your-value
```

If this value is not set in production, the dashboard will remain locked.

## Database / Migrations

MEDUSA uses one Postgres database for both:

- production eval persistence
- anonymous profile persistence
- run history
- feedback memory

Apply all migrations:

```bash
npm run db:migrate
```

Current migrations live in:

- `db/migrations/001_inference_evals.sql`
- `db/migrations/002_product_persistence.sql`

These cover:

- inference eval storage
- product persistence
- profile history support

If `DATABASE_URL` is not set, the product still runs, but eval rows, profiles, runs, and feedback are not persisted.

Setup and deployment notes also live in `docs/database.md`.

For Render deployments, the repo also includes `render.yaml`, which:

- provisions a managed Postgres database
- injects `DATABASE_URL` into the web service
- runs `npm run db:migrate` before deploy

If you already have an existing Render service, update the names in `render.yaml` before syncing it so Render adopts the correct resources instead of creating duplicates.

## Evals

MEDUSA includes an eval layer for analysis and generation quality.

Supporting files:

- `docs/evals.md`
- `src/lib/evals/store.ts`
- `src/lib/evals/validators.ts`
- `src/lib/evals/versioning.ts`

This layer exists so the team can measure whether:

- analysis quality is holding up
- prompts are regressing
- look-specific tutorial behavior remains correct
- production output quality stays stable over time

## Persistence

Profile persistence helpers live under:

- `src/lib/persistence/store.ts`
- `src/lib/persistence/profile-cookie.ts`
- `src/lib/persistence/types.ts`

These support product memory and saved history patterns rather than treating every session as stateless.

## Current Product Direction

The project is moving toward a beauty intelligence system, not just a one-shot tutorial generator.

That includes:

- stronger persistence
- better eval tracking
- clearer user trust signals
- richer look branching
- better face-guided visual teaching

## Notes For Contributors

- The repo uses Next.js App Router.
- The codebase uses local Claude orchestration helpers in `src/lib/claude`.
- The product prompt design is central to product quality, not an implementation detail.
- Visual overlays matter as much as the generated text.
- If you change prompt logic, tutorial rules, or look definitions, verify that the resulting user experience still feels readable and specific.

## Short Summary

MEDUSA is a face-aware AI makeup product that:

- sees the user's features
- explains them simply
- lets them choose a style direction
- generates a tutorial for that exact face
- teaches the application visually on their own photo

That is the core product.
