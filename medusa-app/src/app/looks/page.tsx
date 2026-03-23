import Link from 'next/link';
import Navbar from '@/components/Navbar';

const LOOKS = [
  {
    id: 'no-makeup',
    label: 'No-Makeup Makeup',
    tagline: 'Your skin, perfected.',
    desc: 'The art of looking effortlessly natural. Skin-first, flaw-forgiving, undeniably you. This look uses your real undertone to pick the exact foundation finish that disappears into your skin.',
    steps: 8,
    palette: ['#F5DDD3', '#E8C4B2', '#D4A090', '#C17060', '#9B6050'],
    time: '12 min',
    level: 'Beginner',
  },
  {
    id: 'smoky-eye',
    label: 'Smoky Eye',
    tagline: 'Dark. Mysterious. You.',
    desc: 'A smoked-out eye that pulls focus. Built around your eye shape — monolid, hooded, almond — so the shadow sits exactly where it should. Deep, moody, unforgettable.',
    steps: 8,
    palette: ['#2C1F18', '#4A3028', '#6B4840', '#8B5E50', '#B08070'],
    time: '18 min',
    level: 'Intermediate',
  },
  {
    id: 'glass-skin',
    label: 'Dewy Glass Skin',
    tagline: 'Lit from within.',
    desc: 'The Korean-inspired luminous finish. Layered hydration, strategic highlight, zero matte. We map your skin depth to choose the exact highlighter tones that look like light, not glitter.',
    steps: 8,
    palette: ['#FAF0EC', '#F0E0D6', '#E8D4C8', '#DDB8A8', '#C89888'],
    time: '14 min',
    level: 'Beginner',
  },
  {
    id: 'bold-lip',
    label: 'Bold Lip',
    tagline: 'One move. Full power.',
    desc: 'A single lip colour that commands the room. We match the hue to your undertone — cool blue-reds for cool skin, warm brick-reds for warm — so it looks intentional, not costume.',
    steps: 8,
    palette: ['#8B1A2A', '#B02030', '#C83040', '#E04050', '#F06070'],
    time: '10 min',
    level: 'Beginner',
  },
  {
    id: 'editorial',
    label: 'Editorial',
    tagline: 'Runway-ready, real life.',
    desc: 'A look that takes a creative risk. Graphic liner, unexpected texture, colour placement that defies convention. Built around your bone structure so the drama lands in exactly the right places.',
    steps: 8,
    palette: ['#1A1210', '#3D2820', '#7A4035', '#B56048', '#E09070'],
    time: '22 min',
    level: 'Advanced',
  },
];

const LEVEL_COLOR: Record<string, string> = {
  Beginner:     '#16a34a',
  Intermediate: 'var(--accent)',
  Advanced:     '#7c3aed',
};

export default function LooksPage() {
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Navbar />

      {/* ── Hero ───────────────────────────────────────────── */}
      <div style={{ paddingTop: 'calc(var(--nav-h) + 80px)', paddingBottom: 80 }}>
        <div className="wrap">
          <span className="tag" style={{ marginBottom: 20, display: 'inline-flex' }}>The Look Library</span>
          <h1
            className="serif"
            style={{
              fontSize: 'clamp(44px, 8vw, 88px)',
              lineHeight: 0.93,
              letterSpacing: '-0.03em',
              marginBottom: 24,
            }}
          >
            Five looks.
            <br />
            <span className="serif-italic" style={{ color: 'var(--text-2)' }}>One is yours.</span>
          </h1>
          <p style={{ fontSize: 16, color: 'var(--text-2)', lineHeight: 1.8, fontWeight: 300, maxWidth: 480 }}>
            Every look is adapted to your face — skin tone, undertone, eye shape, bone structure.
            Pick one and let MEDUSA write your personalised tutorial.
          </p>
        </div>
      </div>

      <div className="rule-fade" />

      {/* ── Look cards ─────────────────────────────────────── */}
      <div className="wrap" style={{ paddingTop: 80, paddingBottom: 120 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {LOOKS.map((look, i) => (
            <div
              key={look.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: 40,
                alignItems: 'center',
                padding: '44px 0',
                borderBottom: i < LOOKS.length - 1 ? '1px solid var(--line-subtle)' : 'none',
              }}
            >
              {/* Left: content */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 500 }}>
                    0{i + 1}
                  </span>
                  <span style={{
                    fontSize: 10.5, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase',
                    padding: '3px 10px', borderRadius: 100,
                    color: LEVEL_COLOR[look.level],
                    border: `1px solid ${LEVEL_COLOR[look.level]}33`,
                    background: `${LEVEL_COLOR[look.level]}10`,
                  }}>
                    {look.level}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.06em' }}>
                    {look.time}
                  </span>
                </div>

                <h2 className="serif" style={{ fontSize: 'clamp(28px, 4vw, 48px)', lineHeight: 1.05, letterSpacing: '-0.02em', marginBottom: 8 }}>
                  {look.label}
                </h2>
                <p className="serif-italic" style={{ fontSize: 16, color: 'var(--accent)', marginBottom: 16 }}>
                  {look.tagline}
                </p>
                <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.75, maxWidth: 520, marginBottom: 24 }}>
                  {look.desc}
                </p>

                {/* Palette swatches */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {look.palette.map((c, j) => (
                    <div
                      key={j}
                      style={{
                        width: 22, height: 22, borderRadius: '50%',
                        background: c,
                        border: '1.5px solid rgba(0,0,0,.08)',
                        flexShrink: 0,
                      }}
                    />
                  ))}
                  <span style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 8, letterSpacing: '0.06em' }}>
                    Shade palette
                  </span>
                </div>
              </div>

              {/* Right: CTA */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
                <div style={{
                  width: 80, height: 80, borderRadius: 20,
                  background: `linear-gradient(135deg, ${look.palette[0]}, ${look.palette[4]})`,
                  border: '1px solid rgba(0,0,0,.07)',
                  flexShrink: 0,
                }} />
                <Link href="/start" className="btn btn-dark btn-sm">
                  Try this look →
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom note */}
        <div
          style={{
            marginTop: 80, padding: '40px 44px',
            borderRadius: 24, background: 'var(--bg-dark)',
            position: 'relative', overflow: 'hidden',
          }}
        >
          <div style={{
            position: 'absolute', top: '50%', right: '-10%',
            transform: 'translateY(-50%)',
            width: 400, height: 400, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(181,96,74,.18) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <p style={{ fontSize: 11, color: 'rgba(245,240,235,.35)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
              Ready?
            </p>
            <h3 className="serif" style={{ fontSize: 'clamp(28px, 4vw, 46px)', color: 'var(--text-inv)', lineHeight: 1.1, marginBottom: 20 }}>
              Upload your selfie.<br />
              <span className="serif-italic" style={{ color: 'var(--accent-hi)' }}>Get your personalised look.</span>
            </h3>
            <Link href="/start" className="btn btn-accent">
              Get started — it's free →
            </Link>
          </div>
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid var(--line)', padding: '32px 0', background: 'var(--bg-card)' }}>
        <div className="wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span className="serif" style={{ fontSize: 13, color: 'var(--text-3)', letterSpacing: '0.24em' }}>MEDUSA</span>
          </Link>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>© 2026 — AI Makeup Tutorials</span>
        </div>
      </footer>
    </div>
  );
}
