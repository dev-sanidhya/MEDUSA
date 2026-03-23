'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import MedusaMark from './MedusaMark';

const LINKS = [
  { href: '/looks',    label: 'Looks' },
  { href: '/roadmap',  label: 'Roadmap' },
  { href: '/#process', label: 'How it works' },
];

export default function Navbar() {
  const path = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isApp  = path.startsWith('/start') || path.startsWith('/upload');
  const isDark = false; // hero is now light — nav is always in light mode

  return (
    <nav
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: 'var(--nav-h)',
        background: scrolled || isApp
          ? 'rgba(250,246,241,0.94)'
          : 'transparent',
        backdropFilter: scrolled || isApp ? 'blur(24px)' : 'none',
        WebkitBackdropFilter: scrolled || isApp ? 'blur(24px)' : 'none',
        borderBottom: scrolled || isApp ? '1px solid var(--line)' : 'none',
        transition: 'background .35s, border-color .35s',
      }}
    >
      <div className="wrap" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

        {/* ── Logo ──────────────────────────────────────────── */}
        <Link
          href="/"
          style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}
        >
          <MedusaMark
            size={30}
            color={isDark ? 'rgba(245,240,235,0.9)' : 'var(--accent)'}
          />
          <span
            className="serif"
            style={{
              fontSize: 13,
              letterSpacing: '0.28em',
              color: isDark ? 'rgba(245,240,235,0.9)' : 'var(--text)',
              transition: 'color .35s',
            }}
          >
            MEDUSA
          </span>
        </Link>

        {/* ── Centre links ──────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 36, alignItems: 'center' }}>
          {LINKS.map(l => (
            <Link
              key={l.href}
              href={l.href}
              style={{
                fontSize: 13,
                fontWeight: 400,
                letterSpacing: '0.01em',
                color: isDark ? 'rgba(245,240,235,0.55)' : 'var(--text-2)',
                transition: 'color .2s',
                textDecoration: 'none',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = isDark ? 'rgba(245,240,235,0.9)' : 'var(--text)')}
              onMouseLeave={e => (e.currentTarget.style.color = isDark ? 'rgba(245,240,235,0.55)' : 'var(--text-2)')}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* ── CTA ───────────────────────────────────────────── */}
        <Link
          href="/start"
          className={isDark ? 'btn btn-ghost-inv btn-sm' : 'btn btn-dark btn-sm'}
          style={{ minWidth: 130, textAlign: 'center' }}
        >
          Get your look →
        </Link>
      </div>
    </nav>
  );
}
