'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

interface Look {
  id: string; label: string; tagline: string; mood: string;
  keywords: string[]; palette: string[]; gradient: string;
}

const LOOKS: Look[] = [
  {
    id: 'no-makeup', label: 'No-Makeup Makeup', tagline: 'Your skin, perfected.',
    mood: 'Natural · Fresh · Confident',
    keywords: ['Tinted moisturizer', 'Concealer', 'Clear brow gel', 'Lip balm'],
    palette: ['#E8C9A0', '#C9956B', '#A67855', '#F5DEB3'],
    gradient: 'linear-gradient(135deg, #FDF3E7 0%, #F5E6D0 100%)',
  },
  {
    id: 'smoky-eye', label: 'Smoky Eye', tagline: 'Dark. Mysterious. You.',
    mood: 'Bold · Evening · Dramatic',
    keywords: ['Black eyeshadow', 'Blending brush', 'Kohl liner', 'Mascara'],
    palette: ['#3A3A3A', '#6B6B6B', '#A0A0A0', '#D4D4D4'],
    gradient: 'linear-gradient(135deg, #EBEBEB 0%, #D8D8D8 100%)',
  },
  {
    id: 'glass-skin', label: 'Dewy Glass Skin', tagline: 'Lit from within.',
    mood: 'Glow · K-beauty · Luminous',
    keywords: ['Hydrating serum', 'Highlighter', 'Blush', 'Setting spray'],
    palette: ['#FFD6D6', '#FFB3C1', '#FF91A4', '#FF6B8A'],
    gradient: 'linear-gradient(135deg, #FFF0F3 0%, #FFE0E8 100%)',
  },
  {
    id: 'bold-lip', label: 'Bold Lip', tagline: 'One move. Full power.',
    mood: 'Classic · Statement · Iconic',
    keywords: ['Red lipstick', 'Lip liner', 'Setting powder', 'Clean skin'],
    palette: ['#C41E1E', '#8B0000', '#E05050', '#F5A0A0'],
    gradient: 'linear-gradient(135deg, #FDF0EE 0%, #F8E0DC 100%)',
  },
  {
    id: 'editorial', label: 'Editorial', tagline: 'Runway-ready, real life.',
    mood: 'Avant-garde · Fashion · Artistic',
    keywords: ['Color eyeshadow', 'Graphic liner', 'Bold structure'],
    palette: ['#7B5EA7', '#C084FC', '#E9D5FF', '#F5F3FF'],
    gradient: 'linear-gradient(135deg, #F5F0FF 0%, #EDE4FF 100%)',
  },
];

export default function LookPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [hovering, setHovering] = useState<string | null>(null);

  useEffect(() => {
    const s = sessionStorage.getItem('medusa_selfie');
    if (!s) router.push('/upload');
    setSelfie(s);
  }, [router]);

  const activeLook = LOOKS.find(l => l.id === (hovering || selected));

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Navbar />

      <main className="flex flex-col px-6 pt-28 pb-20 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-12 anim-fade-up">
          <div className="flex items-center gap-4">
            {selfie && (
              <div className="w-9 h-9 rounded-full overflow-hidden border" style={{ borderColor: 'var(--line)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selfie} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <span className="tag">Step 02 — Pick your look</span>
          </div>
          <h1
            className="serif"
            style={{ fontSize: 'clamp(36px, 6vw, 60px)', color: 'var(--text)', letterSpacing: '-0.025em', lineHeight: '1.04' }}
          >
            What energy
            <br />
            <span className="serif-italic" style={{ color: activeLook ? 'var(--accent)' : 'var(--text-2)' }}>
              {activeLook ? activeLook.tagline : 'are you today?'}
            </span>
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-3)' }}>Hover to preview · Click to select</p>
        </div>

        {/* Look grid */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-10 anim-fade-up-d1">
          {LOOKS.map((look, i) => {
            const isSelected = selected === look.id;
            const isHovered  = hovering === look.id;
            return (
              <button
                key={look.id}
                className="look-tile text-left"
                style={{
                  borderColor: isSelected ? 'var(--accent)' : isHovered ? 'var(--text-3)' : 'var(--line)',
                  boxShadow: isSelected
                    ? '0 0 0 3px rgba(181,96,74,.15), 0 16px 40px rgba(181,96,74,.12)'
                    : isHovered ? '0 8px 32px rgba(28,20,16,.08)' : 'none',
                  transform: isHovered && !isSelected ? 'translateY(-3px)' : 'none',
                  transition: 'all .25s',
                }}
                onClick={() => setSelected(look.id)}
                onMouseEnter={() => setHovering(look.id)}
                onMouseLeave={() => setHovering(null)}
              >
                {/* Gradient swatch area */}
                <div
                  className="relative flex items-end justify-start p-5"
                  style={{ height: '150px', background: look.gradient, borderBottom: '1px solid var(--line-subtle)' }}
                >
                  <div className="flex gap-2">
                    {look.palette.map((c, j) => (
                      <div key={j} className="rounded-full" style={{ width: '18px', height: '18px', background: c, border: '1.5px solid rgba(255,255,255,.6)' }} />
                    ))}
                  </div>
                  {/* Symbol */}
                  <div className="absolute top-4 left-5 serif text-2xl" style={{ color: 'rgba(28,20,16,.12)' }}>
                    {['✦','◆','◇','▲','●'][i]}
                  </div>
                  {/* Selected check */}
                  {isSelected && (
                    <div className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'var(--accent)' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Text */}
                <div className="p-5" style={{ background: 'var(--bg-card)' }}>
                  <p className="serif mb-1" style={{ fontSize: '17px', color: isSelected ? 'var(--accent)' : 'var(--text)', lineHeight: '1.2' }}>
                    {look.label}
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--text-2)', marginBottom: '10px' }}>{look.mood}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {look.keywords.slice(0, 2).map(kw => (
                      <span key={kw} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '100px', background: 'var(--bg-surface)', border: '1px solid var(--line)', color: 'var(--text-3)', letterSpacing: '0.04em' }}>
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between flex-wrap gap-4 anim-fade-up-d2">
          <button onClick={() => router.push('/upload')} className="btn-ghost">← Retake selfie</button>
          <div className="flex items-center gap-4">
            {selected && (
              <p style={{ fontSize: '14px', color: 'var(--text-2)' }}>
                <span className="serif-italic" style={{ color: 'var(--text)' }}>
                  {LOOKS.find(l => l.id === selected)?.label}
                </span>{' '}selected
              </p>
            )}
            <button
              onClick={() => { if (selected) { sessionStorage.setItem('medusa_look', selected); router.push('/tutorial'); } }}
              className="btn-accent"
              style={{ opacity: selected ? 1 : 0.4, cursor: selected ? 'pointer' : 'not-allowed' }}
              disabled={!selected}
            >
              Build my tutorial →
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
