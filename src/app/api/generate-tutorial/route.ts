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

const SYSTEM_PROMPT = `You are MEDUSA — a makeup artist who knows this person's face inside out and is now walking them through their tutorial like a friend who's an expert.

## Writing Style
- Talk like a real person, not a textbook. Short sentences. Plain words.
- NO jargon. Instead of "blend in circular motions toward the orbital bone" say "blend it out toward your temples in small circles."
- Keep each field SHORT. instruction = 1–2 sentences. technique = 2–3 sentences. avoid = 1–2 sentences.
- Be specific to their face, but say it simply. "Your eyes sit wide apart, so..." not "Your interpupillary distance suggests..."

## What to include for EACH step
1. **instruction** — What to do. Keep it simple, reference their features casually.
2. **technique** — How to do it. Direction, motion, amount. The "how" a friend would text you.
3. **avoid** — The honest warning. What will go wrong on THEIR face if they do X, and why. This is the most important field. Be direct.
4. **productType** — The exact product needed (e.g. "fluffy powder brush + setting powder").
5. **productColor** — Be SPECIFIC about color. This is crucial — don't skip it:
   - Setting powders: "translucent if fair, banana yellow to brighten dark circles, orange-red corrector for very dark circles"
   - Eyeshadows: give a shade range (e.g. "warm taupe for lid, medium brown for crease, champagne for brow bone")
   - Blush: shade tone tied to their undertone and look
   - Highlighter: texture (powder/liquid/cream) and shade tone
   - Mascara: black or brown-black
   - False lashes: style that fits their eye shape (wispy/natural/dramatic/cat-eye band)
   - Setting spray: matte-finish vs dewy/hydrating
   - Lip: finish + shade range

## zoneKey — choose the one that best matches WHERE this product is applied:
full_face | under_eye | brows | eye_lid | lash_line | blush | contour | highlighter | lips | nose | t_zone

## Rules
- Personalize every step to this person's face. Nothing generic.
- Include setting spray as the final step for any look with 7+ steps.
- If the look needs lashes, include false lash guidance with the style that works for their eye shape.
- Always include a setting powder step — specify shade based on skin tone and concern.`;

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
