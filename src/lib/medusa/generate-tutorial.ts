import { runClaudeJsonQuery } from "@/lib/claude/client";
import { MEDUSA_CLAUDE_MODEL } from "@/lib/claude/models";
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
import {
  EDITORIAL_SUBTYPE_DEFINITIONS,
  LOOK_ANCHOR_FEATURES,
  LOOK_DEFINITIONS,
  LOOK_INTENSITIES,
  LOOK_PRIMARY_AXES,
  MONOCHROMATIC_VARIANT_DEFINITIONS,
  type MonochromaticVariant,
  type EditorialSubtype,
  type LookId,
} from "@/lib/medusa/look-config";

export type { EditorialSubtype, LookId, MonochromaticVariant };

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
  faceAnalysis?: FaceAnalysis;
  analysisRunId?: string | null;
  selectedLook: LookId;
  selectedEditorialSubtype?: EditorialSubtype;
  preferenceProfile?: PersonalizationProfile | null;
}

export interface GenerateTutorialResult {
  tutorialRunId?: string | null;
  lookVariant?: {
    family: "editorial" | "monochromatic";
    id: string;
    label: string;
    rationale: string;
  } | null;
  lookName: string;
  lookDescription: string;
  lookIntent: {
    primaryAxis: (typeof LOOK_PRIMARY_AXES)[number];
    intensity: (typeof LOOK_INTENSITIES)[number];
    anchorFeature: (typeof LOOK_ANCHOR_FEATURES)[number];
    colorStrategy: string;
    finishStrategy: string;
    statementPlacement: string;
  };
  steps: TutorialStep[];
  closingNote: string;
}

export interface PersonalizationProfile {
  preferredLooks: LookId[];
  discouragedLooks: LookId[];
  recentLooks: LookId[];
  skillLevel: "beginner" | "intermediate" | "advanced" | null;
  intensityPreference: "soft" | "balanced" | "bold" | null;
  finishPreference: "glowy" | "balanced" | "matte" | null;
  styleMood: "classic" | "soft" | "graphic" | "experimental" | null;
  definitionPreference: "diffused" | "balanced" | "sharp" | null;
  featureFocus: "eyes" | "lips" | null;
  positiveTags: string[];
  dislikedTags: string[];
}

interface ResolvedLookVariant {
  editorialSubtype?: EditorialSubtype;
  monochromaticVariant?: MonochromaticVariant;
  metadata?: NonNullable<GenerateTutorialResult["lookVariant"]>;
}

const ZONE_KEYS = [
  "full_face",
  "under_eye",
  "brows",
  "eye_lid",
  "lash_line",
  "blush",
  "contour",
  "highlighter",
  "lips",
  "nose",
  "t_zone",
] as const;

const TUTORIAL_SCHEMA = {
  type: "object",
  required: ["lookName", "lookDescription", "lookIntent", "steps", "closingNote"],
  properties: {
    lookName: { type: "string" },
    lookDescription: { type: "string" },
    closingNote: { type: "string" },
    lookIntent: {
      type: "object",
      required: ["primaryAxis", "intensity", "anchorFeature", "colorStrategy", "finishStrategy", "statementPlacement"],
      properties: {
        primaryAxis: { type: "string", enum: LOOK_PRIMARY_AXES },
        intensity: { type: "string", enum: LOOK_INTENSITIES },
        anchorFeature: { type: "string", enum: LOOK_ANCHOR_FEATURES },
        colorStrategy: { type: "string" },
        finishStrategy: { type: "string" },
        statementPlacement: { type: "string" },
      },
    },
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

const SYSTEM_PROMPT = `You are MEDUSA's tutorial engine. You are a luxury makeup artist writing face-specific routines from a fixed look contract.

## Writing Rules
- Speak directly to the user. Reference their actual features. Nothing generic.
- Plain words. Short sentences. No beauty-blog filler.
- instruction = 1-2 sentences. technique = 2-3 sentences. avoid = 1-2 sentences.
- The avoid field must explain why a placement or finish fails on their face.

## Non-Negotiable Structure
- Return JSON that matches the schema exactly.
- Include lookIntent and make it match the supplied look contract.
- Step 1 must be skin prep on full_face.
- Step 2 must be color correction on under_eye unless the prompt explicitly says to skip correction.
- Step 3 must be concealer on under_eye and cover both under-eye brightening and spot concealment.
- Step 4 must set the concealer on under_eye with loose powder or baking guidance.
- Brows and mascara belong in one combined brows step.
- Looks with 7 or more steps need their own highlighter step and should finish with setting spray.
- Evening and editorial must include a lash_line step with false lashes.

## Technique Rules
- Build complexion in thin layers. Keep center-face light when the look allows it.
- Distinguish bronzer from contour. Bronzer adds warmth. Contour creates shadow.
- Every eye look needs architecture: depth, brightness, edge finish, and why it flatters this face.
- ProductColor must be specific, not vague. Name tone family, finish, and undertone fit where relevant.
- Use zoneKey based on actual placement, not category vibes.

## Under-Eye Sequence
- Corrector hue must match the discoloration and complexion depth.
- Concealer must mention the under-eye triangle and spot-conceal placement.
- Powder choice must respect complexion depth and avoid flashback or dullness.
- If correction is skipped because the face reads genuinely even, say that in closingNote and keep the under-eye sequence otherwise intact.

## Look Logic
- The supplied look contract is authoritative.
- The selected look decides intensity, anchor feature, color discipline, complexion behavior, and statement placement.
- Editorial subtype only modifies the editorial direction. It does not replace the main look contract.
- Monochromatic variant decides the exact color family and finish mood inside the monochromatic contract.
- Preferences can steer finish or emphasis, but they cannot override the selected look.

## Output Goal
- Teach the user what to do and why it works on their face.
- Make the look feel clearly different from the other MEDUSA looks.`;

export async function generateTutorial(
  faceAnalysis: FaceAnalysis,
  selectedLook: LookId,
  selectedEditorialSubtype?: EditorialSubtype,
  preferenceProfile?: PersonalizationProfile | null
): Promise<GenerateTutorialResult> {
  const lookDef = LOOK_DEFINITIONS[selectedLook];
  const resolvedVariant = resolveLookVariant(
    faceAnalysis,
    selectedLook,
    selectedEditorialSubtype,
    preferenceProfile
  );
  const startedAt = Date.now();

  if (!lookDef) {
    throw new Error("Invalid look");
  }

  try {
    const initialResult = await runTutorialQuery(
      buildTutorialPrompt(faceAnalysis, lookDef, resolvedVariant, preferenceProfile),
      "generate-tutorial"
    );
    const enrichedInitialResult = attachResolvedVariant(initialResult, resolvedVariant);

    const initialEvaluation = evaluateTutorialResult(enrichedInitialResult, selectedLook);
    if (initialEvaluation.passed) {
      await persistEval({
        executionStatus: "succeeded",
        outputStatus: "initial_pass",
        selectedLook,
        requestSummary: summarizeTutorialInput(
          faceAnalysis,
          selectedLook,
          resolvedVariant.editorialSubtype,
          preferenceProfile,
          resolvedVariant.metadata?.label ?? null
        ),
        responseSummary: summarizeTutorialOutput(enrichedInitialResult),
        automaticEvaluation: initialEvaluation,
        metrics: {
          durationMs: Date.now() - startedAt,
          repairAttempted: false,
          validatorVersion: VALIDATOR_VERSION,
        },
      });

      return enrichedInitialResult;
    }

    const repairedResult = await runTutorialQuery(
      buildRepairPrompt(
        faceAnalysis,
        selectedLook,
        lookDef,
        enrichedInitialResult,
        initialEvaluation.issues.map((issue) => issue.message),
        resolvedVariant,
        preferenceProfile
      ),
      "generate-tutorial-repair"
    );
    const enrichedRepairedResult = attachResolvedVariant(repairedResult, resolvedVariant);

    const repairedEvaluation = evaluateTutorialResult(enrichedRepairedResult, selectedLook);
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
      requestSummary: summarizeTutorialInput(
        faceAnalysis,
        selectedLook,
        resolvedVariant.editorialSubtype,
        preferenceProfile,
        resolvedVariant.metadata?.label ?? null
      ),
      responseSummary: {
        final: summarizeTutorialOutput(enrichedRepairedResult),
        repair: {
          attempted: true,
          initialResult: summarizeTutorialOutput(enrichedInitialResult),
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

    return enrichedRepairedResult;
  } catch (error) {
    await persistEval({
      executionStatus: "failed",
      selectedLook,
      requestSummary: summarizeTutorialInput(
        faceAnalysis,
        selectedLook,
        resolvedVariant.editorialSubtype,
        preferenceProfile,
        resolvedVariant.metadata?.label ?? null
      ),
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
  lookDef: (typeof LOOK_DEFINITIONS)[LookId],
  resolvedVariant?: ResolvedLookVariant,
  preferenceProfile?: PersonalizationProfile | null
): string {
  const editorialSubtypeBlock =
    lookDef.id === "editorial" && resolvedVariant?.editorialSubtype
      ? `
## Editorial subtype to build
${EDITORIAL_SUBTYPE_DEFINITIONS[resolvedVariant.editorialSubtype].promptDefinition}

Subtype contract:
- Contrast level: ${EDITORIAL_SUBTYPE_DEFINITIONS[resolvedVariant.editorialSubtype].engine.contrastLevel}
- Edge style: ${EDITORIAL_SUBTYPE_DEFINITIONS[resolvedVariant.editorialSubtype].engine.edgeStyle}
- Texture style: ${EDITORIAL_SUBTYPE_DEFINITIONS[resolvedVariant.editorialSubtype].engine.textureStyle}
- Statement placement: ${EDITORIAL_SUBTYPE_DEFINITIONS[resolvedVariant.editorialSubtype].engine.statementPlacement}
`
      : "";
  const monochromaticVariantBlock =
    lookDef.id === "monochromatic" && resolvedVariant?.monochromaticVariant
      ? `
## Monochromatic color family to build
${MONOCHROMATIC_VARIANT_DEFINITIONS[resolvedVariant.monochromaticVariant].promptDefinition}

Variant contract:
- Palette focus: ${MONOCHROMATIC_VARIANT_DEFINITIONS[resolvedVariant.monochromaticVariant].engine.paletteFocus}
- Finish style: ${MONOCHROMATIC_VARIANT_DEFINITIONS[resolvedVariant.monochromaticVariant].engine.finishStyle}
- Placement mood: ${MONOCHROMATIC_VARIANT_DEFINITIONS[resolvedVariant.monochromaticVariant].engine.placementMood}
`
      : "";

  const preferenceBlock = preferenceProfile
    ? `
## Saved Preferences
- Preferred looks: ${preferenceProfile.preferredLooks.length > 0 ? preferenceProfile.preferredLooks.join(" | ") : "none yet"}
- Discouraged looks: ${preferenceProfile.discouragedLooks.length > 0 ? preferenceProfile.discouragedLooks.join(" | ") : "none yet"}
- Recent looks: ${preferenceProfile.recentLooks.length > 0 ? preferenceProfile.recentLooks.join(" | ") : "none yet"}
- Intensity preference: ${preferenceProfile.intensityPreference ?? "unknown"}
- Finish preference: ${preferenceProfile.finishPreference ?? "unknown"}
- Style mood: ${preferenceProfile.styleMood ?? "unknown"}
- Edge preference: ${preferenceProfile.definitionPreference ?? "unknown"}
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

## Look Contract
- Selected look: ${lookDef.label}
- Look definition: ${lookDef.promptDefinition}
- Primary axis: ${lookDef.engine.primaryAxis}
- Default intensity: ${lookDef.engine.defaultIntensity}
- Anchor feature: ${lookDef.engine.anchorFeature}
- Color discipline: ${lookDef.engine.colorDiscipline}
- Complexion directive: ${lookDef.engine.complexionDirective}
- Eye directive: ${lookDef.engine.eyeDirective}
- Lip directive: ${lookDef.engine.lipDirective}
- Contour directive: ${lookDef.engine.contourDirective}
- Finish directive: ${lookDef.engine.finishDirective}
- Statement directive: ${lookDef.engine.statementDirective}

${preferenceBlock}
${editorialSubtypeBlock}
${monochromaticVariantBlock}

Return JSON matching the schema. The lookIntent fields must align with the look contract above, not generic defaults.
`.trim();
}

function buildRepairPrompt(
  analysis: FaceAnalysis,
  selectedLook: LookId,
  lookDef: (typeof LOOK_DEFINITIONS)[LookId],
  previousResult: GenerateTutorialResult,
  issues: string[],
  resolvedVariant?: ResolvedLookVariant,
  preferenceProfile?: PersonalizationProfile | null
): string {
  const editorialSubtypeBlock =
    selectedLook === "editorial" && resolvedVariant?.editorialSubtype
      ? `
Editorial subtype:
${resolvedVariant.editorialSubtype}

Subtype definition:
${EDITORIAL_SUBTYPE_DEFINITIONS[resolvedVariant.editorialSubtype].promptDefinition}

Subtype contract:
- Contrast level: ${EDITORIAL_SUBTYPE_DEFINITIONS[resolvedVariant.editorialSubtype].engine.contrastLevel}
- Edge style: ${EDITORIAL_SUBTYPE_DEFINITIONS[resolvedVariant.editorialSubtype].engine.edgeStyle}
- Texture style: ${EDITORIAL_SUBTYPE_DEFINITIONS[resolvedVariant.editorialSubtype].engine.textureStyle}
- Statement placement: ${EDITORIAL_SUBTYPE_DEFINITIONS[resolvedVariant.editorialSubtype].engine.statementPlacement}
`
      : "";
  const monochromaticVariantBlock =
    selectedLook === "monochromatic" && resolvedVariant?.monochromaticVariant
      ? `
Monochromatic variant:
${resolvedVariant.monochromaticVariant}

Variant definition:
${MONOCHROMATIC_VARIANT_DEFINITIONS[resolvedVariant.monochromaticVariant].promptDefinition}

Variant contract:
- Palette focus: ${MONOCHROMATIC_VARIANT_DEFINITIONS[resolvedVariant.monochromaticVariant].engine.paletteFocus}
- Finish style: ${MONOCHROMATIC_VARIANT_DEFINITIONS[resolvedVariant.monochromaticVariant].engine.finishStyle}
- Placement mood: ${MONOCHROMATIC_VARIANT_DEFINITIONS[resolvedVariant.monochromaticVariant].engine.placementMood}
`
      : "";

  const preferenceBlock = preferenceProfile
    ? `
Saved preferences:
- Preferred looks: ${preferenceProfile.preferredLooks.length > 0 ? preferenceProfile.preferredLooks.join(" | ") : "none yet"}
- Discouraged looks: ${preferenceProfile.discouragedLooks.length > 0 ? preferenceProfile.discouragedLooks.join(" | ") : "none yet"}
- Intensity preference: ${preferenceProfile.intensityPreference ?? "unknown"}
- Finish preference: ${preferenceProfile.finishPreference ?? "unknown"}
- Style mood: ${preferenceProfile.styleMood ?? "unknown"}
- Edge preference: ${preferenceProfile.definitionPreference ?? "unknown"}
- Feature focus: ${preferenceProfile.featureFocus ?? "none"}
- Positive signals: ${preferenceProfile.positiveTags.length > 0 ? preferenceProfile.positiveTags.join(" | ") : "none yet"}
- Negative signals: ${preferenceProfile.dislikedTags.length > 0 ? preferenceProfile.dislikedTags.join(" | ") : "none yet"}
`
    : "";

  return `
The previous tutorial did not match the selected look strongly enough.

Selected look:
${selectedLook}

Look contract:
- Label: ${lookDef.label}
- Definition: ${lookDef.promptDefinition}
- Primary axis: ${lookDef.engine.primaryAxis}
- Default intensity: ${lookDef.engine.defaultIntensity}
- Anchor feature: ${lookDef.engine.anchorFeature}
- Color discipline: ${lookDef.engine.colorDiscipline}
- Complexion directive: ${lookDef.engine.complexionDirective}
- Eye directive: ${lookDef.engine.eyeDirective}
- Lip directive: ${lookDef.engine.lipDirective}
- Contour directive: ${lookDef.engine.contourDirective}
- Finish directive: ${lookDef.engine.finishDirective}
- Statement directive: ${lookDef.engine.statementDirective}

${editorialSubtypeBlock}
${monochromaticVariantBlock}
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

Return only corrected JSON matching the schema. The lookIntent object must match the supplied contract.
`.trim();
}

function resolveLookVariant(
  analysis: FaceAnalysis,
  selectedLook: LookId,
  selectedEditorialSubtype?: EditorialSubtype,
  preferenceProfile?: PersonalizationProfile | null
): ResolvedLookVariant {
  if (selectedLook === "editorial") {
    const resolvedEditorialSubtype =
      selectedEditorialSubtype ??
      pickEditorialSubtype(analysis, preferenceProfile);

    return {
      editorialSubtype: resolvedEditorialSubtype,
      metadata: {
        family: "editorial",
        id: resolvedEditorialSubtype,
        label: `Editorial tuned ${resolvedEditorialSubtype} for you`,
        rationale: buildEditorialVariantReason(resolvedEditorialSubtype, analysis),
      },
    };
  }

  if (selectedLook === "monochromatic") {
    const resolvedMonochromaticVariant = pickMonochromaticVariant(analysis, preferenceProfile);

    return {
      monochromaticVariant: resolvedMonochromaticVariant,
      metadata: {
        family: "monochromatic",
        id: resolvedMonochromaticVariant,
        label: `Monochromatic in ${resolvedMonochromaticVariant} for you`,
        rationale: buildMonochromaticVariantReason(resolvedMonochromaticVariant, analysis),
      },
    };
  }

  return {};
}

function attachResolvedVariant(
  result: GenerateTutorialResult,
  resolvedVariant: ResolvedLookVariant
): GenerateTutorialResult {
  return {
    ...result,
    lookVariant: resolvedVariant.metadata ?? null,
  };
}

function pickEditorialSubtype(
  analysis: FaceAnalysis,
  preferenceProfile?: PersonalizationProfile | null
): EditorialSubtype {
  if (
    preferenceProfile?.skillLevel === "beginner" ||
    preferenceProfile?.intensityPreference === "soft" ||
    preferenceProfile?.dislikedTags.includes("too_bold")
  ) {
    return "soft";
  }

  if (
    preferenceProfile?.skillLevel === "advanced" &&
    preferenceProfile?.intensityPreference === "bold" &&
    preferenceProfile?.preferredLooks.includes("editorial")
  ) {
    return "messy";
  }

  if (
    preferenceProfile?.preferredLooks.includes("soft-glam") ||
    preferenceProfile?.preferredLooks.includes("monochromatic") ||
    (analysis.skinUndertone !== "cool" && analysis.beautyHighlights.some((item) => /glow|skin|warm/i.test(item)))
  ) {
    return "glossy";
  }

  return "sharp";
}

function pickMonochromaticVariant(
  analysis: FaceAnalysis,
  preferenceProfile?: PersonalizationProfile | null
): MonochromaticVariant {
  if (
    analysis.skinUndertone === "warm" &&
    preferenceProfile?.intensityPreference !== "bold" &&
    preferenceProfile?.featureFocus !== "eyes"
  ) {
    return "peach";
  }

  if (
    preferenceProfile?.intensityPreference === "bold" ||
    preferenceProfile?.preferredLooks.includes("evening") ||
    preferenceProfile?.preferredLooks.includes("bold-lip") ||
    ["medium", "tan", "deep"].includes(analysis.skinTone)
  ) {
    return "brown";
  }

  return "rose";
}

function buildEditorialVariantReason(
  subtype: EditorialSubtype,
  analysis: FaceAnalysis
) {
  switch (subtype) {
    case "soft":
      return "Your saved taste signals lean softer, so MEDUSA kept editorial diffused and easier to wear on your features.";
    case "glossy":
      return `Your ${analysis.skinUndertone} undertone and polished preference signals point toward a cleaner, glow-led editorial finish.`;
    case "messy":
      return "Your profile reads bolder and more experimental, so MEDUSA pushed editorial into a smudged, fashion-led direction.";
    case "sharp":
    default:
      return "Your structure and current preference signals can carry a crisp, graphic editorial look without losing control.";
  }
}

function buildMonochromaticVariantReason(
  variant: MonochromaticVariant,
  analysis: FaceAnalysis
) {
  switch (variant) {
    case "peach":
      return `Your ${analysis.skinUndertone} undertone and softer profile cues are strongest in peach-based monochromatic tones.`;
    case "brown":
      return "Your depth, intensity signals, and look history can carry a richer brown monochromatic story most cleanly.";
    case "rose":
    default:
      return "Rose gives you the most balanced monochromatic read, keeping the palette polished without pushing too warm or too deep.";
  }
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
