# MEDUSA Agent Router

This file is a routing index. Keep it short and treat the codebase as source of truth.

## Always Do First

1. Read this file before making changes.
2. If editing code, read the relevant files you are about to touch before proposing or writing changes.
3. For non-trivial work, write a short task contract in notes: scope, constraints, verification commands, and exit criteria.
4. Preserve the current product direction: high-contrast luxury beauty UI, geometry-backed analysis, and face-specific guidance that feels premium and direct.

## Core Constraints

- This app uses Next.js 16 App Router. Do not assume older Next.js patterns are valid.
- Photos are processed client-side first. Avoid changes that move raw photo handling server-side unless explicitly requested.
- `CLAUDE_CODE_OAUTH_TOKEN` belongs in `.env.local`, not committed files.
- The two agent-backed APIs return structured JSON. Keep schemas, prompt rules, and UI expectations aligned.
- Do not weaken the precision gate. If face analysis quality checks change, review both the client capture flow and `/api/analyze-face`.
- Push meaningful completed increments regularly instead of batching large local-only changes.
- This repo is mirrored to two GitHub remotes. After a verified increment, push it to both configured repos, not just one.

## Project Routing

- Landing and marketing UI:
  - `src/app/page.tsx`
  - `src/app/layout.tsx`
  - `src/app/globals.css`
- App flow and stage management:
  - `src/app/app/page.tsx`
- Client-side face capture and landmark processing:
  - `src/components/PhotoCapture.tsx`
  - `src/lib/face-detector.ts`
  - `src/lib/geometry-calculator.ts`
  - `src/lib/precision-scorer.ts`
  - `src/lib/face-zone-painter.ts`
- Analysis and tutorial presentation:
  - `src/components/FaceAnalysisDisplay.tsx`
  - `src/components/LookSelector.tsx`
  - `src/components/TutorialDisplay.tsx`
  - `src/components/FaceZoneCanvas.tsx`
- Claude Agent SDK routes:
  - `src/app/api/analyze-face/route.ts`
  - `src/app/api/generate-tutorial/route.ts`

## Conditional Routing

- If touching the landing page or visual system, preserve the existing MEDUSA brand language:
  - dramatic editorial feel
  - Cormorant + DM Sans typography
  - dark luxury palette
  - motion that feels intentional, not generic
- If touching capture or geometry code, verify the full path from image upload to precision scoring to overlay rendering.
- If touching either API route, review:
  - request and response types
  - JSON schema requirements
  - system prompt constraints
  - frontend consumers in `src/app/app/page.tsx` and display components
- If touching privacy, tokens, uploads, or anything that could expose user photos or secrets, review all affected data flow before changing code.

## Completion Gates

Do not mark work complete until the relevant checks pass.

- Default gate:
  - `npm run build`
- If lint-sensitive files changed or build output suggests it:
  - `npm run lint`
- If env or API flow changed:
  - confirm `.env.local` expectations still match the route comments and runtime behavior
- If UI changed materially:
  - verify the affected route in browser at minimum on desktop layout
- After a coherent, verified unit of work is complete:
  - commit and push promptly unless the user explicitly wants changes held locally
  - make sure the push reaches both configured GitHub repos/remotes

## Working Style

- Prefer focused changes over broad rewrites.
- Keep prompts and schema-driven outputs specific to this product. Generic beauty advice is a bug here.
- Keep copy direct and premium. Avoid flattening the brand into generic SaaS language.
- When adding new rules, update this file only if the guidance is durable and project-wide.

