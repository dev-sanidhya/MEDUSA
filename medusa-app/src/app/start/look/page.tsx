'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

interface Look {
  id: string;
  label: string;
  tagline: string;
  mood: string;
  keywords: string[];
  palette: string[];
  gradient: string;
}

const LOOKS: Look[] = [
  {
    id: 'no-makeup',
    label: 'No-Makeup Makeup',
    tagline: 'Your skin, perfected.',
    mood: 'Natural · Fresh · Confident',
    keywords: ['Tinted moisturiser', 'Concealer', 'Clear brow gel', 'Lip balm'],
    palette: ['#E8C9A0', '#C9956B', '#A67855', '#F5DEB3'],
    gradient: 'linear-gradient(135deg, #FDF3E7 0%, #F0E0C8 100%)',
  },
  {
    id: 'smoky-eye',
    label: 'Smoky Eye',
    tagline: 'Dark. Mysterious. You.',
    mood: 'Bold · Evening · Dramatic',
    keywords: ['Black eyeshadow', 'Blending brush', 'Kohl liner', 'Mascara'],
    palette: ['#3A3A3A', '#6B6B6B', '#A0A0A0', '#D4D4D4'],
    gradient: 'linear-gradient(135deg, #EAEAEA 0%, #D0D0D0 100%)',
  },
  {
    id: 'glass-skin',
    label: 'Dewy Glass Skin',
    tagline: 'Lit from within.',
    mood: 'Glow · K-beauty · Luminous',
    keywords: ['Hydrating serum', 'Highlighter', 'Jelly blush', 'Setting mist'],
    palette: ['#FFD6D6', '#FFB3C1', '#FF91A4', '#FFE8EE'],
    gradient: 'linear-gradient(135deg, #FFF0F3 0%, #FFE0E8 100%)',
  },
  {
    id: 'bold-lip',
    label: 'Bold Lip',
    tagline: 'One move. Full power.',
    mood: 'Classic · Statement · Iconic',
    keywords: ['Lip liner', 'Satin lipstick', 'Concealer brush', 'Setting powder'],
    palette: ['#C41E1E', '#8B0000', '#E05050', '#F5A0A0'],
    gradient: 'linear-gradient(135deg, #FDF0EE 0%, #F5D8D4 100%)',
  },
  {
    id: 'editorial',
    label: 'Editorial',
    tagline: 'Runway-ready. Real life.',
    mood: 'Avant-garde · Fashion · Artistic',
    keywords: ['Gel liner', 'Colour eyeshadow', 'Contour', 'Graphic structure'],
    palette: ['#7B5EA7', '#C084FC', '#E9D5FF', '#F5F3FF'],
    gradient: 'linear-gradient(135deg, #F5F0FF 0%, #EDE4FF 100%)',
  },
];

const SYMBOLS = ['✦', '◆', '◇', '▲', '●'];

export default function LookPage() {
  const router   = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [selfie,   setSelfie]   = useState<string | null>(null);
  const [hovering, setHovering] = useState<string | null>(null);

  useEffect(() => {
    const s = sessionStorage.getItem('medusa_selfie');
    if (!s) { router.push('/start'); return; }
    setSelfie(s);
  }, [router]);

  const activeLook = LOOKS.find(l => l.id === (hovering || selected));

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Navbar />

      <main style={{ paddingTop: 'calc(var(--nav-h) + 48px)', paddingBottom: 80 }}>
        <div className="wrap" style={{ maxWidth: 860 }}>

          {/* ── Header ──────────────────────────────────────── */}
          <div className="anim-fade-up" style={{ marginBottom: 48 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              {selfie && (
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', overflow: 'hidden',
                  border: '1.5px solid rgba(181,96,74,0.3)', flexShrink: 0,
                }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selfie} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
              <span className="tag">Step 02 of 03 — Pick your look</span>
            </div>

            <h1 className="serif" style={{
              fontSize: 'clamp(36px, 6vw, 60px)', letterSpacing: '-0.025em',
              lineHeight: 1.02, color: 'var(--text)', marginBottom: 10,
            }}>
              What energy
              <br />
              <em className="serif-italic" style={{ color: activeLook ? 'var(--accent)' : 'var(--text-2)' }}>
                {activeLook ? activeLook.tagline : 'are you today?'}
              </em>
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-3)', letterSpacing: '0.02em' }}>
              Hover to preview · Click to select
            </p>
          </div>

          {/* ── Look grid ───────────────────────────────────── */}
          <div
            className="anim-fade-up-d1"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 12,
              marginBottom: 36,
            }}
          >
            {LOOKS.map((look, i) => {
              const isSel = selected === look.id;
              const isHov = hovering === look.id;
              return (
                <button
                  key={look.id}
                  onClick={() => setSelected(look.id)}
                  onMouseEnter={() => setHovering(look.id)}
                  onMouseLeave={() => setHovering(null)}
                  style={{
                    background: 'var(--bg-card)',
                    border: `1.5px solid ${isSel ? 'var(--accent)' : isHov ? 'var(--text-3)' : 'var(--line)'}`,
                    borderRadius: 20,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    textAlign: 'left',
                    boxShadow: isSel
                      ? '0 0 0 3px rgba(181,96,74,.14), 0 16px 40px rgba(181,96,74,.10)'
                      : isHov ? '0 8px 28px rgba(28,20,16,.08)' : 'none',
                    transform: isHov && !isSel ? 'translateY(-3px)' : 'none',
                    transition: 'all .22s ease',
                    padding: 0,
                  }}
                >
                  {/* Gradient swatch */}
                  <div style={{
                    height: 130,
                    background: look.gradient,
                    borderBottom: '1px solid var(--line-subtle)',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'flex-end',
                    padding: '0 18px 16px',
                  }}>
                    {/* Palette dots */}
                    <div style={{ display: 'flex', gap: 7 }}>
                      {look.palette.map((c, j) => (
                        <div key={j} style={{
                          width: 16, height: 16, borderRadius: '50%',
                          background: c, border: '1.5px solid rgba(255,255,255,.65)',
                        }} />
                      ))}
                    </div>
                    {/* Symbol */}
                    <span className="serif" style={{
                      position: 'absolute', top: 14, left: 18,
                      fontSize: 20, color: 'rgba(28,20,16,.12)',
                    }}>
                      {SYMBOLS[i]}
                    </span>
                    {/* Selected check */}
                    {isSel && (
                      <div style={{
                        position: 'absolute', top: 14, right: 14,
                        width: 28, height: 28, borderRadius: '50%',
                        background: 'var(--accent)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ padding: '16px 18px 18px' }}>
                    <p className="serif" style={{
                      fontSize: 16, lineHeight: 1.2, marginBottom: 4,
                      color: isSel ? 'var(--accent)' : 'var(--text)',
                    }}>
                      {look.label}
                    </p>
                    <p style={{ fontSize: 11.5, color: 'var(--text-2)', marginBottom: 10 }}>
                      {look.mood}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {look.keywords.slice(0, 2).map(kw => (
                        <span key={kw} style={{
                          fontSize: 10, padding: '2px 9px', borderRadius: 100,
                          background: 'var(--bg-surface)', border: '1px solid var(--line)',
                          color: 'var(--text-3)', letterSpacing: '0.04em',
                        }}>
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* ── Actions ─────────────────────────────────────── */}
          <div
            className="anim-fade-up-d2"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}
          >
            <button onClick={() => router.push('/start')} className="btn btn-ghost">
              ← Retake selfie
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {selected && (
                <p style={{ fontSize: 14, color: 'var(--text-2)' }}>
                  <em className="serif-italic" style={{ color: 'var(--text)' }}>
                    {LOOKS.find(l => l.id === selected)?.label}
                  </em>
                  {' '}selected
                </p>
              )}
              <button
                onClick={() => {
                  if (selected) {
                    sessionStorage.setItem('medusa_look', selected);
                    router.push('/start/tutorial');
                  }
                }}
                className="btn btn-accent"
                disabled={!selected}
                style={{ opacity: selected ? 1 : 0.38, cursor: selected ? 'pointer' : 'not-allowed' }}
              >
                Build my tutorial →
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
