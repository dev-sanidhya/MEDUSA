import type { ClaudeContentBlock } from "@/lib/claude/client";
import { runClaudeJsonQuery } from "@/lib/claude/client";
import { MEDUSA_CLAUDE_MODEL } from "@/lib/claude/models";
import { recordInferenceRun } from "@/lib/evals/store";
import type { InferenceRunRecord } from "@/lib/evals/types";
import { summarizeAnalyzeFaceInput, summarizeAnalyzeFaceOutput } from "@/lib/evals/sanitize";
import { evaluateFaceAnalysisResult } from "@/lib/evals/validators";
import {
  FACE_ANALYSIS_PROMPT_VERSION,
  FACE_ANALYSIS_SCHEMA_VERSION,
  VALIDATOR_VERSION,
} from "@/lib/evals/versioning";
import type {
  FaceProfile,
  SkinTone,
  SkinUndertone,
} from "@/lib/geometry-calculator";
import {
  mergeReports,
  type ConfidenceTier,
  type PrecisionReport,
} from "@/lib/precision-scorer";

export interface AnalyzeFacePhoto {
  base64: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  geometryProfile: FaceProfile;
  precisionReport: PrecisionReport;
}

export interface AnalyzeFaceRequest {
  photos: AnalyzeFacePhoto[];
}

export interface FaceAnalysis {
  personalReading: string;
  faceShape: string;
  faceShapeExplanation: string;
  faceShapeWorkWith: string;
  faceShapeAvoid: string;
  skinTone: SkinTone;
  skinToneOptions: SkinTone[];
  skinUndertone: SkinUndertone;
  skinUndertoneOptions: SkinUndertone[];
  skinToneExplanation: string;
  skinToneWorkWith: string;
  skinToneAvoid: string;
  eyes: {
    shape: string;
    set: string;
    specificCharacteristics: string;
    makeupImplication: string;
    workWith: string;
    avoid: string;
  };
  lips: {
    description: string;
    specificCharacteristics: string;
    makeupImplication: string;
    workWith: string;
    avoid: string;
  };
  nose: {
    description: string;
    makeupImplication: string;
  };
  brows: {
    naturalShape: string;
    asymmetry: string;
    makeupImplication: string;
  };
  cheekbones: {
    description: string;
    makeupImplication: string;
  };
  beautyHighlights: string[];
  makeupPriorities: string[];
  avoidTechniques: string[];
  precisionLevel: "high" | "medium";
  precisionNote: string;
  readConfidence: {
    overall: ConfidenceTier;
    summary: string;
    features: {
      faceShape: {
        tier: ConfidenceTier;
        bestPhotoIndex: number;
      };
      eyes: {
        tier: ConfidenceTier;
        bestPhotoIndex: number;
      };
      lips: {
        tier: ConfidenceTier;
        bestPhotoIndex: number;
      };
      skinTone: {
        tier: ConfidenceTier;
        bestPhotoIndex: number;
      };
    };
  };
}

export interface FaceAnalysisResult {
  status: "needs_more_photos" | "analysis_complete";
  analysisRunId?: string | null;
  photoRequest?: {
    message: string;
    specificInstruction: string;
    photoNumber: number;
  };
  faceAnalysis?: FaceAnalysis;
}

const FACE_ANALYSIS_SCHEMA = {
  type: "object",
  required: ["status"],
  properties: {
    status: { type: "string", enum: ["needs_more_photos", "analysis_complete"] },
    photoRequest: {
      type: "object",
      properties: {
        message: { type: "string" },
        specificInstruction: { type: "string" },
        photoNumber: { type: "number" },
      },
      required: ["message", "specificInstruction", "photoNumber"],
    },
    faceAnalysis: {
      type: "object",
      properties: {
        personalReading: { type: "string" },
        faceShape: { type: "string" },
        faceShapeExplanation: { type: "string" },
        faceShapeWorkWith: { type: "string" },
        faceShapeAvoid: { type: "string" },
        skinTone: { type: "string", enum: ["fair", "light", "wheatish", "medium", "tan", "deep"] },
        skinToneOptions: {
          type: "array",
          minItems: 3,
          maxItems: 3,
          items: { type: "string", enum: ["fair", "light", "wheatish", "medium", "tan", "deep"] },
        },
        skinUndertone: { type: "string", enum: ["warm", "cool", "neutral"] },
        skinUndertoneOptions: {
          type: "array",
          minItems: 3,
          maxItems: 3,
          items: { type: "string", enum: ["warm", "cool", "neutral"] },
        },
        skinToneExplanation: { type: "string" },
        skinToneWorkWith: { type: "string" },
        skinToneAvoid: { type: "string" },
        eyes: {
          type: "object",
          properties: {
            shape: { type: "string" },
            set: { type: "string" },
            specificCharacteristics: { type: "string" },
            makeupImplication: { type: "string" },
            workWith: { type: "string" },
            avoid: { type: "string" },
          },
          required: ["shape", "set", "specificCharacteristics", "makeupImplication", "workWith", "avoid"],
        },
        lips: {
          type: "object",
          properties: {
            description: { type: "string" },
            specificCharacteristics: { type: "string" },
            makeupImplication: { type: "string" },
            workWith: { type: "string" },
            avoid: { type: "string" },
          },
          required: ["description", "specificCharacteristics", "makeupImplication", "workWith", "avoid"],
        },
        nose: {
          type: "object",
          properties: {
            description: { type: "string" },
            makeupImplication: { type: "string" },
          },
          required: ["description", "makeupImplication"],
        },
        brows: {
          type: "object",
          properties: {
            naturalShape: { type: "string" },
            asymmetry: { type: "string" },
            makeupImplication: { type: "string" },
          },
          required: ["naturalShape", "asymmetry", "makeupImplication"],
        },
        cheekbones: {
          type: "object",
          properties: {
            description: { type: "string" },
            makeupImplication: { type: "string" },
          },
          required: ["description", "makeupImplication"],
        },
        beautyHighlights: { type: "array", items: { type: "string" } },
        makeupPriorities: { type: "array", items: { type: "string" } },
        avoidTechniques: { type: "array", items: { type: "string" } },
        precisionLevel: { type: "string", enum: ["high", "medium"] },
        precisionNote: { type: "string" },
      },
      required: [
        "personalReading", "faceShape", "faceShapeExplanation", "faceShapeWorkWith", "faceShapeAvoid",
        "skinTone", "skinToneOptions", "skinUndertone", "skinUndertoneOptions",
        "skinToneExplanation", "skinToneWorkWith", "skinToneAvoid",
        "eyes", "lips", "nose", "brows", "cheekbones",
        "beautyHighlights", "makeupPriorities", "avoidTechniques",
        "precisionLevel", "precisionNote",
      ],
    },
  },
};

const SYSTEM_PROMPT = `You are MEDUSA's core face analysis agent. You receive face photos plus MediaPipe geometry and must turn them into a concise, face-specific makeup read.

## Decision Order
Work in this order every time:
1. Quality decision
2. Feature interpretation
3. User-facing copy

## Quality Decision
- Treat the precision report as the primary gate. Do not override it casually.
- If canProceed=false and the user has submitted fewer than 3 photos, return status="needs_more_photos".
- Only ask for another photo when the blocked zones or pose issues would materially weaken face-shape, eye, lip, or skin-tone judgment.
- If the current photos already give you a useful read, do not force another upload just because the score is not perfect.
- After 3 photos, always return status="analysis_complete" and work from the best available evidence.

## Feature Interpretation
- Use the geometry block as the anchor for face shape, eye set, brow asymmetry, lip balance, and cheekbone read.
- Use the photos to interpret skin tone, undertone, finish, softness vs definition, and any visible discoloration or texture clues.
- If geometry and photos seem to disagree, prefer the geometry for structure labels and explain the result in plain language.
- Do not invent precision problems that are not in the supplied report.

## Skin Tone And Undertone Rules
- Judge skin tone and undertone from all uploaded photos together.
- If lighting varies, choose the most consistent reading across the set, not the brightest or darkest single image.
- Return exactly one skinTone from: fair, light, wheatish, medium, tan, deep.
- Return exactly 3 skinToneOptions from the same list, closest first, with skinTone first.
- Return exactly one skinUndertone from: warm, cool, neutral.
- Return exactly 3 skinUndertoneOptions from the same list, closest first, with skinUndertone first.
- Do not repeat options in either list.

## Retry Response
If status="needs_more_photos":
- Start by complimenting or reassuring the user about the current photo.
- Take the burden on MEDUSA, not on the user. Sound like the system wants one more angle, not like the user did something wrong.
- Explain the blocker in plain language only. No numbers, no degrees, no ratios, no math, no landmark talk.
- Give one specific instruction that would fix it.
- Keep it warm, short, direct, and slightly inviting.

## Analysis Response
If status="analysis_complete":
- Speak directly to the user using "you" and "your".
- Keep every field brief and trustworthy.
- Tie each feature read to one concrete reason. Example: width balance, lid visibility, lip ratio, brow asymmetry, cheekbone width.
- Use beginner-friendly language. No clinical or textbook voice.
- Never mention numbers, degrees, ratios, or measurements in user-facing copy.
- When precisionLevel is medium, the tone should still feel confident and usable, not hesitant or apologetic.

## Field Discipline
- personalReading: one warm sentence, max 24 words
- faceShapeExplanation and skinToneExplanation: one short sentence each, max 18 words
- faceShapeWorkWith, faceShapeAvoid, skinToneWorkWith, skinToneAvoid, eyes.workWith, eyes.avoid, lips.workWith, lips.avoid: short action lines, max 8 words each
- beautyHighlights: exactly 3 items, each 2-5 words
- makeupPriorities: exactly 3 items, each 3-7 words
- avoidTechniques: max 2 items, short and specific
- precisionNote: one short sentence that reflects the actual confidence level. If confidence is medium, it can say we can still move forward and one more photo would only sharpen accuracy.

## Tone
Warm, direct, premium, plain-spoken. Short sentences. No generic beauty filler.`;

export async function analyzeFace(photos: AnalyzeFacePhoto[]): Promise<FaceAnalysisResult> {
  const boundedPhotos = photos.slice(0, 3);
  const photoCount = boundedPhotos.length;
  const startedAt = Date.now();
  const mergedPrecision = mergeReports(boundedPhotos.map((photo) => photo.precisionReport));
  const geometryTrust = assessGeometryTrust(boundedPhotos, mergedPrecision);
  const representativePhoto = boundedPhotos.reduce((best, candidate) =>
    candidate.precisionReport.overallScore > best.precisionReport.overallScore ? candidate : best
  );

  const content: ClaudeContentBlock[] = [];

  for (let i = 0; i < boundedPhotos.length; i++) {
    content.push({ type: "text", text: `## Photo ${i + 1} of ${boundedPhotos.length}` });
    content.push({
      type: "image",
      source: {
        type: "base64",
        media_type: boundedPhotos[i].mimeType,
        data: boundedPhotos[i].base64,
      },
    });
  }

  content.push({
    type: "text",
    text: buildGeometryPrompt(
      representativePhoto.geometryProfile,
      mergedPrecision,
      geometryTrust,
      photoCount
    ),
  });

  try {
    const result = await runClaudeJsonQuery<FaceAnalysisResult>({
      content,
      systemPrompt: SYSTEM_PROMPT,
      schema: FACE_ANALYSIS_SCHEMA,
      errorTag: "analyze-face",
    });

    const automaticEvaluation = evaluateFaceAnalysisResult(result, photoCount);
    const hydratedResult = hydrateReadConfidence(result, geometryTrust, mergedPrecision);

    await persistEval({
      executionStatus: "succeeded",
      outputStatus: hydratedResult.status,
      requestSummary: summarizeAnalyzeFaceInput(boundedPhotos),
      responseSummary: summarizeAnalyzeFaceOutput(hydratedResult),
      automaticEvaluation,
      metrics: {
        durationMs: Date.now() - startedAt,
        photoCount,
        validatorVersion: VALIDATOR_VERSION,
      },
    });

    return hydratedResult;
  } catch (error) {
    await persistEval({
      executionStatus: "failed",
      requestSummary: summarizeAnalyzeFaceInput(boundedPhotos),
      metrics: {
        durationMs: Date.now() - startedAt,
        photoCount,
        validatorVersion: VALIDATOR_VERSION,
      },
      errorTag: "analyze-face",
      errorMessage: error instanceof Error ? error.message : "Unknown analysis error",
    });

    throw error;
  }
}

function buildGeometryPrompt(
  profile: FaceProfile,
  precision: PrecisionReport,
  geometryTrust: GeometryTrustSummary,
  photoCount: number
): string {
  const p = profile;
  const pr = precision;

  return `
## MediaPipe Geometric Analysis (${photoCount} photo${photoCount > 1 ? "s" : ""} analyzed)

### Precision Report
- Overall score: ${pr.overallScore}/100
- Can proceed: ${pr.canProceed}
- Head pose: yaw=${pr.headPose.yaw.toFixed(1)} degrees, pitch=${pr.headPose.pitch.toFixed(1)} degrees, roll=${pr.headPose.roll.toFixed(1)} degrees
- Is frontal: ${pr.headPose.isFrontal}
- Zone scores: eyes=${pr.zones.eyes.score}, lips=${pr.zones.lips.score}, nose=${pr.zones.nose.score}, jaw=${pr.zones.jaw.score}
- Face framing: size ratio=${pr.faceFraming.faceSizeRatio.toFixed(3)}, too small=${pr.faceFraming.isTooSmall}
- Detected issues: ${pr.issues.length > 0 ? pr.issues.join(", ") : "none"}
- Photos so far: ${photoCount}/3 max

### Quality Gate Interpretation
- If canProceed is false and photos so far are below 3, prefer needs_more_photos.
- If canProceed is true, prefer analysis_complete unless the photos clearly contradict the precision report.
- A usable read is enough to move forward. Do not ask for another photo just because a second image might be nicer to have.
- Use blocked zones and detected issues when writing any retry request.

### Feature Confidence
- Face shape confidence: ${pr.featureConfidence.faceShape.tier} (${pr.featureConfidence.faceShape.score}/100), best from photo ${pr.featureConfidence.faceShape.bestPhotoIndex}
- Eyes confidence: ${pr.featureConfidence.eyes.tier} (${pr.featureConfidence.eyes.score}/100), best from photo ${pr.featureConfidence.eyes.bestPhotoIndex}
- Lips confidence: ${pr.featureConfidence.lips.tier} (${pr.featureConfidence.lips.score}/100), best from photo ${pr.featureConfidence.lips.bestPhotoIndex}
- Skin tone confidence: ${pr.featureConfidence.skinTone.tier} (${pr.featureConfidence.skinTone.score}/100), best from photo ${pr.featureConfidence.skinTone.bestPhotoIndex}
- If a feature confidence is weak, soften certainty for that feature instead of overclaiming.
- If a feature confidence is usable or strong, you can move forward without asking for another photo unless a hard blocker is present.

### Cross Photo Consistency
- Overall consistency: ${geometryTrust.overall} (${geometryTrust.overallScore}/100)
- Face shape consistency: ${geometryTrust.features.faceShape.tier} (${geometryTrust.features.faceShape.score}/100)
- Eyes consistency: ${geometryTrust.features.eyes.tier} (${geometryTrust.features.eyes.score}/100)
- Lips consistency: ${geometryTrust.features.lips.tier} (${geometryTrust.features.lips.score}/100)
- Skin tone support: ${geometryTrust.features.skinTone.tier} (${geometryTrust.features.skinTone.score}/100)
- Trust notes: ${geometryTrust.notes.length > 0 ? geometryTrust.notes.join("; ") : "cross-photo read looks stable"}
- If overall consistency is weak and photos so far are below 3, it is acceptable to ask for one more photo.
- If one feature is weak but the rest are stable, keep the full analysis and simply speak more softly on the weaker feature.

### Face Structure
- Shape (calculated): ${p.faceShape}
- Width-to-height: ${p.faceRatios.widthToHeight.toFixed(3)}
- Forehead/cheekbone ratio: ${p.faceRatios.foreheadWidth.toFixed(3)}
- Jaw-to-forehead: ${p.faceRatios.jawToForehead.toFixed(3)}
- Jaw angle: ${p.faceRatios.jawAngleDeg.toFixed(1)} degrees
- Face thirds: forehead=${(p.faceRatios.thirdRatios[0] * 100).toFixed(1)}%, midface=${(p.faceRatios.thirdRatios[1] * 100).toFixed(1)}%, lower=${(p.faceRatios.thirdRatios[2] * 100).toFixed(1)}%

### Eyes
- Set type: ${p.eyes.setType} (ratio: ${p.eyes.interEyeRatio.toFixed(3)})
- Shape: ${p.eyes.shape}
- Lid visibility: ${p.eyes.lidVisibilityRatio.toFixed(3)}
- Tilt: ${p.eyes.tiltDeg.toFixed(2)} degrees (positive=upturned)
- Asymmetry: ${p.eyes.asymmetryMm.toFixed(3)}
- EAR left/right: ${p.eyes.leftEyeAspectRatio.toFixed(3)} / ${p.eyes.rightEyeAspectRatio.toFixed(3)}

### Lips
- Fullness: ${p.lips.fullness}
- Upper/lower ratio: ${p.lips.upperToLowerRatio.toFixed(3)}
- Width/face ratio: ${p.lips.widthToFaceRatio.toFixed(3)}
- Symmetry: ${p.lips.symmetry.toFixed(3)}
- Cupid bow depth: ${p.lips.cupidBowDepth.toFixed(3)}
- Corner tilt: ${p.lips.cornerTilt.toFixed(3)}

### Nose
- Width/face: ${p.nose.widthToFaceRatio.toFixed(3)}
- Length/face: ${p.nose.lengthToFaceRatio.toFixed(3)}
- Bridge width: ${p.nose.bridgeWidth.toFixed(3)}

### Brows
- Arch height: ${p.brows.archHeightRatio.toFixed(3)}
- Asymmetry: ${p.brows.asymmetryDeg.toFixed(1)} degrees
- Spacing ratio: ${p.brows.spacingRatio.toFixed(3)}
- Peak position L/R: ${p.brows.leftArchPeakPosition.toFixed(2)} / ${p.brows.rightArchPeakPosition.toFixed(2)}

### Cheekbones
- Prominence: ${p.cheekbones.prominence}
- Width ratio: ${p.cheekbones.widthRatio.toFixed(3)}

Based on the photos AND geometric measurements above, return your analysis as structured JSON matching the output schema.
`.trim();
}

interface GeometryTrustFeature {
  tier: ConfidenceTier;
  score: number;
}

interface GeometryTrustSummary {
  overall: ConfidenceTier;
  overallScore: number;
  notes: string[];
  features: {
    faceShape: GeometryTrustFeature;
    eyes: GeometryTrustFeature;
    lips: GeometryTrustFeature;
    skinTone: GeometryTrustFeature;
  };
}

function hydrateReadConfidence(
  result: FaceAnalysisResult,
  geometryTrust: GeometryTrustSummary,
  mergedPrecision: PrecisionReport
): FaceAnalysisResult {
  if (!result.faceAnalysis) {
    return result;
  }

  return {
    ...result,
    faceAnalysis: {
      ...result.faceAnalysis,
      readConfidence: {
        overall: geometryTrust.overall,
        summary: buildConfidenceSummary(geometryTrust),
        features: {
          faceShape: {
            tier: geometryTrust.features.faceShape.tier,
            bestPhotoIndex: mergedPrecision.featureConfidence.faceShape.bestPhotoIndex,
          },
          eyes: {
            tier: geometryTrust.features.eyes.tier,
            bestPhotoIndex: mergedPrecision.featureConfidence.eyes.bestPhotoIndex,
          },
          lips: {
            tier: geometryTrust.features.lips.tier,
            bestPhotoIndex: mergedPrecision.featureConfidence.lips.bestPhotoIndex,
          },
          skinTone: {
            tier: geometryTrust.features.skinTone.tier,
            bestPhotoIndex: mergedPrecision.featureConfidence.skinTone.bestPhotoIndex,
          },
        },
      },
    },
  };
}

function assessGeometryTrust(
  photos: AnalyzeFacePhoto[],
  mergedPrecision: PrecisionReport
): GeometryTrustSummary {
  const profiles = photos.map((photo) => photo.geometryProfile);
  const precisionReports = photos.map((photo) => photo.precisionReport);
  const faceShapeScore = clampScore(
    mergedPrecision.featureConfidence.faceShape.score -
      mismatchPenalty(profiles.map((profile) => profile.faceShape)) -
      rangePenalty(profiles.map((profile) => profile.faceRatios.widthToHeight), 0.08, 18) -
      rangePenalty(profiles.map((profile) => profile.faceRatios.jawToForehead), 0.12, 14) -
      rangePenalty(
        profiles.map((profile) => maxRange(profile.faceRatios.thirdRatios)),
        0.08,
        10
      )
  );

  const eyesScore = clampScore(
    mergedPrecision.featureConfidence.eyes.score -
      mismatchPenalty(profiles.map((profile) => profile.eyes.setType), 12) -
      mismatchPenalty(profiles.map((profile) => profile.eyes.shape), 10) -
      rangePenalty(profiles.map((profile) => profile.eyes.interEyeRatio), 0.2, 16) -
      rangePenalty(profiles.map((profile) => profile.eyes.tiltDeg), 5.5, 18) -
      rangePenalty(
        profiles.map(
          (profile) =>
            (profile.eyes.leftEyeAspectRatio + profile.eyes.rightEyeAspectRatio) / 2
        ),
        0.08,
        10
      )
  );

  const lipsScore = clampScore(
    mergedPrecision.featureConfidence.lips.score -
      mismatchPenalty(profiles.map((profile) => profile.lips.fullness), 12) -
      rangePenalty(profiles.map((profile) => profile.lips.upperToLowerRatio), 0.28, 18) -
      rangePenalty(profiles.map((profile) => profile.lips.widthToFaceRatio), 0.08, 14) -
      rangePenalty(profiles.map((profile) => profile.lips.symmetry), 0.18, 12)
  );

  const skinSupportScore = clampScore(
    mergedPrecision.featureConfidence.skinTone.score -
      rangePenalty(
        precisionReports.map(
          (report) => Math.round((report.zones.forehead.score + report.zones.cheeks.score) / 2)
        ),
        16,
        14
      ) +
      Math.min(
        8,
        precisionReports.filter(
          (report) =>
            report.zones.forehead.tier !== "weak" && report.zones.cheeks.tier !== "weak"
        ).length * 4
      )
  );

  const featureScores = {
    faceShape: buildGeometryTrustFeature(faceShapeScore),
    eyes: buildGeometryTrustFeature(eyesScore),
    lips: buildGeometryTrustFeature(lipsScore),
    skinTone: buildGeometryTrustFeature(skinSupportScore),
  };

  const overallScore = Math.round(
    (featureScores.faceShape.score * 0.3 +
      featureScores.eyes.score * 0.25 +
      featureScores.lips.score * 0.2 +
      featureScores.skinTone.score * 0.25)
  );

  return {
    overall: getTierFromScore(overallScore),
    overallScore,
    notes: buildGeometryTrustNotes(featureScores, photos.length),
    features: featureScores,
  };
}

function buildGeometryTrustFeature(score: number): GeometryTrustFeature {
  return {
    tier: getTierFromScore(score),
    score,
  };
}

function buildConfidenceSummary(trust: GeometryTrustSummary) {
  const strongFeatures = Object.entries(trust.features)
    .filter(([, feature]) => feature.tier === "strong")
    .map(([name]) => labelFeature(name));
  const softFeatures = Object.entries(trust.features)
    .filter(([, feature]) => feature.tier === "weak")
    .map(([name]) => labelFeature(name));

  if (softFeatures.length === 0 && strongFeatures.length >= 3) {
    return "This read looks very stable across your photos, so the main feature calls are landing cleanly.";
  }

  if (softFeatures.length === 0) {
    return "This read is holding together well, with enough consistency to move forward confidently.";
  }

  return `${joinLabels(strongFeatures)} are reading clearly. ${joinLabels(softFeatures)} are a little softer, so MEDUSA is keeping those calls more approximate.`;
}

function buildGeometryTrustNotes(
  features: GeometryTrustSummary["features"],
  photoCount: number
) {
  const notes: string[] = [];

  if (photoCount > 1 && features.faceShape.tier === "strong") {
    notes.push("face shape stays consistent across the set");
  }
  if (features.eyes.tier === "weak") {
    notes.push("eye structure shifts a bit between photos");
  }
  if (features.lips.tier === "weak") {
    notes.push("lip read is softer than the rest");
  }
  if (features.skinTone.tier !== "strong") {
    notes.push("tone call is usable but still light-sensitive");
  }

  return notes.slice(0, 3);
}

function mismatchPenalty(values: string[], penalty = 18) {
  return new Set(values).size > 1 ? penalty : 0;
}

function rangePenalty(values: number[], threshold: number, penalty: number) {
  if (values.length <= 1) {
    return 0;
  }

  return maxRange(values) > threshold ? penalty : 0;
}

function maxRange(values: readonly number[]) {
  return Math.max(...values) - Math.min(...values);
}

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function getTierFromScore(score: number): ConfidenceTier {
  if (score >= 78) return "strong";
  if (score >= 60) return "usable";
  return "weak";
}

function labelFeature(key: string) {
  const labels: Record<string, string> = {
    faceShape: "Face shape",
    eyes: "Eyes",
    lips: "Lips",
    skinTone: "Tone",
  };

  return labels[key] ?? key;
}

function joinLabels(labels: string[]) {
  if (labels.length === 0) {
    return "The main read";
  }

  if (labels.length === 1) {
    return labels[0];
  }

  if (labels.length === 2) {
    return `${labels[0]} and ${labels[1]}`;
  }

  return `${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`;
}

type FaceAnalysisEvalRecord = Omit<
  InferenceRunRecord,
  "workflow" | "model" | "promptVersion" | "schemaVersion"
>;

async function persistEval(params: FaceAnalysisEvalRecord) {
  try {
    await recordInferenceRun({
      workflow: "face_analysis",
      model: MEDUSA_CLAUDE_MODEL,
      promptVersion: FACE_ANALYSIS_PROMPT_VERSION,
      schemaVersion: FACE_ANALYSIS_SCHEMA_VERSION,
      ...params,
    });
  } catch (error) {
    console.error("[evals:face-analysis] Failed to persist eval run", error);
  }
}
