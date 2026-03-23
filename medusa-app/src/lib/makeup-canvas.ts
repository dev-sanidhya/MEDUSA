/**
 * makeup-canvas.ts
 *
 * Renders progressive makeup overlays onto the user's selfie using
 * ACTUAL face landmark coordinates returned by Claude Vision API (claude-sonnet-4-6).
 *
 * Coordinates are image fractions (0–1), so makeup is precisely placed
 * regardless of face position, zoom level or orientation.
 */

/* ─── Claude landmark schema ────────────────────────────────────── */
export interface FaceLandmarks {
  faceBox:    { x: number; y: number; w: number; h: number };
  leftEye:    { cx: number; cy: number; rx: number; ry: number };
  rightEye:   { cx: number; cy: number; rx: number; ry: number };
  leftBrow:   { cx: number; cy: number; rx: number; ry: number };
  rightBrow:  { cx: number; cy: number; rx: number; ry: number };
  nose:       { cx: number; cy: number };
  upperLip:   { cx: number; cy: number; rx: number; ry: number };
  lowerLip:   { cx: number; cy: number; rx: number; ry: number };
  leftCheek:  { cx: number; cy: number; rx: number; ry: number };
  rightCheek: { cx: number; cy: number; rx: number; ry: number };
  jawLeft:    { cx: number; cy: number };
  jawRight:   { cx: number; cy: number };
  chin:       { cx: number; cy: number };
}

/** Convert fraction-based landmarks to pixel coordinates for a given canvas size */
export interface PixelLandmarks {
  faceBox:    { x: number; y: number; w: number; h: number };
  leftEye:    { cx: number; cy: number; rx: number; ry: number };
  rightEye:   { cx: number; cy: number; rx: number; ry: number };
  leftBrow:   { cx: number; cy: number; rx: number; ry: number };
  rightBrow:  { cx: number; cy: number; rx: number; ry: number };
  nose:       { cx: number; cy: number };
  upperLip:   { cx: number; cy: number; rx: number; ry: number };
  lowerLip:   { cx: number; cy: number; rx: number; ry: number };
  leftCheek:  { cx: number; cy: number; rx: number; ry: number };
  rightCheek: { cx: number; cy: number; rx: number; ry: number };
  jawLeft:    { cx: number; cy: number };
  jawRight:   { cx: number; cy: number };
  chin:       { cx: number; cy: number };
  highlights: { cx: number; cy: number; rx: number; ry: number }[];
}

export function toPixelLandmarks(lm: FaceLandmarks, W: number, H: number): PixelLandmarks {
  const px = (v: number) => v * W;
  const py = (v: number) => v * H;
  const pr = (v: number, dim: number) => v * dim;

  // Highlight points derived from actual cheekbone & nose positions
  const leftHighlight  = {
    cx: lm.leftCheek.cx * W,
    cy: (lm.leftCheek.cy - lm.leftCheek.ry * 0.5) * H,
    rx: lm.leftCheek.rx * W * 0.45,
    ry: lm.leftCheek.ry * H * 0.35,
  };
  const rightHighlight = {
    cx: lm.rightCheek.cx * W,
    cy: (lm.rightCheek.cy - lm.rightCheek.ry * 0.5) * H,
    rx: lm.rightCheek.rx * W * 0.45,
    ry: lm.rightCheek.ry * H * 0.35,
  };
  // Nose bridge highlight between the eyes
  const noseBridgeY = (lm.leftEye.cy * 0.5 + lm.nose.cy * 0.5);
  const noseHighlight = {
    cx: lm.nose.cx * W,
    cy: noseBridgeY * H,
    rx: lm.leftEye.rx * W * 0.25,
    ry: (lm.nose.cy - lm.leftEye.cy) * H * 0.35,
  };

  return {
    faceBox:    { x: lm.faceBox.x * W, y: lm.faceBox.y * H, w: lm.faceBox.w * W,  h: lm.faceBox.h * H  },
    leftEye:    { cx: px(lm.leftEye.cx),   cy: py(lm.leftEye.cy),   rx: pr(lm.leftEye.rx, W),   ry: pr(lm.leftEye.ry, H)   },
    rightEye:   { cx: px(lm.rightEye.cx),  cy: py(lm.rightEye.cy),  rx: pr(lm.rightEye.rx, W),  ry: pr(lm.rightEye.ry, H)  },
    leftBrow:   { cx: px(lm.leftBrow.cx),  cy: py(lm.leftBrow.cy),  rx: pr(lm.leftBrow.rx, W),  ry: pr(lm.leftBrow.ry, H)  },
    rightBrow:  { cx: px(lm.rightBrow.cx), cy: py(lm.rightBrow.cy), rx: pr(lm.rightBrow.rx, W), ry: pr(lm.rightBrow.ry, H) },
    nose:       { cx: px(lm.nose.cx),       cy: py(lm.nose.cy)       },
    upperLip:   { cx: px(lm.upperLip.cx),  cy: py(lm.upperLip.cy),  rx: pr(lm.upperLip.rx, W),  ry: pr(lm.upperLip.ry, H)  },
    lowerLip:   { cx: px(lm.lowerLip.cx),  cy: py(lm.lowerLip.cy),  rx: pr(lm.lowerLip.rx, W),  ry: pr(lm.lowerLip.ry, H)  },
    leftCheek:  { cx: px(lm.leftCheek.cx),  cy: py(lm.leftCheek.cy),  rx: pr(lm.leftCheek.rx, W),  ry: pr(lm.leftCheek.ry, H)  },
    rightCheek: { cx: px(lm.rightCheek.cx), cy: py(lm.rightCheek.cy), rx: pr(lm.rightCheek.rx, W), ry: pr(lm.rightCheek.ry, H) },
    jawLeft:    { cx: px(lm.jawLeft.cx),   cy: py(lm.jawLeft.cy)   },
    jawRight:   { cx: px(lm.jawRight.cx),  cy: py(lm.jawRight.cy)  },
    chin:       { cx: px(lm.chin.cx),       cy: py(lm.chin.cy)       },
    highlights: [leftHighlight, rightHighlight, noseHighlight],
  };
}

/**
 * Fallback: estimate face regions proportionally when Claude landmarks aren't available.
 * Used only during loading / static fallback mode.
 */
export function estimateLandmarks(imgW: number, imgH: number): FaceLandmarks {
  const isPortrait = imgH >= imgW;
  const faceW = isPortrait ? 0.62 : 0.44;
  const faceH = isPortrait ? Math.min(0.68, faceW * 1.48 * (imgW / imgH)) : 0.75;
  const faceX = (1 - faceW) / 2;
  const faceY = isPortrait ? 0.06 : 0.08;

  const eyeY  = faceY + faceH * 0.36;
  const eyeRx = faceW * 0.120;
  const eyeRy = faceH * 0.046;

  return {
    faceBox:    { x: faceX, y: faceY, w: faceW, h: faceH },
    leftEye:    { cx: faceX + faceW * 0.30, cy: eyeY, rx: eyeRx, ry: eyeRy },
    rightEye:   { cx: faceX + faceW * 0.70, cy: eyeY, rx: eyeRx, ry: eyeRy },
    leftBrow:   { cx: faceX + faceW * 0.29, cy: faceY + faceH * 0.265, rx: faceW * 0.135, ry: faceH * 0.022 },
    rightBrow:  { cx: faceX + faceW * 0.71, cy: faceY + faceH * 0.265, rx: faceW * 0.135, ry: faceH * 0.022 },
    nose:       { cx: faceX + faceW * 0.50, cy: faceY + faceH * 0.530 },
    upperLip:   { cx: faceX + faceW * 0.50, cy: faceY + faceH * 0.730, rx: faceW * 0.135, ry: faceH * 0.030 },
    lowerLip:   { cx: faceX + faceW * 0.50, cy: faceY + faceH * 0.762, rx: faceW * 0.135, ry: faceH * 0.038 },
    leftCheek:  { cx: faceX + faceW * 0.17, cy: faceY + faceH * 0.595, rx: faceW * 0.14, ry: faceH * 0.12 },
    rightCheek: { cx: faceX + faceW * 0.83, cy: faceY + faceH * 0.595, rx: faceW * 0.14, ry: faceH * 0.12 },
    jawLeft:    { cx: faceX + faceW * 0.10, cy: faceY + faceH * 0.82 },
    jawRight:   { cx: faceX + faceW * 0.90, cy: faceY + faceH * 0.82 },
    chin:       { cx: faceX + faceW * 0.50, cy: faceY + faceH * 0.94 },
  };
}

/* ─── Color palettes per look ───────────────────────────────────── */
export const LOOK_PALETTES: Record<string, {
  foundation: string; eyeshadow: string; eyeliner: string;
  blush: string; highlight: string; upperLip: string; lowerLip: string;
  brow: string; contour: string;
}> = {
  'no-makeup': {
    foundation: 'rgba(210,170,140,0.28)',
    eyeshadow:  'rgba(175,135,108,0.45)',
    eyeliner:   'rgba(48,28,18,0.70)',
    blush:      'rgba(218,132,112,0.52)',
    highlight:  'rgba(255,242,222,0.70)',
    upperLip:   'rgba(195,118,98,0.72)',
    lowerLip:   'rgba(195,118,98,0.78)',
    brow:       'rgba(78,50,34,0.68)',
    contour:    'rgba(148,100,76,0.32)',
  },
  'smoky-eye': {
    foundation: 'rgba(200,162,130,0.22)',
    eyeshadow:  'rgba(22,14,10,0.88)',
    eyeliner:   'rgba(6,3,3,0.97)',
    blush:      'rgba(165,112,96,0.30)',
    highlight:  'rgba(248,232,208,0.45)',
    upperLip:   'rgba(148,88,72,0.62)',
    lowerLip:   'rgba(148,88,72,0.70)',
    brow:       'rgba(32,18,10,0.82)',
    contour:    'rgba(90,62,48,0.38)',
  },
  'glass-skin': {
    foundation: 'rgba(255,238,220,0.35)',
    eyeshadow:  'rgba(192,170,155,0.42)',
    eyeliner:   'rgba(52,32,25,0.70)',
    blush:      'rgba(238,165,162,0.58)',
    highlight:  'rgba(255,252,232,0.88)',
    upperLip:   'rgba(220,155,148,0.65)',
    lowerLip:   'rgba(220,155,148,0.72)',
    brow:       'rgba(85,60,46,0.62)',
    contour:    'rgba(172,135,115,0.22)',
  },
  'bold-lip': {
    foundation: 'rgba(212,175,145,0.25)',
    eyeshadow:  'rgba(150,112,92,0.35)',
    eyeliner:   'rgba(35,20,13,0.90)',
    blush:      'rgba(192,122,108,0.38)',
    highlight:  'rgba(255,240,218,0.55)',
    upperLip:   'rgba(175,25,25,0.92)',
    lowerLip:   'rgba(155,20,20,0.96)',
    brow:       'rgba(60,38,26,0.72)',
    contour:    'rgba(138,92,72,0.28)',
  },
  'editorial': {
    foundation: 'rgba(238,208,185,0.38)',
    eyeshadow:  'rgba(92,52,155,0.82)',
    eyeliner:   'rgba(6,3,3,0.98)',
    blush:      'rgba(172,115,98,0.40)',
    highlight:  'rgba(255,248,228,0.75)',
    upperLip:   'rgba(72,32,122,0.88)',
    lowerLip:   'rgba(60,28,108,0.94)',
    brow:       'rgba(22,13,8,0.88)',
    contour:    'rgba(92,68,52,0.42)',
  },
};

export type MakeupPalette = (typeof LOOK_PALETTES)[string];

/* ─── Canvas drawing helpers ────────────────────────────────────── */
function ell(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number) {
  ctx.beginPath();
  ctx.ellipse(cx, cy, Math.max(rx, 1), Math.max(ry, 1), 0, 0, Math.PI * 2);
}

/**
 * Draw the upper half of an ellipse (the arc from left → top → right).
 * In canvas coords (y-down), clockwise from Math.PI (left) to 0 (right)
 * passes through 3π/2 which is the TOP — so this draws the upper arc correctly.
 */
function halfEllipseUpper(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number) {
  ctx.beginPath();
  ctx.ellipse(cx, cy, Math.max(rx, 1), Math.max(ry, 1), 0, Math.PI, 0);
}

/**
 * Draw the lower half of an ellipse (the arc from left → bottom → right).
 * Counterclockwise from Math.PI (left) to 0 (right) passes through π/2 (bottom).
 */
function halfEllipseLower(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number) {
  ctx.beginPath();
  ctx.ellipse(cx, cy, Math.max(rx, 1), Math.max(ry, 1), 0, Math.PI, 0, true);
}

/* ─── Core makeup layer draw function ───────────────────────────── */
export function drawMakeupLayer(
  ctx: CanvasRenderingContext2D,
  zone: string,
  palette: MakeupPalette,
  lm: PixelLandmarks,
) {
  ctx.save();

  // Scale-relative blur: based on face width so it looks consistent across photo sizes
  const faceBlur   = Math.max(lm.faceBox.w * 0.030, 6);
  const skinBlur   = Math.max(lm.faceBox.w * 0.055, 10);

  switch (zone) {

    /* ─ Foundation / primer / skin prep ─ */
    case 'full':
    case 'skin': {
      ctx.globalCompositeOperation = 'multiply';
      ctx.filter = `blur(${skinBlur}px)`;
      const faceCx = lm.faceBox.x + lm.faceBox.w / 2;
      const faceCy = lm.faceBox.y + lm.faceBox.h * 0.42;
      const grad = ctx.createRadialGradient(
        faceCx, faceCy, 0,
        faceCx, faceCy, lm.faceBox.w * 0.68,
      );
      grad.addColorStop(0,   palette.foundation);
      grad.addColorStop(0.7, palette.foundation);
      grad.addColorStop(1,   'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(
        lm.faceBox.x - 30,
        lm.faceBox.y - 20,
        lm.faceBox.w + 60,
        lm.faceBox.h + 40,
      );
      break;
    }

    /* ─ Eyeshadow + eyeliner ─ */
    case 'eyes':
    case 'lids': {
      [lm.leftEye, lm.rightEye].forEach(eye => {
        const eyeBlurShadow = Math.max(eye.rx * 0.22, 2);
        const eyeBlurLiner  = Math.max(eye.rx * 0.06, 1);

        /* Eyeshadow — soft wash over the upper eyelid area, above the iris */
        ctx.globalCompositeOperation = 'multiply';
        ctx.filter = `blur(${eyeBlurShadow}px)`;
        // Centre the shadow ellipse above the iris (at the upper eyelid), not on it
        halfEllipseUpper(
          ctx,
          eye.cx,
          eye.cy - eye.ry * 0.35,   // shift centre up so shadow sits on upper lid
          eye.rx * 1.15,
          eye.ry * 2.0,              // tall enough to cover lid to brow bone
        );
        ctx.fillStyle = palette.eyeshadow;
        ctx.fill();

        /* Upper eyeliner — sharp arc along the actual upper lash line */
        ctx.globalCompositeOperation = 'multiply';
        ctx.filter = `blur(${eyeBlurLiner}px)`;
        ctx.beginPath();
        // The upper lash line sits at the TOP of the eye ellipse (cy - ry).
        // We draw the upper arc of a small ellipse centred at (cy - ry*0.55)
        // so its peak falls right on the lash line at approximately cy - ry.
        ctx.ellipse(
          eye.cx,
          eye.cy - eye.ry * 0.55,   // centre placed in upper lid zone
          eye.rx * 0.90,
          eye.ry * 0.50,
          0,
          Math.PI, 0,               // upper arc only
        );
        ctx.strokeStyle = palette.eyeliner;
        ctx.lineWidth   = Math.max(eye.ry * 0.45, 1.2);
        ctx.stroke();

        /* Lower lash smudge — soft arc just beneath the lower lash line */
        ctx.filter = `blur(${eyeBlurShadow * 0.7}px)`;
        ctx.beginPath();
        // Lower lash line is at cy + ry. Centre at cy + ry*0.72 so arc peak ≈ cy+ry.
        ctx.ellipse(
          eye.cx,
          eye.cy + eye.ry * 0.72,
          eye.rx * 0.78,
          eye.ry * 0.30,
          0,
          0, Math.PI,               // lower arc only (counterclockwise=false → clockwise from 0→π = lower arc)
        );
        ctx.strokeStyle = palette.eyeliner.replace(/[\d.]+\)$/, m => String(Math.max(parseFloat(m) * 0.45, 0.05)) + ')');
        ctx.lineWidth   = Math.max(eye.ry * 0.28, 1);
        ctx.stroke();
      });
      break;
    }

    /* ─ Brows ─ */
    case 'brows': {
      ctx.globalCompositeOperation = 'multiply';
      [lm.leftBrow, lm.rightBrow].forEach(brow => {
        const browBlur = Math.max(brow.rx * 0.10, 1.5);
        ctx.filter = `blur(${browBlur}px)`;
        // Fill the brow: draw a solid filled arch
        // Upper half fills from the arch downward
        halfEllipseUpper(ctx, brow.cx, brow.cy + brow.ry * 0.3, brow.rx, brow.ry * 1.6);
        ctx.fillStyle = palette.brow;
        ctx.fill();
      });
      break;
    }

    /* ─ Blush + cheekbone highlight ─ */
    case 'cheeks': {
      /* Blush — soft oval centred on cheek apple */
      ctx.globalCompositeOperation = 'multiply';
      [lm.leftCheek, lm.rightCheek].forEach(cheek => {
        const blushBlur = Math.max(cheek.rx * 0.28, faceBlur);
        ctx.filter = `blur(${blushBlur}px)`;
        ell(ctx, cheek.cx, cheek.cy, cheek.rx, cheek.ry);
        ctx.fillStyle = palette.blush;
        ctx.fill();
      });

      /* Cheekbone highlights — above the blush, using screen blend */
      ctx.globalCompositeOperation = 'screen';
      lm.highlights.forEach(pt => {
        const hlBlur = Math.max(pt.rx * 0.35, faceBlur * 0.6);
        ctx.filter = `blur(${hlBlur}px)`;
        ell(ctx, pt.cx, pt.cy, pt.rx, pt.ry);
        ctx.fillStyle = palette.highlight;
        ctx.fill();
      });
      break;
    }

    /* ─ Lips ─ */
    case 'lips': {
      ctx.globalCompositeOperation = 'multiply';

      /* Upper lip */
      const lipBlurUpper = Math.max(lm.upperLip.rx * 0.06, 1);
      ctx.filter = `blur(${lipBlurUpper}px)`;
      // Full ellipse at upper lip position; ry amplified so it reads clearly
      ell(ctx, lm.upperLip.cx, lm.upperLip.cy, lm.upperLip.rx, Math.max(lm.upperLip.ry * 1.4, lm.faceBox.h * 0.012));
      ctx.fillStyle = palette.upperLip;
      ctx.fill();

      /* Lower lip — slightly fuller */
      const lipBlurLower = Math.max(lm.lowerLip.rx * 0.05, 1);
      ctx.filter = `blur(${lipBlurLower}px)`;
      ell(ctx, lm.lowerLip.cx, lm.lowerLip.cy, lm.lowerLip.rx, Math.max(lm.lowerLip.ry * 1.5, lm.faceBox.h * 0.015));
      ctx.fillStyle = palette.lowerLip;
      ctx.fill();
      break;
    }

    /* ─ Contour / jaw sculpt ─ */
    case 'jaw': {
      ctx.globalCompositeOperation = 'multiply';

      /* Under-cheekbone shadow — narrow oval just below each cheek apple */
      [lm.leftCheek, lm.rightCheek].forEach(cheek => {
        const shadowBlur = Math.max(cheek.rx * 0.35, faceBlur);
        ctx.filter = `blur(${shadowBlur}px)`;
        ell(
          ctx,
          cheek.cx,
          cheek.cy + cheek.ry * 0.65,
          cheek.rx * 0.68,
          cheek.ry * 0.35,
        );
        ctx.fillStyle = palette.contour;
        ctx.fill();
      });

      /* Jaw shadow — curved stroke from jawLeft to chin to jawRight */
      const jawBlur = Math.max(lm.faceBox.w * 0.035, faceBlur);
      ctx.filter = `blur(${jawBlur}px)`;
      ctx.beginPath();
      ctx.moveTo(lm.jawLeft.cx, lm.jawLeft.cy);
      ctx.quadraticCurveTo(
        lm.chin.cx,
        lm.chin.cy + lm.faceBox.h * 0.025,
        lm.jawRight.cx,
        lm.jawRight.cy,
      );
      ctx.strokeStyle = palette.contour;
      ctx.lineWidth   = Math.max(lm.faceBox.h * 0.048, 8);
      ctx.stroke();
      break;
    }

    default:
      break;
  }

  ctx.restore();
}

/* ─── Main render function ──────────────────────────────────────── */
export function renderMakeupOnCanvas(
  canvas: HTMLCanvasElement,
  imageSrc: string,
  lookId: string,
  zones: string[],
  landmarks?: FaceLandmarks | null,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('no canvas context')); return; }

      canvas.width  = img.naturalWidth;
      canvas.height = img.naturalHeight;

      // 1. Draw base photo
      ctx.drawImage(img, 0, 0);

      // 2. Resolve landmarks — use Claude's precise coords or fall back to estimate
      const lmFrac   = landmarks ?? estimateLandmarks(img.naturalWidth, img.naturalHeight);
      const lmPixels = toPixelLandmarks(lmFrac, img.naturalWidth, img.naturalHeight);
      const palette  = LOOK_PALETTES[lookId] ?? LOOK_PALETTES['no-makeup'];

      // 3. Draw each accumulated makeup layer in order
      zones.forEach(zone => drawMakeupLayer(ctx, zone, palette, lmPixels));

      resolve();
    };
    img.onerror = reject;
    img.src = imageSrc;
  });
}
