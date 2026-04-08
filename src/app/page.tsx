"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { MedusaLogo } from "@/components/MedusaLogo";

const heroSignals = [
  "MEDUSA reads structure before it writes a routine.",
  "Tone, proportions, and standout features shape every recommendation.",
  "Each look changes mood and finish without losing face-fit placement.",
];

const designNotes = [
  {
    title: "Feature-led reads",
    body: "MEDUSA surfaces the parts of your face that matter most, so the recommendation starts from structure instead of generic beauty language.",
  },
  {
    title: "Tone-aware direction",
    body: "Skin tone and undertone stay tied to the read, so shade families feel usable on your face instead of detached from the rest of the routine.",
  },
  {
    title: "Look-specific routines",
    body: "Soft glam, bold lip, editorial, and the rest each change emphasis, sequencing, and finish instead of recycling one base tutorial.",
  },
];

const productCards = [
  {
    eyebrow: "Soft Glam",
    title: "Lift the eyes, keep the skin fresh.",
    body: "A brighter lid, diffused outer corner, and light-reflecting cheek placement shaped to your actual proportions.",
  },
  {
    eyebrow: "Bold Lip",
    title: "Let one feature lead cleanly.",
    body: "MEDUSA shifts balance around the mouth so a stronger lip reads intentional instead of heavy.",
  },
  {
    eyebrow: "Editorial",
    title: "Graphic where your structure can carry it.",
    body: "Sharper line work only appears when your face read says the geometry can support it.",
  },
];

function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      animate={{
        backgroundColor: scrolled ? "rgba(255, 250, 246, 0.82)" : "rgba(255, 250, 246, 0)",
        borderBottomColor: scrolled ? "rgba(151, 108, 95, 0.12)" : "rgba(151, 108, 95, 0)",
        backdropFilter: scrolled ? "blur(18px)" : "blur(0px)",
      }}
      transition={{ duration: 0.28 }}
      className="fixed inset-x-0 top-0 z-50 border-b"
    >
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-6">
        <Link href="/" aria-label="MEDUSA home">
          <MedusaLogo size="sm" />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <a href="#process" className="text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-strong)]">
            Process
          </a>
          <a href="#looks" className="text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-strong)]">
            Looks
          </a>
          <a href="#precision" className="text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-strong)]">
            Precision
          </a>
        </nav>

        <Link
          href="/app"
          className="medusa-button-primary px-5 py-3 text-sm font-semibold transition-transform hover:-translate-y-0.5"
        >
          Try MEDUSA
        </Link>
      </div>
    </motion.header>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden px-6 pb-18 pt-32 md:pb-24 md:pt-36">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute left-[6%] top-28 h-40 w-40 rounded-full bg-[#f7d4c8]/70 blur-3xl" />
        <div className="absolute right-[10%] top-18 h-56 w-56 rounded-full bg-[#fde7df] blur-3xl" />
        <div className="absolute bottom-10 right-[18%] h-44 w-44 rounded-full bg-[#f1c1b2]/45 blur-3xl" />
      </div>

      <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="relative z-10">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="medusa-kicker"
          >
            Face-Mapped Makeup
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.6 }}
            className="mt-6 max-w-4xl text-[clamp(4rem,8vw,7.4rem)] font-semibold leading-[0.92] text-[var(--text-strong)]"
            style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
          >
            Makeup mapped
            <br />
            to your features,
            <br />
            your tone,
            <br />
            and your structure.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16, duration: 0.6 }}
            className="mt-8 max-w-2xl text-lg leading-8 text-[var(--text-main)]"
          >
            Upload a clear photo and MEDUSA reads your facial geometry, tone cues, and feature balance
            before building a routine. The result is makeup direction that feels specific to your face,
            not copied from a generic trend board.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, duration: 0.6 }}
            className="mt-10 flex flex-col gap-4 sm:flex-row"
          >
            <Link
              href="/app"
              className="medusa-button-primary px-8 py-4 text-sm font-semibold transition-transform hover:-translate-y-0.5"
            >
              Start Your Read
            </Link>
            <a
              href="#process"
              className="medusa-button-secondary px-8 py-4 text-sm font-semibold transition-colors hover:bg-white/90"
            >
              How It Works
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-12 grid gap-3 md:max-w-2xl"
          >
            {heroSignals.map((signal) => (
              <div key={signal} className="medusa-card-soft flex items-start gap-3 px-5 py-4">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[var(--rose)]" />
                <p className="text-sm leading-7 text-[var(--text-main)]">{signal}</p>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.7 }}
          className="medusa-shell relative"
        >
          <div className="medusa-card noise relative overflow-hidden p-5 md:p-7">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(240,179,154,0.24),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(253,232,228,0.9),transparent_34%)]" />
            <div className="relative">
              <div className="flex items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-5">
                <div>
                  <p className="medusa-kicker">Routine Preview</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                    What MEDUSA isolates before it writes placement, product direction, and technique.
                  </p>
                </div>
                <div className="rounded-full bg-white/75 px-4 py-2 text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  94 / 100 precision
                </div>
              </div>

              <div className="mt-6 grid gap-4">
                <div className="rounded-[1.8rem] border border-[var(--border-subtle)] bg-white/75 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--rose-strong)]">Step 01</p>
                      <p
                        className="mt-2 text-3xl text-[var(--text-strong)]"
                        style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
                      >
                        Capture
                      </p>
                    </div>
                    <div className="rounded-full bg-[var(--bg-soft-rose)] px-4 py-2 text-xs uppercase tracking-[0.18em] text-[var(--text-main)]">
                      Natural light
                    </div>
                  </div>
                  <p className="mt-3 max-w-md text-sm leading-7 text-[var(--text-main)]">
                    A clean, front-facing photo gives MEDUSA the strongest read on shape, symmetry, and tone.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-[0.95fr_1.05fr]">
                  <div className="rounded-[1.8rem] border border-[var(--border-subtle)] bg-[#fdf4ef] p-5">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">Feature Focus</p>
                    <p className="mt-2 text-xl text-[var(--text-strong)]" style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}>
                      Eyes with clear lift potential.
                    </p>
                    <p className="mt-2 text-sm leading-7 text-[var(--text-main)]">
                      MEDUSA identifies the features worth emphasizing so the final routine knows where to place drama and where to stay soft.
                    </p>
                  </div>

                  <div className="rounded-[1.8rem] border border-[var(--border-subtle)] bg-white/78 p-5">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">Shade Families</p>
                    <div className="mt-4 flex gap-3">
                      {["#d9878f", "#e7b29b", "#c69986", "#efd9cb"].map((color) => (
                        <span
                          key={color}
                          className="h-12 w-12 rounded-full border border-white/80 shadow-sm"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <p className="mt-4 text-sm leading-7 text-[var(--text-main)]">
                      Shade direction follows the tone read, so lips, cheeks, and eyes stay coherent with the face in front of the camera.
                    </p>
                  </div>
                </div>

                <div className="rounded-[1.8rem] border border-[var(--border-subtle)] bg-[linear-gradient(135deg,rgba(250,228,220,0.9),rgba(255,250,246,0.92))] p-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="medusa-chip">Client-side first pass</span>
                    <span className="medusa-chip">Look-specific routines</span>
                    <span className="medusa-chip">Face-fit stays strict</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function DesignSection() {
  return (
    <section className="px-6 py-18 md:py-24">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.78fr_1.22fr]">
        <div>
          <p className="medusa-kicker">What MEDUSA Reads</p>
          <h2
            className="mt-5 text-5xl leading-none text-[var(--text-strong)] md:text-6xl"
            style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
          >
            A system read,
            <br />
            not a beauty guess.
          </h2>
          <p className="mt-6 max-w-md text-base leading-8 text-[var(--text-main)]">
            MEDUSA works best when the product logic stays visible: structure, tone, emphasis,
            and look selection all stay connected so the recommendation feels authored instead of improvised.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {designNotes.map((note, index) => (
            <motion.article
              key={note.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: index * 0.08 }}
              className="medusa-card p-6"
            >
              <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--rose-strong)]">
                0{index + 1}
              </p>
              <h3
                className="mt-4 text-3xl leading-none text-[var(--text-strong)]"
                style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
              >
                {note.title}
              </h3>
              <p className="mt-4 text-sm leading-7 text-[var(--text-main)]">{note.body}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProcessSection() {
  const steps = [
    {
      number: "01",
      title: "Capture a clear read",
      body: "MEDUSA starts with a straight-on photo, checks quality, and only moves forward once the face read is strong enough to trust.",
    },
    {
      number: "02",
      title: "Map your features",
      body: "Face shape, eyes, lips, symmetry, and tone cues are read together so the final routine reflects how your features actually balance.",
    },
    {
      number: "03",
      title: "Build the routine",
      body: "Choose the look you want and MEDUSA translates that direction into step-by-step placement, technique, and what to avoid on your face.",
    },
  ];

  return (
    <section id="process" className="px-6 py-18 md:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 max-w-3xl">
          <p className="medusa-kicker">How MEDUSA Works</p>
          <h2
            className="mt-5 text-5xl leading-none text-[var(--text-strong)] md:text-6xl"
            style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
          >
            One photo in.
            <br />
            Face-fit guidance out.
          </h2>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {steps.map((step, index) => (
            <motion.article
              key={step.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: index * 0.08 }}
              className="medusa-card p-7"
            >
              <div className="flex items-center justify-between gap-4">
                <span className="text-[11px] uppercase tracking-[0.24em] text-[var(--rose-strong)]">
                  Step {step.number}
                </span>
                <span className="rounded-full bg-[var(--bg-soft-rose)] px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-[var(--text-main)]">
                  Face-fit stays on
                </span>
              </div>
              <h3
                className="mt-6 text-4xl leading-none text-[var(--text-strong)]"
                style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
              >
                {step.title}
              </h3>
              <p className="mt-5 text-sm leading-7 text-[var(--text-main)]">{step.body}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

function LooksSection() {
  return (
    <section id="looks" className="px-6 py-18 md:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="medusa-kicker">Look Library</p>
            <h2
              className="mt-5 text-5xl leading-none text-[var(--text-strong)] md:text-6xl"
              style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
            >
              Six look families.
              <br />
              One face-specific fit.
            </h2>
          </div>
          <p className="max-w-xl text-base leading-8 text-[var(--text-main)]">
            MEDUSA changes the mood, intensity, and finish of the routine without dropping the facial read underneath.
            The look changes. The fit does not.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {productCards.map((card, index) => (
            <motion.article
              key={card.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: index * 0.08 }}
              className="medusa-card overflow-hidden"
            >
              <div className="h-52 bg-[radial-gradient(circle_at_25%_25%,rgba(240,179,154,0.65),transparent_32%),radial-gradient(circle_at_75%_30%,rgba(220,127,139,0.38),transparent_28%),linear-gradient(135deg,#fff1ea,#fce3d9)]" />
              <div className="p-7">
                <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--rose-strong)]">{card.eyebrow}</p>
                <h3
                  className="mt-4 text-4xl leading-none text-[var(--text-strong)]"
                  style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
                >
                  {card.title}
                </h3>
                <p className="mt-5 text-sm leading-7 text-[var(--text-main)]">{card.body}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

function PrecisionSection() {
  return (
    <section id="precision" className="px-6 py-18 md:py-24">
      <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-[1.12fr_0.88fr]">
        <div className="medusa-card p-8 md:p-10">
          <p className="medusa-kicker">Precision First</p>
          <h2
            className="mt-5 text-5xl leading-none text-[var(--text-strong)] md:text-6xl"
            style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
          >
            No vague reads.
            <br />
            No filler routines.
          </h2>
          <p className="mt-6 max-w-2xl text-base leading-8 text-[var(--text-main)]">
            MEDUSA keeps the strict parts strict: client-side landmark detection, photo quality scoring,
            structure-aware analysis, and routines that stay specific to your face instead of collapsing into generic beauty advice.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="medusa-card-soft px-5 py-5">
              <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">Client-side first</p>
              <p className="mt-3 text-sm leading-7 text-[var(--text-main)]">Raw photo handling still begins on-device.</p>
            </div>
            <div className="medusa-card-soft px-5 py-5">
              <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">Precision gate</p>
              <p className="mt-3 text-sm leading-7 text-[var(--text-main)]">Low-quality reads still get stopped instead of guessed.</p>
            </div>
            <div className="medusa-card-soft px-5 py-5">
              <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">Face-specific outputs</p>
              <p className="mt-3 text-sm leading-7 text-[var(--text-main)]">Looks shift, but the fit stays tied to the face.</p>
            </div>
          </div>
        </div>

        <div className="medusa-card p-8">
          <p className="medusa-kicker">Start Here</p>
          <p
            className="mt-5 text-4xl leading-none text-[var(--text-strong)]"
            style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
          >
            Your features
            <br />
            set the direction.
          </p>
          <p className="mt-5 text-sm leading-7 text-[var(--text-main)]">
            One clear photo is enough for MEDUSA to start reading what to emphasize, what to soften,
            and how to shape the look around the face you actually have.
          </p>
          <div className="mt-7 flex flex-col gap-3">
            <Link
              href="/app"
              className="medusa-button-primary px-7 py-4 text-sm font-semibold transition-transform hover:-translate-y-0.5"
            >
              Start Analysis
            </Link>
            <a
              href="mailto:hello@medusa.ai"
              className="medusa-button-secondary px-7 py-4 text-sm font-semibold transition-colors hover:bg-white/90"
            >
              Talk To The Team
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="px-6 py-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 border-t border-[var(--border-subtle)] pt-8 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <span
            className="text-2xl tracking-[0.24em] text-[var(--text-strong)]"
            style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
          >
            MEDUSA
          </span>
          <span className="text-sm text-[var(--text-muted)]">Face-mapped makeup</span>
        </div>
        <div className="flex items-center gap-6 text-sm text-[var(--text-muted)]">
          <a href="#process" className="transition-colors hover:text-[var(--text-strong)]">Process</a>
          <a href="#looks" className="transition-colors hover:text-[var(--text-strong)]">Looks</a>
          <Link href="/app" className="transition-colors hover:text-[var(--text-strong)]">Try MEDUSA</Link>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <main className="min-h-screen text-[var(--text-main)]">
      <Navbar />
      <HeroSection />
      <DesignSection />
      <ProcessSection />
      <LooksSection />
      <PrecisionSection />
      <Footer />
    </main>
  );
}
