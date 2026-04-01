"use client";

import { useRef, useState, useEffect } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useInView,
} from "framer-motion";
import Link from "next/link";
import { MedusaLogo } from "@/components/MedusaLogo";

// ─── Face Mesh Data ───────────────────────────────────────────────────────────
// ~55 key landmark positions in a 100×92 viewBox space

const OUTLINE_PTS =
  "50,5 58,7 66,11 73,17 78,25 81,35 82,46 80,57 76,67 69,75 60,80 52,84 48,84 40,80 31,75 24,67 20,57 18,46 19,35 22,25 27,17 34,11 42,7";

const L_EYE_PTS = "23,42 29,38 36,37 43,40 36,45 29,45";
const R_EYE_PTS = "57,40 64,37 71,38 77,42 71,45 64,45";
const L_BROW_PTS = "21,31 28,26 35,25 42,27 47,31";
const R_BROW_PTS = "53,31 58,27 65,25 72,26 79,31";
const NOSE_PTS = "50,40 50,54 44,58 50,60 56,58";
const LIPS_PTS = "39,70 45,67 50,65 55,67 61,70 56,77 50,80 44,77";

const ALL_DOTS: [number, number][] = [
  [50,5],[58,7],[66,11],[73,17],[78,25],[81,35],[82,46],[80,57],[76,67],[69,75],[60,80],[52,84],
  [48,84],[40,80],[31,75],[24,67],[20,57],[18,46],[19,35],[22,25],[27,17],[34,11],[42,7],
  [23,42],[29,38],[36,37],[43,40],[36,45],[29,45],
  [57,40],[64,37],[71,38],[77,42],[71,45],[64,45],
  [21,31],[28,26],[35,25],[42,27],[47,31],
  [53,31],[58,27],[65,25],[72,26],[79,31],
  [50,40],[50,54],[44,58],[50,60],[56,58],
  [39,70],[45,67],[50,65],[55,67],[61,70],[56,77],[50,80],[44,77],
];

// ─── Face Mesh SVG ────────────────────────────────────────────────────────────

function FaceMeshSVG({
  opacity = 1,
  glowIntensity = 0.5,
  showMeasurements = false,
  pulseDots = true,
  className = "",
  style = {},
}: {
  opacity?: number;
  glowIntensity?: number;
  showMeasurements?: boolean;
  pulseDots?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const rc = (alpha: number) => `rgba(244,63,94,${(alpha * glowIntensity).toFixed(2)})`;

  return (
    <svg
      viewBox="0 0 100 92"
      className={className}
      style={{ opacity, ...style }}
      aria-hidden="true"
    >
      <defs>
        <filter id="mesh-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id="eye-fill" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(244,63,94,0.15)" />
          <stop offset="100%" stopColor="rgba(244,63,94,0.02)" />
        </radialGradient>
      </defs>

      {/* Face outline */}
      <polygon
        points={OUTLINE_PTS + " 50,5"}
        fill="none"
        stroke={rc(0.35)}
        strokeWidth="0.4"
        filter="url(#mesh-glow)"
      />

      {/* Eye fills */}
      <polygon points={L_EYE_PTS} fill="url(#eye-fill)" stroke={rc(0.6)} strokeWidth="0.45" filter="url(#mesh-glow)" />
      <polygon points={R_EYE_PTS} fill="url(#eye-fill)" stroke={rc(0.6)} strokeWidth="0.45" filter="url(#mesh-glow)" />

      {/* Brows */}
      <polyline points={L_BROW_PTS} fill="none" stroke={rc(0.45)} strokeWidth="0.4" />
      <polyline points={R_BROW_PTS} fill="none" stroke={rc(0.45)} strokeWidth="0.4" />

      {/* Nose */}
      <polyline points={NOSE_PTS} fill="none" stroke={rc(0.3)} strokeWidth="0.4" />

      {/* Lips */}
      <polygon points={LIPS_PTS} fill={rc(0.08)} stroke={rc(0.5)} strokeWidth="0.4" />

      {/* Measurement overlays */}
      {showMeasurements && (
        <g>
          <line x1="16" y1="41" x2="84" y2="41" stroke={rc(0.2)} strokeWidth="0.3" strokeDasharray="1.5,1.5" />
          <line x1="50" y1="5" x2="50" y2="84" stroke={rc(0.15)} strokeWidth="0.3" strokeDasharray="1.5,1.5" />
          <line x1="16" y1="63" x2="84" y2="63" stroke={rc(0.15)} strokeWidth="0.3" strokeDasharray="1.5,1.5" />
          <text x="85" y="42" fill={rc(0.8)} fontSize="2.8" fontFamily="monospace">eye axis</text>
          <text x="85" y="64" fill={rc(0.7)} fontSize="2.8" fontFamily="monospace">jaw line</text>
          <rect x="32" y="87" width="36" height="6.5" rx="1.5" fill={rc(0.15)} stroke={rc(0.4)} strokeWidth="0.3" />
          <text x="50" y="91.5" fill={rc(1)} fontSize="3.2" fontFamily="monospace" textAnchor="middle">precision: 94/100</text>
        </g>
      )}

      {/* Landmark dots */}
      {ALL_DOTS.map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r="0.85"
          fill={rc(0.8)}
          filter="url(#mesh-glow)"
          style={pulseDots ? {
            animation: `dot-pulse 2.5s ${((i * 73) % 1000) / 1000}s ease-in-out infinite`,
          } : undefined}
        />
      ))}
    </svg>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12"
      style={{ height: 64 }}
      animate={{
        background: scrolled ? "rgba(5,5,8,0.85)" : "rgba(5,5,8,0)",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(255,255,255,0)",
        backdropFilter: scrolled ? "blur(20px)" : "blur(0px)",
      }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Link href="/" aria-label="MEDUSA home">
          <MedusaLogo size="sm" />
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="flex items-center gap-4"
      >
        <a href="#how-it-works" className="hidden md:block text-sm text-white/50 hover:text-white/80 transition-colors">
          How it works
        </a>
        <a href="#coming-soon" className="hidden md:block text-sm text-white/50 hover:text-white/80 transition-colors">
          V2
        </a>
        <Link
          href="/app"
          className="text-sm font-medium bg-rose-500 hover:bg-rose-400 text-white px-4 py-2 rounded-full transition-colors"
        >
          Try Now
        </Link>
      </motion.div>
    </motion.nav>
  );
}

// ─── Hero Section ─────────────────────────────────────────────────────────────

function HeroSection() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 50]);
  // Scroll indicator fades away as soon as user starts scrolling
  const scrollIndicatorOpacity = useTransform(scrollYProgress, [0, 0.12], [1, 0]);

  return (
    <section
      ref={ref}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ paddingTop: 64 }}
    >
      {/* Background orbs — overflow:hidden is safe here because this is absolute,
          not an ancestor of the sticky scrollytelling section */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div
          className="absolute top-[-10%] right-[-5%] w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] rounded-full opacity-[0.18]"
          style={{
            background: "radial-gradient(circle, #f43f5e 0%, #9f1239 40%, transparent 70%)",
            filter: "blur(80px)",
            animation: "orb-drift-1 20s ease-in-out infinite",
          }}
        />
        <div
          className="absolute bottom-[-20%] left-[-10%] w-[50vw] h-[50vw] max-w-[700px] max-h-[700px] rounded-full opacity-[0.12]"
          style={{
            background: "radial-gradient(circle, #6d28d9 0%, #4c1d95 40%, transparent 70%)",
            filter: "blur(100px)",
            animation: "orb-drift-2 25s ease-in-out infinite",
          }}
        />
        <div
          className="absolute top-[40%] left-[30%] w-[30vw] h-[30vw] max-w-[400px] max-h-[400px] rounded-full opacity-[0.08]"
          style={{
            background: "radial-gradient(circle, #f43f5e 0%, transparent 70%)",
            filter: "blur(60px)",
            animation: "orb-drift-3 18s ease-in-out infinite",
          }}
        />

        {/* Subtle dot grid */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dot-grid" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dot-grid)" />
        </svg>
      </div>

      {/* Face mesh — large, faded background element */}
      <motion.div
        style={{ y, opacity }}
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        aria-hidden="true"
      >
        <FaceMeshSVG
          opacity={0.06}
          glowIntensity={0.8}
          pulseDots={false}
          className="w-[80vw] max-w-[600px] h-auto"
        />
      </motion.div>

      {/* Main content */}
      <motion.div
        style={{ y: contentY, opacity }}
        className="relative z-10 text-center px-6 max-w-4xl mx-auto"
      >
        {/* Eyebrow label */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.7 }}
          className="inline-flex items-center gap-2 text-xs tracking-[0.3em] uppercase text-rose-400 mb-8 border border-rose-500/25 px-4 py-2 rounded-full glass-card"
        >
          <span className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-pulse" />
          AI-Powered Face Analysis
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="text-[clamp(4rem,12vw,9rem)] font-bold leading-none tracking-tight text-white mb-6"
          style={{ fontFamily: "var(--font-cormorant), Georgia, serif", fontWeight: 600 }}
        >
          Your face.
          <br />
          <span
            className="shimmer-text"
            style={{ fontStyle: "italic" }}
          >
            Perfected.
          </span>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.7 }}
          className="text-lg md:text-xl text-white/50 max-w-xl mx-auto leading-relaxed mb-10"
        >
          MEDUSA maps{" "}
          <span className="text-white/80">478 facial landmarks</span> and builds
          a makeup tutorial written specifically for your geometry — not anyone else.
        </motion.p>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="flex flex-wrap items-center justify-center gap-3 mb-12"
        >
          {[
            "478 Landmark Points",
            "Zero Generic Advice",
            "Privacy First",
            "Personalized to You",
          ].map((pill) => (
            <span
              key={pill}
              className="text-xs text-white/60 border border-white/10 px-3 py-1.5 rounded-full glass-card"
            >
              {pill}
            </span>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75, duration: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="/app"
            className="group relative inline-flex items-center gap-3 bg-rose-500 hover:bg-rose-400 text-white font-semibold px-8 py-4 rounded-full text-base transition-all duration-200 hover:shadow-[0_0_40px_rgba(244,63,94,0.4)]"
          >
            Begin My Analysis
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
          <a
            href="#how-it-works"
            className="text-sm text-white/50 hover:text-white/80 transition-colors flex items-center gap-2"
          >
            See how it works
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="rotate-90">
              <path d="M2 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        </motion.div>

        {/* Privacy note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="text-xs text-white/25 mt-8"
        >
          Photos processed locally — never uploaded or stored.
        </motion.p>
      </motion.div>

      {/* Scroll indicator — mount fade-in wraps the scroll-driven fade-out */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        aria-hidden="true"
      >
        <motion.div
          style={{ opacity: scrollIndicatorOpacity }}
          className="flex flex-col items-center gap-2"
        >
          <span className="text-xs text-white/25 tracking-[0.2em] uppercase">Scroll</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
            className="w-5 h-8 border border-white/15 rounded-full flex items-start justify-center pt-2"
          >
            <div className="w-1 h-2 bg-white/30 rounded-full" />
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────

function StatsBar() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const stats = [
    { value: "478", label: "Landmark Points" },
    { value: "6", label: "Makeup Looks" },
    { value: "100%", label: "Client-Side Processing" },
    { value: "0", label: "Generic Advice" },
  ];

  return (
    <div
      ref={ref}
      className="border-y border-white/[0.06] py-8 md:py-10 px-6 overflow-hidden"
      style={{ background: "rgba(13,13,20,0.5)" }}
    >
      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map(({ value, label }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.1, duration: 0.6 }}
            className="text-center"
          >
            <div
              className="text-3xl md:text-4xl font-bold text-white mb-1"
              style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
            >
              {value}
            </div>
            <div className="text-xs text-white/40 tracking-wide uppercase">{label}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Scrollytelling — How It Works ───────────────────────────────────────────

function PhaseCapture() {
  return (
    <div className="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-20 w-full max-w-5xl mx-auto px-6 h-full">
      {/* Visual */}
      <div className="relative flex-shrink-0 w-52 h-72 md:w-64 md:h-80">
        {/* Phone frame */}
        <div
          className="absolute inset-0 rounded-[2rem] border border-white/15 glass-card"
          style={{ boxShadow: "0 0 60px rgba(244,63,94,0.08), inset 0 0 30px rgba(244,63,94,0.03)" }}
        />
        {/* Screen */}
        <div className="absolute inset-2 rounded-[1.6rem] bg-stone-900/80 overflow-hidden flex items-center justify-center">
          {/* Face area with dashed outline */}
          <div className="relative w-32 h-40">
            <div className="absolute inset-0 border-2 border-dashed border-rose-400/40 rounded-2xl" />
            {/* Corner markers */}
            {[["top-0 left-0", "-translate-x-0.5 -translate-y-0.5"], ["top-0 right-0", "translate-x-0.5 -translate-y-0.5"], ["bottom-0 left-0", "-translate-x-0.5 translate-y-0.5"], ["bottom-0 right-0", "translate-x-0.5 translate-y-0.5"]].map(([pos, tr], i) => (
              <div
                key={i}
                className={`absolute ${pos} w-4 h-4 border-rose-400 ${
                  i === 0 ? "border-t-2 border-l-2 rounded-tl" :
                  i === 1 ? "border-t-2 border-r-2 rounded-tr" :
                  i === 2 ? "border-b-2 border-l-2 rounded-bl" :
                  "border-b-2 border-r-2 rounded-br"
                } transform ${tr}`}
              />
            ))}
            {/* Face silhouette */}
            <FaceMeshSVG opacity={0.5} glowIntensity={0.7} pulseDots className="absolute inset-2" />
          </div>
          {/* Bottom bar */}
          <div className="absolute bottom-4 inset-x-4 flex items-center justify-center">
            <div className="bg-rose-500/80 text-white text-[10px] font-medium px-4 py-1.5 rounded-full tracking-wide">
              Face detected ✓
            </div>
          </div>
        </div>
        {/* Upload arrow animation */}
        <motion.div
          animate={{ y: [8, -8, 8] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
          className="absolute -right-10 top-1/2 -translate-y-1/2"
        >
          <div className="w-8 h-8 rounded-full border border-rose-400/40 flex items-center justify-center text-rose-400">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 11V3M3 7l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </motion.div>
      </div>

      {/* Text */}
      <div className="max-w-sm text-center lg:text-left">
        <div className="text-xs text-rose-400 tracking-[0.25em] uppercase mb-4 font-medium">Step 01</div>
        <h3
          className="text-4xl md:text-5xl font-bold text-white mb-5 leading-tight"
          style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
        >
          Upload a selfie.
        </h3>
        <p className="text-white/55 text-base leading-relaxed">
          One photo. Straight on, natural light, no filters.
          MEDUSA processes everything on your device — your face never leaves your browser.
        </p>
        <div className="mt-6 flex flex-wrap gap-2 justify-center lg:justify-start">
          {["Drag & Drop", "Mobile Camera", "Photo Library"].map((t) => (
            <span key={t} className="text-xs text-white/40 border border-white/10 px-3 py-1 rounded-full">
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function PhaseAnalyze() {
  return (
    <div className="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-20 w-full max-w-5xl mx-auto px-6 h-full">
      {/* Visual */}
      <div className="relative flex-shrink-0 w-60 h-64 md:w-72 md:h-80">
        <FaceMeshSVG
          opacity={1}
          glowIntensity={0.9}
          showMeasurements
          pulseDots
          className="w-full h-full"
          style={{ filter: "drop-shadow(0 0 20px rgba(244,63,94,0.25))" }}
        />
        {/* Scan line */}
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg"
          aria-hidden="true"
        >
          <motion.div
            animate={{ y: ["0%", "100%"] }}
            transition={{ repeat: Infinity, duration: 3, ease: "linear", repeatDelay: 1 }}
            className="w-full h-0.5 bg-gradient-to-r from-transparent via-rose-400/50 to-transparent"
          />
        </div>
        {/* Floating metric chips */}
        {[
          { label: "Face Shape", value: "Oval",  pos: { left: "-24%", top: "20%" }, delay: 0 },
          { label: "Eye Set",    value: "Wide",  pos: { left: "105%", top: "40%" }, delay: 0.9 },
          { label: "Lip Ratio", value: "0.72",  pos: { left: "-20%", top: "72%" }, delay: 1.7 },
        ].map(({ label, value, pos, delay }) => (
          <motion.div
            key={label}
            animate={{ opacity: [0.55, 1, 0.55] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut", delay }}
            className="absolute glass-card text-[10px] px-2.5 py-1.5 rounded-lg"
            style={{ ...pos, whiteSpace: "nowrap", borderColor: "rgba(244,63,94,0.2)" }}
          >
            <div className="text-white/40">{label}</div>
            <div className="text-rose-400 font-semibold font-mono">{value}</div>
          </motion.div>
        ))}
      </div>

      {/* Text */}
      <div className="max-w-sm text-center lg:text-left">
        <div className="text-xs text-rose-400 tracking-[0.25em] uppercase mb-4 font-medium">Step 02</div>
        <h3
          className="text-4xl md:text-5xl font-bold text-white mb-5 leading-tight"
          style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
        >
          478-point face read.
        </h3>
        <p className="text-white/55 text-base leading-relaxed">
          MediaPipe maps every contour — eye shape, lip fullness, face geometry,
          skin tone, cheekbone placement. Measured in real millimetres.
          No approximations.
        </p>
        <div className="mt-6 space-y-2.5">
          {[
            "Face shape classification",
            "Eye shape & tilt angle",
            "Lip proportions & symmetry",
            "Skin tone & undertone",
          ].map((item) => (
            <div key={item} className="flex items-center gap-2.5 justify-center lg:justify-start">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 flex-shrink-0" />
              <span className="text-sm text-white/50">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PhaseTutorial() {
  const steps = [
    { num: "01", title: "Prep & Prime", zone: "Full Face", body: "Start with a hydrating primer. Given your combination T-zone, focus product on the center panel only." },
    { num: "02", title: "Foundation Placement", zone: "Base", body: "Your oval face benefits from blending foundation from center outward. Skip the hairline — you don't need coverage there." },
    { num: "03", title: "Eye Sculpting", zone: "Eyes", body: "Your almond eyes with slight upward tilt — extend the liner outward and upward at 15° to enhance your natural lift." },
  ];

  return (
    <div className="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-16 w-full max-w-5xl mx-auto px-6 h-full">
      {/* Visual — stacked card deck.
          Keep the stack geometry deterministic so copy length never
          collapses cards into each other on narrower viewports. */}
      <div className="relative flex-shrink-0 w-full max-w-[26rem] lg:max-w-[24rem] h-[16.5rem] md:h-[18rem]">
        {steps.map((step, i) => {
          const isFrontCard = i === 0;
          const bg = i === 0 ? "#131320" : i === 1 ? "#0f0f1c" : "#0c0c17";
          const border = i === 0 ? "rgba(244,63,94,0.35)" : i === 1 ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.05)";
          const shadow = i === 0
            ? "0 0 28px rgba(244,63,94,0.1), 0 8px 32px rgba(0,0,0,0.7)"
            : "0 4px 20px rgba(0,0,0,0.5)";
          const topOffset = i * 18;

          return (
            <motion.div
              key={step.num}
              animate={{ y: [0, -5 + i, 0] }}
              transition={{ repeat: Infinity, duration: 3.2 + i * 0.5, ease: "easeInOut", delay: i * 0.7 }}
              className="absolute inset-x-0"
              style={{
                top: `${topOffset}px`,
                zIndex: 3 - i,
                opacity: 1 - i * 0.18,
                transform: `scale(${1 - i * 0.035})`,
                transformOrigin: "top center",
              }}
            >
              <div
                className="w-full rounded-[1.75rem] border px-5 py-4"
                style={{ background: bg, borderColor: border, boxShadow: shadow }}
              >
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <span className="text-[10px] text-rose-400 font-mono font-semibold tracking-[0.18em]">STEP {step.num}</span>
                  <span className="text-[10px] text-white/35 border border-white/10 px-3 py-1 rounded-full shrink-0">{step.zone}</span>
                </div>
                <div className={`${isFrontCard ? "text-2xl" : "text-base"} font-semibold text-white leading-tight`}>
                  {step.title}
                </div>
                {isFrontCard ? (
                  <div className="mt-3 text-[13px] text-white/55 leading-relaxed max-w-[30ch]">
                    {step.body}
                  </div>
                ) : (
                  <div className="mt-2 text-[11px] text-white/20 leading-relaxed max-w-[24ch]">
                    {step.body}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Text */}
      <div className="max-w-sm text-center lg:text-left">
        <div className="text-xs text-rose-400 tracking-[0.25em] uppercase mb-4 font-medium">Step 03</div>
        <h3
          className="text-4xl md:text-5xl font-bold text-white mb-5 leading-tight"
          style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
        >
          Your tutorial.
          <br />
          <span style={{ fontStyle: "italic" }}>Only yours.</span>
        </h3>
        <p className="text-white/55 text-base leading-relaxed">
          Every step is written for your measurements. The placement, the angle, the technique —
          all calculated from your face geometry. Nothing that could be said to anyone else.
        </p>
        <div className="mt-8">
          <Link
            href="/app"
            className="inline-flex items-center gap-2 text-sm font-medium text-rose-400 hover:text-rose-300 transition-colors group"
          >
            Start your analysis
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function ScrollytellingSection() {
  // containerRef wraps the full 360vh scroll distance.
  // The sticky child stays at top:0 for the entire scroll.
  // IMPORTANT: no overflow on any ancestor of this section (main has no overflow-x-hidden).
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Mild spring for smooth feel without lag
  const smoothProgress = useSpring(scrollYProgress, { damping: 35, stiffness: 200, restDelta: 0.001 });

  // Each phase occupies ~1/3 of the scroll range.
  // Transitions overlap by ~0.06 for a crossfade feel.
  //
  //   Phase 1: fully visible 0.02 → 0.28, fades out by 0.38
  //   Phase 2: fades in 0.28 → 0.38, fully visible 0.38 → 0.60, fades out by 0.70
  //   Phase 3: fades in 0.60 → 0.72, fully visible 0.72 → 1.0
  const phase1Opacity = useTransform(smoothProgress, [0, 0.04, 0.28, 0.38], [0, 1, 1, 0]);
  const phase2Opacity = useTransform(smoothProgress, [0.28, 0.38, 0.60, 0.70], [0, 1, 1, 0]);
  const phase3Opacity = useTransform(smoothProgress, [0.60, 0.72, 1,   1  ], [0, 1, 1, 1]);

  // Subtle vertical parallax per phase
  const phase1Y = useTransform(smoothProgress, [0,    0.38], [20,  -30]);
  const phase2Y = useTransform(smoothProgress, [0.28, 0.70], [30,  -30]);
  const phase3Y = useTransform(smoothProgress, [0.60, 1   ], [30,    0]);

  // 3D tilt on face mesh during phase 2
  const meshRotateY = useTransform(smoothProgress, [0.28, 0.65], [-7, 7]);
  const meshRotateX = useTransform(smoothProgress, [0.28, 0.65], [ 4, -4]);

  // Progress dot brightness
  const dot1Scale = useTransform(smoothProgress, [0, 0.04, 0.38], [0.4, 1, 0.4]);
  const dot2Scale = useTransform(smoothProgress, [0.28, 0.38, 0.70], [0.4, 1, 0.4]);
  const dot3Scale = useTransform(smoothProgress, [0.60, 0.72, 1 ], [0.4, 1, 1]);

  // Shifting background tint
  const bgGradient = useTransform(
    smoothProgress,
    [0, 0.33, 0.66, 1],
    [
      "radial-gradient(ellipse at 75% 50%, rgba(244,63,94,0.05) 0%, transparent 55%)",
      "radial-gradient(ellipse at 50% 50%, rgba(244,63,94,0.08) 0%, transparent 55%)",
      "radial-gradient(ellipse at 25% 50%, rgba(244,63,94,0.05) 0%, transparent 55%)",
      "radial-gradient(ellipse at 35% 50%, rgba(109,40,217,0.06) 0%, transparent 55%)",
    ]
  );

  // Step label driven by scroll
  const [stepLabel, setStepLabel] = useState("01 / 03");
  useEffect(() => {
    return smoothProgress.on("change", (v) => {
      setStepLabel(v < 0.38 ? "01 / 03" : v < 0.70 ? "02 / 03" : "03 / 03");
    });
  }, [smoothProgress]);

  return (
    <section id="how-it-works">
      {/* ── Section header (above the sticky zone) ── */}
      <div className="pt-24 pb-14 px-6 text-center">
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-xs text-rose-400 tracking-[0.3em] uppercase mb-4"
        >
          The Process
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-6xl font-bold text-white leading-tight"
          style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
        >
          How MEDUSA works
        </motion.h2>
      </div>

      {/* ── Scrollytelling: 360vh outer, 100vh sticky inner ──
          The outer div is 360vh tall — it IS the scroll distance.
          The inner div is sticky: it stays fixed on screen while you scroll through the outer.
          Three phases are absolutely positioned inside the sticky div and crossfade via scroll progress.
      ── */}
      <div ref={containerRef} style={{ height: "360vh" }}>
        {/* Sticky viewport — fills 100vh, clips phase content */}
        <div
          style={{
            position: "sticky",
            top: 0,
            height: "100vh",
            overflow: "hidden",   // safe on the sticky element itself
          }}
        >
          {/* Shifting background tint */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{ background: bgGradient }}
            aria-hidden="true"
          />

          {/* ── Phase 1 — Upload ── */}
          <motion.div
            style={{ opacity: phase1Opacity, y: phase1Y }}
            className="absolute inset-0 flex items-center justify-center px-4"
          >
            <PhaseCapture />
          </motion.div>

          {/* ── Phase 2 — Analyze (3D tilt wrapper) ── */}
          <motion.div
            style={{ opacity: phase2Opacity, y: phase2Y }}
            className="absolute inset-0 flex items-center justify-center px-4"
          >
            <div style={{ perspective: "1200px", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <motion.div
                style={{ rotateY: meshRotateY, rotateX: meshRotateX }}
                className="w-full flex items-center justify-center"
              >
                <PhaseAnalyze />
              </motion.div>
            </div>
          </motion.div>

          {/* ── Phase 3 — Tutorial ── */}
          <motion.div
            style={{ opacity: phase3Opacity, y: phase3Y }}
            className="absolute inset-0 flex items-center justify-center px-4"
          >
            <PhaseTutorial />
          </motion.div>

          {/* ── Side progress dots ── */}
          <div className="absolute right-5 md:right-9 top-1/2 -translate-y-1/2 flex flex-col gap-3">
            {[dot1Scale, dot2Scale, dot3Scale].map((sc, i) => (
              <div key={i} className="relative w-2 h-2">
                <div className="absolute inset-0 rounded-full bg-white/10" />
                <motion.div
                  className="absolute inset-0 rounded-full bg-rose-400"
                  style={{ scale: sc, opacity: sc }}
                />
              </div>
            ))}
          </div>

          {/* ── Step counter ── */}
          <div className="absolute left-5 md:left-9 bottom-9">
            <span className="text-white/20 text-xs font-mono tracking-widest">{stepLabel}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Features Section ─────────────────────────────────────────────────────────

function FeaturesSection() {
  const features = [
    {
      icon: "◈",
      title: "478 Landmark Points",
      body: "MediaPipe Face Landmarker runs entirely in your browser. Every measurement taken locally — zero data sent to any server.",
    },
    {
      icon: "◉",
      title: "Precision Scoring",
      body: "Each photo is scored for angle, lighting, and landmark confidence before analysis begins. Bad photo? We'll ask for a better one.",
    },
    {
      icon: "✦",
      title: "Skin Tone Reading",
      body: "Beyond just 'fair' or 'deep'. MEDUSA reads your undertone, surface tone, and condition to guide color selection precisely.",
    },
    {
      icon: "⬡",
      title: "6 Curated Looks",
      body: "Natural. Soft Glam. Evening. Bold Lip. Monochromatic. Editorial. Each look DNA is distinct — step count, products, and intensity all calibrated.",
    },
    {
      icon: "◫",
      title: "Step-by-Step Guidance",
      body: "5 to 12 steps per look. Every instruction includes the product, the color, the technique — and what NOT to do on YOUR face.",
    },
    {
      icon: "◧",
      title: "Privacy by Design",
      body: "No account. No storage. No uploads. Your photo is processed client-side and discarded the moment you close the tab.",
    },
  ];

  return (
    <section className="py-24 px-6" style={{ background: "rgba(8,8,13,0.8)" }}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs text-rose-400 tracking-[0.3em] uppercase mb-4"
          >
            What&apos;s Inside
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-white"
            style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
          >
            Built for precision
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(({ icon, title, body }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.07, duration: 0.6 }}
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
              className="glass-card rounded-2xl p-6 cursor-default group"
              style={{ animation: "border-glow-pulse 4s ease-in-out infinite", animationDelay: `${i * 0.5}s` }}
            >
              <div
                className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 text-lg mb-4 group-hover:bg-rose-500/15 transition-colors"
              >
                {icon}
              </div>
              <h3 className="text-white font-semibold text-base mb-2">{title}</h3>
              <p className="text-white/45 text-sm leading-relaxed">{body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── V2 Teaser Section ────────────────────────────────────────────────────────

function V2Section() {
  const v2Cards = [
    {
      tag: "Coming in V2",
      title: "Custom Tutorials on Prompt",
      body: "Describe your vibe — \"old money evening look\" or \"90s grunge\" — and get a full tutorial written for your exact face geometry.",
      gradient: "from-rose-500/15 to-pink-500/5",
      icon: "✍",
    },
    {
      tag: "Coming in V2",
      title: "AI Product Recommendations",
      body: "Based on your face analysis, skin tone, and selected look — specific product picks with shades matched to your exact measurements.",
      gradient: "from-violet-500/15 to-purple-500/5",
      icon: "◈",
    },
    {
      tag: "Coming in V2",
      title: "Expanded Look Library",
      body: "Seasonal, editorial, and trend-based looks. New aesthetics added monthly — each one carrying a full tutorial personalized to you.",
      gradient: "from-amber-500/10 to-orange-500/5",
      icon: "⬡",
    },
    {
      tag: "Coming in V2",
      title: "Artist-Taught Techniques",
      body: "Top makeup artists explain their techniques — MEDUSA adapts their methods to your face profile automatically.",
      gradient: "from-sky-500/12 to-blue-500/5",
      icon: "◉",
    },
  ];

  return (
    <section id="coming-soon" className="py-28 px-6" style={{ background: "#050508" }}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 text-xs text-violet-300 tracking-[0.25em] uppercase border border-violet-500/25 px-4 py-2 rounded-full glass-card mb-6"
          >
            <span className="w-1.5 h-1.5 bg-violet-400 rounded-full" />
            Version 2 · In Development
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold text-white mb-5 leading-tight"
            style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
          >
            What&apos;s coming next
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-white/45 text-base max-w-lg mx-auto"
          >
            MEDUSA V1 is the foundation. V2 turns it into a full beauty intelligence platform.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {v2Cards.map(({ tag, title, body, gradient, icon }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.1, duration: 0.7 }}
              className={`relative rounded-2xl p-7 glass-card overflow-hidden group hover:scale-[1.01] transition-transform duration-200`}
            >
              {/* Card gradient background */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-60 pointer-events-none`}
                aria-hidden="true"
              />
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-5">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 text-lg">
                    {icon}
                  </div>
                  <span className="text-[10px] text-white/35 border border-white/10 px-2.5 py-1 rounded-full tracking-wide">
                    {tag}
                  </span>
                </div>
                <h3
                  className="text-xl font-semibold text-white mb-3"
                  style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
                >
                  {title}
                </h3>
                <p className="text-white/45 text-sm leading-relaxed">{body}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* V2 CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center"
        >
          <p className="text-white/30 text-sm">
            Want to be notified when V2 launches?{" "}
            <a href="mailto:hello@medusa.ai" className="text-rose-400 hover:text-rose-300 transition-colors underline underline-offset-4">
              Get in touch
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}

// ─── CTA Section ──────────────────────────────────────────────────────────────

function CTASection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      ref={ref}
      className="relative py-32 px-6 overflow-hidden"
      style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(244,63,94,0.08) 0%, transparent 70%), #050508" }}
    >
      {/* Background accent */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
      >
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-[0.04]"
          style={{
            background: "radial-gradient(circle, #f43f5e 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />
        {/* Faded face mesh */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.025]">
          <FaceMeshSVG
            opacity={1}
            glowIntensity={1}
            pulseDots={false}
            className="w-[400px] h-auto"
          />
        </div>
      </div>

      <div className="relative z-10 max-w-2xl mx-auto text-center">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          className="text-xs text-rose-400 tracking-[0.3em] uppercase mb-6"
        >
          Ready?
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold text-white leading-none mb-6"
          style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
        >
          Your face has
          <br />
          <span style={{ fontStyle: "italic" }}>a story.</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
          className="text-white/45 text-lg mb-10 leading-relaxed"
        >
          Let MEDUSA read it. One photo. Five minutes.
          A tutorial built entirely around your face.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: 0.3 }}
        >
          <Link
            href="/app"
            className="inline-flex items-center gap-3 bg-white text-stone-950 font-semibold px-10 py-5 rounded-full text-base hover:bg-rose-50 transition-all duration-200 hover:shadow-[0_0_50px_rgba(244,63,94,0.25)] group"
          >
            Begin My Analysis
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.5 }}
          className="text-white/20 text-xs mt-6"
        >
          Free · No account required · Photos stay on your device
        </motion.p>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer
      className="border-t border-white/[0.06] py-10 px-6"
      style={{ background: "#050508" }}
    >
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <span
            className="text-xl font-bold tracking-wider text-white/70"
            style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
          >
            MEDUSA
          </span>
          <span className="text-white/20 text-xs">·</span>
          <span className="text-white/30 text-xs">AI Makeup Artist</span>
        </div>

        <div className="flex items-center gap-6">
          <a href="#how-it-works" className="text-xs text-white/30 hover:text-white/60 transition-colors">
            How it works
          </a>
          <a href="#coming-soon" className="text-xs text-white/30 hover:text-white/60 transition-colors">
            V2
          </a>
          <Link href="/app" className="text-xs text-rose-400/70 hover:text-rose-400 transition-colors">
            Try Now
          </Link>
        </div>

        <p className="text-white/20 text-xs">
          Photos processed locally. Zero data stored.
        </p>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  // NOTE: NO overflow-x-hidden on <main> — it would create a new scroll container
  // and break position:sticky inside ScrollytellingSection.
  // Overflow clipping is handled per-section where needed.
  return (
    <main className="bg-[#050508] text-white">
      <Navbar />
      <HeroSection />
      <StatsBar />
      <ScrollytellingSection />
      <FeaturesSection />
      <V2Section />
      <CTASection />
      <Footer />
    </main>
  );
}
