'use client';

import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

/* ─── Warm cream palette — matches site tokens ──────────── */
const MASSES = [
  // color,      x%,  y%,  r px, phase, maxOp, blur px, driftX, driftY
  { c: '#C17060', x: 20, y: 35, r: 480, ph: 0,   op: 0.38, blur: 120, dx: 4,  dy: 2   },  // terracotta
  { c: '#D4906A', x: 72, y: 22, r: 400, ph: 1.5, op: 0.30, blur: 100, dx: -3, dy: 2.5 },  // blush
  { c: '#9B6888', x: 50, y: 78, r: 440, ph: 2.8, op: 0.28, blur: 110, dx: 2,  dy: -3  },  // mauve
  { c: '#C8A478', x: 85, y: 62, r: 340, ph: 0.7, op: 0.26, blur: 90,  dx: -2, dy: 2   },  // champagne
  { c: '#A85048', x: 12, y: 68, r: 300, ph: 2.1, op: 0.24, blur: 80,  dx: 3,  dy: -2  },  // deep rose
  { c: '#E8B898', x: 55, y: 15, r: 260, ph: 3.4, op: 0.22, blur: 70,  dx: -2, dy: 3   },  // nude
];

/* ─── Fine detail accents ─────────────────────────────────── */
const ACCENTS = [
  { c: '#B5604A', x: 28, y: 28, r: 80,  ph: 1.0, blur: 28 },
  { c: '#C87868', x: 68, y: 60, r: 100, ph: 2.3, blur: 32 },
  { c: '#8B4858', x: 18, y: 72, r: 70,  ph: 0.5, blur: 24 },
  { c: '#D49878', x: 80, y: 28, r: 90,  ph: 3.1, blur: 30 },
];

/* ─── Brush-stroke SVG paths ──────────────────────────────── */
const STROKES = [
  { d: 'M 5 48 Q 28 38 52 50 Q 72 60 95 46',  delay: 0,  dur: 150 },
  { d: 'M 8 68 Q 30 55 55 65 Q 75 73 94 62',  delay: 35, dur: 130 },
  { d: 'M 12 28 Q 38 18 62 30 Q 80 38 92 24', delay: 65, dur: 140 },
];

export function MakeupComposition() {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 50], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <div style={{ width, height, background: '#FAF6F1', position: 'relative', overflow: 'hidden' }}>

      {/* ── Soft colour masses ─────────────────────────────── */}
      {MASSES.map((m, i) => {
        const cycle   = (frame / durationInFrames) * Math.PI * 2;
        const breathe = 1 + 0.08 * Math.sin(cycle + m.ph);
        const moveX   = m.dx * Math.sin(cycle + m.ph);
        const moveY   = m.dy * Math.cos(cycle + m.ph);
        const opacity = fadeIn * m.op * (0.88 + 0.12 * Math.sin(cycle + m.ph + 0.5));

        return (
          <div key={`m${i}`} style={{
            position: 'absolute',
            left: `${m.x + moveX}%`,
            top:  `${m.y + moveY}%`,
            width:  m.r * 2,
            height: m.r * 2,
            borderRadius: '50%',
            background: m.c,
            opacity,
            filter: `blur(${m.blur}px)`,
            transform: `translate(-50%,-50%) scale(${breathe})`,
            mixBlendMode: 'multiply',
          }} />
        );
      })}

      {/* ── Accent sparks ──────────────────────────────────── */}
      {ACCENTS.map((a, i) => {
        const cycle   = (frame / durationInFrames) * Math.PI * 2;
        const breathe = 1 + 0.22 * Math.sin(cycle * 1.7 + a.ph);
        const opacity = fadeIn * 0.28 * (0.7 + 0.3 * Math.sin(cycle * 1.4 + a.ph));

        return (
          <div key={`a${i}`} style={{
            position: 'absolute',
            left: `${a.x}%`,
            top:  `${a.y}%`,
            width:  a.r * 2,
            height: a.r * 2,
            borderRadius: '50%',
            background: a.c,
            opacity,
            filter: `blur(${a.blur}px)`,
            transform: `translate(-50%,-50%) scale(${breathe})`,
            mixBlendMode: 'multiply',
          }} />
        );
      })}

      {/* ── Animated brush strokes ─────────────────────────── */}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        {STROKES.map((s, i) => {
          const progress = interpolate(frame, [s.delay, s.delay + s.dur], [0, 1],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          return (
            <path key={`s${i}`}
              d={s.d}
              fill="none"
              stroke="#B5604A"
              strokeWidth="0.35"
              strokeLinecap="round"
              opacity={0.14 * fadeIn * progress}
              strokeDasharray="200"
              strokeDashoffset={200 * (1 - progress)}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </svg>

      {/* ── Vignette — subtle edge darkening ───────────────── */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 85% 75% at 50% 50%, transparent 40%, rgba(181,96,74,0.06) 100%)',
        pointerEvents: 'none',
      }} />

      {/* ── Grain ───────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.03,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundSize: '200px 200px',
      }} />
    </div>
  );
}
