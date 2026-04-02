import { runClaudeJsonQuery } from "@/lib/claude/client";
import { recordInferenceRun } from "@/lib/evals/store";
import type { InferenceRunRecord } from "@/lib/evals/types";
import { summarizeTutorialInput, summarizeTutorialOutput } from "@/lib/evals/sanitize";
import { evaluateTutorialResult, validateTutorialIssues } from "@/lib/evals/validators";
import {
  TUTORIAL_PROMPT_VERSION,
  TUTORIAL_SCHEMA_VERSION,
  VALIDATOR_VERSION,
} from "@/lib/evals/versioning";
import type { FaceAnalysis } from "@/lib/medusa/analyze-face";
import { MEDUSA_CLAUDE_MODEL } from "@/lib/claude/models";

export type LookId =
  | "natural"
  | "soft-glam"
  | "evening"
  | "bold-lip"
  | "monochromatic"
  | "editorial";

export type EditorialSubtype = "sharp" | "glossy" | "messy" | "soft";

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
  zoneKey: ZoneKey;
  productType: string;
  productColor: string;
  instruction: string;
  technique: string;
  avoid: string;
}

export interface GenerateTutorialRequest {
  faceAnalysis: FaceAnalysis;
  analysisRunId?: string | null;
  preferenceProfile?: PersonalizationProfile | null;
  selectedLook: LookId;
  selectedEditorialSubtype?: EditorialSubtype;
}

export interface GenerateTutorialResult {
  tutorialRunId?: string | null;
  lookName: string;
  lookDescription: string;
  steps: TutorialStep[];
  closingNote: string;
}

export interface PersonalizationProfile {
  preferredLooks: LookId[];
  discouragedLooks: LookId[];
  recentLooks: LookId[];
  intensityPreference: "soft" | "balanced" | "bold" | null;
  featureFocus: "eyes" | "lips" | null;
  positiveTags: string[];
  dislikedTags: string[];
}

const EDITORIAL_SUBTYPE_DEFINITIONS: Record<EditorialSubtype, string> = {
  sharp: "Sharp Editorial - crisp structure, graphic edges, clean symmetry, strong shape control. Think precise liner, clean negative space, sculpted placement, and polished finish.",
  glossy: "Glossy Editorial - wet-looking shine, reflective lids or skin, fresh base, controlled glow, and modern shine without looking greasy. Keep gloss intentional and placed with restraint.",
  messy: "Messy Editorial - intentionally undone, smudged, lived-in texture with attitude. Think blurred edges, slept-in eyes, imperfect diffusion, and cool contrast, but still deliberately designed.",
  soft: "Soft Editorial - diffused, airy, washed, and fashion-led rather than dramatic. Think hazy edges, blended tones, gentle glow, blurred lips, and softer transitions everywhere.",
};
const LOOK_DEFINITIONS: Record<LookId, string> = {
  natural: "Natural / Everyday - 5-7 steps. Skin-first, barely-there. Tinted moisturizer or light coverage, groomed brows, sheer lid wash, tinted lip balm.",
  "soft-glam": "Soft Glam - 8-10 steps. Polished without being heavy. Seamless base, warm neutral eyes with soft liner, blush, highlight on cheekbones, MLBB or nude satin lip.",
  evening: "Evening / Dramatic - 10-12 steps. Full face with impact. Foundation + concealer, sculpted contour, dimensional eyes (crease depth + liner + lashes), bold or rich lip.",
  "bold-lip": "Bold Lip - 7-9 steps. Lip is the hero. Light even skin, barely-there brows, zero eye makeup beyond mascara, everything framed around one saturated statement lip.",
  monochromatic: "Monochromatic - 7-9 steps. One color family everywhere. Pick a tone (rose/peach/berry/terracotta), use it on eyes, cheeks, and lips at different intensities.",
  editorial: "Editorial - 8-12 steps. Bold, directional, photogenic. Can include graphic liner, cut crease, unusual color placement, or a statement fashion-forward element.",
};

const ZONE_KEYS = ["full_face", "under_eye", "brows", "eye_lid", "lash_line", "blush", "contour", "highlighter", "lips", "nose", "t_zone"];

const TUTORIAL_SCHEMA = {
  type: "object",
  required: ["lookName", "lookDescription", "steps", "closingNote"],
  properties: {
    lookName: { type: "string" },
    lookDescription: { type: "string" },
    closingNote: { type: "string" },
    steps: {
      type: "array",
      items: {
        type: "object",
        required: ["stepNumber", "title", "category", "zoneKey", "productType", "productColor", "instruction", "technique", "avoid"],
        properties: {
          stepNumber: { type: "number" },
          title: { type: "string" },
          category: { type: "string", enum: ["prep", "base", "eyes", "brows", "lips", "face", "finish"] },
          zoneKey: { type: "string", enum: ZONE_KEYS },
          productType: { type: "string" },
          productColor: { type: "string" },
          instruction: { type: "string" },
          technique: { type: "string" },
          avoid: { type: "string" },
        },
      },
    },
  },
};

const SYSTEM_PROMPT = `You are MEDUSA - a top-tier professional makeup artist with deep editorial, bridal, and everyday expertise. You've studied this person's face geometry, skin tone, undertone, and individual features from their analysis. Speak directly to them like a trusted pro who knows their face.

## Writing Style
- Plain words. Short sentences. No textbook language, no jargon.
- Reference their actual features: "your neutral-set eyes", "your fuller lower lip", "your warm olive skin tone". Nothing generic.
- instruction = 1-2 sentences max. technique = 2-3 sentences max. avoid = 1-2 sentences max.
- The avoid field is the most important - be direct and geometry-specific. "Don't do X because on YOUR face it causes Y."

## Artistry Depth
Write like someone with serious modern makeup training, not a beauty blog.
- Complexion should be built in thin layers. Preserve light in the center face. Add depth with intention around the perimeter and under structure, not by blanketing the whole face.
- Do not confuse bronzer with contour. Bronzer adds warmth. Contour creates shadow. If both appear, describe them differently.
- Every eye look needs architecture: what is the shape map, where the depth sits, where the brightness sits, and how the edge finishes.
- When the look is creative or editorial, push contrast, shape, and placement on purpose. A strong look should still look controlled, not messy.
- The technique field should feel like a masterclass: tool choice, pressure, order of placement, blend direction, and what visual effect that creates on their face.
- Every tutorial should leave the user feeling like they learned WHY the placement works, not just where to put product.

## MANDATORY STEPS - every tutorial must include these, in this order at the start

### 1. Skin Prep (zoneKey: "full_face")
This step must appear in every tutorial before complexion products.
- Always include moisturizer. Say what finish it should have for the chosen look: lightweight or dewy for natural/soft looks, balanced but well-set for glam, editorial, and long-wear looks.
- If the look is soft-glam, evening, bold-lip, monochromatic, or editorial, also include primer and explain why: gripping/smoothing for longevity, pore blur through the center face, or glow only where the look needs it.
- The instruction should clearly tell them where it goes: moisturizer pressed over the full face, primer focused where makeup needs to last or where texture shows most.
- Editorial specifically must mention skin prep as part of the polished finish. Do not jump straight into color products.

### 2. Color Correction (zoneKey: "under_eye")
Color correctors cancel discoloration BEFORE concealer. They must be picked based on what you see in the face analysis:
- **Brown/blue-toned dark circles, medium-warm/olive skin** -> salmon or brick-red corrector (warm orange-red neutralizes blue-brown)
- **Purple or blue-tinted circles, fair/light skin** -> peach or apricot corrector
- **Very deep, near-black circles, deep/dark skin** -> bold orange or red-orange corrector (only orange cuts through)
- **Active redness, acne, broken capillaries anywhere on face** -> green corrector stippled directly on those spots
- **PIH (post-inflammatory hyperpigmentation / dark spots)** -> orange-red corrector pressed on each spot
- If the analysis shows genuinely even skin with no notable discoloration, skip this step; mention it in the closingNote.
- productColor: always name the exact corrector hue family AND explain in plain English why that color counteracts their specific discoloration.

### 3. Concealer (zoneKey: "under_eye")
Always two placements - always both:
1. **Under-eye triangle**: start at inner corner, draw to outer corner, let the apex point down toward the nose wing - this triangle covers the whole dark zone. Pat with a damp sponge, blend the edges UPWARD into the lash line. Never swipe - it creases.
2. **Spot concealment**: stipple on any blemishes/dark spots with a small brush. Blend the edges only, leave the center opaque.
- productColor: under-eye = 1 shade lighter than their foundation for a lifting effect. Spots = exact skin-tone match.
- Finish: always cream or liquid concealer (not powder, not stick).

### 4. Setting the Concealer (zoneKey: "under_eye")
Lock concealer before it moves. Use a loose powder - NEVER a pressed powder, it looks cakey.
- **Fair skin** -> translucent or slightly pink-toned powder
- **Medium warm/olive skin** -> banana yellow powder (brightens, adds warmth, counteracts dullness)
- **Medium cool skin** -> translucent or pink-lavender powder
- **Deep skin** -> deep banana, golden, or orange-toned powder - NOT white translucent (will flashback grey in photos)
- Glam/evening looks: bake (press and leave 3-5 min, then dust off) for maximum longevity. Natural/soft looks: light press only.

## LOOK DNA - each look is fundamentally different. Do not repeat the same steps.

### Natural / Everyday (5-7 steps total)
Skin is the star. Goal: "your face but healthier and more awake," not coverage.
- Base: skin tint or tinted moisturizer ONLY. No full foundation - it defeats the point.
- Eyes: one neutral wash of shadow OR none. No liner. Curl lashes + single coat mascara.
- Brows: brushed, groomed, filled only in sparse gaps. Fluffy and natural.
- Lips: tinted balm or clear gloss. No defined liner.
- No sculpted contour. Cream blush pressed on with fingers is the max.
- Setting: light powder on T-zone only if oily. Dewy or hydrating setting spray, never matte.

### Soft Glam (8-10 steps total)
Polished and put-together. The dinner out, the event, the "effortlessly done" look.
- Base: buildable liquid foundation, blended to a satin finish. Spot conceal.
- Complexion should look expensive and seamless. Build coverage where needed, then keep the center of the face clean and bright so it does not read heavy.
- Eyes: neutral warm palette - dirty taupe or soft champagne on lid, medium warm brown in crease, light shimmer or satin on inner corner. Thin upper liner or tight-lined waterline. 2 coats mascara.
- Brows: filled, arched softly, set with tinted gel.
- Lips: MLBB, warm nude, muted rose, or dusty berry - satin or cream finish.
- Blush: warm peach or rosy nude, swept from apples diagonally toward temples.
- Highlighter: glowy cheekbones and inner corners only - not blinding, just dimensional.
- Setting: translucent/banana powder on T-zone, satin finish setting spray.

### Evening / Dramatic (10-12 steps total)
Full face with serious impact. This is the heavy artillery - every zone gets attention.
- Base: full-coverage foundation, color-corrected, fully set with powder. Bake under-eye.
- Build drama through contrast and structure, not just by piling on more product.
- Eyes: dimensional - rich lid color + defined crease shadow + full liner or cat-eye + false lash band matched to eye shape.
- Contour: place it under the cheekbone line first, sweeping back toward the temple so the structure reads lifted. Add jawline contour only when the face actually needs extra edge; never replace cheekbone sculpting with a jaw stripe.
- Highlighter: every point - cheekbones, nose bridge, brow bone, inner corners, cupid bow.
- Lip: rich and bold - deep berry, classic red, plum, or warm brick. Lined and filled.
- Setting: full baking under-eye, powder all zones, lock with long-wear setting spray.

### Bold Lip (7-9 steps total)
The lip is the ONLY hero. Everything else steps back.
- Base: even but light skin - spot conceal, no heavy foundation. Skip contour.
- Eyes: zero eyeshadow. Zero liner. Clean brows. Mascara optional - 1 light coat max.
- Lip prep is its own step: exfoliate lip, apply lip primer or nude liner all over to extend wear, then fill with the statement color. This step matters enormously for longevity.
- No heavy blush. A soft warm matte bronzer on the temples max - just to avoid the face looking flat.
- Lip color tied to undertone: warm skin -> brick red, terracotta, warm coral, tomato. Cool skin -> true red, raspberry, wine, berry.

### Monochromatic (7-9 steps total)
One color family, three intensities, worn on eyes + cheeks + lips simultaneously.
- Choose the tone based on undertone: rose-pink (cool), peach-coral (warm/neutral), terracotta-bronze (warm-deep), berry-plum (cool-deep).
- Eyes: lightest intensity wash on lid. Mid-tone in the outer V and crease.
- Cheeks: same color family, mid intensity, swept from apples to temples.
- Lips: deepest intensity in the same family - cream or satin, not matte (too flat with the rest).
- Base: sheer to medium coverage. This look is about the COLOR story, not coverage.
- Every product should visually feel like it belongs to the same palette.

### Editorial (8-12 steps total)
One bold, directional statement element. Everything else supports it.
- Skin prep must be visible in the instructions: moisturizer first, then primer chosen for the finish and wear time. Editorial skin should look intentional before color goes on.
- Choose ONE anchor: graphic liner, floating liner, bold cut crease, unexpected color placement, blush draping, or a statement lip in an unusual shade.
- If the statement is on the eyes -> lip is nude, brows are clean, base is perfect.
- If the statement is the lip -> eyes are completely bare, brows minimal.
- If contour appears, it follows the underside of the cheekbone and lifts toward the temple. Do not default to a low jawline stripe unless the face analysis explicitly calls for it.
- Blush draping: sweep blush HIGH onto the orbital bone / temple, even under the eye - this is the editorial technique that elevates it.
- Be specific: describe exactly where the graphic element goes on THEIR face.
- Eye looks can be more graphic here: stronger crease mapping, cleaner edges, sharper contrast, and more intentional negative space are all welcome if they suit this face.

## Product Color Rules (always specific, never vague)
- **Foundation/concealer**: undertone match + coverage level + finish
- **Eyeshadow**: 2-3 specific shade descriptors (e.g. "warm terracotta on the lid, chocolate brown in the crease, gold shimmer on the inner corner")
- **Blush**: shade + finish (matte vs satin) + placement tied to look
- **Highlighter**: texture (powder/liquid/cream) + exact shade family
- **Lip**: finish + shade category + undertone match
- **False lashes**: style tied to eye shape (downturned -> cat-eye flared end; hooded -> wispy clusters; round -> elongating natural band; almond -> any style works)
- **Setting spray**: matte-finish for oily/dramatic, hydrating-dewy for dry/natural

## zoneKey - use the zone that best matches WHERE this product is applied:
full_face | under_eye | brows | eye_lid | lash_line | blush | contour | highlighter | lips | nose | t_zone

## Structural Rules
- Personalize every step to this specific person's geometry. Nothing generic.
- Use their makeupPriorities to decide what gets the most attention in the tutorial.
- If saved preferences are provided, use them to steer intensity, emphasis, and finish as long as they do not break the selected look or face-fit guidance.
- Respect negative memory. If they repeatedly dislike looks that feel too bold or too generic, avoid drifting there unless the selected look explicitly calls for it.
- If they prefer eye focus, invest more detail and artistry in the eye architecture. If they prefer lip focus, make the lip choice especially intentional within the look.
- **Brows + mascara = one combined step** (zoneKey: "brows"). Cover: brow shape/fill technique for their specific shape + lash curl recommendation + mascara formula choice.
- **Highlighter = always its own step** (zoneKey: "highlighter") for looks 7+ steps.
- **False lashes required** for evening/editorial (zoneKey: "lash_line").
- **Setting spray = final step** for all looks 7+ steps.`;

export async function generateTutorial(
  faceAnalysis: FaceAnalysis,
  selectedLook: LookId,
  selectedEditorialSubtype?: EditorialSubtype,
  preferenceProfile?: PersonalizationProfile | null
): Promise<GenerateTutorialResult> {
  const lookDef = LOOK_DEFINITIONS[selectedLook];
  const startedAt = Date.now();

  if (!lookDef) {
    throw new Error("Invalid look");
  }

  try {
    const initialResult = await runTutorialQuery(
      buildTutorialPrompt(faceAnalysis, selectedLook, lookDef, selectedEditorialSubtype, preferenceProfile),
      "generate-tutorial"
    );

    const initialEvaluation = evaluateTutorialResult(initialResult, selectedLook);
    if (initialEvaluation.passed) {
      await persistEval({
        executionStatus: "succeeded",
        outputStatus: "initial_pass",
        selectedLook,
        requestSummary: summarizeTutorialInput(faceAnalysis, selectedLook, selectedEditorialSubtype, preferenceProfile),
        responseSummary: summarizeTutorialOutput(initialResult),
        automaticEvaluation: initialEvaluation,
        metrics: {
          durationMs: Date.now() - startedAt,
          repairAttempted: false,
          validatorVersion: VALIDATOR_VERSION,
        },
      });

      return initialResult;
    }

    const repairedResult = await runTutorialQuery(
      buildRepairPrompt(
        faceAnalysis,
        selectedLook,
        lookDef,
        initialResult,
        initialEvaluation.issues.map((issue) => issue.message),
        selectedEditorialSubtype,
        preferenceProfile
      ),
      "generate-tutorial-repair"
    );

    const repairedEvaluation = evaluateTutorialResult(repairedResult, selectedLook);
    if (!repairedEvaluation.passed) {
      console.warn(
        "[generate-tutorial] Tutorial still failed look validation:",
        repairedEvaluation.issues.map((issue) => issue.message)
      );
    }

    await persistEval({
      executionStatus: "succeeded",
      outputStatus: repairedEvaluation.passed ? "repaired_pass" : "repaired_with_issues",
      selectedLook,
      requestSummary: summarizeTutorialInput(faceAnalysis, selectedLook, selectedEditorialSubtype, preferenceProfile),
      responseSummary: {
        final: summarizeTutorialOutput(repairedResult),
        repair: {
          attempted: true,
          initialResult: summarizeTutorialOutput(initialResult),
          initialIssues: initialEvaluation.issues,
        },
      },
      automaticEvaluation: repairedEvaluation,
      metrics: {
        durationMs: Date.now() - startedAt,
        repairAttempted: true,
        initialScore: initialEvaluation.score,
        repairedScore: repairedEvaluation.score,
        validatorVersion: VALIDATOR_VERSION,
      },
    });

    return repairedResult;
  } catch (error) {
    await persistEval({
      executionStatus: "failed",
      selectedLook,
      requestSummary: summarizeTutorialInput(faceAnalysis, selectedLook, selectedEditorialSubtype, preferenceProfile),
      metrics: {
        durationMs: Date.now() - startedAt,
        validatorVersion: VALIDATOR_VERSION,
      },
      errorTag: "generate-tutorial",
      errorMessage: error instanceof Error ? error.message : "Unknown tutorial error",
    });

    throw error;
  }
}

function runTutorialQuery(
  content: string,
  errorTag: string
): Promise<GenerateTutorialResult> {
  return runClaudeJsonQuery<GenerateTutorialResult>({
    content,
    systemPrompt: SYSTEM_PROMPT,
    schema: TUTORIAL_SCHEMA,
    errorTag,
  });
}

function buildTutorialPrompt(
  analysis: FaceAnalysis,
  selectedLook: LookId,
  lookDef: string,
  selectedEditorialSubtype?: EditorialSubtype,
  preferenceProfile?: PersonalizationProfile | null
): string {
  const editorialSubtypeBlock =
    selectedLook === "editorial" && selectedEditorialSubtype
      ? `
## Editorial subtype to build
${EDITORIAL_SUBTYPE_DEFINITIONS[selectedEditorialSubtype]}

Subtype rules:
- sharp: prioritize crisp edges, clean liner geometry, strong contrast, and polished placement.
- glossy: prioritize reflective lids/skin, fresh base, and glass-like shine with controlled placement.
- messy: prioritize intentionally smudged edges, grungy texture, lived-in eyes, and imperfect-looking diffusion that is still deliberate.
- soft: prioritize blurred edges, airy wash, low harshness, and subtle editorial shape.
`
      : "";

  const preferenceBlock = preferenceProfile
    ? `
## Saved Preferences
- Preferred looks: ${preferenceProfile.preferredLooks.length > 0 ? preferenceProfile.preferredLooks.join(" | ") : "none yet"}
- Discouraged looks: ${preferenceProfile.discouragedLooks.length > 0 ? preferenceProfile.discouragedLooks.join(" | ") : "none yet"}
- Recent looks: ${preferenceProfile.recentLooks.length > 0 ? preferenceProfile.recentLooks.join(" | ") : "none yet"}
- Intensity preference: ${preferenceProfile.intensityPreference ?? "unknown"}
- Feature focus: ${preferenceProfile.featureFocus ?? "none"}
- Positive signals: ${preferenceProfile.positiveTags.length > 0 ? preferenceProfile.positiveTags.join(" | ") : "none yet"}
- Negative signals: ${preferenceProfile.dislikedTags.length > 0 ? preferenceProfile.dislikedTags.join(" | ") : "none yet"}
`
    : "";

  return `
## Their Face
- Shape: ${analysis.faceShape} - ${analysis.faceShapeExplanation}
- Skin: ${analysis.skinTone}, ${analysis.skinUndertone} undertone - ${analysis.skinToneExplanation}
- Eyes: ${analysis.eyes.shape}, ${analysis.eyes.set} - ${analysis.eyes.specificCharacteristics} - ${analysis.eyes.makeupImplication}
- Lips: ${analysis.lips.description} - ${analysis.lips.specificCharacteristics} - ${analysis.lips.makeupImplication}
- Nose: ${analysis.nose.description} - ${analysis.nose.makeupImplication}
- Brows: ${analysis.brows.naturalShape}${analysis.brows.asymmetry ? ` (${analysis.brows.asymmetry})` : ""} - ${analysis.brows.makeupImplication}
- Cheekbones: ${analysis.cheekbones.description} - ${analysis.cheekbones.makeupImplication}
- Best features: ${analysis.beautyHighlights.join(" · ")}
- Makeup priorities: ${analysis.makeupPriorities.join(" · ")}
- Known avoid rules: ${analysis.avoidTechniques.map((technique, index) => `${index + 1}. ${technique}`).join(" | ")}

## Look to build
${lookDef}

${preferenceBlock}
${editorialSubtypeBlock}

Build the complete step-by-step tutorial. Keep writing style casual and short. Return JSON matching the schema.
`.trim();
}

function buildRepairPrompt(
  analysis: FaceAnalysis,
  selectedLook: LookId,
  lookDef: string,
  previousResult: GenerateTutorialResult,
  issues: string[],
  selectedEditorialSubtype?: EditorialSubtype,
  preferenceProfile?: PersonalizationProfile | null
): string {
  const editorialSubtypeBlock =
    selectedLook === "editorial" && selectedEditorialSubtype
      ? `
Editorial subtype:
${selectedEditorialSubtype}

Subtype definition:
${EDITORIAL_SUBTYPE_DEFINITIONS[selectedEditorialSubtype]}
`
      : "";

  const preferenceBlock = preferenceProfile
    ? `
Saved preferences:
- Preferred looks: ${preferenceProfile.preferredLooks.length > 0 ? preferenceProfile.preferredLooks.join(" | ") : "none yet"}
- Discouraged looks: ${preferenceProfile.discouragedLooks.length > 0 ? preferenceProfile.discouragedLooks.join(" | ") : "none yet"}
- Intensity preference: ${preferenceProfile.intensityPreference ?? "unknown"}
- Feature focus: ${preferenceProfile.featureFocus ?? "none"}
- Positive signals: ${preferenceProfile.positiveTags.length > 0 ? preferenceProfile.positiveTags.join(" | ") : "none yet"}
- Negative signals: ${preferenceProfile.dislikedTags.length > 0 ? preferenceProfile.dislikedTags.join(" | ") : "none yet"}
`
    : "";

  return `
The previous tutorial did not match the selected look strongly enough.

Selected look:
${selectedLook}

Look definition:
${lookDef}

${editorialSubtypeBlock}
${preferenceBlock}

Validation failures:
${issues.map((issue, index) => `${index + 1}. ${issue}`).join("\n")}

Previous invalid tutorial JSON:
${JSON.stringify(previousResult, null, 2)}

Rebuild the tutorial so it fully matches the selected look and still matches the exact same face analysis below.

## Their Face
- Shape: ${analysis.faceShape} - ${analysis.faceShapeExplanation}
- Skin: ${analysis.skinTone}, ${analysis.skinUndertone} undertone - ${analysis.skinToneExplanation}
- Eyes: ${analysis.eyes.shape}, ${analysis.eyes.set} - ${analysis.eyes.specificCharacteristics} - ${analysis.eyes.makeupImplication}
- Lips: ${analysis.lips.description} - ${analysis.lips.specificCharacteristics} - ${analysis.lips.makeupImplication}
- Nose: ${analysis.nose.description} - ${analysis.nose.makeupImplication}
- Brows: ${analysis.brows.naturalShape}${analysis.brows.asymmetry ? ` (${analysis.brows.asymmetry})` : ""} - ${analysis.brows.makeupImplication}
- Cheekbones: ${analysis.cheekbones.description} - ${analysis.cheekbones.makeupImplication}
- Best features: ${analysis.beautyHighlights.join(" · ")}
- Makeup priorities: ${analysis.makeupPriorities.join(" · ")}
- Known avoid rules: ${analysis.avoidTechniques.map((technique, index) => `${index + 1}. ${technique}`).join(" | ")}

Return only corrected JSON matching the schema.
`.trim();
}

export function validateTutorialForLook(
  result: GenerateTutorialResult,
  look: LookId
): string[] {
  return validateTutorialIssues(result, look).map((issue) => issue.message);
}

type TutorialEvalRecord = Omit<
  InferenceRunRecord,
  "workflow" | "model" | "promptVersion" | "schemaVersion"
>;

async function persistEval(params: TutorialEvalRecord) {
  try {
    await recordInferenceRun({
      workflow: "tutorial_generation",
      model: MEDUSA_CLAUDE_MODEL,
      promptVersion: TUTORIAL_PROMPT_VERSION,
      schemaVersion: TUTORIAL_SCHEMA_VERSION,
      ...params,
    });
  } catch (error) {
    console.error("[evals:tutorial] Failed to persist eval run", error);
  }
}
