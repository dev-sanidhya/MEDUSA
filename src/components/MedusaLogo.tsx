"use client";

interface MarkProps {
  size?: number;
  className?: string;
  animated?: boolean;
}

export function MedusaLogoMark({
  size = 36,
  className = "",
  animated = false,
}: MarkProps) {
  return (
    <svg
      viewBox="0 0 72 84"
      width={size}
      height={Math.round((size * 84) / 72)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient id="medusa-core" x1="12" y1="10" x2="58" y2="74" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffe4ea" />
          <stop offset="38%" stopColor="#fda4af" />
          <stop offset="72%" stopColor="#fb7185" />
          <stop offset="100%" stopColor="#be123c" />
        </linearGradient>
        <linearGradient id="medusa-line" x1="10" y1="8" x2="62" y2="78" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fff7fb" />
          <stop offset="45%" stopColor="#fda4af" />
          <stop offset="100%" stopColor="#e11d48" />
        </linearGradient>
        <radialGradient id="medusa-glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(36 34) rotate(90) scale(34 28)">
          <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
          <stop offset="30%" stopColor="rgba(251,113,133,0.65)" />
          <stop offset="100%" stopColor="rgba(190,24,93,0)" />
        </radialGradient>
        <filter id="medusa-shadow" x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g filter="url(#medusa-shadow)">
        <ellipse cx="36" cy="34" rx="22" ry="24" fill="url(#medusa-glow)" opacity="0.65" />
      </g>

      <path
        d="M36 6c4.2 0 8 1.7 10.7 4.8 1.7-4.3 5.5-7 10-7 6.2 0 11.3 5.1 11.3 11.4 0 2.6-.9 5-2.5 7 4.6 1.5 7.8 5.9 7.8 10.9 0 6.3-5.1 11.4-11.5 11.4-.9 0-1.9-.1-2.8-.4-1.5 6.7-7.4 11.7-14.5 11.7-3.2 0-6.1-1-8.5-2.8-2.4 1.8-5.4 2.8-8.6 2.8-7 0-13-5-14.4-11.7-.9.3-1.9.4-2.9.4C4.1 44.5-1 39.4-1 33.1c0-5 3.2-9.4 7.8-10.9-1.6-2-2.5-4.4-2.5-7 0-6.3 5.1-11.4 11.4-11.4 4.5 0 8.4 2.7 10.1 7C28.3 7.7 31.9 6 36 6Z"
        stroke="url(#medusa-line)"
        strokeWidth="1.3"
        opacity="0.45"
        transform="translate(0 2) scale(0.96)"
      />

      <path
        d="M12 24c3-5.7 7.2-9.6 12.6-11.6M60 24c-3-5.7-7.2-9.6-12.6-11.6M17.5 16.5c.8 5.2-1 9.8-5.3 13.8M54.5 16.5c-.8 5.2 1 9.8 5.3 13.8"
        stroke="url(#medusa-line)"
        strokeWidth="1.35"
        strokeLinecap="round"
        opacity="0.92"
      />

      <path
        d="M24 30.5c0-7.4 5.4-13.5 12-13.5s12 6.1 12 13.5c0 6-2.6 11.4-6.9 15.4-.8.7-1.6 1.6-2.1 2.6L36 55l-3-6.5c-.5-1-1.2-1.9-2-2.6-4.4-4-7-9.5-7-15.4Z"
        fill="rgba(8,8,13,0.82)"
        stroke="url(#medusa-line)"
        strokeWidth="1.5"
      />
      <path
        d="M29.5 29.5c2.7-4.2 10.3-4.2 13 0-1 4.2-3.7 6.3-6.5 6.3s-5.5-2.1-6.5-6.3Z"
        fill="url(#medusa-core)"
      />
      <path
        d="M31 29.6c1.8-2 8.2-2 10 0"
        stroke="#fff7fb"
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity="0.95"
      />
      <circle cx="36" cy="31.5" r="2.4" fill="#0f0f17" />
      <path
        d="M30 43.2c1.8 2.2 3.9 3.3 6 3.3s4.2-1.1 6-3.3"
        stroke="url(#medusa-core)"
        strokeWidth="1.35"
        strokeLinecap="round"
      />
      <path
        d="M28.8 52.8 36 66l7.2-13.2"
        stroke="url(#medusa-line)"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />
      <path
        d="M21.5 61.5c5.2 4.4 9.9 6.5 14.5 6.5s9.3-2.1 14.5-6.5"
        stroke="url(#medusa-line)"
        strokeWidth="1.05"
        strokeLinecap="round"
        opacity="0.7"
      />

      {animated && (
        <ellipse
          cx="36"
          cy="34"
          rx="16"
          ry="18"
          stroke="#fff7fb"
          strokeWidth="0.7"
          opacity="0.35"
        >
          <animate attributeName="rx" values="15;18;15" dur="4.2s" repeatCount="indefinite" />
          <animate attributeName="ry" values="17;20;17" dur="4.2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.15;0.45;0.15" dur="4.2s" repeatCount="indefinite" />
        </ellipse>
      )}
    </svg>
  );
}

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  animated?: boolean;
  className?: string;
}

export function MedusaLogo({
  size = "md",
  showTagline = false,
  animated = false,
  className = "",
}: LogoProps) {
  const markSize = size === "sm" ? 28 : size === "md" ? 40 : 58;
  const titleClass =
    size === "sm"
      ? "text-[1.35rem] tracking-[0.24em]"
      : size === "md"
        ? "text-[1.85rem] tracking-[0.26em]"
        : "text-[2.7rem] tracking-[0.28em]";
  const subtitleClass = size === "sm" ? "text-[8px]" : size === "md" ? "text-[9px]" : "text-[10px]";

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <div className="relative shrink-0">
        <div
          className="absolute inset-0 rounded-full blur-xl opacity-70"
          style={{ background: "radial-gradient(circle, rgba(244,63,94,0.28) 0%, transparent 72%)" }}
        />
        <MedusaLogoMark size={markSize} animated={animated} className="relative" />
      </div>
      <div className="flex flex-col leading-none">
        <span
          className={`font-semibold text-white ${titleClass}`}
          style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', Georgia, serif" }}
        >
          MEDUSA
        </span>
        {showTagline && (
          <span className={`${subtitleClass} mt-1.5 uppercase tracking-[0.42em] text-white/38`}>
            Face-Mapped Makeup
          </span>
        )}
      </div>
    </div>
  );
}

export function MedusaLogoCentered({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <MedusaLogoMark size={84} animated className="drop-shadow-[0_0_24px_rgba(244,63,94,0.18)]" />
      <div className="text-center space-y-2">
        <div
          className="text-5xl font-semibold text-white tracking-[0.3em]"
          style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
        >
          MEDUSA
        </div>
        <div className="text-[10px] uppercase tracking-[0.45em] text-white/35">
          Face-Mapped Makeup
        </div>
      </div>
    </div>
  );
}
