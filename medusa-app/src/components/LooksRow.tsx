'use client';

import Link from 'next/link';
import { useState } from 'react';

const LOOKS = [
  { label: 'No-Makeup Makeup', emoji: '✦', desc: 'Your skin, perfected.' },
  { label: 'Smoky Eye',         emoji: '◆', desc: 'Dark. Mysterious. You.' },
  { label: 'Dewy Glass Skin',   emoji: '◇', desc: 'Lit from within.' },
  { label: 'Bold Lip',          emoji: '▲', desc: 'One move. Full power.' },
  { label: 'Editorial',         emoji: '●', desc: 'Runway-ready, real life.' },
];

export default function LooksRow() {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {LOOKS.map((look, i) => (
        <Link
          key={i}
          href="/start"
          className="look-row-item"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            textDecoration: 'none',
            transform: hovered === i ? 'translateX(6px)' : 'none',
            borderColor: hovered === i ? 'var(--text-3)' : 'var(--line)',
            background: hovered === i ? 'var(--bg-surface)' : 'var(--bg-card)',
            boxShadow: hovered === i ? '0 4px 20px rgba(28,20,16,.06)' : 'none',
          }}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(null)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <span
              className="serif"
              style={{
                fontSize: 16, width: 20,
                color: hovered === i ? 'var(--accent)' : 'var(--text-3)',
                transition: 'color .2s',
              }}
            >
              {look.emoji}
            </span>
            <div>
              <p className="serif" style={{ fontSize: 18, color: 'var(--text)', marginBottom: 2, lineHeight: 1.2 }}>
                {look.label}
              </p>
              <p style={{ fontSize: 12.5, color: 'var(--text-2)' }}>{look.desc}</p>
            </div>
          </div>
          <span
            style={{
              fontSize: 16,
              color: hovered === i ? 'var(--text-2)' : 'var(--text-3)',
              transition: 'all .2s',
              transform: hovered === i ? 'translateX(3px)' : 'none',
              display: 'inline-block',
            }}
          >
            →
          </span>
        </Link>
      ))}
    </div>
  );
}
