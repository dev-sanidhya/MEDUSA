/**
 * face-zone-painter.ts
 * Zone overlays + motion guide data for the tutorial canvas.
 */

import type { RawLandmark } from "./face-detector";
import { LANDMARK_INDICES } from "./face-detector";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ZoneKey =
  | "full_face" | "under_eye" | "brows" | "eye_lid" | "lash_line"
  | "blush"     | "contour"   | "highlighter" | "lips" | "nose" | "t_zone";

export interface MotionArrow {
  x: number; y: number;   // position as fraction of canvas (0-1)
  dx: number; dy: number; // direction vector (normalized)
  label?: string;
}

export const ZONE_META: Record<ZoneKey, { label: string; color: string; accent: string }> = {
  full_face:   { label: "Full Face",    color: "rgba(255,215,170,0.32)", accent: "#d49a52" },
  under_eye:   { label: "Under Eye",   color: "rgba(255,205,155,0.45)", accent: "#c07030" },
  brows:       { label: "Brows + Lash",color: "rgba(110,70,30,0.42)",   accent: "#7a4520" },
  eye_lid:     { label: "Lid & Crease",color: "rgba(160,130,210,0.45)", accent: "#8055c8" },
  lash_line:   { label: "Lash Line",   color: "rgba(20,20,20,0.70)",    accent: "#444444" },
  blush:       { label: "Blush Zone",  color: "rgba(255,130,130,0.40)", accent: "#d45555" },
  contour:     { label: "Contour",     color: "rgba(120,72,30,0.40)",   accent: "#7a4010" },
  highlighter: { label: "Highlight",   color: "rgba(255,245,185,0.65)", accent: "#c8aa30" },
  lips:        { label: "Lips",        color: "rgba(210,65,65,0.50)",   accent: "#c03030" },
  nose:        { label: "Nose",        color: "rgba(130,82,40,0.38)",   accent: "#7a4a10" },
  t_zone:      { label: "T-Zone",      color: "rgba(255,225,185,0.38)", accent: "#b88840" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

type Pt = [number, number];

function p(lm: RawLandmark[], idx: number, w: number, h: number): Pt {
  return [lm[idx].x * w, lm[idx].y * h];
}

function sortByX(pts: Pt[]): Pt[] {
  return [...pts].sort((a, b) => a[0] - b[0]);
}

function fillPoly(ctx: CanvasRenderingContext2D, pts: Pt[], fill: string, blur = 6) {
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
}

function strokePath(ctx: CanvasRenderingContext2D, pts: Pt[], color: string, width: number, close = false) {
  if (pts.length < 2) return;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  if (close) ctx.closePath();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke();
  ctx.restore();
}

function fillEllipse(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, fill: string, blur = 8, rot = 0) {
  ctx.save();
  ctx.filter = `blur(${blur}px)`;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.restore();
}

function centroid(pts: Pt[]): Pt {
  return [
    pts.reduce((s, p) => s + p[0], 0) / pts.length,
    pts.reduce((s, p) => s + p[1], 0) / pts.length,
  ];
}

function span(lm: RawLandmark[], indices: number[], axis: "x" | "y"): number {
  const vals = indices.map(i => lm[i][axis]);
  return Math.max(...vals) - Math.min(...vals);
}

// ─── Zone painters ────────────────────────────────────────────────────────────

function paintFullFace(ctx: CanvasRenderingContext2D, lm: RawLandmark[], w: number, h: number, fill: string) {
  const pts = LANDMARK_INDICES.faceOval.map(i => p(lm, i, w, h));
  fillPoly(ctx, pts, fill, 10);
}

function paintUnderEye(ctx: CanvasRenderingContext2D, lm: RawLandmark[], w: number, h: number, fill: string) {
  // Professional concealer = inverted triangle: top edge along lower lash line, apex pointing down toward cheek.
  // Covers the full dark circle zone — inner corner → outer corner → tip at ~nose-wing level.
  for (const [lowerIdx, innerCorner, outerCorner] of [
    [LANDMARK_INDICES.leftEyeLower,  LANDMARK_INDICES.leftEyeInnerCorner[0],  LANDMARK_INDICES.leftEyeOuterCorner[0]],
    [LANDMARK_INDICES.rightEyeLower, LANDMARK_INDICES.rightEyeInnerCorner[0], LANDMARK_INDICES.rightEyeOuterCorner[0]],
  ] as const) {
    const inner = p(lm, innerCorner, w, h);
    const outer = p(lm, outerCorner, w, h);
    const eyeSpanX = Math.abs(outer[0] - inner[0]);

    // Bottom of lower lash line (true floor of the eye opening)
    const lowerPts = (lowerIdx as number[]).map(i => p(lm, i, w, h));
    const lashBottomY = Math.max(...lowerPts.map(([, y]) => y));

    // Triangle apex drops down ~60% of the eye width
    const dropH = eyeSpanX * 0.60;
    const tipX   = (inner[0] + outer[0]) / 2;
    const tipY   = lashBottomY + dropH;

    // Slightly widen the top corners outward so the shape matches the actual under-eye hollow
    const triangle: Pt[] = [
      [inner[0] - eyeSpanX * 0.06, lashBottomY],
      [outer[0] + eyeSpanX * 0.06, lashBottomY],
      [tipX, tipY],
    ];
    fillPoly(ctx, triangle, fill, 9);
  }
}

function paintBrowsAndLash(ctx: CanvasRenderingContext2D, lm: RawLandmark[], w: number, h: number, fill: string) {
  // ── Brow band — thick stroke follows brow curve exactly (avoids blob from fillPoly) ──
  for (const browIdx of [LANDMARK_INDICES.leftEyebrow, LANDMARK_INDICES.rightEyebrow] as const) {
    const raw = browIdx.map(i => p(lm, i, w, h));
    const pts = sortByX(raw);

    const minY = Math.min(...pts.map(([, y]) => y));
    const maxY = Math.max(...pts.map(([, y]) => y));
    const browH = maxY - minY;
    const faceWLocal = span(lm, LANDMARK_INDICES.faceOval, "x") * w;
    // Brow = ~5-8mm wide; on a 600px canvas ≈ 12-20px. Cap via face proportion.
    const strokeW = Math.max(Math.min(browH * 2.2, faceWLocal * 0.045), 8);

    ctx.save();
    ctx.filter = "blur(2px)";
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.strokeStyle = fill;
    ctx.lineWidth = strokeW;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    ctx.restore();
  }

  // ── Upper lash line — thin precise stroke, NOT proportional to full eye height ──
  const lashColor = "rgba(15,15,15,0.65)";
  const faceWBrow = span(lm, LANDMARK_INDICES.faceOval, "x") * w;
  const lashW = Math.max(2, faceWBrow * 0.012); // ~7px on a 600px face — realistic lash thickness
  for (const upperIdx of [LANDMARK_INDICES.leftEyeUpper, LANDMARK_INDICES.rightEyeUpper] as const) {
    const pts = sortByX(upperIdx.map(i => p(lm, i, w, h)));
    strokePath(ctx, pts, lashColor, lashW);
  }
}

function paintEyeLid(ctx: CanvasRenderingContext2D, lm: RawLandmark[], w: number, h: number, fill: string) {
  for (const [upper, lower] of [
    [LANDMARK_INDICES.leftEyeUpper,  LANDMARK_INDICES.leftEyeLower],
    [LANDMARK_INDICES.rightEyeUpper, LANDMARK_INDICES.rightEyeLower],
  ] as const) {
    const eyeH = span(lm, [...upper, ...lower], "y") * h;
    const upperPts = sortByX(upper.map(i => p(lm, i, w, h)));
    const lowerPts = sortByX(lower.map(i => p(lm, i, w, h)));

    // Lid fill (upper to lower)
    fillPoly(ctx, [...upperPts, ...[...lowerPts].reverse()], fill, 5);

    // Crease band above upper lid
    const crease = upperPts.map(([x, y]): Pt => [x, y - eyeH * 1.6]);
    fillPoly(ctx, [...crease, ...[...upperPts].reverse()], fill.replace(/[\d.]+\)$/, "0.25)"), 9);
  }
}

function paintLashLine(ctx: CanvasRenderingContext2D, lm: RawLandmark[], w: number, h: number) {
  const faceW = span(lm, LANDMARK_INDICES.faceOval, "x") * w;
  // Lash line = thin stripe hugging the upper lid. ~1.5% of face width ≈ 5-8px realistic.
  const lineW = Math.max(3, faceW * 0.015);
  for (const upper of [LANDMARK_INDICES.leftEyeUpper, LANDMARK_INDICES.rightEyeUpper] as const) {
    const pts = sortByX(upper.map(i => p(lm, i, w, h)));
    strokePath(ctx, pts, "rgba(15,15,15,0.80)", lineW);
  }
}

function paintBlush(ctx: CanvasRenderingContext2D, lm: RawLandmark[], w: number, h: number, fill: string) {
  const faceW = span(lm, LANDMARK_INDICES.faceOval, "x") * w;
  const rx = faceW * 0.14, ry = faceW * 0.085;

  // Cheek blush — apple of cheek sweeping toward temple
  const lCheek = p(lm, LANDMARK_INDICES.leftCheekbone[0], w, h);
  const lEyeOut = p(lm, LANDMARK_INDICES.leftEyeOuterCorner[0], w, h);
  fillEllipse(ctx, lCheek[0] * 0.68 + lEyeOut[0] * 0.32, lCheek[1] * 0.52 + lEyeOut[1] * 0.48 + ry * 0.4, rx, ry, fill, 13, -0.3);

  const rCheek = p(lm, LANDMARK_INDICES.rightCheekbone[0], w, h);
  const rEyeOut = p(lm, LANDMARK_INDICES.rightEyeOuterCorner[0], w, h);
  fillEllipse(ctx, rCheek[0] * 0.68 + rEyeOut[0] * 0.32, rCheek[1] * 0.52 + rEyeOut[1] * 0.48 + ry * 0.4, rx, ry, fill, 13, 0.3);

  // Nose bridge blush — subtle horizontal stripe connecting both cheeks across the bridge
  // (common technique: swipe blush across nose for a sun-kissed, editorial look)
  const nBridgeMid = p(lm, LANDMARK_INDICES.noseBridgeMid[0], w, h); // landmark 197
  const lInner = p(lm, LANDMARK_INDICES.leftEyeInnerCorner[0], w, h);
  const rInner = p(lm, LANDMARK_INDICES.rightEyeInnerCorner[0], w, h);
  const bridgeSpanX = Math.abs(rInner[0] - lInner[0]) * 0.75;
  fillEllipse(ctx, nBridgeMid[0], nBridgeMid[1], bridgeSpanX * 0.55, faceW * 0.025, fill.replace(/[\d.]+\)$/, "0.28)"), 7, 0);
}

function paintContour(ctx: CanvasRenderingContext2D, lm: RawLandmark[], w: number, h: number, fill: string) {
  const faceW = span(lm, LANDMARK_INDICES.faceOval, "x") * w;
  const sw = faceW * 0.08;
  const cheekDepth = faceW * 0.045;

  const lT = p(lm, LANDMARK_INDICES.leftTemple[0], w, h);
  const lC = p(lm, LANDMARK_INDICES.leftCheekbone[0], w, h);
  fillPoly(ctx, [[lT[0],lT[1]], [lT[0]+sw,lT[1]], [lC[0]+sw*.75,lC[1]+cheekDepth*.35], [lC[0],lC[1]+cheekDepth]], fill, 10);

  const rT = p(lm, LANDMARK_INDICES.rightTemple[0], w, h);
  const rC = p(lm, LANDMARK_INDICES.rightCheekbone[0], w, h);
  fillPoly(ctx, [[rT[0],rT[1]], [rT[0]-sw,rT[1]], [rC[0]-sw*.75,rC[1]+cheekDepth*.35], [rC[0],rC[1]+cheekDepth]], fill, 10);
}

function paintHighlighter(ctx: CanvasRenderingContext2D, lm: RawLandmark[], w: number, h: number, fill: string) {
  const faceW = span(lm, LANDMARK_INDICES.faceOval, "x") * w;
  const r = faceW * 0.052;

  // 1. Cheekbone tops — main highlight point
  const lCheek = p(lm, LANDMARK_INDICES.leftCheekbone[0], w, h);
  const rCheek = p(lm, LANDMARK_INDICES.rightCheekbone[0], w, h);
  fillEllipse(ctx, lCheek[0], lCheek[1] - r * 0.5, r * 1.8, r * 0.9, fill, 8);
  fillEllipse(ctx, rCheek[0], rCheek[1] - r * 0.5, r * 1.8, r * 0.9, fill, 8);

  // 2. Nose bridge slim strip — only from bridge top (6) to bridge mid (197), NOT down to tip
  const nBridgeTop = p(lm, LANDMARK_INDICES.noseBridgeTop[0], w, h); // landmark 6
  const nBridgeMid = p(lm, LANDMARK_INDICES.noseBridgeMid[0], w, h); // landmark 197
  const bridgeSpanH = nBridgeMid[1] - nBridgeTop[1];
  fillEllipse(ctx, nBridgeTop[0], nBridgeTop[1] + bridgeSpanH * 0.5, r * 0.28, bridgeSpanH * 0.55, fill, 3);

  // 3. Brow bone — BELOW the brow hair (between the brow bottom edge and the eye lid)
  const lBrowPts = LANDMARK_INDICES.leftEyebrow.map(i => p(lm, i, w, h));
  const rBrowPts = LANDMARK_INDICES.rightEyebrow.map(i => p(lm, i, w, h));
  const lBrow = centroid(lBrowPts);
  const rBrow = centroid(rBrowPts);
  const lBrowBottomY = Math.max(...lBrowPts.map(pt => pt[1])); // lowest (bottom) edge of brow
  const rBrowBottomY = Math.max(...rBrowPts.map(pt => pt[1]));
  const eyeVertSpan = span(lm, [...LANDMARK_INDICES.leftEyeUpper, ...LANDMARK_INDICES.leftEyeLower], "y") * h;
  fillEllipse(ctx, lBrow[0], lBrowBottomY + eyeVertSpan * 0.25, r * 1.2, r * 0.4, fill, 5);
  fillEllipse(ctx, rBrow[0], rBrowBottomY + eyeVertSpan * 0.25, r * 1.2, r * 0.4, fill, 5);

  // 4. Inner corner of each eye
  const lInner = p(lm, LANDMARK_INDICES.leftEyeInnerCorner[0], w, h);
  const rInner = p(lm, LANDMARK_INDICES.rightEyeInnerCorner[0], w, h);
  fillEllipse(ctx, lInner[0], lInner[1], r * 0.55, r * 0.55, fill, 4);
  fillEllipse(ctx, rInner[0], rInner[1], r * 0.55, r * 0.55, fill, 4);

  // 5. Philtrum — the skin ABOVE the upper lip, between nose bottom and lip bow center
  //    landmark 2 = nose bottom (under septum), landmark 0 = upper lip top center (cupid bow peak)
  const noseBot = p(lm, LANDMARK_INDICES.noseBottom[0], w, h); // landmark 2
  const lipBowCenter = p(lm, 0, w, h);                         // landmark 0 = top of upper lip
  const philtX = (noseBot[0] + lipBowCenter[0]) / 2;
  const philtY = (noseBot[1] + lipBowCenter[1]) / 2;
  fillEllipse(ctx, philtX, philtY, r * 0.65, r * 0.3, fill, 3);
}

function paintLips(ctx: CanvasRenderingContext2D, lm: RawLandmark[], w: number, h: number, fill: string) {
  const outer = LANDMARK_INDICES.lipsOuter.map(i => p(lm, i, w, h));
  fillPoly(ctx, outer, fill, 3);
  strokePath(ctx, outer, fill.replace(/[\d.]+\)$/, "0.75)"), 1.5, true);
}

function paintNose(ctx: CanvasRenderingContext2D, lm: RawLandmark[], w: number, h: number, fill: string) {
  const faceW = span(lm, LANDMARK_INDICES.faceOval, "x") * w;
  const sw = faceW * 0.024;
  const nTop = p(lm, LANDMARK_INDICES.noseBridgeTop[0], w, h);
  const nLeft = p(lm, LANDMARK_INDICES.noseLeftWing[0], w, h);
  const nRight = p(lm, LANDMARK_INDICES.noseRightWing[0], w, h);
  const nTip = p(lm, LANDMARK_INDICES.noseTip[0], w, h);
  const nH = nTip[1] - nTop[1];
  fillPoly(ctx, [[nTop[0]-sw*.5,nTop[1]], [nLeft[0],nLeft[1]], [nLeft[0]+sw*.9,nTip[1]], [nTop[0]+sw*.3,nTop[1]+nH*.2]], fill, 6);
  fillPoly(ctx, [[nTop[0]+sw*.5,nTop[1]], [nRight[0],nRight[1]], [nRight[0]-sw*.9,nTip[1]], [nTop[0]-sw*.3,nTop[1]+nH*.2]], fill, 6);
}

function paintTZone(ctx: CanvasRenderingContext2D, lm: RawLandmark[], w: number, h: number, fill: string) {
  const forehead = p(lm, LANDMARK_INDICES.foreheadTop[0], w, h);
  const lT = p(lm, LANDMARK_INDICES.leftTemple[0], w, h);
  const rT = p(lm, LANDMARK_INDICES.rightTemple[0], w, h);
  const nTip = p(lm, LANDMARK_INDICES.noseTip[0], w, h);
  const nTop = p(lm, LANDMARK_INDICES.noseBridgeTop[0], w, h);
  const faceW = span(lm, LANDMARK_INDICES.faceOval, "x") * w;
  const bW = faceW * 0.055;
  fillPoly(ctx, [[lT[0],lT[1]], [forehead[0],forehead[1]-faceW*.02], [rT[0],rT[1]], [rT[0],rT[1]+(nTip[1]-rT[1])*.15], [forehead[0],forehead[1]+faceW*.08], [lT[0],lT[1]+(nTip[1]-lT[1])*.15]], fill, 12);
  fillPoly(ctx, [[nTop[0]-bW,nTop[1]], [nTop[0]+bW,nTop[1]], [p(lm,LANDMARK_INDICES.noseRightWing[0],w,h)[0],nTip[1]], [nTip[0],nTip[1]], [p(lm,LANDMARK_INDICES.noseLeftWing[0],w,h)[0],nTip[1]]], fill, 7);
}

// ─── Motion guide export ──────────────────────────────────────────────────────

/** Returns motion arrow guides (positions 0-1 of canvas, direction vectors). */
export function getMotionGuides(lm: RawLandmark[], zone: ZoneKey, w: number, h: number): MotionArrow[] {
  const f = (idx: number): Pt => [lm[idx].x * w / w, lm[idx].y * h / h]; // normalized 0-1

  switch (zone) {
    case "brows": {
      const lBrowPts = LANDMARK_INDICES.leftEyebrow.map(i => f(i));
      const rBrowPts = LANDMARK_INDICES.rightEyebrow.map(i => f(i));
      const lC = centroid(lBrowPts);
      const rC = centroid(rBrowPts);
      return [
        { x: lC[0], y: lC[1] - 0.02, dx: 0.25, dy: -0.04, label: "tiny upward strokes" },
        { x: rC[0], y: rC[1] - 0.02, dx: 0.25, dy: -0.04 },
      ];
    }
    case "eye_lid": {
      const lInner = f(LANDMARK_INDICES.leftEyeInnerCorner[0]);
      const rInner = f(LANDMARK_INDICES.rightEyeInnerCorner[0]);
      return [
        { x: lInner[0] + 0.02, y: lInner[1], dx: 0.35, dy: -0.05, label: "blend outward" },
        { x: rInner[0] - 0.04, y: rInner[1], dx: -0.35, dy: -0.05 },
      ];
    }
    case "lash_line": {
      const lOuter = f(LANDMARK_INDICES.leftEyeOuterCorner[0]);
      const rOuter = f(LANDMARK_INDICES.rightEyeOuterCorner[0]);
      return [
        { x: lOuter[0] - 0.06, y: lOuter[1], dx: 0.4, dy: -0.15, label: "flick outward" },
        { x: rOuter[0] + 0.06, y: rOuter[1], dx: -0.4, dy: -0.15 },
      ];
    }
    case "blush": {
      const lCheek = f(LANDMARK_INDICES.leftCheekbone[0]);
      const rCheek = f(LANDMARK_INDICES.rightCheekbone[0]);
      return [
        { x: lCheek[0], y: lCheek[1], dx: 0.15, dy: -0.25, label: "sweep upward" },
        { x: rCheek[0], y: rCheek[1], dx: -0.15, dy: -0.25 },
      ];
    }
    case "contour": {
      const lCheek = f(LANDMARK_INDICES.leftCheekbone[0]);
      const rCheek = f(LANDMARK_INDICES.rightCheekbone[0]);
      return [
        { x: lCheek[0] - 0.02, y: lCheek[1] + 0.03, dx: 0.2, dy: -0.12, label: "follow cheekbone line" },
        { x: rCheek[0] + 0.02, y: rCheek[1] + 0.03, dx: -0.2, dy: -0.12 },
      ];
    }
    case "highlighter": {
      const lCheek = f(LANDMARK_INDICES.leftCheekbone[0]);
      const rCheek = f(LANDMARK_INDICES.rightCheekbone[0]);
      return [
        { x: lCheek[0], y: lCheek[1], dx: 0, dy: 0, label: "tap, don't blend" },
        { x: rCheek[0], y: rCheek[1], dx: 0, dy: 0 },
      ];
    }
    case "lips": {
      const cupid = f(13);
      return [
        { x: cupid[0] - 0.06, y: cupid[1] + 0.01, dx: -0.3, dy: 0, label: "fill inward → out" },
        { x: cupid[0] + 0.06, y: cupid[1] + 0.01, dx:  0.3, dy: 0 },
      ];
    }
    default:
      return [];
  }
}

// ─── Main entry ───────────────────────────────────────────────────────────────

export function paintZone(ctx: CanvasRenderingContext2D, lm: RawLandmark[], zone: ZoneKey, w: number, h: number): void {
  const { color } = ZONE_META[zone];
  ctx.save();
  switch (zone) {
    case "full_face":   paintFullFace(ctx, lm, w, h, color); break;
    case "under_eye":   paintUnderEye(ctx, lm, w, h, color); break;
    case "brows":       paintBrowsAndLash(ctx, lm, w, h, color); break;
    case "eye_lid":     paintEyeLid(ctx, lm, w, h, color); break;
    case "lash_line":   paintLashLine(ctx, lm, w, h); break;
    case "blush":       paintBlush(ctx, lm, w, h, color); break;
    case "contour":     paintContour(ctx, lm, w, h, color); break;
    case "highlighter": paintHighlighter(ctx, lm, w, h, color); break;
    case "lips":        paintLips(ctx, lm, w, h, color); break;
    case "nose":        paintNose(ctx, lm, w, h, color); break;
    case "t_zone":      paintTZone(ctx, lm, w, h, color); break;
  }
  ctx.restore();
}
