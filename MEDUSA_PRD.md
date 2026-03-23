# 🐍 MEDUSA

AI-Powered Personalized Makeup Tutor

Make them freeze.

Product Requirements Document · v1.0 · 2026

## 1. Product Overview

Medusa is an AI-powered makeup tutoring app that takes a user's selfie, analyzes their unique face — skin tone, undertone, face shape, skin concerns — and generates a fully personalized, step-by-step visual makeup tutorial. After each step, the user sees a realistic render of their own face with that step applied, building progressively to the final complete look.

Medusa does not just recommend products. It teaches. It shows. It transforms.

## 2. Problem Statement

## 2.1 The Core Pain

Generic YouTube tutorials are made for a default face — not yours.

Virtual try-on apps (Nykaa, MAC) let you test products but don't teach technique.

Makeup counters are intimidating, expensive, and inaccessible.

Indian skin tones are severely underrepresented in Western beauty AI tools.

First-time users have no idea what order to apply things in or why.

## 2.2 The Gap Medusa Fills

No app today combines: your specific face + a personalized step-by-step guide + a visual preview of the result at each step. That combination is Medusa's entire value proposition.

## 3. Target Users

Segment

Who They Are

Their Need

Primary

Women 18–30, India-first, first-time or casual makeup users

Learn the right technique for their specific face

Secondary

Makeup-aware women experimenting with new looks

See the look on their face before investing time/money

Tertiary

Makeup artists & influencers

Quick personalized look mockups for clients or content

## 4. Core Features

## 4.1 Face Analysis Engine

User uploads a selfie (front-facing, natural lighting recommended)

Claude SDK analyzes: skin tone (fair / wheatish / dusky / deep), undertone (warm / cool / neutral), face shape (oval / round / square / heart / oblong), visible concerns (dark circles, uneven skin, oiliness, dryness)

Analysis is stored as a structured face profile used throughout the session

## 4.2 Look Selection

User selects an occasion/vibe: Natural Glow · Office Ready · Soft Glam · Night Out · Festive / Wedding

Optional: intensity level (light / medium / full glam)

Optional: product budget tier (drugstore / mid-range / premium)

## 4.3 Personalized Tutorial Generation

Claude generates 6–9 ordered steps specific to the user's face profile and chosen look

Each step includes: step name, face zone targeted, technique instruction in plain English, why this suits their specific skin/face, product category (not brand-specific in V1)

Example step: 'Your T-zone is slightly oily — apply a matte primer here first, dabbing not swiping, before any foundation'

## 4.4 Step-by-Step Realistic Face Renders (The Hero Feature)

After each tutorial step is shown, a realistic image of the user's face with that step applied is generated

Images build cumulatively — each step's output feeds as input to the next generation

Face identity is preserved throughout the chain (using InstantID + ControlNet or equivalent)

User sees a visual progression: original face → primer → foundation → eyes → lips → final look

Final screen shows a side-by-side: original selfie vs. complete look

## 4.5 Look Saving & Sharing

Users can save any look as a 'Medusa Look' to their profile

Shareable card: progression strip showing all steps as thumbnails + final look

Share to Instagram / WhatsApp directly from the app

## 5. User Flow

Step

Screen

What Happens

1

Onboarding / Upload

User uploads selfie or takes photo in-app

2

Face Analysis

Loading state while Claude analyzes face — shows detected skin tone, face shape, undertone as a visual card

3

Look Picker

User picks occasion + intensity + budget preference

4

Tutorial Overview

Shows all steps in a numbered list — user sees the full journey before starting

5

Step-by-Step

For each step: technique card (plain English) → 'See Result' button → realistic face render loads

6

Final Look

Before/after comparison — original selfie vs. full look

7

Save / Share

Save to profile or share as a card

## 6. Technical Architecture

## 6.1 Tech Stack

Layer

Technology

Purpose

AI Brain

Claude Code SDK (claude-sonnet-4)

Face analysis, tutorial generation, image prompting

Image Generation

fal.ai or Replicate API

Realistic face renders per step

Face Consistency

InstantID + ControlNet

Preserves face identity across all generated steps

Frontend

React Native

iOS + Android from single codebase

Backend

Node.js + Express

API orchestration, session management

Storage

## AWS S3

User photos, generated images

Database

PostgreSQL

User profiles, saved looks, face data

Auth

Firebase Auth

Phone / Google sign-in

## 6.2 The AI Pipeline

## Step 1 — Face Analysis

Selfie sent to Claude SDK with a structured system prompt

Claude returns JSON: { skinTone, undertone, faceShape, concerns[], recommendedTechniques[] }

## Step 2 — Tutorial Generation

Claude receives face profile + selected look

Returns ordered array of steps: [{ stepName, zone, instruction, whyForYou, imagePromptHint }]

## Step 3 — Image Generation Chain

Base image = original selfie

For each step: previous image + Claude's imagePromptHint → fal.ai API → new image

Images stored in S3 with step index; session maintains the chain

## 7. MVP Scope (V1)

In Scope

Selfie upload + face analysis

## 5 look types (Natural, Office, Soft Glam, Night Out, Festive)

Step-by-step tutorial with 6–8 steps

Realistic face render after each step

Final before/after comparison

Save look to profile

Basic share card (PNG export)

Out of Scope for V1

Product recommendations with buy links (V2)

Live camera / AR try-on (V2)

Community / social feed (V3)

Makeup artist booking (V3)

Brand partnership integrations (V3)

Multi-language support beyond English (V2)

## 8. Monetization

Stream

Model

Timing

Freemium Subscription

## 3 free looks/month → ₹199/mo or ₹1499/yr for unlimited

Launch

Affiliate Revenue

Product links to Nykaa, Myntra Beauty, Sephora India

## V2

Brand Partnerships

Brands pay to be featured in 'recommended products'

## V2

B2B / White Label

Sell to salons, beauty schools, influencer agencies

## V3

## 9. Competitive Advantage

Why Medusa Wins

India-first skin tone depth — trained and optimized for South Asian complexions (warm, wheatish, dusky, deep brown) where Western apps fail badly

Step-by-step face renders — nobody does this. The progressive visual on YOUR face is the moat

Tutorial-first, not product-first — builds trust before asking for money

Brand positioning — dark, bold, empowering. Not pink, not soft. Owns a completely different emotional space in beauty tech

Competitive Landscape

Competitor

What They Do

What They Miss

Nykaa Beauty

Product discovery + basic virtual try-on

No personalized tutorial, no face-specific guidance

YouCam Makeup

AR try-on + looks

Generic, not personalized, poor Indian skin tone support

MAC Virtual Try-On

Try on MAC products only

Brand-locked, no tutorial, no technique guidance

YouTube Tutorials

Video tutorials

Generic face, no personalization, no visual preview on you

Medusa

Personalized tutorial + step renders on YOUR face

This is what we build 🐍

## 10. Success Metrics

Metric

Target (3 months post-launch)

Why It Matters

Monthly Active Users

## 10,000 MAU

Core adoption signal

Tutorial Completion Rate

> 60%

Measures if the experience is engaging enough to finish

Look Shares per Week

> 2,000

Organic growth engine

Paid Conversion Rate

> 8%

Business viability

Face Render Satisfaction

> 4.2/5 in-app rating

Core feature quality signal

D7 Retention

> 35%

Product-market fit indicator

## 11. Risks & Mitigations

Risk

Impact

Mitigation

Face render quality is uncanny/unrealistic

High — kills trust immediately

Extensive testing on Indian faces pre-launch; offer stylized mode as fallback

Face identity drifts between steps

High — user looks different in each step

Use cumulative chain (step N output → step N+1 input), not original each time

High API cost per session

Medium — margins tight

Cache face analysis; optimize step count; gate renders behind subscription

Privacy concerns around selfie storage

High — user trust

On-device processing where possible; clear data deletion policy; no selling of face data

Indian skin tone accuracy

High — core differentiator

Build diverse test dataset of South Asian skin tones before launch

## 12. Roadmap

Phase

Timeline

Key Deliverables

Phase 0 — Validation

Weeks 1–2

Manual test: upload face → Claude analysis → hand-crafted tutorial → image gen quality check. No app yet.

Phase 1 — MVP Build

Weeks 3–8

Core pipeline: face analysis + tutorial gen + step renders. React Native shell. Internal testing.

Phase 2 — Beta

Weeks 9–12

100 beta users. Collect satisfaction scores. Fix render quality. Tune face analysis for Indian tones.

Phase 3 — Launch

Month 4

Public launch on iOS + Android. Freemium model live. PR push on Instagram/X.

Phase 4 — V2

Month 6+

Product affiliate links, Nykaa integration, multi-language (Hindi), expanded look library.

## 13. Brand Identity

The Philosophy

In Greek mythology, one look at Medusa froze you in place. With this app, you become Medusa — the one people can't stop staring at. Every step of the tutorial is a snake on her head, each one distinct, each one part of the whole. The mirror of Perseus — you see your reflection at every step before you even pick up a brush.

Brand Pillars

Bold, not soft — this is not a pastel pink beauty app

Empowering, not prescriptive — teaches you why, not just what

Yours, not generic — every tutorial is built for your specific face

Indian-first — built for skin tones that the rest of the world ignores

Taglines

"Make them freeze."

"One look. That's all it takes."

"You were always the most dangerous one in the room."

## 14. Agent SDK Architecture

Key Insight from @divyaranjan_ thread: The Claude Agent SDK is the same agentic loop that powers Claude Code, built around one philosophy: "give your agents a computer." MEDUSA should use it as the full orchestration backbone — not just the Anthropic chat API.

## 14.1 Why Agent SDK Instead of Direct API Calls

The PRD's current architecture treats Claude as a stateless API — one call for face analysis, one call per tutorial step. The Claude Agent SDK changes the model entirely. Claude becomes the orchestrator, running a continuous agentic loop: gather context → take action → verify result → repeat.

Autonomous tool invocation: Claude calls image APIs, validates outputs, and retries bad renders without backend logic

Built-in session management, context continuity, and permission handling

Sub-agent spawning: generate multiple render variations in parallel, pick the best one

Cost advantage: use the Max plan subscription via claude setup-token — no separate per-token API billing during development and testing

Provider flexibility: the SDK is not locked to Anthropic — swap in other model providers for specific pipeline steps if needed

## 14.2 Revised AI Pipeline (Agent SDK-First)

Replace the manual orchestration backend with a single MEDUSA Agent that handles the full session autonomously:

User submits selfie + look choice → MEDUSA Agent session starts

Tool: analyze_face() → Claude Vision → returns structured JSON face profile (skin tone, undertone, face shape, zones, concerns)

Tool: generate_tutorial() → Claude → returns ordered steps[] with full structured image prompts per step

Tool: generate_render(step, face_profile, prev_image) → fal.ai → returns image

Tool: quality_check(image) → Claude Vision → validates render quality → auto-retries up to 2x if poor

Tool: store_session() → S3 → persists images + profile for reuse

Agent streams step completions back to app via SSE — user sees Step 1 render while Step 2 generates

The Node.js backend becomes a thin orchestration shell. Most intelligence lives inside the Agent.

## 14.3 Dual-Anchor Image Chain (Fixes Identity Drift)

The PRD's chain approach (step N → step N+1) compounds identity drift. After 6-8 generations, the face subtly becomes someone else. The correct model uses two simultaneous anchors at every step:

— The original selfie is always passed to InstantID/PuLID at every step. Face identity is re-derived from ground truth, never from a generated image.Identity Anchor

— The previous step's output is used as ControlNet structural reference (pose, lighting, angle). Makeup state accumulates correctly without identity contamination.State Anchor

Result: identity stays locked while the makeup progression builds correctly across all 6-8 steps. This is the core technical moat. Validate it in Phase 0 before writing app code.

## 14.4 Zone-Based Inpainting (Cost + Quality Optimization)

Full-face regeneration for every step is expensive and imprecise. Later steps only change small face regions:

Steps 1-2 (primer, foundation): Full face img2img — justified, affects entire face

Steps 3-5 (eye makeup, brow): Inpaint only the eye region — ~3× cheaper, more accurate, no risk of altering skin tone or lips

Steps 6-7 (lip color, gloss): Inpaint only the lip region — same benefit

Claude determines which zones are affected per step (from the structured prompt output) and routes to full-face or zone-inpainting accordingly.

## 14.5 Structured Image Prompts per Step

Replace the loose imagePromptHint string from the PRD with a fully structured prompt object that Claude returns for each step:

positive_prompt: what makeup is visible on the face at this exact step

negative_prompt: what is NOT yet applied (prevents early steps from showing full glam accidentally)

face_zones_affected: which zones changed this step (drives inpainting mask selection)

denoising_strength: how dramatic the change is (higher for foundation, lower for lip gloss over a base)

lighting_match: matches the lighting of the original selfie (warm indoor, natural daylight, etc.)

## 15. Critical Implementation Improvements

## 15.1 Face Profile as a Persistent Asset

Current PRD: face analysis runs every session. Updated approach: the face profile is computed once, stored in PostgreSQL, and reused across all future sessions. Returning users skip directly to Look Picker. This reduces Claude Vision API calls by ~80% for returning users and enables the profile to be refined over time via user feedback.

## 15.2 Async Streaming Architecture

Never make the user wait for all renders to complete before seeing anything. Stream results via WebSocket or Server-Sent Events:

Show Step 1's render while Step 2 generates in the background

User reads Step 2's technique card while Step 2's image loads

Maximum perceived wait at any point: one step's generation time (~5-8 seconds)

If a render fails quality check and retries, the loading state simply extends — user is never shown a broken image

## 15.3 Render Caching by Face Archetype

Steps 1-2 (primer, foundation) are nearly identical across users who share the same look type + skin tone + undertone. Cache these renders keyed by {lookType, skinTone, undertone} at the infrastructure level — not per user. Common archetypes (e.g., wheatish warm + Natural Glow) will be served from cache after the first generation, reducing API cost to near-zero for those steps.

## 15.4 Self-Validating Render Loop

The Agent's quality_check() tool uses Claude Vision to review each generated render before it is ever shown to the user. Validation criteria: face identity preserved, skin tone accurate, makeup applied in correct zone, no uncanny distortion. On failure, the Agent automatically retries with an adjusted prompt — up to 2 retries. User sees a loading state; never a broken render. Every retry is logged as a training signal for prompt improvement.

## 15.5 Phase 0: Three Non-Negotiable Validation Tests

The following tests must pass before any app code is written. They validate the three technical pillars the product depends on:

: Generate 8 sequential renders using PuLID + ControlNet with the dual-anchor method. Pass = face is recognizably the same person at step 8. Fail = solve before proceeding.Identity Drift Test

: Run face analysis on 20+ diverse South Asian selfies (fair, wheatish, dusky, deep brown, warm and cool undertones). Pass = Claude classifies correctly in >85% of cases.Indian Skin Tone Accuracy Test

: Show 10 target users (18-30, Indian, casual makeup) a Claude-generated tutorial for their own face. Pass = >70% read every step without confusion or skepticism.Tutorial Quality Test

## 16. Product Additions (V1.5)

## 16.1 My Product Shelf

Users photograph products they already own — drugstore liner, old lipstick, a foundation they bought and forgot. Claude identifies each product and maps it to a tutorial step. The tutorial then specifies exactly how to use what the user already has. This is extremely differentiated from all competitors, requires no affiliate deals, and builds trust before any monetization ask.

## 16.2 Technique Overlays on Renders

Each render shows what the face looks like after a step. But the user still needs to know where to apply. Overlay a subtle face zone diagram on the render image: blush placement arc, eyebrow arch line, T-zone highlight boundary, lip liner guide. Bridges the gap between seeing the result and recreating it.

## 16.3 Regenerate This Step

A one-tap button on any render allows the user to regenerate that step's image. Every regeneration is automatically logged: which face profile, which step, which look, which prompt parameters. This creates a continuous improvement dataset for prompt tuning per face archetype.

## 16.4 Animated Share Card

Replace the static PNG progression strip with an animated GIF or short video morph: original face → each step builds progressively → final look reveal. This format is inherently viral on Instagram Reels and TikTok. A 6-second morph performs dramatically better than a static image and naturally invites the Medusa Challenge mechanic.

## 17. Go-To-Market Additions

## 17.1 Creator Program at Launch

50 Indian beauty influencers (10K-500K followers) receive free unlimited access pre-launch in exchange for authentic content — no scripted ads. Each creator generates their own Medusa look and shares the animated progression. Target: 50 pieces of genuine user content live on launch day. Zero paid acquisition cost.

## 17.2 The Medusa Challenge

A branded share mechanic that uses the product name itself as the campaign: post your before/after with #MedusaFreeze. The mythology of Medusa — one look freezes you — maps perfectly to a reveal format. The challenge mechanic is built into the animated share card output. No separate campaign creative needed.

## 17.3 Hindi Tutorial Text in V1 Beta

The PRD schedules multi-language support for V2. Adding Hindi as a toggle for tutorial text only — not the full app UI — is low engineering effort (one additional Claude output per step) and dramatically expands TAM in Tier 2 and 3 cities. Ship this in V1 beta, not V2. The target user in Jaipur or Indore is the same buyer, with a lower barrier if the instructions are in Hindi.

MEDUSA · Confidential · v1.0 · 2026 🐍
