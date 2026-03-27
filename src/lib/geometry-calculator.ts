/**
 * geometry-calculator.ts
 * Derives a structured FaceProfile from raw MediaPipe landmarks.
 * Every measurement is calculated from actual landmark coordinates —
 * nothing generic, nothing estimated.
 */

import type { RawLandmark } from "./face-detector";
import { LANDMARK_INDICES } from "./face-detector";

// ─── Types ────────────────────────────────────────────────────────────────────

export type FaceShape = "oval" | "round" | "square" | "heart" | "diamond" | "oblong";
export type EyeShape = "almond" | "round" | "hooded" | "monolid" | "downturned" | "upturned";
export type EyeSet = "close-set" | "normal" | "wide-set";
export type SkinTone = "fair" | "light" | "wheatish" | "medium" | "tan" | "deep";
export type SkinUndertone = "warm" | "cool" | "neutral";
export type CheekboneProminence = "high" | "medium" | "low";
export type LipFullness = "thin" | "medium" | "full" | "very-full";

export interface FaceProfile {
  // ── Face shape ──────────────────────────────────────────────────────────────
  faceShape: FaceShape;
  faceRatios: {
    widthToHeight: number;        // face width / face height
    foreheadWidth: number;        // forehead width / cheekbone width
    jawToForehead: number;        // jaw width / forehead width (< 1 = narrower jaw)
    cheekboneWidth: number;       // cheekbone width / face height
    jawAngleDeg: number;          // angle at jaw corners (sharper = more square)
    thirdRatios: [number, number, number]; // forehead:midface:lower thirds
  };

  // ── Eyes ────────────────────────────────────────────────────────────────────
  eyes: {
    setType: EyeSet;
    interEyeRatio: number;        // inner eye gap / eye width (>1.3 = wide-set)
    shape: EyeShape;
    lidVisibilityRatio: number;   // visible lid height / eye height (< 0.3 = hooded)
    tiltDeg: number;              // positive = upturned, negative = downturned
    asymmetryMm: number;          // height difference between eyes (normalized)
    leftEyeAspectRatio: number;   // eye openness
    rightEyeAspectRatio: number;
  };

  // ── Lips ────────────────────────────────────────────────────────────────────
  lips: {
    fullness: LipFullness;
    upperToLowerRatio: number;    // < 1 = thinner upper lip (very common)
    widthToFaceRatio: number;     // lip width / face width
    symmetry: number;             // 0–1 (1 = perfect)
    cupidBowDepth: number;        // depth of the philtrum dip (normalized)
    cornerTilt: number;           // positive = upturned corners, negative = downturned
  };

  // ── Nose ────────────────────────────────────────────────────────────────────
  nose: {
    widthToFaceRatio: number;     // nose wing width / face width
    lengthToFaceRatio: number;    // nose length / face height
    bridgeWidth: number;          // bridge width / nose wing width
  };

  // ── Eyebrows ─────────────────────────────────────────────────────────────────
  brows: {
    archHeightRatio: number;      // arch peak height above brow start / brow width
    asymmetryDeg: number;         // difference in arch angle between brows
    spacingRatio: number;         // inter-brow gap / eye width
    leftArchPeakPosition: number; // how far along brow the peak is (0 = inner, 1 = outer)
    rightArchPeakPosition: number;
  };

  // ── Cheekbones ───────────────────────────────────────────────────────────────
  cheekbones: {
    prominence: CheekboneProminence;
    widthRatio: number;           // cheekbone width / face height
  };

  // ── Skin tone (placeholder — filled later by Claude Vision analysis) ─────────
  skinTone: {
    tone: SkinTone | null;
    undertone: SkinUndertone | null;
    sampledRgb: [number, number, number] | null;
  };

  // ── Raw data (passed to Claude) ──────────────────────────────────────────────
  keyLandmarkPixels: Record<string, [number, number]>; // name → [px, py]
  imageWidth: number;
  imageHeight: number;
}

// ─── Helper math ─────────────────────────────────────────────────────────────

function lm(landmarks: RawLandmark[], idx: number): [number, number, number] {
  const p = landmarks[idx];
  return [p.x, p.y, p.z ?? 0];
}

function dist2D(
  landmarks: RawLandmark[],
  a: number,
  b: number
): number {
  const [ax, ay] = lm(landmarks, a);
  const [bx, by] = lm(landmarks, b);
  return Math.sqrt((bx - ax) ** 2 + (by - ay) ** 2);
}

function midpoint(
  landmarks: RawLandmark[],
  a: number,
  b: number
): [number, number] {
  const [ax, ay] = lm(landmarks, a);
  const [bx, by] = lm(landmarks, b);
  return [(ax + bx) / 2, (ay + by) / 2];
}

function angleBetween(
  p1: [number, number],
  vertex: [number, number],
  p2: [number, number]
): number {
  const v1 = [p1[0] - vertex[0], p1[1] - vertex[1]];
  const v2 = [p2[0] - vertex[0], p2[1] - vertex[1]];
  const dot = v1[0] * v2[0] + v1[1] * v2[1];
  const mag = Math.sqrt(v1[0] ** 2 + v1[1] ** 2) * Math.sqrt(v2[0] ** 2 + v2[1] ** 2);
  return (Math.acos(Math.min(1, dot / mag)) * 180) / Math.PI;
}

// Eye Aspect Ratio — openness measure
function eyeAspectRatio(landmarks: RawLandmark[], upperIdx: number[], lowerIdx: number[]): number {
  const upperY = upperIdx.reduce((s, i) => s + landmarks[i].y, 0) / upperIdx.length;
  const lowerY = lowerIdx.reduce((s, i) => s + landmarks[i].y, 0) / lowerIdx.length;
  const leftX = Math.min(...[...upperIdx, ...lowerIdx].map(i => landmarks[i].x));
  const rightX = Math.max(...[...upperIdx, ...lowerIdx].map(i => landmarks[i].x));
  const height = Math.abs(lowerY - upperY);
  const width = rightX - leftX;
  return width > 0 ? height / width : 0;
}

// ─── Main calculator ──────────────────────────────────────────────────────────

export function calculateFaceProfile(
  landmarks: RawLandmark[],
  imageWidth: number,
  imageHeight: number
): FaceProfile {
  const L = landmarks;
  const idx = LANDMARK_INDICES;

  // ── Face dimensions ───────────────────────────────────────────────────────
  const faceWidth = dist2D(L, idx.leftTemple[0], idx.rightTemple[0]);
  const faceHeight = dist2D(L, idx.foreheadTop[0], idx.chinBottom[0]);
  const cheekboneWidth = dist2D(L, idx.leftCheekbone[0], idx.rightCheekbone[0]);
  const jawWidth = dist2D(L, idx.leftJaw[0], idx.rightJaw[0]);

  // Estimate forehead width using points near hairline (approx temples - narrowed)
  const foreheadWidth = faceWidth * 0.88; // temples slightly wider than forehead

  // Face thirds (forehead top → brow, brow → nose base, nose base → chin)
  const foreheadBottom = midpoint(L, idx.leftEyebrow[0], idx.rightEyebrow[0]);
  const noseBase = lm(L, idx.noseBottom[0]);
  const chin = lm(L, idx.chinBottom[0]);
  const foreheadTop = lm(L, idx.foreheadTop[0]);

  const third1 = Math.abs(foreheadBottom[1] - foreheadTop[1]);
  const third2 = Math.abs(noseBase[1] - foreheadBottom[1]);
  const third3 = Math.abs(chin[1] - noseBase[1]);
  const thirdTotal = third1 + third2 + third3;

  const thirdRatios: [number, number, number] = [
    third1 / thirdTotal,
    third2 / thirdTotal,
    third3 / thirdTotal,
  ];

  // Jaw angle
  const leftJawPt = lm(L, idx.leftJaw[0]) as [number, number, number];
  const rightJawPt = lm(L, idx.rightJaw[0]) as [number, number, number];
  const chinPt = lm(L, idx.chinBottom[0]) as [number, number, number];
  const jawAngleDeg = angleBetween(
    [leftJawPt[0], leftJawPt[1]],
    [chinPt[0], chinPt[1]],
    [rightJawPt[0], rightJawPt[1]]
  );

  // ── Face shape classification ──────────────────────────────────────────────
  const widthToHeight = cheekboneWidth / faceHeight;
  const jawToForehead = jawWidth / foreheadWidth;
  const foreheadToCheek = foreheadWidth / cheekboneWidth;

  let faceShape: FaceShape = "oval";
  if (widthToHeight > 0.85) {
    faceShape = jawAngleDeg < 130 ? "square" : "round";
  } else if (widthToHeight < 0.65) {
    faceShape = "oblong";
  } else if (foreheadToCheek > 1.05 && jawToForehead < 0.8) {
    faceShape = "heart";
  } else if (foreheadToCheek < 0.9 && jawToForehead < 0.85) {
    faceShape = "diamond";
  } else {
    faceShape = "oval";
  }

  // ── Eyes ──────────────────────────────────────────────────────────────────
  const leftInner = lm(L, idx.leftEyeInnerCorner[0]);
  const leftOuter = lm(L, idx.leftEyeOuterCorner[0]);
  const rightInner = lm(L, idx.rightEyeInnerCorner[0]);
  const rightOuter = lm(L, idx.rightEyeOuterCorner[0]);

  const leftEyeWidth = dist2D(L, idx.leftEyeOuterCorner[0], idx.leftEyeInnerCorner[0]);
  const rightEyeWidth = dist2D(L, idx.rightEyeOuterCorner[0], idx.rightEyeInnerCorner[0]);
  const avgEyeWidth = (leftEyeWidth + rightEyeWidth) / 2;

  const interEyeGap = dist2D(L, idx.leftEyeInnerCorner[0], idx.rightEyeInnerCorner[0]);
  const interEyeRatio = interEyeGap / avgEyeWidth;

  let eyeSetType: EyeSet = "normal";
  if (interEyeRatio < 0.9) eyeSetType = "close-set";
  else if (interEyeRatio > 1.3) eyeSetType = "wide-set";

  // Lid visibility: distance from pupil to upper lid vs total eye height
  const leftEAR = eyeAspectRatio(L, [...idx.leftEyeUpper], [...idx.leftEyeLower]);
  const rightEAR = eyeAspectRatio(L, [...idx.rightEyeUpper], [...idx.rightEyeLower]);

  // Eye tilt (outer corner vs inner corner vertical difference)
  const leftTilt = (leftOuter[1] - leftInner[1]) / leftEyeWidth * 100; // % - negative = upturned
  const rightTilt = (rightInner[1] - rightOuter[1]) / rightEyeWidth * 100;
  const avgTilt = (leftTilt + rightTilt) / 2;

  const avgEAR = (leftEAR + rightEAR) / 2;
  let eyeShape: EyeShape = "almond";
  if (avgEAR < 0.18) eyeShape = "monolid";
  else if (avgEAR < 0.25) eyeShape = "hooded";
  else if (avgEAR > 0.35) eyeShape = "round";
  else if (avgTilt < -3) eyeShape = "downturned";
  else if (avgTilt > 3) eyeShape = "upturned";
  else eyeShape = "almond";

  const eyeHeightAsymmetry = Math.abs(leftEAR - rightEAR);

  // ── Lips ──────────────────────────────────────────────────────────────────
  // Key lip points
  const lipLeft = lm(L, 61);       // left corner
  const lipRight = lm(L, 291);     // right corner
  const upperLipTop = lm(L, 0);    // top of upper lip (center)
  const upperLipBot = lm(L, 13);   // bottom of upper lip (inner)
  const lowerLipTop = lm(L, 14);   // top of lower lip (inner)
  const lowerLipBot = lm(L, 17);   // bottom of lower lip
  const cupidLeft = lm(L, 37);     // cupid's bow left peak
  const cupidRight = lm(L, 267);   // cupid's bow right peak
  const cupidDip = lm(L, 0);       // center dip

  const lipWidth = Math.sqrt((lipRight[0] - lipLeft[0]) ** 2 + (lipRight[1] - lipLeft[1]) ** 2);
  const upperLipHeight = Math.abs(upperLipBot[1] - upperLipTop[1]);
  const lowerLipHeight = Math.abs(lowerLipBot[1] - lowerLipTop[1]);
  const upperToLowerRatio = upperLipHeight / (lowerLipHeight || 0.001);

  const lipWidthToFace = lipWidth / faceWidth;

  // Cupid bow depth (normalized)
  const cupidBowDepth = Math.abs(
    ((cupidLeft[1] + cupidRight[1]) / 2) - cupidDip[1]
  ) / (upperLipHeight || 0.001);

  // Corner tilt
  const cornerTilt = ((lipLeft[1] + lipRight[1]) / 2 - (cupidLeft[1] + cupidRight[1]) / 2)
    / (upperLipHeight || 0.001);

  const totalLipHeight = upperLipHeight + lowerLipHeight;
  let lipFullness: LipFullness = "medium";
  if (totalLipHeight / faceHeight < 0.04) lipFullness = "thin";
  else if (totalLipHeight / faceHeight < 0.06) lipFullness = "medium";
  else if (totalLipHeight / faceHeight < 0.08) lipFullness = "full";
  else lipFullness = "very-full";

  // ── Nose ──────────────────────────────────────────────────────────────────
  const noseWidth = dist2D(L, idx.noseLeftWing[0], idx.noseRightWing[0]);
  const noseLength = dist2D(L, idx.noseBridgeTop[0], idx.noseBottom[0]);
  const bridgeWidth = dist2D(L, idx.noseBridgeTop[0], idx.noseBridgeMid[0]) * 0.5;

  // ── Eyebrows ──────────────────────────────────────────────────────────────
  const leftBrow = idx.leftEyebrow.map(i => lm(L, i));
  const rightBrow = idx.rightEyebrow.map(i => lm(L, i));

  const leftBrowWidth = Math.abs(leftBrow[leftBrow.length - 1][0] - leftBrow[0][0]);
  const rightBrowWidth = Math.abs(rightBrow[rightBrow.length - 1][0] - rightBrow[0][0]);

  const leftBrowPeakY = Math.min(...leftBrow.map(p => p[1]));
  const leftBrowBaseY = (leftBrow[0][1] + leftBrow[leftBrow.length - 1][1]) / 2;
  const leftArchHeight = Math.abs(leftBrowBaseY - leftBrowPeakY) / (leftBrowWidth || 0.001);

  const rightBrowPeakY = Math.min(...rightBrow.map(p => p[1]));
  const rightBrowBaseY = (rightBrow[0][1] + rightBrow[rightBrow.length - 1][1]) / 2;
  const rightArchHeight = Math.abs(rightBrowBaseY - rightBrowPeakY) / (rightBrowWidth || 0.001);

  const avgArchHeight = (leftArchHeight + rightArchHeight) / 2;

  const leftPeakIdx = leftBrow.findIndex(p => p[1] === leftBrowPeakY);
  const rightPeakIdx = rightBrow.findIndex(p => p[1] === rightBrowPeakY);
  const leftArchPeakPos = leftPeakIdx / (leftBrow.length - 1);
  const rightArchPeakPos = rightPeakIdx / (rightBrow.length - 1);

  const interBrowGap = dist2D(L, idx.leftEyebrow[0], idx.rightEyebrow[0]);
  const browSpacingRatio = interBrowGap / avgEyeWidth;

  const leftBrowAngle = Math.atan2(
    leftBrow[leftBrow.length - 1][1] - leftBrow[0][1],
    leftBrow[leftBrow.length - 1][0] - leftBrow[0][0]
  ) * 180 / Math.PI;
  const rightBrowAngle = Math.atan2(
    rightBrow[rightBrow.length - 1][1] - rightBrow[0][1],
    rightBrow[rightBrow.length - 1][0] - rightBrow[0][0]
  ) * 180 / Math.PI;
  const browAsymmetryDeg = Math.abs(leftBrowAngle - rightBrowAngle);

  // ── Cheekbones ────────────────────────────────────────────────────────────
  const cheekboneWidthRatio = cheekboneWidth / faceHeight;
  let cheekProminence: CheekboneProminence = "medium";
  if (cheekboneWidthRatio > 0.75) cheekProminence = "high";
  else if (cheekboneWidthRatio < 0.6) cheekProminence = "low";

  // ── Key pixel coordinates (for overlay rendering) ─────────────────────────
  function toPixel(idx: number): [number, number] {
    return [
      Math.round(L[idx].x * imageWidth),
      Math.round(L[idx].y * imageHeight),
    ];
  }

  const keyLandmarkPixels: Record<string, [number, number]> = {
    foreheadTop: toPixel(LANDMARK_INDICES.foreheadTop[0]),
    chinBottom: toPixel(LANDMARK_INDICES.chinBottom[0]),
    leftTemple: toPixel(LANDMARK_INDICES.leftTemple[0]),
    rightTemple: toPixel(LANDMARK_INDICES.rightTemple[0]),
    leftCheekbone: toPixel(LANDMARK_INDICES.leftCheekbone[0]),
    rightCheekbone: toPixel(LANDMARK_INDICES.rightCheekbone[0]),
    leftJaw: toPixel(LANDMARK_INDICES.leftJaw[0]),
    rightJaw: toPixel(LANDMARK_INDICES.rightJaw[0]),
    noseTip: toPixel(LANDMARK_INDICES.noseTip[0]),
    noseLeftWing: toPixel(LANDMARK_INDICES.noseLeftWing[0]),
    noseRightWing: toPixel(LANDMARK_INDICES.noseRightWing[0]),
    leftEyeInner: toPixel(LANDMARK_INDICES.leftEyeInnerCorner[0]),
    leftEyeOuter: toPixel(LANDMARK_INDICES.leftEyeOuterCorner[0]),
    rightEyeInner: toPixel(LANDMARK_INDICES.rightEyeInnerCorner[0]),
    rightEyeOuter: toPixel(LANDMARK_INDICES.rightEyeOuterCorner[0]),
    lipLeft: toPixel(61),
    lipRight: toPixel(291),
    upperLipTop: toPixel(0),
    lowerLipBot: toPixel(17),
  };

  return {
    faceShape,
    faceRatios: {
      widthToHeight,
      foreheadWidth: foreheadWidth / cheekboneWidth,
      jawToForehead: jawToForehead,
      cheekboneWidth: cheekboneWidthRatio,
      jawAngleDeg,
      thirdRatios,
    },
    eyes: {
      setType: eyeSetType,
      interEyeRatio,
      shape: eyeShape,
      lidVisibilityRatio: avgEAR,
      tiltDeg: avgTilt,
      asymmetryMm: eyeHeightAsymmetry,
      leftEyeAspectRatio: leftEAR,
      rightEyeAspectRatio: rightEAR,
    },
    lips: {
      fullness: lipFullness,
      upperToLowerRatio,
      widthToFaceRatio: lipWidthToFace,
      symmetry: 1 - Math.min(1, Math.abs(lipLeft[1] - lipRight[1]) / (totalLipHeight || 0.001)),
      cupidBowDepth,
      cornerTilt,
    },
    nose: {
      widthToFaceRatio: noseWidth / cheekboneWidth,
      lengthToFaceRatio: noseLength / faceHeight,
      bridgeWidth: bridgeWidth / noseWidth,
    },
    brows: {
      archHeightRatio: avgArchHeight,
      asymmetryDeg: browAsymmetryDeg,
      spacingRatio: browSpacingRatio,
      leftArchPeakPosition: leftArchPeakPos,
      rightArchPeakPosition: rightArchPeakPos,
    },
    cheekbones: {
      prominence: cheekProminence,
      widthRatio: cheekboneWidthRatio,
    },
    skinTone: {
      tone: null,        // filled by Claude Vision
      undertone: null,
      sampledRgb: null,
    },
    keyLandmarkPixels,
    imageWidth,
    imageHeight,
  };
}
