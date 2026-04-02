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

// â”€â”€â”€ Face Mesh Data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// ~55 key landmark positions in a 100Ã—92 viewBox space

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

// â”€â”€â”€ Face Mesh SVG â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€â”€ Navbar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€â”€ Hero Section â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function HeroSection() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 50]);
  const scrollIndicatorOpacity = useTransform(scrollYProgress, [0, 0.12], [1, 0]);

  const heroNotes = [
    ["478 points", "Landmark mapping reads structure before the model writes anything."],
    ["Client-side first pass", "Photos stay local for detection, geometry, and quality checks."],
    ["Look-specific direction", "Output changes by look instead of recycling generic beauty advice."],
  ];

  return (
    <section
      ref={ref}
      className="relative flex min-h-screen items-center overflow-hidden"
      style={{ paddingTop: 64 }}
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div
          className="absolute top-[-10%] right-[-5%] h-[60vw] max-h-[800px] w-[60vw] max-w-[800px] rounded-full opacity-[0.18]"
          style={{
            background: "radial-gradient(circle, #f43f5e 0%, #9f1239 40%, transparent 70%)",
            filter: "blur(80px)",
            animation: "orb-drift-1 20s ease-in-out infinite",
          }}
        />
        <div
          className="absolute bottom-[-20%] left-[-10%] h-[50vw] max-h-[700px] w-[50vw] max-w-[700px] rounded-full opacity-[0.12]"
          style={{
            background: "radial-gradient(circle, #6d28d9 0%, #4c1d95 40%, transparent 70%)",
            filter: "blur(100px)",
            animation: "orb-drift-2 25s ease-in-out infinite",
          }}
        />
        <div
          className="absolute left-[30%] top-[40%] h-[30vw] max-h-[400px] w-[30vw] max-w-[400px] rounded-full opacity-[0.08]"
          style={{
            background: "radial-gradient(circle, #f43f5e 0%, transparent 70%)",
            filter: "blur(60px)",
            animation: "orb-drift-3 18s ease-in-out infinite",
          }}
        />

        <svg className="absolute inset-0 h-full w-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dot-grid" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dot-grid)" />
        </svg>
      </div>

      <motion.div
        style={{ y, opacity }}
        className="absolute inset-0 flex items-center justify-end pr-[6vw] pointer-events-none"
        aria-hidden="true"
      >
        <FaceMeshSVG
          opacity={0.08}
          glowIntensity={0.8}
          pulseDots={false}
          className="h-auto w-[78vw] max-w-[720px]"
        />
      </motion.div>

      <motion.div
        style={{ y: contentY, opacity }}
        className="relative z-10 mx-auto w-full max-w-7xl px-6 py-20"
      >
        <div className="grid gap-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] lg:items-end">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.7 }}
              className="mb-10 inline-flex items-center gap-3 border border-rose-500/20 bg-rose-500/8 px-4 py-2 text-[11px] uppercase tracking-[0.34em] text-rose-300"
            >
              <span className="h-2 w-2 rounded-full bg-rose-400" />
              Face-Mapped Makeup
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="text-[clamp(4.2rem,10vw,8.5rem)] font-semibold leading-[0.92] tracking-[-0.03em] text-white"
              style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
            >
              Makeup, mapped
              <br />
              <span className="text-white/72" style={{ fontStyle: "italic" }}>
                to your face.
              </span>
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.7 }}
              className="mt-8 grid gap-8 border-t border-white/10 pt-8 lg:grid-cols-[minmax(0,1fr)_180px]"
            >
              <p className="max-w-2xl text-base leading-8 text-white/58 md:text-lg">
                MEDUSA reads facial structure, tone cues, and feature balance before it writes a routine.
                The result is placement, product direction, and technique that feel authored for your face,
                not generated for everyone.
              </p>
              <div className="space-y-3 border-l border-white/10 pl-6 text-xs uppercase tracking-[0.22em] text-white/32">
                <p>Geometry-backed read</p>
                <p>Quality gate first</p>
                <p>Look-by-look direction</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.58, duration: 0.7 }}
              className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center"
            >
              <Link
                href="/app"
                className="group inline-flex items-center gap-3 rounded-full bg-rose-500 px-8 py-4 text-sm font-semibold uppercase tracking-[0.16em] text-white transition-all duration-200 hover:bg-rose-400 hover:shadow-[0_0_36px_rgba(244,63,94,0.35)]"
              >
                Start Analysis
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-3 text-sm uppercase tracking-[0.16em] text-white/46 transition-colors hover:text-white/74"
              >
                Read the process
                <span className="text-lg leading-none">↓</span>
              </a>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.85 }}
            className="relative"
          >
            <div className="absolute inset-y-10 right-0 hidden w-px bg-white/8 lg:block" />
            <div className="relative overflow-hidden rounded-[2.4rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.01))] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.5)]">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(244,63,94,0.16),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(96,165,250,0.08),transparent_35%)]" />
              <div className="relative">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-rose-300">Live Read Preview</p>
                    <p className="mt-1 text-sm text-white/38">What the system isolates before tutorial generation.</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-white/26">Precision Gate</p>
                    <p className="mt-1 text-2xl text-white" style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}>
                      94/100
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-5 md:grid-cols-[minmax(0,1fr)_150px]">
                  <div className="relative overflow-hidden rounded-[1.9rem] border border-white/10 bg-black/25 px-5 py-6">
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rose-400/55 to-transparent" />
                    <div className="absolute inset-0 bg-[linear-gradient(transparent_0%,rgba(255,255,255,0.025)_50%,transparent_100%)]" />
                    <div className="relative">
                      <FaceMeshSVG
                        opacity={0.95}
                        glowIntensity={1}
                        showMeasurements
                        pulseDots={false}
                        className="mx-auto h-auto w-[85%] max-w-[320px]"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    {heroNotes.map(([title, body]) => (
                      <div key={title} className="border border-white/10 bg-white/[0.025] p-3">
                        <p className="text-[10px] uppercase tracking-[0.24em] text-white/28">{title}</p>
                        <p className="mt-2 text-sm leading-6 text-white/56">{body}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5 grid gap-3 border-t border-white/10 pt-4 text-xs uppercase tracking-[0.18em] text-white/30 sm:grid-cols-3">
                  <div>
                    <p>Eye axis</p>
                    <p className="mt-2 text-white/58">Balanced</p>
                  </div>
                  <div>
                    <p>Undertone</p>
                    <p className="mt-2 text-white/58">Neutral warm</p>
                  </div>
                  <div>
                    <p>Placement logic</p>
                    <p className="mt-2 text-white/58">Written after read</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        className="absolute bottom-8 left-6 md:left-10 lg:left-[max(2rem,calc((100vw-80rem)/2+1.5rem))]"
        aria-hidden="true"
      >
        <motion.div
          style={{ opacity: scrollIndicatorOpacity }}
          className="flex items-center gap-3"
        >
          <span className="text-xs uppercase tracking-[0.2em] text-white/25">Scroll</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15"
          >
            <div className="text-white/36">↓</div>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}

function StatsBar() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const stats = [
    { value: "478", label: "landmark points", note: "facial map used before any tutorial copy" },
    { value: "6", label: "looks in v1", note: "each routine shifts steps, finish, and intensity" },
    { value: "100%", label: "client-side first pass", note: "detection and geometry stay in-browser" },
    { value: "3", label: "photos max", note: "only when MEDUSA needs a better read" },
  ];

  return (
    <div
      ref={ref}
      className="overflow-hidden border-y border-white/[0.06] px-6 py-6 md:py-8"
      style={{ background: "linear-gradient(180deg, rgba(10,10,16,0.88), rgba(10,10,16,0.62))" }}
    >
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="border-b border-white/10 pb-4 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-6"
        >
          <p className="text-[10px] uppercase tracking-[0.28em] text-rose-300">Product Frame</p>
          <p className="mt-3 max-w-[14rem] text-sm leading-6 text-white/48">
            The product works best when the interface feels measured, not decorative. These are the actual constraints.
          </p>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(({ value, label, note }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              className="border-l border-white/10 pl-4"
            >
              <div
                className="mb-1 text-3xl font-semibold text-white md:text-4xl"
                style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
              >
                {value}
              </div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-white/34">{label}</div>
              <p className="mt-3 max-w-[16rem] text-sm leading-6 text-white/46">{note}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

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
          Start with one clear photo.
        </h3>
        <p className="text-white/55 text-base leading-relaxed">
          One photo. Straight on, natural light, no filters.
          MEDUSA reads the image in your browser first, so the raw photo stays with you.
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
          Feature mapping.
        </h3>
        <p className="text-white/55 text-base leading-relaxed">
          MediaPipe reads contour, eye shape, lip balance, face shape,
          and tone cues, then turns that read into practical placement decisions.
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
    { num: "02", title: "Foundation Placement", zone: "Base", body: "Your oval face benefits from blending foundation from the center outward. Leave the hairline lighter for a cleaner finish." },
    { num: "03", title: "Eye Sculpting", zone: "Eyes", body: "Your almond eyes already lift upward, so extending liner slightly outward keeps that shape sharp without overworking it." },
  ];

  return (
    <div className="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-16 w-full max-w-5xl mx-auto px-6 h-full">
      {/* Visual â€” stacked card deck.
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
          Your routine.
          <br />
          <span style={{ fontStyle: "italic" }}>Built around your features.</span>
        </h3>
        <p className="text-white/55 text-base leading-relaxed">
          Every step is written for your measurements. The placement, angle,
          and product direction are tailored to your proportions.
        </p>
        <div className="mt-8">
          <Link
            href="/app"
            className="inline-flex items-center gap-2 text-sm font-medium text-rose-400 hover:text-rose-300 transition-colors group"
          >
            Start Analysis
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
      {/* â”€â”€ Section header (above the sticky zone) â”€â”€ */}
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

      {/* â”€â”€ Scrollytelling: 360vh outer, 100vh sticky inner â”€â”€
          The outer div is 360vh tall â€” it IS the scroll distance.
          The inner div is sticky: it stays fixed on screen while you scroll through the outer.
          Three phases are absolutely positioned inside the sticky div and crossfade via scroll progress.
      â”€â”€ */}
      <div ref={containerRef} style={{ height: "360vh" }}>
        {/* Sticky viewport â€” fills 100vh, clips phase content */}
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

          {/* â”€â”€ Phase 1 â€” Upload â”€â”€ */}
          <motion.div
            style={{ opacity: phase1Opacity, y: phase1Y }}
            className="absolute inset-0 flex items-center justify-center px-4"
          >
            <PhaseCapture />
          </motion.div>

          {/* â”€â”€ Phase 2 â€” Analyze (3D tilt wrapper) â”€â”€ */}
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

          {/* â”€â”€ Phase 3 â€” Tutorial â”€â”€ */}
          <motion.div
            style={{ opacity: phase3Opacity, y: phase3Y }}
            className="absolute inset-0 flex items-center justify-center px-4"
          >
            <PhaseTutorial />
          </motion.div>

          {/* â”€â”€ Side progress dots â”€â”€ */}
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

          {/* â”€â”€ Step counter â”€â”€ */}
          <div className="absolute left-5 md:left-9 bottom-9">
            <span className="text-white/20 text-xs font-mono tracking-widest">{stepLabel}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// â”€â”€â”€ Features Section â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function FeaturesSection() {
  const features = [
    {
      index: "01",
      title: "Landmark map first",
      body: "MediaPipe Face Landmarker runs in-browser, so geometry, symmetry, and placement anchors are read before any agent output is generated.",
      note: "Client-side detection",
    },
    {
      index: "02",
      title: "Quality gate before analysis",
      body: "Angle, lighting, framing, and landmark confidence are scored up front. Low-quality photos do not get politely guessed at.",
      note: "Precision scoring",
    },
    {
      index: "03",
      title: "Tone cues with structure",
      body: "Tone, undertone, and visible contrast are read alongside eye shape, lip balance, and facial proportions so shade direction is not disconnected from the rest of the face.",
      note: "Color direction",
    },
    {
      index: "04",
      title: "Six looks, six different routines",
      body: "Natural, soft glam, evening, bold lip, monochromatic, and editorial each change intensity, sequencing, and placement instead of reusing one generic routine.",
      note: "Look DNA",
    },
    {
      index: "05",
      title: "Step writing stays specific",
      body: "Tutorial steps call out placement, finish, product type, and what to avoid on your face, so the routine reads like guidance instead of brand copy.",
      note: "Technique notes",
    },
  ];

  return (
    <section className="px-6 py-24" style={{ background: "linear-gradient(180deg, rgba(8,8,13,0.86), rgba(5,5,8,1))" }}>
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="lg:pr-8">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs uppercase tracking-[0.3em] text-rose-400"
          >
            What MEDUSA Reads
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-5 text-4xl font-semibold text-white md:text-5xl"
            style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
          >
            A system read,
            <br />
            not a mood board.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-6 max-w-sm text-base leading-8 text-white/48"
          >
            The fastest way to make the product feel fake is to describe everything in the same premium blur.
            MEDUSA works better when the interface shows what it actually measures and why those measurements matter.
          </motion.p>
        </div>

        <div className="space-y-4">
          {features.map(({ index, title, body, note }, i) => (
            <motion.article
              key={title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.08, duration: 0.65 }}
              className="grid gap-5 border-t border-white/10 py-5 md:grid-cols-[84px_minmax(0,1fr)_170px] md:items-start"
            >
              <div className="text-[11px] uppercase tracking-[0.26em] text-white/26">{index}</div>
              <div>
                <h3
                  className="text-2xl font-semibold text-white"
                  style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
                >
                  {title}
                </h3>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/48 md:text-[15px]">{body}</p>
              </div>
              <div className="border-l border-white/10 pl-4 text-[10px] uppercase tracking-[0.24em] text-rose-300/80 md:mt-2">
                {note}
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

function V2Section() {
  const roadmapItems = [
    {
      phase: "01",
      title: "Prompt-led tutorial briefs",
      body: "Describe the mood you want, then let MEDUSA translate that into a routine that still respects your structure, tone, and proportions.",
    },
    {
      phase: "02",
      title: "Product suggestions that make sense",
      body: "Shade and product recommendations should follow the read, not sit beside it as a separate shopping module.",
    },
    {
      phase: "03",
      title: "More look families",
      body: "Trend, seasonal, and artist-led looks can expand the system once the placement logic stays as exact as v1.",
    },
    {
      phase: "04",
      title: "Artist technique overlays",
      body: "The long-term version is teaching techniques from working artists, then adapting them to the face in front of the camera.",
    },
  ];

  return (
    <section id="coming-soon" className="px-6 py-28" style={{ background: "#050508" }}>
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-3 border border-violet-500/20 px-4 py-2 text-[10px] uppercase tracking-[0.28em] text-violet-300"
          >
            <span className="h-2 w-2 rounded-full bg-violet-400" />
            Version 2 in development
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-6 text-4xl font-semibold leading-tight text-white md:text-6xl"
            style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
          >
            What expands
            <br />
            after v1.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-6 max-w-md text-base leading-8 text-white/46"
          >
            V1 proves the read. V2 should widen what you can ask for without loosening the geometry, tone, or tutorial discipline that makes the product credible.
          </motion.p>
        </div>

        <div className="border-t border-white/10">
          {roadmapItems.map(({ phase, title, body }, i) => (
            <motion.article
              key={title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.08, duration: 0.65 }}
              className="grid gap-5 border-b border-white/10 py-6 md:grid-cols-[84px_minmax(0,1fr)]"
            >
              <div className="text-[11px] uppercase tracking-[0.26em] text-white/26">Phase {phase}</div>
              <div>
                <h3
                  className="text-2xl font-semibold text-white"
                  style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
                >
                  {title}
                </h3>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/46 md:text-[15px]">{body}</p>
              </div>
            </motion.article>
          ))}

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="pt-6 text-sm text-white/32"
          >
            Want to hear when V2 is ready? <a href="mailto:hello@medusa.ai" className="text-rose-400 underline underline-offset-4 transition-colors hover:text-rose-300">Get in touch</a>.
          </motion.p>
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      ref={ref}
      className="relative overflow-hidden px-6 py-32"
      style={{ background: "radial-gradient(circle at 78% 35%, rgba(244,63,94,0.1), transparent 0 36%), #050508" }}
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute left-[8%] top-10 h-px w-[24%] bg-gradient-to-r from-transparent via-white/12 to-transparent" />
        <div className="absolute bottom-14 right-[8%] h-px w-[18%] bg-gradient-to-r from-transparent via-white/12 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            className="text-xs uppercase tracking-[0.3em] text-rose-400"
          >
            Start Here
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 }}
            className="mt-6 text-5xl font-semibold leading-none text-white md:text-7xl"
            style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
          >
            Your features set
            <br />
            the direction.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
            className="mt-6 max-w-2xl text-lg leading-8 text-white/46"
          >
            MEDUSA reads them first, then writes the routine around that read. One clear photo. A few minutes. Direction you can actually use.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: 0.3 }}
          className="border border-white/10 bg-white/[0.025] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.42)]"
        >
          <p className="text-[10px] uppercase tracking-[0.24em] text-white/28">Launch the analysis</p>
          <div className="mt-5 space-y-3 border-t border-white/10 pt-5 text-sm leading-7 text-white/48">
            <p>One front-facing photo is usually enough.</p>
            <p>No account required.</p>
            <p>MEDUSA only asks for more photos when the read is not reliable yet.</p>
          </div>
          <Link
            href="/app"
            className="group mt-8 inline-flex items-center gap-3 rounded-full bg-white px-8 py-4 text-sm font-semibold uppercase tracking-[0.16em] text-stone-950 transition-all duration-200 hover:bg-rose-50 hover:shadow-[0_0_50px_rgba(244,63,94,0.2)]"
          >
            Start Analysis
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
          <p className="mt-5 text-xs uppercase tracking-[0.22em] text-white/22">Free · No account required · Built from your features</p>
        </motion.div>
      </div>
    </section>
  );
}

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
          <span className="text-white/30 text-xs">Face-Mapped Makeup</span>
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
          Makeup guidance shaped by real features.
        </p>
      </div>
    </footer>
  );
}

// â”€â”€â”€ Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function LandingPage() {
  // NOTE: NO overflow-x-hidden on <main> â€” it would create a new scroll container
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
