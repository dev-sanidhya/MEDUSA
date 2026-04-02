import type { FaceAnalysisResult } from "@/lib/medusa/analyze-face";
import type {
  GenerateTutorialResult,
  LookId,
  TutorialStep,
  ZoneKey,
} from "@/lib/medusa/generate-tutorial";
import { LOOK_DEFINITIONS } from "@/lib/medusa/look-config";
import type { AutomaticEvalResult, EvalIssue } from "@/lib/evals/types";

interface LookRule {
  minSteps: number;
  maxSteps: number;
  requiredZones?: ZoneKey[];
  forbiddenZones?: ZoneKey[];
  maxZoneOccurrences?: Partial<Record<ZoneKey, number>>;
}

const LOOK_RULES: Record<LookId, LookRule> = {
  natural: {
    minSteps: 5,
    maxSteps: 7,
    requiredZones: ["full_face", "under_eye", "brows", "lips"],
    forbiddenZones: ["contour", "lash_line"],
    maxZoneOccurrences: {
      eye_lid: 1,
      highlighter: 1,
    },
  },
  "soft-glam": {
    minSteps: 8,
    maxSteps: 10,
    requiredZones: ["full_face", "under_eye", "brows", "eye_lid", "blush", "highlighter", "lips"],
  },
  evening: {
    minSteps: 10,
    maxSteps: 12,
    requiredZones: ["full_face", "under_eye", "brows", "eye_lid", "lash_line", "contour", "highlighter", "lips"],
  },
  "bold-lip": {
    minSteps: 7,
    maxSteps: 9,
    requiredZones: ["full_face", "under_eye", "brows", "lips"],
    forbiddenZones: ["contour", "eye_lid", "lash_line"],
    maxZoneOccurrences: {
      blush: 1,
      highlighter: 1,
    },
  },
  monochromatic: {
    minSteps: 7,
    maxSteps: 9,
    requiredZones: ["full_face", "under_eye", "brows", "eye_lid", "blush", "lips"],
  },
  editorial: {
    minSteps: 8,
    maxSteps: 12,
    requiredZones: ["full_face", "under_eye", "brows"],
  },
};

export function evaluateFaceAnalysisResult(
  result: FaceAnalysisResult,
  photoCount: number
): AutomaticEvalResult {
  const issues: EvalIssue[] = [];

  if (result.status === "needs_more_photos") {
    if (!result.photoRequest) {
      issues.push(fail("analysis.missing_photo_request", "Photo retry response is missing photoRequest."));
    }

    if (result.faceAnalysis) {
      issues.push(fail("analysis.retry_with_face_analysis", "Retry response should not also include a faceAnalysis payload."));
    }

    if (photoCount >= 3) {
      issues.push(fail("analysis.retry_after_limit", "Analysis requested another photo after the 3-photo limit."));
    }
  }

  if (result.status === "analysis_complete") {
    if (!result.faceAnalysis) {
      issues.push(fail("analysis.missing_face_analysis", "Completed response is missing faceAnalysis."));
    }

    if (result.photoRequest) {
      issues.push(fail("analysis.complete_with_photo_request", "Completed response should not include photoRequest."));
    }

    if (result.faceAnalysis) {
      const faceAnalysis = result.faceAnalysis;

      ensureLength(issues, "analysis.beauty_highlights_count", faceAnalysis.beautyHighlights.length, 3, 3, "beautyHighlights");
      ensureLength(issues, "analysis.makeup_priorities_count", faceAnalysis.makeupPriorities.length, 3, 3, "makeupPriorities");

      if (faceAnalysis.avoidTechniques.length > 2) {
        issues.push(fail("analysis.avoid_techniques_overflow", `avoidTechniques should have at most 2 items, got ${faceAnalysis.avoidTechniques.length}.`));
      }

      validateRankedOptions(
        issues,
        "analysis.skin_tone_options",
        faceAnalysis.skinTone,
        faceAnalysis.skinToneOptions
      );

      validateRankedOptions(
        issues,
        "analysis.skin_undertone_options",
        faceAnalysis.skinUndertone,
        faceAnalysis.skinUndertoneOptions
      );

      if (!containsWord(faceAnalysis.personalReading, ["you", "your"])) {
        issues.push(warn("analysis.personal_reading_generic", "personalReading should speak directly to the user."));
      }

      if (!faceAnalysis.precisionNote.trim()) {
        issues.push(fail("analysis.precision_note_blank", "precisionNote should not be blank."));
      }
    }
  }

  return finalizeEvaluation(issues);
}

export function evaluateTutorialResult(
  result: GenerateTutorialResult,
  look: LookId
): AutomaticEvalResult {
  const issues: EvalIssue[] = validateTutorialIssues(result, look);
  return finalizeEvaluation(issues);
}

export function validateTutorialIssues(
  result: GenerateTutorialResult,
  look: LookId
): EvalIssue[] {
  const issues: EvalIssue[] = [];
  const rules = LOOK_RULES[look];
  const lookDef = LOOK_DEFINITIONS[look];
  const zones = result.steps.map((step) => step.zoneKey);
  const allText = [
    result.lookDescription,
    result.lookIntent.colorStrategy,
    result.lookIntent.finishStrategy,
    result.lookIntent.statementPlacement,
    ...result.steps.map((step) => `${step.title} ${step.productType} ${step.productColor} ${step.instruction} ${step.technique} ${step.avoid}`),
  ].join(" ").toLowerCase();

  if (result.steps.length < rules.minSteps || result.steps.length > rules.maxSteps) {
    issues.push(fail(
      "tutorial.step_count",
      `${look} should have ${rules.minSteps}-${rules.maxSteps} steps, but got ${result.steps.length}.`,
      { expectedMin: rules.minSteps, expectedMax: rules.maxSteps, actual: result.steps.length }
    ));
  }

  if (result.lookName.trim().toLowerCase() !== lookDef.label.toLowerCase()) {
    issues.push(warn("tutorial.look_name_drift", `lookName should match ${lookDef.label}.`));
  }

  if (result.lookIntent.primaryAxis !== lookDef.engine.primaryAxis) {
    issues.push(fail("tutorial.intent_axis_mismatch", `${look} should declare primaryAxis=${lookDef.engine.primaryAxis}.`));
  }

  if (result.lookIntent.anchorFeature !== lookDef.engine.anchorFeature) {
    issues.push(fail("tutorial.intent_anchor_mismatch", `${look} should declare anchorFeature=${lookDef.engine.anchorFeature}.`));
  }

  if (result.lookIntent.intensity !== lookDef.engine.defaultIntensity) {
    issues.push(warn("tutorial.intent_intensity_drift", `${look} should usually declare intensity=${lookDef.engine.defaultIntensity}.`));
  }

  if (!containsWord(result.lookIntent.colorStrategy, [
    lookDef.engine.colorDiscipline,
    "palette",
    "tone",
    "undertone",
    "contrast",
    "cohesive",
    "guided",
    "strict",
    "free",
  ])) {
    issues.push(warn("tutorial.intent_color_strategy_thin", "lookIntent.colorStrategy should describe the palette or color discipline clearly."));
  }

  if (!containsWord(result.lookIntent.finishStrategy, finishKeywordsForLook(look))) {
    issues.push(warn("tutorial.intent_finish_strategy_thin", `${look} should describe a finish strategy that matches the look.`));
  }

  if (!containsWord(result.lookIntent.statementPlacement, statementKeywordsForLook(look))) {
    issues.push(warn("tutorial.intent_statement_thin", `${look} should describe where the look's statement or emphasis sits.`));
  }

  result.steps.forEach((step, index) => {
    if (step.stepNumber !== index + 1) {
      issues.push(fail(
        "tutorial.step_number_sequence",
        `Step numbering must be sequential starting at 1. Expected ${index + 1}, got ${step.stepNumber}.`,
        { expected: index + 1, actual: step.stepNumber }
      ));
    }
  });

  const firstStep = result.steps[0];
  if (!firstStep || firstStep.zoneKey !== "full_face") {
    issues.push(fail("tutorial.first_step_zone", "Step 1 should be skin prep on the full face."));
  } else if (!textIncludes(firstStep, ["moistur", "prep", "skin"])) {
    issues.push(warn("tutorial.first_step_copy", "Step 1 should read like skin prep and mention moisturizer or prep explicitly."));
  }

  const secondStep = result.steps[1];
  const correctionSkipped = containsWord(result.closingNote, ["skip correction", "no correction", "even skin", "didn't need correction"]);
  if (!correctionSkipped) {
    if (!secondStep || secondStep.zoneKey !== "under_eye" || !textIncludes(secondStep, ["correct", "peach", "apricot", "salmon", "orange", "green"])) {
      issues.push(fail("tutorial.color_correction_missing", "Step 2 should be under-eye or discoloration correction with a specific corrector hue."));
    }
  }

  const thirdStep = result.steps[2];
  if (!thirdStep || thirdStep.zoneKey !== "under_eye" || !textIncludes(thirdStep, ["conceal", "under-eye triangle", "spot conceal"])) {
    issues.push(fail("tutorial.concealer_step_missing", "Step 3 should be a concealer step covering under-eye and spot concealment."));
  }

  const fourthStep = result.steps[3];
  if (!fourthStep || fourthStep.zoneKey !== "under_eye" || !textIncludes(fourthStep, ["powder", "set", "bake", "loose powder"])) {
    issues.push(fail("tutorial.concealer_setting_missing", "Step 4 should set the concealer with powder or baking guidance."));
  }

  const underEyeSteps = result.steps.filter((step) => step.zoneKey === "under_eye");
  if (underEyeSteps.length < 2) {
    issues.push(fail("tutorial.under_eye_coverage", "Tutorial should include under-eye correction/concealer coverage and setting."));
  }

  const browsStep = result.steps.find((step) => step.zoneKey === "brows");
  if (!browsStep) {
    issues.push(fail("tutorial.brows_step_missing", "Tutorial must include a combined brows and mascara step."));
  } else if (!textIncludes(browsStep, ["mascara", "lash", "curl"])) {
    issues.push(warn("tutorial.brows_step_missing_mascara", "Brows step should include lash curl or mascara guidance."));
  }

  if (result.steps.length >= 7) {
    const highlighterStep = result.steps.find((step) => step.zoneKey === "highlighter");
    if (!highlighterStep) {
      issues.push(fail("tutorial.highlighter_missing", "Looks with 7+ steps should include a dedicated highlighter step."));
    }

    const finalStep = result.steps[result.steps.length - 1];
    if (!finalStep || !textIncludes(finalStep, ["setting spray", "mist", "lock"])) {
      issues.push(warn("tutorial.final_step_setting_spray", "Looks with 7+ steps should usually finish with setting spray."));
    }
  }

  for (const zone of rules.requiredZones ?? []) {
    if (!zones.includes(zone)) {
      issues.push(fail("tutorial.required_zone_missing", `${look} must include a ${zone} step.`, { zone }));
    }
  }

  for (const zone of rules.forbiddenZones ?? []) {
    if (zones.includes(zone)) {
      issues.push(fail("tutorial.forbidden_zone_present", `${look} should not include a ${zone} step.`, { zone }));
    }
  }

  for (const [zone, maxOccurrences] of Object.entries(rules.maxZoneOccurrences ?? {})) {
    const count = zones.filter((value) => value === zone).length;
    if (count > (maxOccurrences ?? 0)) {
      issues.push(fail(
        "tutorial.zone_overuse",
        `${look} should not use ${zone} more than ${maxOccurrences} time(s), but got ${count}.`,
        { zone, maxOccurrences, actual: count }
      ));
    }
  }

  switch (look) {
    case "natural":
      if (containsWord(allText, ["full coverage", "dramatic", "cat-eye", "sharp contour", "false lash"])) {
        issues.push(fail("tutorial.natural_overbuilt", "natural should not drift into heavy coverage or dramatic structure."));
      }
      break;
    case "soft-glam":
      if (!containsWord(allText, ["satin", "soft liner", "neutral", "polished", "warm brown", "champagne", "mlbb"])) {
        issues.push(warn("tutorial.soft_glam_signature_missing", "soft-glam should read polished, neutral, and softly structured."));
      }
      if (containsWord(allText, ["graphic", "floating liner", "statement lip only", "zero eyeshadow"])) {
        issues.push(fail("tutorial.soft_glam_drift", "soft-glam should not collapse into editorial or bold-lip logic."));
      }
      break;
    case "evening":
      if (!containsWord(allText, ["full coverage", "bake", "long-wear", "rich", "dramatic", "contour", "false lash"])) {
        issues.push(fail("tutorial.evening_signature_missing", "evening should read like a full-impact long-wear look."));
      }
      break;
    case "bold-lip":
      if (!containsWord(allText, ["statement lip", "lip prep", "liner", "saturated", "hero lip"])) {
        issues.push(fail("tutorial.bold_lip_signature_missing", "bold-lip should explicitly treat the lip as the hero."));
      }
      if (containsWord(allText, ["crease shadow", "cat-eye", "graphic liner", "false lash", "smoky eye"])) {
        issues.push(fail("tutorial.bold_lip_competition", "bold-lip should not add competing eye drama."));
      }
      break;
    case "monochromatic":
      if (!containsWord(allText, ["same family", "tone story", "one color family", "same palette", "monoch", "matching family"])) {
        issues.push(fail("tutorial.monochromatic_story_missing", "monochromatic tutorial should explicitly describe one shared color family or tone story."));
      }
      break;
    case "editorial": {
      const editorialAnchorZones: ZoneKey[] = ["eye_lid", "lash_line", "blush", "lips"];
      const anchorCount = editorialAnchorZones.filter((zone) => zones.includes(zone)).length;
      if (anchorCount < 2) {
        issues.push(fail("tutorial.editorial_anchor", "editorial should have at least two strong statement zones among eye_lid, lash_line, blush, and lips."));
      }
      if (!containsWord(allText, ["graphic", "statement", "directional", "drape", "concept", "negative space", "editorial"])) {
        issues.push(fail("tutorial.editorial_signature_missing", "editorial should read concept-led and directional, not like softened glam."));
      }
      break;
    }
  }

  if (look === "evening" || look === "editorial") {
    const lashStep = result.steps.find((step) => step.zoneKey === "lash_line");
    if (!lashStep || !textIncludes(lashStep, ["lash", "false lash", "band"])) {
      issues.push(fail("tutorial.false_lash_missing", `${look} should include a false lash step that mentions lash placement clearly.`));
    }
  }

  if (look === "bold-lip") {
    const lipPrepMentioned = result.steps
      .filter((step) => step.zoneKey === "lips")
      .some((step) => textIncludes(step, ["exfol", "primer", "liner", "prep"]));

    if (!lipPrepMentioned) {
      issues.push(fail("tutorial.bold_lip_prep_missing", "bold-lip should include explicit lip prep or longevity prep before the statement lip."));
    }
  }

  return issues;
}

function finishKeywordsForLook(look: LookId): string[] {
  switch (look) {
    case "natural":
      return ["fresh", "skin-like", "dewy", "light-reflective"];
    case "soft-glam":
      return ["satin", "dimensional", "polished", "refined"];
    case "evening":
      return ["long-wear", "camera-ready", "set", "controlled"];
    case "bold-lip":
      return ["clean", "quiet", "supportive", "framed"];
    case "monochromatic":
      return ["cohesive", "harmon", "tonal", "unified"];
    case "editorial":
      return ["directional", "fashion", "designed", "intentional"];
  }
}

function statementKeywordsForLook(look: LookId): string[] {
  switch (look) {
    case "natural":
      return ["none", "understated", "overall face", "soft complexion"];
    case "soft-glam":
      return ["overall polish", "eyes", "balanced face", "soft structure"];
    case "evening":
      return ["eyes and structure", "full face", "contrast", "multiple zones"];
    case "bold-lip":
      return ["lip", "mouth", "statement lip", "hero lip"];
    case "monochromatic":
      return ["palette", "eyes cheeks lips", "color family", "tone story"];
    case "editorial":
      return ["statement", "graphic", "drape", "placement", "concept"];
  }
}

function validateRankedOptions(
  issues: EvalIssue[],
  code: string,
  primary: string,
  options: string[]
) {
  if (options.length !== 3) {
    issues.push(fail(`${code}.count`, `${code} should contain exactly 3 options, got ${options.length}.`));
  }

  if (options[0] !== primary) {
    issues.push(fail(`${code}.primary_order`, `${code} should start with the selected primary value.`));
  }

  if (new Set(options).size !== options.length) {
    issues.push(fail(`${code}.duplicates`, `${code} should not contain duplicate options.`));
  }
}

function ensureLength(
  issues: EvalIssue[],
  code: string,
  actual: number,
  expectedMin: number,
  expectedMax: number,
  fieldName: string
) {
  if (actual < expectedMin || actual > expectedMax) {
    issues.push(fail(code, `${fieldName} should contain ${expectedMin}-${expectedMax} items, got ${actual}.`));
  }
}

function finalizeEvaluation(issues: EvalIssue[]): AutomaticEvalResult {
  const penalty = issues.reduce((total, issue) => {
    switch (issue.severity) {
      case "fail":
        return total + 20;
      case "warn":
        return total + 8;
      case "info":
        return total + 2;
    }
  }, 0);

  return {
    score: Math.max(0, 100 - penalty),
    passed: !issues.some((issue) => issue.severity === "fail"),
    issues,
  };
}

function textIncludes(step: TutorialStep, fragments: string[]) {
  const haystack = `${step.title} ${step.productType} ${step.productColor} ${step.instruction} ${step.technique} ${step.avoid}`.toLowerCase();
  return containsWord(haystack, fragments);
}

function containsWord(value: string, fragments: string[]) {
  const normalized = value.toLowerCase();
  return fragments.some((fragment) => normalized.includes(fragment.toLowerCase()));
}

function warn(code: string, message: string, metadata?: Record<string, unknown>): EvalIssue {
  return { code, severity: "warn", message, metadata };
}

function fail(code: string, message: string, metadata?: Record<string, unknown>): EvalIssue {
  return { code, severity: "fail", message, metadata };
}
