/**
 * precision-scorer.ts
 * Scores the quality of a face detection result.
 * Determines whether we have enough data to proceed,
 * or whether the agent should request another photo — and exactly why.
 */

import type { RawLandmark, FaceDetectionResult } from "./face-detector";
import { extractHeadPose, LANDMARK_INDICES } from "./face-detector";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PrecisionIssue =
  | "face_angle_yaw"       // head turned left/right
  | "face_angle_pitch"     // head tilted up/down
  | "face_angle_roll"      // head tilted sideways
  | "low_landmark_confidence"
  | "eyes_partially_occluded"
  | "lips_partially_occluded"
  | "nose_occluded"
  | "jaw_occluded"
  | "face_too_small"       // face takes up too little of the frame
  | "face_too_close"       // face fills too much (cropped features)
  | "lighting_harsh"       // detected from z-depth variance
  | "multiple_faces";

export interface ZonePrecision {
  score: number;           // 0–100
  issues: PrecisionIssue[];
}

export interface PrecisionReport {
  overallScore: number;          // 0–100
  canProceed: boolean;           // true if we have enough signal for a useful read
  headPose: {
    yaw: number;
    pitch: number;
    roll: number;
    isFrontal: boolean;          // all angles < 15°
  };
  zones: {
    eyes: ZonePrecision;
    lips: ZonePrecision;
    nose: ZonePrecision;
    jaw: ZonePrecision;
    forehead: ZonePrecision;
    cheeks: ZonePrecision;
  };
  faceFraming: {
    faceSizeRatio: number;       // face bounding box / image area (ideal: 0.2–0.6)
    isTooSmall: boolean;
    isTooClose: boolean;
  };
  issues: PrecisionIssue[];      // deduplicated list of all issues

  // Human-readable guidance for the agent to relay to the user
  photoRequest: PhotoRequest | null; // null if canProceed = true
}

export interface PhotoRequest {
  reason: string;                // what's wrong with the current photo(s)
  instruction: string;           // what the user should do differently
  priority: "required" | "recommended"; // required = can't proceed without it
  angleHint?: string;            // e.g. "face the camera directly"
}

// ─── Landmark indices for zone checks ────────────────────────────────────────

const EYE_INDICES = [
  ...LANDMARK_INDICES.leftEyeUpper,
  ...LANDMARK_INDICES.leftEyeLower,
  ...LANDMARK_INDICES.rightEyeUpper,
  ...LANDMARK_INDICES.rightEyeLower,
  ...LANDMARK_INDICES.leftIris,
  ...LANDMARK_INDICES.rightIris,
];

const LIP_INDICES = [
  ...LANDMARK_INDICES.lipsOuter,
  ...LANDMARK_INDICES.lipsInner,
];

const NOSE_INDICES = [
  LANDMARK_INDICES.noseTip[0],
  LANDMARK_INDICES.noseBottom[0],
  LANDMARK_INDICES.noseLeftWing[0],
  LANDMARK_INDICES.noseRightWing[0],
  LANDMARK_INDICES.noseBridgeTop[0],
];

const JAW_INDICES = [
  LANDMARK_INDICES.leftJaw[0],
  LANDMARK_INDICES.rightJaw[0],
  LANDMARK_INDICES.chinBottom[0],
];

const FOREHEAD_INDICES = [
  LANDMARK_INDICES.foreheadTop[0],
  ...LANDMARK_INDICES.leftEyebrow,
  ...LANDMARK_INDICES.rightEyebrow,
];

const CHEEK_INDICES = [
  LANDMARK_INDICES.leftCheekbone[0],
  LANDMARK_INDICES.rightCheekbone[0],
  LANDMARK_INDICES.leftTemple[0],
  LANDMARK_INDICES.rightTemple[0],
];

// ─── Scoring helpers ─────────────────────────────────────────────────────────

function scoreZone(
  landmarks: RawLandmark[],
  indices: number[],
  issueKey: PrecisionIssue,
  {
    minScore = 70,
    marginX = 0.03,
    marginY = 0.03,
    yawWeight = 0.5,
    pitchWeight = 0.3,
    rollWeight = 0.25,
  }: {
    minScore?: number;
    marginX?: number;
    marginY?: number;
    yawWeight?: number;
    pitchWeight?: number;
    rollWeight?: number;
  },
  headPose: { yaw: number; pitch: number; roll: number }
): ZonePrecision {
  const points = indices.map((index) => landmarks[index]).filter(Boolean);
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const edgePenalty =
    overflowPenalty(minX, marginX) +
    overflowPenalty(1 - maxX, marginX) +
    overflowPenalty(minY, marginY) +
    overflowPenalty(1 - maxY, marginY);

  const posePenalty =
    Math.abs(headPose.yaw) * yawWeight +
    Math.abs(headPose.pitch) * pitchWeight +
    Math.abs(headPose.roll) * rollWeight;

  const score = Math.max(0, Math.min(100, Math.round(100 - edgePenalty - posePenalty)));
  return {
    score,
    issues: score < minScore ? [issueKey] : [],
  };
}

function overflowPenalty(distanceToEdge: number, targetMargin: number) {
  if (distanceToEdge >= targetMargin) {
    return 0;
  }

  return ((targetMargin - Math.max(distanceToEdge, 0)) / targetMargin) * 20;
}

// ─── Main scorer ─────────────────────────────────────────────────────────────

export function scorePrecision(detection: FaceDetectionResult): PrecisionReport {
  const { landmarks, facialTransformationMatrix, faceCount } = detection;

  const issues: PrecisionIssue[] = [];

  // ── Head pose ──────────────────────────────────────────────────────────────
  let yaw = 0, pitch = 0, roll = 0;
  if (facialTransformationMatrix) {
    ({ yaw, pitch, roll } = extractHeadPose(facialTransformationMatrix));
  }

  const yawOff = Math.abs(yaw);
  const pitchOff = Math.abs(pitch);
  const rollOff = Math.abs(roll);

  if (yawOff > 15) issues.push("face_angle_yaw");
  if (pitchOff > 15) issues.push("face_angle_pitch");
  if (rollOff > 12) issues.push("face_angle_roll");
  if (faceCount > 1) issues.push("multiple_faces");

  const isFrontal = yawOff <= 15 && pitchOff <= 15 && rollOff <= 12;

  // Pose penalty (larger deviation = bigger penalty)
  const posePenalty = Math.min(40, (yawOff + pitchOff + rollOff) * 0.8);

  // ── Zone precision ─────────────────────────────────────────────────────────
  const headPose = { yaw, pitch, roll };
  const eyeZone = scoreZone(landmarks, EYE_INDICES, "eyes_partially_occluded", {
    minScore: 72,
    marginX: 0.05,
    marginY: 0.05,
    yawWeight: 0.7,
    pitchWeight: 0.35,
    rollWeight: 0.25,
  }, headPose);
  const lipZone = scoreZone(landmarks, LIP_INDICES, "lips_partially_occluded", {
    minScore: 72,
    marginX: 0.04,
    marginY: 0.04,
    yawWeight: 0.45,
    pitchWeight: 0.4,
    rollWeight: 0.2,
  }, headPose);
  const noseZone = scoreZone(landmarks, NOSE_INDICES, "nose_occluded", {
    minScore: 70,
    marginX: 0.03,
    marginY: 0.03,
    yawWeight: 0.55,
    pitchWeight: 0.35,
    rollWeight: 0.15,
  }, headPose);
  const jawZone = scoreZone(landmarks, JAW_INDICES, "jaw_occluded", {
    minScore: 70,
    marginX: 0.04,
    marginY: 0.02,
    yawWeight: 0.55,
    pitchWeight: 0.45,
    rollWeight: 0.2,
  }, headPose);
  const foreheadZone = scoreZone(landmarks, FOREHEAD_INDICES, "low_landmark_confidence", {
    minScore: 68,
    marginX: 0.03,
    marginY: 0.02,
    yawWeight: 0.35,
    pitchWeight: 0.55,
    rollWeight: 0.15,
  }, headPose);
  const cheekZone = scoreZone(landmarks, CHEEK_INDICES, "low_landmark_confidence", {
    minScore: 68,
    marginX: 0.03,
    marginY: 0.03,
    yawWeight: 0.5,
    pitchWeight: 0.25,
    rollWeight: 0.15,
  }, headPose);

  for (const z of [eyeZone, lipZone, noseZone, jawZone, foreheadZone, cheekZone]) {
    issues.push(...z.issues);
  }

  // ── Face framing ───────────────────────────────────────────────────────────
  const xs = landmarks.map(l => l.x);
  const ys = landmarks.map(l => l.y);
  const faceW = (Math.max(...xs) - Math.min(...xs));
  const faceH = (Math.max(...ys) - Math.min(...ys));
  const faceSizeRatio = faceW * faceH;

  const isTooSmall = faceSizeRatio < 0.05;
  const isTooClose = faceW > 0.9 || faceH > 0.9;

  if (isTooSmall) issues.push("face_too_small");
  if (isTooClose) issues.push("face_too_close");

  // ── Overall score ──────────────────────────────────────────────────────────
  // Weighted average of zone scores, minus pose penalty
  const zoneAvg = (
    eyeZone.score * 2 +      // eyes matter most for makeup
    lipZone.score * 1.5 +
    noseZone.score * 1 +
    jawZone.score * 1 +
    foreheadZone.score * 1 +
    cheekZone.score * 1
  ) / 7.5;

  let overallScore = Math.round(Math.max(0, Math.min(100, zoneAvg - posePenalty)));

  // Framing penalties
  if (isTooSmall) overallScore = Math.max(0, overallScore - 20);
  if (isTooClose) overallScore = Math.max(0, overallScore - 10);

  const canProceed = hasEnoughSignalToProceed({
    overallScore,
    issues,
    yawOff,
    pitchOff,
    rollOff,
    isTooSmall,
    faceCount,
    eyeScore: eyeZone.score,
    lipScore: lipZone.score,
    jawScore: jawZone.score,
  });

  // ── Photo request ──────────────────────────────────────────────────────────
  let photoRequest: PhotoRequest | null = null;

  if (!canProceed) {
    photoRequest = buildPhotoRequest(issues);
  }

  // Deduplicate issues
  const uniqueIssues = [...new Set(issues)];

  return {
    overallScore,
    canProceed,
    headPose: { yaw, pitch, roll, isFrontal },
    zones: {
      eyes: eyeZone,
      lips: lipZone,
      nose: noseZone,
      jaw: jawZone,
      forehead: foreheadZone,
      cheeks: cheekZone,
    },
    faceFraming: { faceSizeRatio, isTooSmall, isTooClose },
    issues: uniqueIssues,
    photoRequest,
  };
}

// ─── Photo request builder ────────────────────────────────────────────────────

function buildPhotoRequest(
  issues: PrecisionIssue[]
): PhotoRequest {
  if (issues.includes("face_too_small")) {
    return {
      reason: "This is a nice photo, but I need your face a little closer so I can read your features properly.",
      instruction: "Could you take one more a bit closer, with your full face visible from forehead to chin?",
      priority: "required",
      angleHint: "slightly closer, full face visible",
    };
  }

  if (issues.includes("face_angle_yaw")) {
    return {
      reason: "You look great here, but I need one straighter angle so I do not overread your face shape.",
      instruction: "Could you take one more facing the camera directly, like you are looking into a mirror?",
      priority: "required",
      angleHint: "face directly forward",
    };
  }

  if (issues.includes("face_angle_pitch")) {
    return {
      reason: "This photo still works, but I would trust the read more with your face held a little more level.",
      instruction: "Try one more at eye level with your chin relaxed and your face looking straight ahead.",
      priority: "required",
      angleHint: "chin level, eyes to camera",
    };
  }

  if (issues.includes("face_angle_roll")) {
    return {
      reason: "This is a lovely shot, but I need your head a little straighter to compare both sides evenly.",
      instruction: "Could you take one more with your head upright, without leaning left or right?",
      priority: "required",
      angleHint: "head upright",
    };
  }

  if (issues.includes("multiple_faces")) {
    return {
      reason: "I can see more than one face here, so I cannot tell which one I should follow.",
      instruction: "Could you send one more with only your face in frame?",
      priority: "required",
    };
  }

  if (issues.includes("eyes_partially_occluded")) {
    return {
      reason: "Your photo is good, but I cannot see your eyes clearly enough yet for a confident read.",
      instruction: "Could you send one more with your eyes fully clear, with hair or anything else away from them?",
      priority: "required",
    };
  }

  if (issues.includes("lips_partially_occluded")) {
    return {
      reason: "I can work with a lot here, but your lips are not fully clear enough for me yet.",
      instruction: "Could you send one more with your lips fully visible and your expression relaxed?",
      priority: "required",
    };
  }

  if (issues.includes("jaw_occluded")) {
    return {
      reason: "This photo gives me a start, but I need a clearer view of your jaw and chin for the shape read.",
      instruction: "Please send one more with your jawline clear, hair pulled back, and nothing covering your chin.",
      priority: "required",
    };
  }

  return {
    reason: "This is a strong start. I can already work with it, but one more clear photo would make the read tighter.",
    instruction: "If you want the most accurate result, send one more straight-on photo in soft, even light.",
    priority: "recommended",
    angleHint: "straight-on, soft light",
  };
}

/**
 * Merges precision scores from multiple photos into one report.
 * The best score per zone wins — we're building a composite picture.
 */
export function mergeReports(reports: PrecisionReport[]): PrecisionReport {
  if (reports.length === 1) return reports[0];

  const best = reports.reduce((a, b) => (a.overallScore > b.overallScore ? a : b));
  const mergedIssues = [...new Set(reports.flatMap((report) => report.issues))];

  // Take the best zone score from any photo
  const mergedZones = {
    eyes: { score: Math.max(...reports.map(r => r.zones.eyes.score)), issues: best.zones.eyes.issues },
    lips: { score: Math.max(...reports.map(r => r.zones.lips.score)), issues: best.zones.lips.issues },
    nose: { score: Math.max(...reports.map(r => r.zones.nose.score)), issues: best.zones.nose.issues },
    jaw: { score: Math.max(...reports.map(r => r.zones.jaw.score)), issues: best.zones.jaw.issues },
    forehead: { score: Math.max(...reports.map(r => r.zones.forehead.score)), issues: best.zones.forehead.issues },
    cheeks: { score: Math.max(...reports.map(r => r.zones.cheeks.score)), issues: best.zones.cheeks.issues },
  };

  const mergedOverall = Math.round(
    Object.values(mergedZones).reduce((s, z) => s + z.score, 0) / 6
  );
  const mergedCanProceed = hasEnoughSignalToProceed({
    overallScore: mergedOverall,
    issues: mergedIssues,
    yawOff: Math.abs(best.headPose.yaw),
    pitchOff: Math.abs(best.headPose.pitch),
    rollOff: Math.abs(best.headPose.roll),
    isTooSmall: best.faceFraming.isTooSmall,
    faceCount: reports.some((report) => report.issues.includes("multiple_faces")) ? 2 : 1,
    eyeScore: mergedZones.eyes.score,
    lipScore: mergedZones.lips.score,
    jawScore: mergedZones.jaw.score,
  });

  return {
    ...best,
    overallScore: mergedOverall,
    canProceed: mergedCanProceed,
    zones: mergedZones,
    issues: mergedCanProceed ? [] : mergedIssues,
    photoRequest: mergedCanProceed ? null : buildPhotoRequest(mergedIssues),
  };
}

function hasEnoughSignalToProceed({
  overallScore,
  issues,
  yawOff,
  pitchOff,
  rollOff,
  isTooSmall,
  faceCount,
  eyeScore,
  lipScore,
  jawScore,
}: {
  overallScore: number;
  issues: PrecisionIssue[];
  yawOff: number;
  pitchOff: number;
  rollOff: number;
  isTooSmall: boolean;
  faceCount: number;
  eyeScore: number;
  lipScore: number;
  jawScore: number;
}) {
  const hardPoseFailure = yawOff > 26 || pitchOff > 24 || rollOff > 18;
  const weakCoreZones = [eyeScore, lipScore, jawScore].filter((score) => score < 55).length;
  const hasMultipleFaces = faceCount > 1 || issues.includes("multiple_faces");

  if (hasMultipleFaces || isTooSmall || hardPoseFailure) {
    return false;
  }

  if (overallScore >= 72) {
    return true;
  }

  return overallScore >= 68 && weakCoreZones < 2;
}
