import Link from 'next/link';
import Navbar from '@/components/Navbar';
import RemotionHero from '@/components/RemotionHero';
import LooksRow from '@/components/LooksRow';

const STEPS = [
  { n: '01', title: 'Upload your selfie',  body: 'Any lighting. Any angle. Front camera on your phone is perfect.' },
  { n: '02', title: 'Pick your look',      body: '5 curated aesthetics — from no-makeup to full editorial.' },
  { n: '03', title: 'AI reads your face',  body: 'Skin tone, undertone, bone structure — every feature mapped.' },
  { n: '04', title: 'Get your tutorial',   body: '8 personalised steps, written in plain language, just for you.' },
];

const STATS = [
  { value: '5',     label: 'Looks' },
  { value: '8',     label: 'Steps per tutorial' },
  { value: '< 3s',  label: 'Analysis time' },
  { value: '100%',  label: 'Personalised' },
];

export default function Home() {
  return (
    <div style={{ background: 'var(--bg)' }}>
      <Navbar />

      {/* ══ HERO ══════════════════════════════════════════════════ */}
      <section
        style={{
          position: 'relative',
          height: '100svh',
          minHeight: 640,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {/* Remotion animated background */}
        <RemotionHero />

        {/* Seamless bottom fade into page bg */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: 220, zIndex: 2,
          background: 'linear-gradient(to bottom, transparent, var(--bg))',
          pointerEvents: 'none',
        }} />

        {/* Hero text block */}
        <div
          className="wrap"
          style={{
            position: 'relative', zIndex: 3,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', textAlign: 'center',
            gap: 28,
          }}
        >
          {/* Live badge */}
          <div className="tag fu" style={{ gap: 8 }}>
            <span className="pdot" style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
            V1 — Live now
          </div>

          {/* Main headline */}
          <h1
            className="serif fu-1"
            style={{
              fontSize: 'clamp(64px, 13vw, 138px)',
              lineHeight: 0.88,
              letterSpacing: '-0.03em',
              color: 'var(--text)',
              maxWidth: 840,
            }}
          >
            Make them
            <br />
            <em className="serif-italic" style={{ color: 'var(--accent)' }}>
              stop.
            </em>
          </h1>

          <p
            className="fu-2"
            style={{
              fontSize: 16, lineHeight: 1.85, fontWeight: 300,
              color: 'var(--text-2)', maxWidth: 400,
            }}
          >
            Upload your selfie. AI maps your face. Get a step-by-step makeup
            tutorial built{' '}
            <strong style={{ fontWeight: 500, color: 'var(--text)' }}>
              exactly for you.
            </strong>
          </p>

          <div className="fu-3" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/start" className="btn btn-dark btn-lg">
              Get your look →
            </Link>
            <a href="#process" className="btn btn-ghost btn-lg">
              How it works
            </a>
          </div>

          <p
            className="fu-4"
            style={{ fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}
          >
            Free · No account · Works on mobile
          </p>
        </div>

        {/* Scrolling marquee strip at bottom of hero */}
        <div
          style={{
            position: 'absolute', bottom: 36, left: 0, right: 0,
            overflow: 'hidden', zIndex: 3, pointerEvents: 'none',
          }}
        >
          <div
            style={{
              display: 'flex', gap: 48, whiteSpace: 'nowrap',
              animation: 'marquee 28s linear infinite',
              fontSize: 10, letterSpacing: '0.26em',
              color: 'var(--text-3)', textTransform: 'uppercase',
            }}
          >
            {Array(12).fill(['smoky eye','✦','glass skin','◆','bold lip','◇','editorial','▲','no-makeup makeup','●']).flat().map((t, i) => (
              <span key={i}>{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ══ STATS BAR ══════════════════════════════════════════ */}
      <div style={{ background: 'var(--bg-dark)', padding: '32px 0' }}>
        <div className="wrap">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
            }}
          >
            {STATS.map((s, i) => (
              <div
                key={i}
                style={{
                  textAlign: 'center', padding: '10px 0',
                  borderRight: i < 3 ? '1px solid rgba(255,255,255,.07)' : 'none',
                }}
              >
                <p className="serif" style={{ fontSize: 32, color: 'var(--text-inv)', letterSpacing: '-0.02em', lineHeight: 1 }}>{s.value}</p>
                <p style={{ fontSize: 10.5, color: 'rgba(245,240,235,.35)', marginTop: 6, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ HOW IT WORKS ══════════════════════════════════════ */}
      <section id="process" style={{ padding: '120px 0' }}>
        <div className="wrap">

          <div style={{ marginBottom: 64 }}>
            <span className="tag" style={{ marginBottom: 18, display: 'inline-flex' }}>How it works</span>
            <h2 className="serif" style={{ fontSize: 'clamp(40px, 6vw, 72px)', lineHeight: 1, letterSpacing: '-0.03em' }}>
              Four steps.
              <br />
              <span className="serif-italic" style={{ color: 'var(--text-2)' }}>Zero guesswork.</span>
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {STEPS.map((step, i) => (
              <div key={i} className="process-card">
                <span className="num">{step.n}</span>
                <p style={{ fontSize: 10.5, color: 'var(--accent)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 16, fontWeight: 500 }}>Step {step.n}</p>
                <h3 className="serif" style={{ fontSize: 24, color: 'var(--text)', marginBottom: 12, lineHeight: 1.15 }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.75 }}>{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ EDITORIAL PULL QUOTE ══════════════════════════════ */}
      <div className="rule-fade" />
      <div
        style={{
          padding: '100px 0',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Soft colour bleed */}
        {[
          { left: '-4%',  top: '0%',  size: 500, color: '#C17060', opacity: 0.07 },
          { left: '65%',  top: '-30%', size: 420, color: '#D4A090', opacity: 0.07 },
        ].map((b, i) => (
          <div key={i} style={{
            position: 'absolute', left: b.left, top: b.top,
            width: b.size, height: b.size, borderRadius: '50%',
            background: b.color, opacity: b.opacity, filter: 'blur(80px)',
            pointerEvents: 'none',
          }} />
        ))}

        <div className="wrap" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <p
            className="serif-italic"
            style={{
              fontSize: 'clamp(26px, 4.5vw, 54px)',
              color: 'var(--text-2)',
              lineHeight: 1.35,
              letterSpacing: '-0.015em',
              maxWidth: 760,
              margin: '0 auto',
            }}
          >
            "No two faces are the same.<br />So why are tutorials generic?"
          </p>
          <div style={{ width: 48, height: 1.5, background: 'var(--accent)', margin: '32px auto 0', opacity: 0.7 }} />
        </div>
      </div>
      <div className="rule-fade" />

      {/* ══ LOOK LIBRARY ══════════════════════════════════════ */}
      <section style={{ padding: '120px 0' }}>
        <div className="wrap">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'start' }}>

            {/* Left: heading */}
            <div style={{ position: 'sticky', top: 120 }}>
              <span className="tag" style={{ marginBottom: 20, display: 'inline-flex' }}>Look library</span>
              <h2 className="serif" style={{ fontSize: 'clamp(38px, 5vw, 66px)', lineHeight: 1, letterSpacing: '-0.03em', marginBottom: 20 }}>
                5 looks.
                <br />
                <span className="serif-italic" style={{ color: 'var(--text-2)' }}>One is yours.</span>
              </h2>
              <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.8, maxWidth: 340, marginBottom: 32 }}>
                From the subtlest skin-first finish to a full runway statement.
                Each look is adapted to your exact skin tone and features.
              </p>
              <Link href="/looks" className="btn btn-ghost btn-sm">
                Explore all looks →
              </Link>
            </div>

            {/* Right: look rows */}
            <div>
              <LooksRow />
            </div>
          </div>
        </div>
      </section>

      {/* ══ DARK CTA ══════════════════════════════════════════ */}
      <section
        style={{
          background: 'var(--bg-dark)',
          padding: '120px 0',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Radial glow */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 700, height: 700, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(181,96,74,.16) 0%, transparent 68%)',
          pointerEvents: 'none',
        }} />

        <div className="wrap" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <span className="tag" style={{ marginBottom: 24, display: 'inline-flex', borderColor: 'rgba(255,255,255,.1)', background: 'rgba(255,255,255,.04)', color: 'rgba(245,240,235,.4)' }}>
            Try it free
          </span>
          <h2
            className="serif"
            style={{
              fontSize: 'clamp(48px, 9vw, 100px)',
              lineHeight: 0.92,
              letterSpacing: '-0.035em',
              color: 'var(--text-inv)',
              marginBottom: 28,
            }}
          >
            Your face.
            <br />
            <em className="serif-italic" style={{ color: 'var(--accent-hi)' }}>Your tutorial.</em>
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(245,240,235,.45)', fontWeight: 300, lineHeight: 1.85, maxWidth: 380, margin: '0 auto 40px' }}>
            No generic guides. No subscriptions.<br />AI-powered steps built around your exact features.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/start" className="btn btn-accent btn-lg">
              Get your look →
            </Link>
            <Link href="/roadmap" className="btn btn-ghost-inv btn-lg">
              See what's coming
            </Link>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ════════════════════════════════════════════ */}
      <footer style={{ borderTop: '1px solid var(--line)', padding: '32px 0', background: 'var(--bg-card)' }}>
        <div className="wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <span className="serif" style={{ fontSize: 13, color: 'var(--text-3)', letterSpacing: '0.24em' }}>MEDUSA</span>
          <div style={{ display: 'flex', gap: 28 }}>
            <Link href="/looks"   style={{ fontSize: 12, color: 'var(--text-3)' }}>Looks</Link>
            <Link href="/roadmap" style={{ fontSize: 12, color: 'var(--text-3)' }}>Roadmap</Link>
            <Link href="/start"   style={{ fontSize: 12, color: 'var(--text-3)' }}>Try it</Link>
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>© 2026 MEDUSA — AI Makeup Tutorials</span>
        </div>
      </footer>
    </div>
  );
}
