"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Eye, ScanFace, Sparkles, Wand2 } from "lucide-react";

const pillars = [
  {
    icon: ScanFace,
    title: "Face Geometry",
    body:
      "MEDUSA starts with structure. The system evaluates facial proportions, eye set and shape, lip balance, brow character, and broader face architecture from the uploaded photos.",
  },
  {
    icon: Eye,
    title: "Visible Beauty Signals",
    body:
      "Geometry alone is not enough. The analysis also considers visible complexion information and how the user’s natural features should lead or recede visually.",
  },
  {
    icon: Wand2,
    title: "Instruction Generation",
    body:
      "The output is not a style paragraph. It becomes a teachable sequence: product type, placement logic, technique notes, and geometry-specific warnings.",
  },
];

const flow = [
  "Upload and client-side photo processing",
  "Geometry profile and precision scoring",
  "Face analysis API response",
  "Look selection and tutorial generation",
];

const roadmap = [
  "A broader tutorial library across everyday, glam, editorial, and prompt-led looks.",
  "Custom requests generated from the user’s own prompt and facial analysis together.",
  "Product recommendations selected to support structure, lift, tone, and contrast.",
];

export default function TechnologyPage() {
  return (
    <div className="px-6 pb-24 pt-16 text-[color:var(--color-ink)]">
      <div className="mx-auto max-w-7xl">
        <section className="grid gap-12 pb-16 pt-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--color-sage)]">
              Technology
            </p>
            <h1 className="mt-5 font-serif text-6xl leading-[0.92] text-[color:var(--color-ink)] sm:text-7xl">
              The interface is aesthetic. The mechanism still needs to read as sharp, premium, and credible.
            </h1>
          </div>
          <p className="max-w-2xl text-lg leading-8 text-[color:var(--color-ink-soft)]">
            MEDUSA works because it does not treat makeup advice like generic content. The
            system reads the face, understands what should visually lead, and then writes
            instruction around that structure. This page should explain that clearly.
          </p>
        </section>

        <section className="grid gap-5 lg:grid-cols-3">
          {pillars.map((pillar, index) => {
            const Icon = pillar.icon;
            return (
              <motion.article
                key={pillar.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-120px" }}
                transition={{ duration: 0.7, delay: index * 0.07 }}
                className="rounded-[2rem] border border-[rgba(77,29,23,0.1)] bg-[rgba(255,250,247,0.78)] p-7 shadow-[0_12px_34px_rgba(111,58,41,0.06)]"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(158,43,37,0.08)] text-[color:var(--color-accent)]">
                  <Icon className="h-6 w-6" />
                </div>
                <h2 className="mt-6 text-3xl font-semibold text-[color:var(--color-ink)]">
                  {pillar.title}
                </h2>
                <p className="mt-4 text-sm leading-7 text-[color:var(--color-ink-soft)]">
                  {pillar.body}
                </p>
              </motion.article>
            );
          })}
        </section>

        <section className="mt-20 grid gap-8 rounded-[2.4rem] border border-[rgba(77,29,23,0.1)] bg-[linear-gradient(135deg,rgba(255,248,243,0.92),rgba(247,232,223,0.86))] p-8 md:p-10 lg:grid-cols-[1.02fr_0.98fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--color-accent)]">
              Live Product Logic
            </p>
            <h2 className="mt-4 font-serif text-4xl text-[color:var(--color-ink)] sm:text-5xl">
              The current route already proves the core product.
            </h2>
            <div className="mt-6 space-y-4 text-sm leading-7 text-[color:var(--color-ink-soft)]">
              <p>
                The user uploads a photo. The product checks whether the image has enough clarity,
                framing, and angle precision. If not, it asks for another one.
              </p>
              <p>
                Once the face can be read confidently, MEDUSA generates a personalized face
                analysis and then builds a tailored tutorial for the selected look.
              </p>
              <p>
                That is the important distinction: the frontend is not selling a concept in a
                vacuum. It is wrapping a working analysis and tutorial pipeline.
              </p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-[rgba(77,29,23,0.1)] bg-[rgba(255,251,248,0.78)] p-6">
            <div className="space-y-4">
              {flow.map((line, index) => (
                <div
                  key={line}
                  className="flex items-center gap-4 rounded-2xl border border-[rgba(77,29,23,0.08)] bg-white/72 px-4 py-4"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(158,43,37,0.08)] text-sm font-semibold text-[color:var(--color-accent)]">
                    {index + 1}
                  </div>
                  <p className="text-sm text-[color:var(--color-ink)]">{line}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-20 grid gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--color-plum)]">
              V2 Direction
            </p>
            <h2 className="mt-4 font-serif text-4xl text-[color:var(--color-ink)] sm:text-5xl">
              The roadmap extends the intelligence model into discovery, generation, and curation.
            </h2>
          </div>
          <div className="grid gap-4">
            {roadmap.map((item, index) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: index * 0.06 }}
                className="rounded-[1.7rem] border border-[rgba(77,29,23,0.08)] bg-[rgba(255,250,247,0.78)] p-5 text-sm leading-7 text-[color:var(--color-ink-soft)]"
              >
                {item}
              </motion.div>
            ))}
          </div>
        </section>

        <section className="mt-20 rounded-[2.35rem] border border-[rgba(77,29,23,0.1)] bg-[radial-gradient(circle_at_top,rgba(158,43,37,0.12),transparent_30%),linear-gradient(180deg,rgba(255,248,243,0.96),rgba(247,232,223,0.9))] px-8 py-14 shadow-[0_16px_50px_rgba(112,53,38,0.08)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-[color:var(--color-accent)]">
                <Sparkles className="h-4 w-4" />
                Next Move
              </p>
              <h2 className="mt-4 font-serif text-4xl text-[color:var(--color-ink)] sm:text-5xl">
                Move from explanation into the live product experience.
              </h2>
            </div>
            <Link
              href="/try"
              className="inline-flex items-center gap-3 rounded-full bg-[color:var(--color-accent)] px-7 py-4 text-sm font-semibold uppercase tracking-[0.16em] text-white"
            >
              Try The MVP
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
