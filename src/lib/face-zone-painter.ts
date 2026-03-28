/**
 * face-zone-painter.ts
 * Draws makeup application zone overlays on a canvas using MediaPipe landmarks.
 * Each zone is a soft, semi-transparent colored region derived from actual face geometry.
 */

import type { RawLandmark } from "./face-detector";
import { LANDMARK_INDICES } from "./face-detector";

// ─── Zone types ───────────────────────────────────────────────────────────────

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

export const ZONE_META: Record<ZoneKey, { label: string; color: string; accent: string }> = {
  full_face:   { label: "Full Face",       color: "rgba(255,215,170,0.35)", accent: "#d49a52" },
  under_eye:   { label: "Under Eye",       color: "rgba(255,205,155,0.45)", accent: "#c07030" },
  brows:       { label: "Brow Zone",       color: "rgba(110,70,30,0.40)",   accent: "#7a4520" },
  eye_lid:     { label: "Lid & Crease",    color: "rgba(160,130,210,0.45)", accent: "#8055c8" },
  lash_line:   { label: "Lash Line",       color: "rgba(20,20,20,0.70)",    accent: "#222222" },
  blush:       { label: "Blush Zone",      color: "rgba(255,130,130,0.40)", accent: "#d45555" },
  contour:     { label: "Contour",         color: "rgba(120,72,30,0.40)",   accent: "#7a4010" },
  highlighter: { label: "Highlight",       color: "rgba(255,245,185,0.65)", accent: "#c8aa30" },
  lips:        { label: "Lips",            color: "rgba(210,65,65,0.50)",   accent: "#c03030" },
  nose:        { label: "Nose",            color: "rgba(130,82,40,0.38)",   accent: "#7a4a10" },
  t_zone:      { label: "T-Zone",          color: "rgba(255,225,185,0.38)", accent: "#b88840" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

type Pt = [number, number];

function p(lm: RawLandmark[], idx: number, w: number, h: number): Pt {
  return [lm[idx].x * w, lm[idx].y * h];
}

/** Draw a filled + stroked soft polygon (blurred for natural edges). */
function fillPoly(
  ctx: CanvasRenderingContext2D,
  pts: Pt[],
  fill: string,
  stroke: string,
  strokeWidth = 1.5,
  blur = 6
) {
  if (pts.length < 3) return;
  ctx.save();
  ctx.filter = `blur(${blur}px)`;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = strokeWidth;
  ctx.stroke();
  ctx.restore();
}

/** Draw a soft ellipse. */
function fillEllipse(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  rx: number, ry: number,
  fill: string,
  blur = 8,
  rotation = 0
) {
  ctx.save();
  ctx.filter = `blur(${blur}px)`;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, rotation, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.restore();
}

/** Average position of a list of landmark indices. */
function centroid(lm: RawLandmark[], indices: number[], w: number, h: number): Pt {
  let sx = 0, sy = 0;
  for (const i of indices) { sx += lm[i].x; sy += lm[i].y; }
  return [sx / indices.length * w, sy / indices.length * h];
}

/** Span (max - min) across axis for a set of indices. */
function span(lm: RawLandmark[], indices: number[], axis: "x" | "y"): number {
  const vals = indices.map(i => lm[i][axis]);
  return Math.max(...vals) - Math.min(...vals);
}

// ─── Zone painters ────────────────────────────────────────────────────────────

function paintFullFace(ctx: CanvasRenderingContext2D, lm: RawLandmark[], w: number, h: number, fill: string) {
  const pts = LANDMARK_INDICES.faceOval.map(i => p(lm, i, w, h));
  fillPoly(ctx, pts, fill, fill.replace(/[\d.]+\)$/, "0.5)"), 0, 10);
}

function paintUnderEye(ctx: CanvasRenderingContext2D, lm: RawLandmark[], w: number, h: number, fill: string) {
  // Left under-eye: below the left lower lid
  const leftLower = LANDMARK_INDICES.leftEyeLower;
  const rightLower = LANDMARK_INDICES.rightEyeLower;

  const eyeH = span(lm, leftLower, "y") * h;
  const dropAmt = eyeH * 1.8;

  for (const lowerIdx of [leftLower, rightLower]) {
    const [cx, topY] = centroid(lm, lowerIdx, w, h);
    const eyeW = span(lm, lowerIdx, "x") * w;
    fillEllipse(ctx, cx, topY + dropAmt * 0.5, eyeW * 0.55, dropAmt * 0.55, fill, 7);
  }
}

function paintBrows(ctx: CanvasRenderingContext2D, lm: RawLandmark[], w: number, h: number, fill: string) {
  for (const browIdx of [LANDMARK_INDICES.leftEyebrow, LANDMARK_INDICES.rightEyebrow]) {
    const pts = browIdx.map(i => p(lm, i, w, h));
    const browH = span(lm, [...browIdx], "y") * h;
    const pad = Math.max(4, browH * 1.2);

    // Expand brow region slightly above and below
    const expanded = [
      ...pts.map(([x, y]): Pt => [x, y - pad]),
      ...[...pts].reverse().map(([x, y]): Pt => [x, y + pad]),
    ];
    fillPoly(ctx, expanded, fill, fill.replace(/[\d.]+\)$/, "0.6)"), 1, 4);
  }
}

function paintEyeLid(ctx: CanvasRenderingContext2D, lm: RawLandmark[], w: number, h: number, fill: string) {
  const leftUpper = LANDMARK_INDICES.leftEyeUpper;
  const leftLower = LANDMARK_INDICES.leftEyeLower;
  const rightUpper = LANDMARK_INDICES.rightEyeUpper;
  const rightLower = LANDMARK_INDICES.rightEyeLower;

  for (const [upper, lower] of [[leftUpper, leftLower], [rightUpper, rightLower]] as const) {
    const eyeH = span(lm, [...upper, ...lower], "y") * h;
    // Lid = from upper lash to crease (above upper lid)
    const upperPts = upper.map(i => p(lm, i, w, h));
    const creaseOffset = eyeH * 1.8;
    const creasePts: Pt[] = upperPts.map(([x, y]) => [x, y - creaseOffset]);
    const lowerPts = lower.map(i => p(lm, i, w, h));
    const combined: Pt[] = [...upperPts, ...[...lowerPts].reverse()];
    fillPoly(ctx, combined, fill, fill.replace(/[\d.]+\)$/, "0.55)"), 1, 5);
    // Crease band above
    fillPoly(
      ctx,
      [...creasePts, ...[...upperPts].reverse()],
      fill.replace(/[\d.]+\)$/, "0.25)"),
      "transparent",
      0, 8
    );
  }
}

function paintLashLine(ctx: CanvasRenderingContext2D, lm: RawLandmark[], w: number, h: number, fill: string) {
  for (const upperIdx of [LANDMARK_INDICES.leftEyeUpper, LANDMARK_INDICES.rightEyeUpper]) {
    const pts = upperIdx.map(i => p(lm, i, w, h));
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.strokeStyle = fill;
    ctx.lineWidth = Math.max(3, span(lm, LANDMARK_INDICES.leftEyeUpper, "y") * h * 2.5);
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.restore();
  }
}

function paintBlush(ctx: CanvasRenderingContext2D, lm: RawLandmark[], w: number, h: number, fill: string) {
  const faceW = span(lm, LANDMARK_INDICES.faceOval, "x") * w;
  const rx = faceW * 0.14;
  const ry = faceW * 0.09;

  // Left cheek — between eye outer corner and mouth corner
  const leftCheek = p(lm, LANDMARK_INDICES.leftCheekbone[0], w, h);
  const leftEyeOuter = p(lm, LANDMARK_INDICES.leftEyeOuterCorner[0], w, h);
  // Position below cheekbone, angled toward mouth corner
  const lx = leftCheek[0] * 0.7 + leftEyeOuter[0] * 0.3;
  const ly = leftCheek[1] * 0.55 + leftEyeOuter[1] * 0.45 + ry * 0.4;
  fillEllipse(ctx, lx, ly, rx, ry, fill, 12, -0.3);

  // Right cheek (mirrored)
  const rightCheek = p(lm, LANDMARK_INDICES.rightCheekbone[0], w, h);
  const rightEyeOuter = p(lm, LANDMARK_INDICES.rightEyeOuterCorner[0], w, h);
  const rx2 = rightCheek[0] * 0.7 + rightEyeOuter[0] * 0.3;
  const ry2 = rightCheek[1] * 0.55 + rightEyeOuter[1] * 0.45 + ry * 0.4;
  fillEllipse(ctx, rx2, ry2, rx, ry, fill, 12, 0.3);
}

function paintContour(ctx: CanvasRenderingContext2D, lm: RawLandmark[], w: number, h: number, fill: string) {
  const faceW = span(lm, LANDMARK_INDICES.faceOval, "x") * w;
  const stripW = faceW * 0.08;

  // Left contour: temple to jaw, along face edge
  const leftTemple = p(lm, LANDMARK_INDICES.leftTemple[0], w, h);
  const leftCheekbone = p(lm, LANDMARK_INDICES.leftCheekbone[0], w, h);
  const leftJaw = p(lm, LANDMARK_INDICES.leftJaw[0], w, h);

  const lContour: Pt[] = [
    [leftTemple[0], leftTemple[1]],
    [leftTemple[0] + stripW, leftTemple[1]],
    [leftCheekbone[0] + stripW * 0.8, leftCheekbone[1]],
    [leftJaw[0] + stripW * 0.5, leftJaw[1]],
    [leftJaw[0], leftJaw[1]],
    [leftCheekbone[0], leftCheekbone[1]],
  ];
  fillPoly(ctx, lContour, fill, fill.replace(/[\d.]+\)$/, "0.5)"), 1, 10);

  // Right contour
  const rightTemple = p(lm, LANDMARK_INDICES.rightTemple[0], w, h);
  const rightCheekbone = p(lm, LANDMARK_INDICES.rightCheekbone[0], w, h);
  const rightJaw = p(lm, LANDMARK_INDICES.rightJaw[0], w, h);

  const rContour: Pt[] = [
    [rightTemple[0], rightTemple[1]],
    [rightTemple[0] - stripW, rightTemple[1]],
    [rightCheekbone[0] - stripW * 0.8, rightCheekbone[1]],
    [rightJaw[0] - stripW * 0.5, rightJaw[1]],
    [rightJaw[0], rightJaw[1]],
    [rightCheekbone[0], rightCheekbone[1]],
  ];
  fillPoly(ctx, rContour, fill, fill.replace(/[\d.]+\)$/, "0.5)"), 1, 10);

  // Jawline underside
  const chin = p(lm, LANDMARK_INDICES.chinBottom[0], w, h);
  const chinH = (chin[1] - leftJaw[1]) * 0.5;
  const jawPts: Pt[] = [
    [leftJaw[0], leftJaw[1]],
    [chin[0], chin[1]],
    [rightJaw[0], rightJaw[1]],
    [rightJaw[0], rightJaw[1] + chinH],
    [chin[0], chin[1] + chinH],
    [leftJaw[0], leftJaw[1] + chinH],
  ];
  fillPoly(ctx, jawPts, fill.replace(/[\d.]+\)$/, "0.3)"), "transparent", 0, 8);
}

function paintHighlighter(ctx: CanvasRenderingContext2D, lm: RawLandmark[], w: number, h: number, fill: string) {
  const faceW = span(lm, LANDMARK_INDICES.faceOval, "x") * w;
  const dotR = faceW * 0.05;

  // 1. Cheekbone tops (just above cheekbones, catching the light)
  const lCheek = p(lm, LANDMARK_INDICES.leftCheekbone[0], w, h);
  const rCheek = p(lm, LANDMARK_INDICES.rightCheekbone[0], w, h);
  fillEllipse(ctx, lCheek[0], lCheek[1] - dotR, dotR * 1.6, dotR * 0.9, fill, 9);
  fillEllipse(ctx, rCheek[0], rCheek[1] - dotR, dotR * 1.6, dotR * 0.9, fill, 9);

  // 2. Nose bridge (slim strip)
  const nBridgeTop = p(lm, LANDMARK_INDICES.noseBridgeTop[0], w, h);
  const nTip = p(lm, LANDMARK_INDICES.noseTip[0], w, h);
  const bridgeH = nTip[1] - nBridgeTop[1];
  fillEllipse(ctx, nBridgeTop[0], nBridgeTop[1] + bridgeH * 0.3, dotR * 0.4, bridgeH * 0.5, fill, 5);

  // 3. Brow bone (just below arch of each brow)
  const lBrowPts = LANDMARK_INDICES.leftEyebrow.map(i => p(lm, i, w, h));
  const rBrowPts = LANDMARK_INDICES.rightEyebrow.map(i => p(lm, i, w, h));
  const lBrowCx = lBrowPts.reduce((s, pt) => s + pt[0], 0) / lBrowPts.length;
  const lBrowCy = Math.min(...lBrowPts.map(pt => pt[1]));
  const rBrowCx = rBrowPts.reduce((s, pt) => s + pt[0], 0) / rBrowPts.length;
  const rBrowCy = Math.min(...rBrowPts.map(pt => pt[1]));
  fillEllipse(ctx, lBrowCx, lBrowCy + dotR * 0.6, dotR * 1.2, dotR * 0.5, fill, 7);
  fillEllipse(ctx, rBrowCx, rBrowCy + dotR * 0.6, dotR * 1.2, dotR * 0.5, fill, 7);

  // 4. Cupid bow center
  const cupidBow = p(lm, 13, w, h); // upper lip center
  fillEllipse(ctx, cupidBow[0], cupidBow[1] - dotR * 1.5, dotR * 0.8, dotR * 0.4, fill, 5);
}

function paintLips(ctx: CanvasRenderingContext2D, lm: RawLandmark[], w: number, h: number, fill: string) {
  const outer = LANDMARK_INDICES.lipsOuter.map(i => p(lm, i, w, h));
  fillPoly(ctx, outer, fill, fill.replace(/[\d.]+\)$/, "0.7)"), 1.5, 3);
}

function paintNose(ctx: CanvasRenderingContext2D, lm: RawLandmark[], w: number, h: number, fill: string) {
  const noseTip = p(lm, LANDMARK_INDICES.noseTip[0], w, h);
  const noseLeft = p(lm, LANDMARK_INDICES.noseLeftWing[0], w, h);
  const noseRight = p(lm, LANDMARK_INDICES.noseRightWing[0], w, h);
  const noseTop = p(lm, LANDMARK_INDICES.noseBridgeTop[0], w, h);
  const faceW = span(lm, LANDMARK_INDICES.faceOval, "x") * w;
  const sideStripW = faceW * 0.025;

  // Shadow strips on both sides of nose bridge
  const noseH = noseTip[1] - noseTop[1];

  const leftNoseShadow: Pt[] = [
    [noseTop[0] - sideStripW * 0.5, noseTop[1]],
    [noseLeft[0], noseLeft[1]],
    [noseLeft[0] + sideStripW * 0.8, noseTip[1]],
    [noseTop[0] + sideStripW * 0.3, noseTop[1] + noseH * 0.2],
  ];
  fillPoly(ctx, leftNoseShadow, fill, "transparent", 0, 6);

  const rightNoseShadow: Pt[] = [
    [noseTop[0] + sideStripW * 0.5, noseTop[1]],
    [noseRight[0], noseRight[1]],
    [noseRight[0] - sideStripW * 0.8, noseTip[1]],
    [noseTop[0] - sideStripW * 0.3, noseTop[1] + noseH * 0.2],
  ];
  fillPoly(ctx, rightNoseShadow, fill, "transparent", 0, 6);
}

function paintTZone(ctx: CanvasRenderingContext2D, lm: RawLandmark[], w: number, h: number, fill: string) {
  const forehead = p(lm, LANDMARK_INDICES.foreheadTop[0], w, h);
  const leftTemple = p(lm, LANDMARK_INDICES.leftTemple[0], w, h);
  const rightTemple = p(lm, LANDMARK_INDICES.rightTemple[0], w, h);
  const noseTip = p(lm, LANDMARK_INDICES.noseTip[0], w, h);
  const noseBottom = p(lm, LANDMARK_INDICES.noseBottom[0], w, h);
  const noseLeft = p(lm, LANDMARK_INDICES.noseLeftWing[0], w, h);
  const noseRight = p(lm, LANDMARK_INDICES.noseRightWing[0], w, h);
  const noseTop = p(lm, LANDMARK_INDICES.noseBridgeTop[0], w, h);
  const faceW = span(lm, LANDMARK_INDICES.faceOval, "x") * w;
  const bridgeW = faceW * 0.06;

  // Forehead band
  const foreheadPts: Pt[] = [
    [leftTemple[0], leftTemple[1]],
    [forehead[0], forehead[1] - faceW * 0.02],
    [rightTemple[0], rightTemple[1]],
    [rightTemple[0], rightTemple[1] + (noseTip[1] - rightTemple[1]) * 0.15],
    [forehead[0], forehead[1] + faceW * 0.08],
    [leftTemple[0], leftTemple[1] + (noseTip[1] - leftTemple[1]) * 0.15],
  ];
  fillPoly(ctx, foreheadPts, fill, "transparent", 0, 12);

  // Nose bridge strip
  const bridgePts: Pt[] = [
    [noseTop[0] - bridgeW, noseTop[1]],
    [noseTop[0] + bridgeW, noseTop[1]],
    [noseRight[0], noseRight[1]],
    [noseBottom[0], noseBottom[1]],
    [noseLeft[0], noseLeft[1]],
  ];
  fillPoly(ctx, bridgePts, fill, "transparent", 0, 8);
}

// ─── Main entry ───────────────────────────────────────────────────────────────

export function paintZone(
  ctx: CanvasRenderingContext2D,
  landmarks: RawLandmark[],
  zone: ZoneKey,
  w: number,
  h: number
): void {
  const { color } = ZONE_META[zone];

  ctx.save();
  switch (zone) {
    case "full_face":   paintFullFace(ctx, landmarks, w, h, color); break;
    case "under_eye":   paintUnderEye(ctx, landmarks, w, h, color); break;
    case "brows":       paintBrows(ctx, landmarks, w, h, color); break;
    case "eye_lid":     paintEyeLid(ctx, landmarks, w, h, color); break;
    case "lash_line":   paintLashLine(ctx, landmarks, w, h, color); break;
    case "blush":       paintBlush(ctx, landmarks, w, h, color); break;
    case "contour":     paintContour(ctx, landmarks, w, h, color); break;
    case "highlighter": paintHighlighter(ctx, landmarks, w, h, color); break;
    case "lips":        paintLips(ctx, landmarks, w, h, color); break;
    case "nose":        paintNose(ctx, landmarks, w, h, color); break;
    case "t_zone":      paintTZone(ctx, landmarks, w, h, color); break;
  }
  ctx.restore();
}
