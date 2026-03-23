'use client';

/**
 * TechniqueAnimation
 * A zone-specific animated SVG that shows the exact brush motion / hand movement
 * required for each makeup step. Pure CSS + SVG — no external deps.
 *
 * Face canvas viewBox: 220 × 280
 * Key landmarks (approx):
 *   Face ellipse:  cx=110  cy=148  rx=72  ry=90
 *   Left eye:       cx=81   cy=114
 *   Right eye:      cx=139  cy=114
 *   Brows:          y≈98
 *   Left cheek:     cx=60   cy=160
 *   Right cheek:    cx=160  cy=160
 *   Lips:           cx=110  cy=193
 *   Jaw:            y≈218
 */

type Zone = 'full' | 'skin' | 'eyes' | 'lids' | 'brows' | 'cheeks' | 'lips' | 'jaw';

const ZONE_COLORS: Record<Zone, string> = {
  full:   '#D4A48C',
  skin:   '#D4A48C',
  eyes:   '#6B4535',
  lids:   '#6B4535',
  brows:  '#5A3825',
  cheeks: '#D4806A',
  lips:   '#C14A3A',
  jaw:    '#B8906A',
};

/* Animated path component */
function BrushPath({ d, color, strokeW = 3, delay = 0, dur = 1.8, blur = 0 }: {
  d: string; color: string; strokeW?: number; delay?: number; dur?: number; blur?: number;
}) {
  const id = `bp_${Math.random().toString(36).slice(2, 7)}`;
  return (
    <>
      <defs>
        <filter id={id}><feGaussianBlur stdDeviation={blur} /></filter>
      </defs>
      <path
        d={d}
        stroke={color}
        strokeWidth={strokeW}
        strokeLinecap="round"
        fill="none"
        filter={blur > 0 ? `url(#${id})` : undefined}
        style={{
          strokeDasharray: 300,
          strokeDashoffset: 300,
          animation: `drawStroke ${dur}s cubic-bezier(.4,0,.2,1) ${delay}s infinite`,
        }}
      />
    </>
  );
}

/* Animated fill ellipse */
function BlushEllipse({ cx, cy, rx, ry, color, delay = 0, dur = 2.2 }: {
  cx: number; cy: number; rx: number; ry: number; color: string; delay?: number; dur?: number;
}) {
  return (
    <ellipse
      cx={cx} cy={cy} rx={rx} ry={ry}
      fill={color}
      style={{
        opacity: 0,
        animation: `fadeBlush ${dur}s ease ${delay}s infinite`,
      }}
    />
  );
}

/* Foundation dots */
function FoundationDot({ cx, cy, r, color, delay }: {
  cx: number; cy: number; r: number; color: string; delay: number;
}) {
  return (
    <circle
      cx={cx} cy={cy} r={r}
      fill={color}
      style={{ opacity: 0, animation: `popDot 2.4s ease ${delay}s infinite` }}
    />
  );
}

/* ─── Zone-specific animation layers ─── */

function FoundationLayer({ color }: { color: string }) {
  const dots = [
    { cx: 110, cy: 140, r: 28, d: 0.0 },
    { cx: 82,  cy: 120, r: 20, d: 0.2 },
    { cx: 138, cy: 120, r: 20, d: 0.3 },
    { cx: 74,  cy: 155, r: 18, d: 0.4 },
    { cx: 146, cy: 155, r: 18, d: 0.5 },
    { cx: 110, cy: 172, r: 22, d: 0.6 },
    { cx: 96,  cy: 102, r: 14, d: 0.7 },
    { cx: 124, cy: 102, r: 14, d: 0.8 },
  ];
  return (
    <g style={{ filter: 'blur(10px)', mixBlendMode: 'multiply' }}>
      {dots.map((d, i) => (
        <FoundationDot key={i} cx={d.cx} cy={d.cy} r={d.r} color={color} delay={d.d} />
      ))}
    </g>
  );
}

function EyeshadowLayer({ color }: { color: string }) {
  return (
    <g>
      {/* Left lid shadow */}
      <ellipse cx="81" cy="110" rx="22" ry="14"
        fill={color} style={{ filter: 'blur(5px)', opacity: 0, animation: 'fadeBlush 2s ease 0s infinite' }} />
      {/* Right lid shadow */}
      <ellipse cx="139" cy="110" rx="22" ry="14"
        fill={color} style={{ filter: 'blur(5px)', opacity: 0, animation: 'fadeBlush 2s ease 0.3s infinite' }} />
      {/* Brush sweep L */}
      <BrushPath d="M 60 114 Q 81 104 102 114" color={color} strokeW={10} delay={0} dur={2} blur={4} />
      {/* Brush sweep R */}
      <BrushPath d="M 118 114 Q 139 104 160 114" color={color} strokeW={10} delay={0.4} dur={2} blur={4} />
      {/* Eyeliner L */}
      <BrushPath d="M 61 116 Q 81 118 101 116" color="rgba(30,15,10,0.85)" strokeW={2.5} delay={1.2} dur={2} />
      {/* Eyeliner R */}
      <BrushPath d="M 119 116 Q 139 118 159 116" color="rgba(30,15,10,0.85)" strokeW={2.5} delay={1.5} dur={2} />
    </g>
  );
}

function BrowLayer({ color }: { color: string }) {
  const strokes = [
    { d: 'M 65 98 L 67 93', d2: 0 },
    { d: 'M 70 96 L 72 91', d2: 0.15 },
    { d: 'M 75 94 L 77 89', d2: 0.3 },
    { d: 'M 80 93 L 83 88', d2: 0.45 },
    { d: 'M 86 93 L 89 89', d2: 0.6 },
    { d: 'M 124 93 L 127 88', d2: 0.0 },
    { d: 'M 130 94 L 133 89', d2: 0.15 },
    { d: 'M 136 96 L 139 91', d2: 0.3 },
    { d: 'M 142 97 L 144 93', d2: 0.45 },
    { d: 'M 148 99 L 149 95', d2: 0.6 },
  ];
  return (
    <g>
      {strokes.map((s, i) => (
        <BrushPath key={i} d={s.d} color={color} strokeW={3} delay={s.d2} dur={2.4} />
      ))}
    </g>
  );
}

function BlushLayer({ color }: { color: string }) {
  const circles = [
    { cx: 62, cy: 158, rx: 26, ry: 18, delay: 0.0 },
    { cx: 58, cy: 162, rx: 22, ry: 16, delay: 0.2 },
    { cx: 55, cy: 155, rx: 18, ry: 13, delay: 0.4 },
    { cx: 158, cy: 158, rx: 26, ry: 18, delay: 0.1 },
    { cx: 162, cy: 162, rx: 22, ry: 16, delay: 0.3 },
    { cx: 165, cy: 155, rx: 18, ry: 13, delay: 0.5 },
  ];
  return (
    <g style={{ mixBlendMode: 'multiply' }}>
      {circles.map((c, i) => (
        <BlushEllipse key={i} cx={c.cx} cy={c.cy} rx={c.rx} ry={c.ry}
          color={color} delay={c.delay} dur={2.4} />
      ))}
      {/* Swirl brush paths */}
      <BrushPath d="M 48 158 Q 60 148 72 158 Q 60 168 48 158" color={color} strokeW={8} delay={0} dur={2} blur={5} />
      <BrushPath d="M 148 158 Q 160 148 172 158 Q 160 168 148 158" color={color} strokeW={8} delay={0.3} dur={2} blur={5} />
      {/* Highlight on nose bridge */}
      <ellipse cx="110" cy="128" rx="6" ry="12"
        fill="rgba(255,242,210,0.65)" style={{ filter: 'blur(4px)', opacity: 0, animation: 'fadeBlush 2.2s ease 1s infinite' }} />
    </g>
  );
}

function LipsLayer({ color }: { color: string }) {
  return (
    <g>
      {/* Upper lip fill */}
      <BlushEllipse cx={110} cy={190} rx={26} ry={9} color={color} delay={0} dur={2.2} />
      {/* Lower lip fill — fuller */}
      <BlushEllipse cx={110} cy={198} rx={24} ry={11} color={color} delay={0.3} dur={2.2} />
      {/* Brush strokes */}
      <BrushPath d="M 86 190 Q 110 185 134 190" color={color} strokeW={10} delay={0} dur={1.8} blur={3} />
      <BrushPath d="M 87 195 Q 110 204 133 195" color={color} strokeW={12} delay={0.5} dur={1.8} blur={3} />
      {/* Liner outline */}
      <BrushPath d="M 94 190 Q 110 183 126 190" color="rgba(100,25,25,0.7)" strokeW={2} delay={1.4} dur={1.8} />
      <BrushPath d="M 94 190 Q 110 205 126 190" color="rgba(100,25,25,0.7)" strokeW={2} delay={1.6} dur={1.8} />
    </g>
  );
}

function ContourLayer({ color }: { color: string }) {
  return (
    <g style={{ mixBlendMode: 'multiply' }}>
      {/* Under-cheekbone shadow L */}
      <BlushEllipse cx={62} cy={170} rx={22} ry={10} color={color} delay={0} dur={2.4} />
      {/* Under-cheekbone shadow R */}
      <BlushEllipse cx={158} cy={170} rx={22} ry={10} color={color} delay={0.3} dur={2.4} />
      {/* Jaw shadow */}
      <BlushEllipse cx={110} cy={215} rx={55} ry={12} color={color} delay={0.6} dur={2.4} />
      {/* Brush strokes */}
      <BrushPath d="M 44 155 Q 58 175 72 162" color={color} strokeW={14} delay={0} dur={2} blur={6} />
      <BrushPath d="M 176 155 Q 162 175 148 162" color={color} strokeW={14} delay={0.4} dur={2} blur={6} />
    </g>
  );
}

/* ─── Main component ─── */
export default function TechniqueAnimation({ zone, label }: { zone: string; label?: string }) {
  const z = (zone as Zone) || 'full';
  const color = ZONE_COLORS[z] || '#C17060';
  const rgba  = `${color}99`; // semi-transparent

  return (
    <div style={{ width: '100%', aspectRatio: '11 / 13', position: 'relative', userSelect: 'none' }}>
      <style>{`
        @keyframes drawStroke {
          0%   { stroke-dashoffset: 300; opacity: 0; }
          10%  { opacity: 1; }
          80%  { stroke-dashoffset: 0; opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 0; }
        }
        @keyframes fadeBlush {
          0%   { opacity: 0; }
          20%  { opacity: 0; }
          55%  { opacity: 1; }
          85%  { opacity: 0.85; }
          100% { opacity: 0; }
        }
        @keyframes popDot {
          0%   { opacity: 0; transform: scale(0.4); }
          30%  { opacity: 0.9; transform: scale(1); }
          75%  { opacity: 0.7; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.2); }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.35; }
        }
      `}</style>

      <svg
        viewBox="0 0 220 280"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: '100%' }}
      >
        {/* ── Background glow for active zone ── */}
        <defs>
          <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={color} stopOpacity="0.10" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="220" height="280" fill="url(#bgGlow)"
          style={{ animation: 'pulseGlow 3s ease-in-out infinite' }} />

        {/* ── Face silhouette ── */}
        {/* Neck */}
        <path d="M 96 234 L 92 260 M 124 234 L 128 260"
          stroke="var(--line)" strokeWidth="1" strokeLinecap="round" fill="none" />
        {/* Face outline */}
        <ellipse cx="110" cy="148" rx="72" ry="90"
          fill="var(--bg-surface)" stroke="var(--line)" strokeWidth="1.2" />

        {/* ── Brows (always visible, dim) ── */}
        <path d="M 65 98 Q 80 92 95 95" stroke="var(--line)" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6" />
        <path d="M 125 95 Q 140 92 155 98" stroke="var(--line)" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6" />

        {/* ── Eye outlines ── */}
        <path d="M 62 114 Q 81 104 100 114 Q 81 124 62 114 Z"
          fill="var(--bg-card)" stroke="var(--line)" strokeWidth="1" />
        <circle cx="81" cy="114" r="4" fill="rgba(100,75,60,0.25)" />
        <path d="M 120 114 Q 139 104 158 114 Q 139 124 120 114 Z"
          fill="var(--bg-card)" stroke="var(--line)" strokeWidth="1" />
        <circle cx="139" cy="114" r="4" fill="rgba(100,75,60,0.25)" />

        {/* ── Nose ── */}
        <path d="M 110 130 L 106 155 Q 110 158 114 155" stroke="var(--line)" strokeWidth="1" strokeLinecap="round" fill="none" />

        {/* ── Lips ── */}
        <path d="M 90 191 Q 100 186 110 188 Q 120 186 130 191"
          stroke="var(--line)" strokeWidth="1.2" strokeLinecap="round" fill="none" />
        <path d="M 90 191 Q 100 200 110 202 Q 120 200 130 191"
          stroke="var(--line)" strokeWidth="1.2" fill="rgba(200,150,140,0.12)" />

        {/* ── Highlighted zone indicator ── */}
        {(z === 'full' || z === 'skin') && (
          <ellipse cx="110" cy="142" rx="68" ry="86"
            fill="none" stroke={color} strokeWidth="1.5" strokeDasharray="4 4"
            style={{ opacity: 0.5, animation: 'pulseGlow 2s ease-in-out infinite' }} />
        )}
        {(z === 'eyes' || z === 'lids') && (
          <>
            <path d="M 60 114 Q 81 102 102 114" stroke={color} strokeWidth="1.5" fill="none" opacity="0.5" strokeDasharray="3 3" />
            <path d="M 118 114 Q 139 102 160 114" stroke={color} strokeWidth="1.5" fill="none" opacity="0.5" strokeDasharray="3 3" />
          </>
        )}
        {z === 'brows' && (
          <>
            <path d="M 64 98 Q 80 91 96 95" stroke={color} strokeWidth="2" fill="none" opacity="0.5" strokeDasharray="3 3" />
            <path d="M 124 95 Q 140 91 156 98" stroke={color} strokeWidth="2" fill="none" opacity="0.5" strokeDasharray="3 3" />
          </>
        )}
        {z === 'cheeks' && (
          <>
            <ellipse cx="60" cy="158" rx="26" ry="18" fill="none" stroke={color} strokeWidth="1.2" strokeDasharray="3 3" opacity="0.5" />
            <ellipse cx="160" cy="158" rx="26" ry="18" fill="none" stroke={color} strokeWidth="1.2" strokeDasharray="3 3" opacity="0.5" />
          </>
        )}
        {z === 'lips' && (
          <path d="M 89 191 Q 110 204 131 191 Q 120 186 110 188 Q 100 186 89 191 Z"
            fill="none" stroke={color} strokeWidth="1.5" strokeDasharray="3 3" opacity="0.5" />
        )}
        {z === 'jaw' && (
          <>
            <path d="M 44 155 Q 56 178 72 165" stroke={color} strokeWidth="1.5" fill="none" opacity="0.5" strokeDasharray="3 3" />
            <path d="M 176 155 Q 164 178 148 165" stroke={color} strokeWidth="1.5" fill="none" opacity="0.5" strokeDasharray="3 3" />
          </>
        )}

        {/* ── Animated makeup layer ── */}
        {(z === 'full' || z === 'skin') && <FoundationLayer color={rgba} />}
        {(z === 'eyes' || z === 'lids') && <EyeshadowLayer color={rgba} />}
        {z === 'brows' && <BrowLayer color={color} />}
        {z === 'cheeks' && <BlushLayer color={rgba} />}
        {z === 'lips' && <LipsLayer color={color} />}
        {z === 'jaw' && <ContourLayer color={rgba} />}

        {/* ── Zone label ── */}
        <text
          x="110" y="268"
          textAnchor="middle"
          fontSize="8"
          fontFamily="'DM Sans', sans-serif"
          letterSpacing="0.12em"
          fill="var(--text-3)"
          style={{ textTransform: 'uppercase' }}
        >
          {label ?? z === 'full' ? 'FULL FACE' : z === 'skin' ? 'BASE SKIN' : z === 'lids' ? 'EYELIDS' : z.toUpperCase()}
        </text>
      </svg>
    </div>
  );
}
