"use client";

/**
 * MedusaLogo — Brand mark + wordmark
 *
 * Mark: a minimal face — oval outline, two eye dots, one lip arc.
 * Intentionally this simple. Scales cleanly from 20px to 200px.
 * Uses `currentColor` throughout.
 */

interface MarkProps {
  size?: number;
  className?: string;
}

export function MedusaLogoMark({ size = 32, className = "" }: MarkProps) {
  return (
    <svg
      viewBox="0 0 24 30"
      width={size}
      height={Math.round((size * 30) / 24)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      {/* Face oval */}
      <ellipse
        cx="12"
        cy="15"
        rx="10.5"
        ry="13.5"
        stroke="currentColor"
        strokeWidth="1"
      />
      {/* Left eye */}
      <circle cx="8" cy="12" r="1.65" fill="currentColor" />
      {/* Right eye */}
      <circle cx="16" cy="12" r="1.65" fill="currentColor" />
      {/* Lip arc */}
      <path
        d="M 8 21 Q 12 25 16 21"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  animated?: boolean;
  className?: string;
}

export function MedusaLogo({ size = "md", showTagline = false, className = "" }: LogoProps) {
  const markSize = size === "sm" ? 22 : size === "md" ? 30 : 46;
  const wordSize =
    size === "sm"
      ? "text-xl tracking-[0.16em]"
      : size === "md"
      ? "text-2xl tracking-[0.18em]"
      : "text-4xl tracking-[0.2em]";

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <MedusaLogoMark size={markSize} className="text-rose-400 flex-shrink-0" />
      <div className="flex flex-col leading-none">
        <span
          className={`font-semibold text-white ${wordSize}`}
          style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', Georgia, serif" }}
        >
          MEDUSA
        </span>
        {showTagline && (
          <span className="text-[9px] text-white/35 tracking-[0.28em] uppercase mt-1">
            AI Makeup Artist
          </span>
        )}
      </div>
    </div>
  );
}

export function MedusaLogoCentered({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <MedusaLogoMark size={60} className="text-rose-400" />
      <div className="text-center space-y-1">
        <div
          className="text-5xl font-semibold text-white tracking-[0.22em]"
          style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
        >
          MEDUSA
        </div>
        <div className="text-[10px] text-white/35 tracking-[0.35em] uppercase">
          AI Makeup Artist
        </div>
      </div>
    </div>
  );
}
