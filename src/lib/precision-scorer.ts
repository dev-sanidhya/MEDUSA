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
  canProceed: boolean;           // true if overallScore >= 78
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

  const blockingIssues: PrecisionIssue[] = [
    "face_angle_yaw",
    "face_angle_pitch",
    "face_angle_roll",
    "face_too_small",
    "multiple_faces",
  ];
  const canProceed = overallScore >= 78 && !issues.some((issue) => blockingIssues.includes(issue));

  // ── Photo request ──────────────────────────────────────────────────────────
  let photoRequest: PhotoRequest | null = null;

  if (!canProceed) {
    photoRequest = buildPhotoRequest(issues, yaw, pitch);
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
  issues: PrecisionIssue[],
  yaw: number,
  pitch: number
): PhotoRequest {
  // Priority ordering: pose issues first, then occlusion, then framing

  if (issues.includes("face_too_small")) {
    return {
      reason: "Your face is too far from the camera — I can see you, but I can't measure your features with enough precision.",
      instruction: "Could you take another photo a bit closer? Ideally your face should fill about half the frame. Make sure your full face — forehead to chin — is visible.",
      priority: "required",
      angleHint: "face directly forward",
    };
  }

  if (issues.includes("face_angle_yaw")) {
    const direction = yaw > 0 ? "slightly to the right" : "slightly to the left";
    return {
      reason: `Your face is turned ${direction} in this photo. I need a straight-on view to measure your face structure precisely — even a small angle affects the accuracy of cheekbone width, eye spacing, and jaw measurements.`,
      instruction: "Could you take another photo facing directly forward? Imagine looking straight into a mirror. Your nose should point straight at the camera.",
      priority: "required",
      angleHint: "face directly forward, nose pointing at the camera",
    };
  }

  if (issues.includes("face_angle_pitch")) {
    const direction = pitch > 0 ? "tilted upward" : "tilted downward";
    return {
      reason: `Your chin is ${direction} in this photo. This changes how your face proportions appear and affects my measurement of the face thirds (forehead:midface:chin ratio).`,
      instruction: "Try holding your phone at eye level and looking straight into the camera — chin parallel to the floor, not tucked or raised.",
      priority: "required",
      angleHint: "chin level, eyes looking straight at camera",
    };
  }

  if (issues.includes("face_angle_roll")) {
    return {
      reason: "Your head is tilted to one side in this photo. This makes it hard to accurately compare your left and right features — symmetry analysis is key to personalized makeup placement.",
      instruction: "Could you straighten your head so it's not tilted left or right? Imagine a vertical line running from the top of your head through your chin.",
      priority: "required",
      angleHint: "head straight, no tilt",
    };
  }

  if (issues.includes("multiple_faces")) {
    return {
      reason: "I can see more than one face in frame, so I can't be sure which features to measure.",
      instruction: "Take another photo with only your face in frame and keep the background clear of other people or portraits.",
      priority: "required",
    };
  }

  if (issues.includes("eyes_partially_occluded")) {
    return {
      reason: "I'm having trouble reading your eyes clearly — they may be partially covered by hair, glasses, or strong lighting shadows.",
      instruction: "If you're wearing glasses, could you remove them for this photo? Also make sure your hair isn't falling across your eyes. Natural, even lighting works best.",
      priority: "required",
    };
  }

  if (issues.includes("lips_partially_occluded")) {
    return {
      reason: "Your lips are partially obscured in this photo — possibly by a shadow, a scarf, or the angle.",
      instruction: "Could you make sure your full lips are visible and unobstructed? A relaxed, neutral expression (mouth closed, lips together) works best.",
      priority: "required",
    };
  }

  if (issues.includes("jaw_occluded")) {
    return {
      reason: "I can't get a clear read on your jaw and chin — this is essential for face shape classification and contouring guidance.",
      instruction: "Make sure your jawline and chin are fully visible. Pull your hair back if it's covering the sides of your face, and make sure nothing is covering your chin.",
      priority: "required",
    };
  }

  // Fallback for low overall confidence
  return {
    reason: "The photo quality isn't quite giving me enough detail to do a precise analysis — I want to make sure every recommendation I give you is specific to your face, not approximate.",
    instruction: "Could you take another photo in good natural light, facing directly forward, with your full face visible from forehead to chin? Avoid flash if possible — it flattens the face.",
    priority: "recommended",
    angleHint: "face directly forward, good natural light",
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
  const blockingIssues: PrecisionIssue[] = [
    "face_angle_yaw",
    "face_angle_pitch",
    "face_angle_roll",
    "face_too_small",
    "multiple_faces",
  ];
  const mergedCanProceed = mergedOverall >= 78 && !mergedIssues.some((issue) => blockingIssues.includes(issue));

  return {
    ...best,
    overallScore: mergedOverall,
    canProceed: mergedCanProceed,
    zones: mergedZones,
    issues: mergedCanProceed ? [] : mergedIssues,
    photoRequest: mergedCanProceed ? null : buildPhotoRequest(mergedIssues, best.headPose.yaw, best.headPose.pitch),
  };
}
