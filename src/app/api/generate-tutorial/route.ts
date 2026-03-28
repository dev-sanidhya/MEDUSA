/**
 * /api/generate-tutorial
 * Generates a personalized step-by-step makeup tutorial
 * using the face analysis result + selected look.
 */

import { query } from "@anthropic-ai/claude-agent-sdk";
import type { SDKUserMessage } from "@anthropic-ai/claude-agent-sdk";
import { NextRequest, NextResponse } from "next/server";
import type { FaceAnalysisResult } from "@/app/api/analyze-face/route";

// ─── Types ────────────────────────────────────────────────────────────────────

export type LookId =
  | "natural"
  | "soft-glam"
  | "evening"
  | "bold-lip"
  | "monochromatic"
  | "editorial";

// Zone keys that map to visual overlays on the user's face photo
export type ZoneKey =
  | "full_face"
  | "under_eye"
  | "brows"
  | "eye_lid"
  | "lash_line"
  | "blush"
  | "contour"
  | "highlighter"
  | "lips"
  | "nose"
  | "t_zone";

export interface TutorialStep {
  stepNumber: number;
  title: string;
  category: "prep" | "base" | "eyes" | "brows" | "lips" | "face" | "finish";
  zoneKey: ZoneKey;           // which zone to highlight on the face photo
  productType: string;        // exact product to use e.g. "translucent setting powder"
  productColor: string;       // color/shade guidance e.g. "banana yellow for warmth, lavender for redness"
  instruction: string;        // short, plain-english what-to-do (1–2 sentences max)
  technique: string;          // simple how-to with direction/motion (2–3 sentences max)
  avoid: string;              // honest "don't do X because [geometry reason]" (1–2 sentences)
}

export interface GenerateTutorialRequest {
  faceAnalysis: NonNullable<FaceAnalysisResult["faceAnalysis"]>;
  selectedLook: LookId;
}

export interface GenerateTutorialResult {
  lookName: string;
  lookDescription: string;    // one casual sentence about this look
  steps: TutorialStep[];
  closingNote: string;        // warm, casual one-sentence send-off
}

// ─── Look definitions ─────────────────────────────────────────────────────────

const LOOK_DEFINITIONS: Record<LookId, string> = {
  "natural":       "Natural / Everyday — 5–7 steps. Skin-first, barely-there. Tinted moisturizer or light coverage, groomed brows, sheer lid wash, tinted lip balm.",
  "soft-glam":     "Soft Glam — 8–10 steps. Polished without being heavy. Seamless base, warm neutral eyes with soft liner, blush, highlight on cheekbones, MLBB or nude satin lip.",
  "evening":       "Evening / Dramatic — 10–12 steps. Full face with impact. Foundation + concealer, sculpted contour, dimensional eyes (crease depth + liner + lashes), bold or rich lip.",
  "bold-lip":      "Bold Lip — 7–9 steps. Lip is the hero. Light even skin, barely-there brows, zero eye makeup beyond mascara, everything framed around one saturated statement lip.",
  "monochromatic": "Monochromatic — 7–9 steps. One color family everywhere. Pick a tone (rose/peach/berry/terracotta), use it on eyes, cheeks, and lips at different intensities.",
  "editorial":     "Editorial — 8–12 steps. Bold, directional, photogenic. Can include graphic liner, cut crease, unusual color placement, or a statement fashion-forward element.",
};

// ─── JSON schema ──────────────────────────────────────────────────────────────

const ZONE_KEYS = ["full_face","under_eye","brows","eye_lid","lash_line","blush","contour","highlighter","lips","nose","t_zone"];

const TUTORIAL_SCHEMA = {
  type: "object",
  required: ["lookName", "lookDescription", "steps", "closingNote"],
  properties: {
    lookName:        { type: "string" },
    lookDescription: { type: "string" },
    closingNote:     { type: "string" },
    steps: {
      type: "array",
      items: {
        type: "object",
        required: ["stepNumber","title","category","zoneKey","productType","productColor","instruction","technique","avoid"],
        properties: {
          stepNumber:   { type: "number" },
          title:        { type: "string" },
          category:     { type: "string", enum: ["prep","base","eyes","brows","lips","face","finish"] },
          zoneKey:      { type: "string", enum: ZONE_KEYS },
          productType:  { type: "string" },
          productColor: { type: "string" },
          instruction:  { type: "string" },
          technique:    { type: "string" },
          avoid:        { type: "string" },
        },
      },
    },
  },
};

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are MEDUSA — a top-tier professional makeup artist with deep editorial, bridal, and everyday expertise. You've studied this person's face geometry, skin tone, undertone, and individual features from their analysis. Speak directly to them like a trusted pro who knows their face.

## Writing Style
- Plain words. Short sentences. No textbook language, no jargon.
- Reference their actual features: "your neutral-set eyes", "your fuller lower lip", "your warm olive skin tone". Nothing generic.
- instruction = 1–2 sentences max. technique = 2–3 sentences max. avoid = 1–2 sentences max.
- The avoid field is the most important — be direct and geometry-specific. "Don't do X because on YOUR face it causes Y."

## MANDATORY STEPS — every tutorial must include these, in this order at the start

### 1. Color Correction (zoneKey: "under_eye")
Color correctors cancel discoloration BEFORE concealer. They must be picked based on what you see in the face analysis:
- **Brown/blue-toned dark circles, medium-warm/olive skin** → salmon or brick-red corrector (warm orange-red neutralizes blue-brown)
- **Purple or blue-tinted circles, fair/light skin** → peach or apricot corrector
- **Very deep, near-black circles, deep/dark skin** → bold orange or red-orange corrector (only orange cuts through)
- **Active redness, acne, broken capillaries anywhere on face** → green corrector stippled directly on those spots
- **PIH (post-inflammatory hyperpigmentation / dark spots)** → orange-red corrector pressed on each spot
- If the analysis shows genuinely even skin with no notable discoloration, skip this step; mention it in the closingNote.
- productColor: always name the exact corrector hue family AND explain in plain English why that color counteracts their specific discoloration.

### 2. Concealer (zoneKey: "under_eye")
Always two placements — always both:
1. **Under-eye triangle**: start at inner corner, draw to outer corner, let the apex point down toward the nose wing — this triangle covers the whole dark zone. Pat with a damp sponge, blend the edges UPWARD into the lash line. Never swipe — it creases.
2. **Spot concealment**: stipple on any blemishes/dark spots with a small brush. Blend the edges only, leave the center opaque.
- productColor: under-eye = 1 shade lighter than their foundation for a lifting effect. Spots = exact skin-tone match.
- Finish: always cream or liquid concealer (not powder, not stick).

### 3. Setting the Concealer (zoneKey: "under_eye")
Lock concealer before it moves. Use a loose powder — NEVER a pressed powder, it looks cakey.
- **Fair skin** → translucent or slightly pink-toned powder
- **Medium warm/olive skin** → banana yellow powder (brightens, adds warmth, counteracts dullness)
- **Medium cool skin** → translucent or pink-lavender powder
- **Deep skin** → deep banana, golden, or orange-toned powder — NOT white translucent (will flashback grey in photos)
- Glam/evening looks: bake (press and leave 3–5 min, then dust off) for maximum longevity. Natural/soft looks: light press only.

## LOOK DNA — each look is fundamentally different. Do not repeat the same steps.

### Natural / Everyday (5–7 steps total)
Skin is the star. Goal: "your face but healthier and more awake," not coverage.
- Base: skin tint or tinted moisturizer ONLY. No full foundation — it defeats the point.
- Eyes: one neutral wash of shadow OR none. No liner. Curl lashes + single coat mascara.
- Brows: brushed, groomed, filled only in sparse gaps. Fluffy and natural.
- Lips: tinted balm or clear gloss. No defined liner.
- No sculpted contour. Cream blush pressed on with fingers is the max.
- Setting: light powder on T-zone only if oily. Dewy or hydrating setting spray, never matte.

### Soft Glam (8–10 steps total)
Polished and put-together. The dinner out, the event, the "effortlessly done" look.
- Base: buildable liquid foundation, blended to a satin finish. Spot conceal.
- Eyes: neutral warm palette — dirty taupe or soft champagne on lid, medium warm brown in crease, light shimmer or satin on inner corner. Thin upper liner or tight-lined waterline. 2 coats mascara.
- Brows: filled, arched softly, set with tinted gel.
- Lips: MLBB, warm nude, muted rose, or dusty berry — satin or cream finish.
- Blush: warm peach or rosy nude, swept from apples diagonally toward temples.
- Highlighter: glowy cheekbones and inner corners only — not blinding, just dimensional.
- Setting: translucent/banana powder on T-zone, satin finish setting spray.

### Evening / Dramatic (10–12 steps total)
Full face with serious impact. This is the heavy artillery — every zone gets attention.
- Base: full-coverage foundation, color-corrected, fully set with powder. Bake under-eye.
- Eyes: dimensional — rich lid color + defined crease shadow + full liner or cat-eye + false lash band matched to eye shape.
- Contour: sculpt cheekbones, nose sides, temples, jawline. Real shadows, not a suggestion.
- Highlighter: every point — cheekbones, nose bridge, brow bone, inner corners, cupid bow.
- Lip: rich and bold — deep berry, classic red, plum, or warm brick. Lined and filled.
- Setting: full baking under-eye, powder all zones, lock with long-wear setting spray.

### Bold Lip (7–9 steps total)
The lip is the ONLY hero. Everything else steps back.
- Base: even but light skin — spot conceal, no heavy foundation. Skip contour.
- Eyes: zero eyeshadow. Zero liner. Clean brows. Mascara optional — 1 light coat max.
- Lip prep is its own step: exfoliate lip, apply lip primer or nude liner all over to extend wear, then fill with the statement color. This step matters enormously for longevity.
- No heavy blush. A soft warm matte bronzer on the temples max — just to avoid the face looking flat.
- Lip color tied to undertone: warm skin → brick red, terracotta, warm coral, tomato. Cool skin → true red, raspberry, wine, berry.

### Monochromatic (7–9 steps total)
One color family, three intensities, worn on eyes + cheeks + lips simultaneously.
- Choose the tone based on undertone: rose-pink (cool), peach-coral (warm/neutral), terracotta-bronze (warm-deep), berry-plum (cool-deep).
- Eyes: lightest intensity wash on lid. Mid-tone in the outer V and crease.
- Cheeks: same color family, mid intensity, swept from apples to temples.
- Lips: deepest intensity in the same family — cream or satin, not matte (too flat with the rest).
- Base: sheer to medium coverage. This look is about the COLOR story, not coverage.
- Every product should visually feel like it belongs to the same palette.

### Editorial (8–12 steps total)
One bold, directional statement element. Everything else supports it.
- Choose ONE anchor: graphic liner, floating liner, bold cut crease, unexpected color placement, blush draping, or a statement lip in an unusual shade.
- If the statement is on the eyes → lip is nude, brows are clean, base is perfect.
- If the statement is the lip → eyes are completely bare, brows minimal.
- Blush draping: sweep blush HIGH onto the orbital bone / temple, even under the eye — this is the editorial technique that elevates it.
- Be specific: describe exactly where the graphic element goes on THEIR face.

## Product Color Rules (always specific, never vague)
- **Foundation/concealer**: undertone match + coverage level + finish
- **Eyeshadow**: 2–3 specific shade descriptors (e.g. "warm terracotta on the lid, chocolate brown in the crease, gold shimmer on the inner corner")
- **Blush**: shade + finish (matte vs satin) + placement tied to look
- **Highlighter**: texture (powder/liquid/cream) + exact shade family
- **Lip**: finish + shade category + undertone match
- **False lashes**: style tied to eye shape (downturned → cat-eye flared end; hooded → wispy clusters; round → elongating natural band; almond → any style works)
- **Setting spray**: matte-finish for oily/dramatic, hydrating-dewy for dry/natural

## zoneKey — use the zone that best matches WHERE this product is applied:
full_face | under_eye | brows | eye_lid | lash_line | blush | contour | highlighter | lips | nose | t_zone

## Structural Rules
- Personalize every step to this specific person's geometry. Nothing generic.
- **Brows + mascara = one combined step** (zoneKey: "brows"). Cover: brow shape/fill technique for their specific shape + lash curl recommendation + mascara formula choice.
- **Highlighter = always its own step** (zoneKey: "highlighter") for looks 7+ steps.
- **False lashes required** for evening/editorial (zoneKey: "lash_line").
- **Setting spray = final step** for all looks 7+ steps.`;

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body: GenerateTutorialRequest = await req.json();

    if (!body.faceAnalysis || !body.selectedLook) {
      return NextResponse.json({ error: "faceAnalysis and selectedLook are required" }, { status: 400 });
    }

    const lookDef = LOOK_DEFINITIONS[body.selectedLook];
    if (!lookDef) {
      return NextResponse.json({ error: "Invalid look" }, { status: 400 });
    }

    const prompt = buildTutorialPrompt(body.faceAnalysis, lookDef);
    const sessionId = crypto.randomUUID();

    async function* makeMessages(): AsyncIterable<SDKUserMessage> {
      yield {
        type: "user",
        session_id: sessionId,
        parent_tool_use_id: null,
        message: { role: "user", content: prompt },
      };
    }

    let result: GenerateTutorialResult | null = null;

    for await (const msg of query({
      prompt: makeMessages(),
      options: {
        model: "claude-sonnet-4-6",
        maxTurns: 5,
        systemPrompt: SYSTEM_PROMPT,
        tools: [],
        outputFormat: { type: "json_schema", schema: TUTORIAL_SCHEMA },
        permissionMode: "bypassPermissions",
        allowDangerouslySkipPermissions: true,
      },
    })) {
      if (msg.type === "result") {
        if (msg.subtype === "success" && msg.structured_output) {
          result = msg.structured_output as GenerateTutorialResult;
        } else {
          const errors = (msg as unknown as { errors?: string[] }).errors ?? [];
          console.error("[generate-tutorial] Agent error:", msg.subtype, errors);
          return NextResponse.json({ error: errors[0] ?? "Agent returned an error" }, { status: 500 });
        }
      }
    }

    if (!result) {
      return NextResponse.json({ error: "Agent produced no output" }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[generate-tutorial]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── Prompt builder ───────────────────────────────────────────────────────────

function buildTutorialPrompt(
  a: NonNullable<FaceAnalysisResult["faceAnalysis"]>,
  lookDef: string
): string {
  return `
## Their Face
- Shape: ${a.faceShape} — ${a.faceShapeExplanation}
- Skin: ${a.skinTone}, ${a.skinUndertone} undertone — ${a.skinToneExplanation}
- Eyes: ${a.eyes.shape}, ${a.eyes.set} — ${a.eyes.specificCharacteristics} — ${a.eyes.makeupImplication}
- Lips: ${a.lips.description} — ${a.lips.specificCharacteristics} — ${a.lips.makeupImplication}
- Nose: ${a.nose.description} — ${a.nose.makeupImplication}
- Brows: ${a.brows.naturalShape}${a.brows.asymmetry ? ` (${a.brows.asymmetry})` : ""} — ${a.brows.makeupImplication}
- Cheekbones: ${a.cheekbones.description} — ${a.cheekbones.makeupImplication}
- Best features: ${a.beautyHighlights.join(" · ")}
- Known avoid rules: ${a.avoidTechniques.map((t, i) => `${i + 1}. ${t}`).join(" | ")}

## Look to build
${lookDef}

Build the complete step-by-step tutorial. Keep writing style casual and short. Return JSON matching the schema.
`.trim();
}
