import Link from 'next/link';
import Navbar from '@/components/Navbar';

const PHASES = [
  {
    version: 'V1',
    label: 'Foundation',
    status: 'live',
    date: 'March 2026',
    description: 'The core loop — upload, pick, analyse, tutorial.',
    items: [
      { done: true,  text: 'Selfie upload (drag & drop + live camera)' },
      { done: true,  text: '5 curated look aesthetics' },
      { done: true,  text: 'Simulated face analysis (skin tone, undertone, structure)' },
      { done: true,  text: '8-step tutorial engine with Pro Tips' },
      { done: true,  text: 'Step-by-step progress tracker' },
      { done: true,  text: 'Mobile-responsive web app' },
      { done: false, text: 'Claude Vision API — real face analysis (coming in V1.1)' },
      { done: false, text: 'Claude AI — generated tutorial text (coming in V1.1)' },
    ],
  },
  {
    version: 'V2',
    label: 'Intelligence',
    status: 'building',
    date: 'Q3 2026',
    description: 'Real AI. Real recommendations. Real results.',
    items: [
      { done: false, text: 'Claude Vision API for actual face feature detection' },
      { done: false, text: 'Dynamically generated tutorials per face (not static)' },
      { done: false, text: 'Undertone detection → product shade recommendations' },
      { done: false, text: 'Nykaa & Sephora India product affiliate links per step' },
      { done: false, text: 'Hindi tutorial language option' },
      { done: false, text: 'Expanded look library (10+ aesthetics)' },
      { done: false, text: '"My Product Shelf" — scan your products, get matched steps' },
      { done: false, text: 'Shareable before/after card (download + share)' },
    ],
  },
  {
    version: 'V3',
    label: 'Community',
    status: 'planned',
    date: '2027',
    description: 'MEDUSA becomes a platform.',
    items: [
      { done: false, text: 'Community look feed — see what others created' },
      { done: false, text: 'Save & revisit your tutorials' },
      { done: false, text: 'Makeup artist booking integration' },
      { done: false, text: 'Brand partnership tutorials (sponsored looks)' },
      { done: false, text: 'AR try-on (WebXR)' },
      { done: false, text: 'Android & iOS native app' },
    ],
  },
];

const STATUS_STYLE: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  live:     { label: 'Live now',    bg: 'rgba(34,197,94,.1)',   color: '#16a34a', dot: '#22c55e' },
  building: { label: 'Building',   bg: 'rgba(181,96,74,.1)',   color: 'var(--accent-lo)', dot: 'var(--accent)' },
  planned:  { label: 'Planned',    bg: 'rgba(148,163,184,.1)', color: '#64748b', dot: '#94a3b8' },
};

export default function RoadmapPage() {
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Navbar />

      {/* Hero */}
      <div style={{ paddingTop: 'calc(var(--nav-h) + 72px)', paddingBottom: 80 }}>
        <div className="wrap">
          <span className="tag" style={{ marginBottom: 20, display: 'inline-flex' }}>Roadmap</span>
          <h1
            className="serif"
            style={{ fontSize: 'clamp(42px, 7vw, 80px)', lineHeight: 0.95, letterSpacing: '-0.03em', marginBottom: 20 }}
          >
            Where we're going.
            <br />
            <span className="serif-italic" style={{ color: 'var(--text-2)' }}>Openly.</span>
          </h1>
          <p style={{ fontSize: 16, color: 'var(--text-2)', lineHeight: 1.75, fontWeight: 300, maxWidth: 480 }}>
            MEDUSA is built in public. Here's exactly what's shipped, what's in progress,
            and what comes next. No vague promises.
          </p>
        </div>
      </div>

      <div className="line-gradient" style={{ marginBottom: 80 }} />

      {/* Phases */}
      <div className="wrap" style={{ paddingBottom: 120 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 64 }}>
          {PHASES.map((phase, pi) => {
            const st = STATUS_STYLE[phase.status];
            const doneCount = phase.items.filter(i => i.done).length;
            return (
              <div
                key={phase.version}
                className={`roadmap-phase ${phase.status === 'live' ? 'current' : ''}`}
              >
                {/* Phase header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                      <span
                        className="serif"
                        style={{ fontSize: 13, color: 'var(--accent)', letterSpacing: '0.16em' }}
                      >
                        {phase.version}
                      </span>
                      {/* Status pill */}
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 100, background: st.bg, fontSize: 11, fontWeight: 500, color: st.color, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: st.dot, display: 'inline-block', animation: phase.status === 'live' ? 'pulseDot 1.8s ease-in-out infinite' : 'none' }} />
                        {st.label}
                      </span>
                    </div>
                    <h2 className="serif" style={{ fontSize: 'clamp(28px, 4vw, 46px)', lineHeight: 1.05, letterSpacing: '-0.02em', marginBottom: 8 }}>
                      {phase.label}
                    </h2>
                    <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.65 }}>{phase.description}</p>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Target</p>
                    <p className="serif" style={{ fontSize: 20, color: 'var(--text)' }}>{phase.date}</p>
                    {phase.status === 'live' && (
                      <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>{doneCount}/{phase.items.length} shipped</p>
                    )}
                  </div>
                </div>

                {/* Progress bar (V1 only) */}
                {phase.status === 'live' && (
                  <div style={{ height: 2, background: 'var(--line)', borderRadius: 2, marginBottom: 24, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(doneCount / phase.items.length) * 100}%`, background: 'linear-gradient(90deg, var(--accent-lo), var(--accent-hi))', borderRadius: 2, transition: 'width .5s' }} />
                  </div>
                )}

                {/* Items */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 10 }}>
                  {phase.items.map((item, ii) => (
                    <div
                      key={ii}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: 12,
                        padding: '14px 16px', borderRadius: 12,
                        background: item.done ? 'var(--bg-card)' : 'transparent',
                        border: `1px solid ${item.done ? 'var(--line)' : 'var(--line-subtle)'}`,
                        opacity: item.done ? 1 : 0.7,
                      }}
                    >
                      {/* Checkbox */}
                      <div style={{
                        width: 18, height: 18, borderRadius: 5, flexShrink: 0, marginTop: 1,
                        background: item.done ? 'var(--accent)' : 'transparent',
                        border: item.done ? 'none' : '1.5px solid var(--line)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {item.done && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                      <p style={{ fontSize: 13.5, color: item.done ? 'var(--text)' : 'var(--text-2)', lineHeight: 1.5, textDecoration: 'none' }}>
                        {item.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom note */}
        <div style={{ marginTop: 80, padding: '32px 36px', borderRadius: 20, background: 'var(--bg-surface)', border: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
            <span className="serif" style={{ fontSize: 32, lineHeight: 1 }}>✦</span>
            <div>
              <h3 className="serif" style={{ fontSize: 22, marginBottom: 8 }}>Have a feature idea?</h3>
              <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.7, marginBottom: 16 }}>
                MEDUSA is built for real people. If there's a look, a product integration, or a feature
                you wish existed — we want to know.
              </p>
              <Link href="/upload" className="btn btn-accent btn-sm">
                Try V1 first →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--line)', padding: '28px 0', background: 'var(--bg-card)' }}>
        <div className="wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span className="serif" style={{ fontSize: 13, color: 'var(--text-3)', letterSpacing: '0.22em' }}>MEDUSA</span>
          </Link>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>© 2026 — AI Makeup Tutorials</span>
        </div>
      </footer>
    </div>
  );
}
