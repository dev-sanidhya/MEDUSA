"use client";

import Link from "next/link";
import { motion, useMotionValueEvent, useScroll, useSpring, useTransform } from "framer-motion";
import { ArrowRight, Bot, Camera, ScanFace, Wand2 } from "lucide-react";
import { useRef, useState } from "react";
import { BrandMark } from "@/components/BrandMark";

const storySteps = [
  {
    id: "01",
    kicker: "Capture",
    title: "Start with a photo the system can trust.",
    body:
      "MEDUSA checks framing, angle precision, and visibility before it moves forward. If the input is weak, it asks for a better one instead of pretending confidence.",
    detail: "Quality gates before analysis",
    railCopy: "Input discipline before analysis",
    support:
      "If the input is unreliable, the rest of the flow becomes performance instead of product. The system needs a readable face before it earns the right to analyze it.",
    stance: "Trust starts with the upload.",
    pills: ["Centered framing", "Visible features", "Balanced light"],
    icon: Camera,
  },
  {
    id: "02",
    kicker: "Analyze",
    title: "Read the face, not a template.",
    body:
      "The system interprets feature balance, facial geometry, and visible beauty signals to understand where makeup should create softness, lift, and focus.",
    detail: "Geometry and visible signals together",
    railCopy: "Understanding the facial structure",
    support:
      "The analysis should explain what to emphasize, what to soften, and what to leave alone. Geometry is not decoration here. It is the logic behind the recommendation.",
    stance: "Geometry drives the read.",
    pills: ["Face geometry", "Feature balance", "Visible signals"],
    icon: ScanFace,
  },
  {
    id: "03",
    kicker: "Generate",
    title: "Write the tutorial around that structure.",
    body:
      "The output becomes a face-specific sequence with placement logic, technique notes, and what to avoid for that exact face.",
    detail: "Personalized instruction output",
    railCopy: "Turning the read into instruction",
    support:
      "The final layer should feel authored for that exact face. Not generic beauty advice, but a sequence that tells the user where to place, blend, and stop.",
    stance: "Output becomes instruction.",
    pills: ["Placement logic", "Technique notes", "Prompt-led looks"],
    icon: Wand2,
  },
];

const cards = [
  {
    icon: Camera,
    title: "Guided Input",
    text: "Users upload the face photo and MEDUSA asks for a better image only when the input is not good enough to trust.",
  },
  {
    icon: ScanFace,
    title: "Face-Led Read",
    text: "The product evaluates feature structure, balance, visible complexion, and the hierarchy of where attention should land.",
  },
  {
    icon: Wand2,
    title: "Tutorial Output",
    text: "It returns practical steps, product guidance, and geometry-specific notes instead of broad beauty advice.",
  },
  {
    icon: Bot,
    title: "V2 Expansion",
    text: "Next comes prompt-based custom looks and product recommendations tuned to the user’s face.",
  },
];

export default function Home() {
  const heroRef = useRef<HTMLElement | null>(null);
  const storyRef = useRef<HTMLElement | null>(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);

  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const { scrollYProgress: storyProgress } = useScroll({
    target: storyRef,
    offset: ["start start", "end end"],
  });

  const heroSmooth = useSpring(heroProgress, {
    stiffness: 110,
    damping: 24,
    mass: 0.22,
  });

  const storySmooth = useSpring(storyProgress, {
    stiffness: 85,
    damping: 20,
    mass: 0.28,
  });

  useMotionValueEvent(storySmooth, "change", (latest) => {
    const nextIndex = Math.max(
      0,
      Math.min(storySteps.length - 1, Math.floor((latest + 0.08) * storySteps.length)),
    );

    setActiveStoryIndex((current) => (current === nextIndex ? current : nextIndex));
  });

  const copyY = useTransform(heroSmooth, [0, 1], [0, 72]);
  const deckY = useTransform(heroSmooth, [0, 1], [0, 108]);
  const deckRotateX = useTransform(heroSmooth, [0, 1], [0, 9]);
  const deckRotateY = useTransform(heroSmooth, [0, 1], [-6, 7]);

  return (
    <div className="overflow-hidden text-[color:var(--color-ink)]">
      <section ref={heroRef} className="relative px-6 pb-16 pt-12">
        <div className="mx-auto grid min-h-[calc(100svh-6rem)] max-w-7xl gap-14 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
          <motion.div style={{ y: copyY }} className="relative z-10">
            <div className="inline-flex items-center gap-3 rounded-full border border-[rgba(77,29,23,0.1)] bg-[rgba(255,247,241,0.84)] px-4 py-2 shadow-[0_12px_35px_rgba(122,64,44,0.08)]">
              <BrandMark className="h-8 w-8" />
              <span className="text-xs uppercase tracking-[0.28em] text-[color:var(--color-accent)]">
                Personalized beauty intelligence
              </span>
            </div>

            <h1 className="mt-8 max-w-5xl font-serif text-[4.2rem] leading-[0.88] text-[color:var(--color-ink)] sm:text-[5.4rem] lg:text-[7rem]">
              Makeup that follows the face.
              <span className="block text-[color:var(--color-accent)]">Not the template.</span>
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-[color:var(--color-ink-soft)] sm:text-xl">
              MEDUSA is an AI makeup product that reads facial geometry from user photos and
              generates tutorials around the structure it sees. The MVP works now. The next
              release expands into prompt-led looks and product guidance.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/try"
                className="group inline-flex items-center justify-center gap-3 rounded-full bg-[color:var(--color-accent)] px-7 py-4 text-sm font-semibold uppercase tracking-[0.16em] text-white shadow-[0_16px_34px_rgba(158,43,37,0.22)] transition-transform duration-300 hover:-translate-y-0.5"
              >
                Try The MVP
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <Link
                href="/technology"
                className="inline-flex items-center justify-center rounded-full border border-[rgba(77,29,23,0.12)] bg-[rgba(255,247,241,0.68)] px-7 py-4 text-sm uppercase tracking-[0.16em] text-[color:var(--color-ink)] transition-colors duration-300 hover:bg-[rgba(255,247,241,0.95)]"
              >
                See How It Works
              </Link>
            </div>
          </motion.div>

          <motion.div
            style={{ y: deckY, rotateX: deckRotateX, rotateY: deckRotateY }}
            className="relative mx-auto h-[35rem] w-full max-w-xl [perspective:1800px] [transform-style:preserve-3d]"
          >
            <div className="absolute inset-0 translate-y-10 rounded-[2.4rem] border border-[rgba(77,29,23,0.08)] bg-[rgba(201,131,91,0.10)] blur-[1px]" />
            <div className="absolute inset-4 -rotate-5 rounded-[2.2rem] border border-[rgba(77,29,23,0.1)] bg-[rgba(255,247,241,0.74)]" />
            <div className="absolute inset-3 rotate-3 rounded-[2.2rem] border border-[rgba(77,29,23,0.08)] bg-[rgba(247,232,223,0.76)]" />
            <div className="absolute inset-0 rounded-[2.3rem] border border-[rgba(77,29,23,0.12)] bg-[linear-gradient(180deg,rgba(255,251,248,0.98),rgba(248,236,228,0.92))] p-6 shadow-[0_24px_80px_rgba(112,53,38,0.12)]">
              <div className="rounded-[1.8rem] border border-[rgba(77,29,23,0.1)] bg-[rgba(255,250,247,0.88)] p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.26em] text-[color:var(--color-sage)]">
                      Active Flow
                    </p>
                    <h2 className="mt-3 text-3xl font-semibold text-[color:var(--color-ink)]">
                      Capture to Tutorial
                    </h2>
                  </div>
                  <span className="rounded-full border border-[rgba(158,43,37,0.12)] bg-[rgba(158,43,37,0.05)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[color:var(--color-accent)]">
                    Live
                  </span>
                </div>

                <div className="mt-6 space-y-3">
                  {[
                    "Guided photo upload with quality checks",
                    "Face and skin reading from live inputs",
                    "Personalized look selection",
                    "Tutorial generation with mapped placement",
                  ].map((item, index) => (
                    <div
                      key={item}
                      className="flex items-center gap-4 rounded-2xl border border-[rgba(77,29,23,0.08)] bg-white/72 px-4 py-4"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(158,43,37,0.08)] text-xs font-semibold text-[color:var(--color-accent)]">
                        {index + 1}
                      </span>
                      <span className="text-sm text-[color:var(--color-ink)]">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <MetricCard label="Analysis Layer" value="478-point" detail="Geometry-led face reading" />
                <MetricCard label="V2" value="Prompt-led" detail="Custom looks and recommendations" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section ref={storyRef} className="relative px-6 pb-10 pt-4">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.42fr_0.58fr] lg:items-start">
            <div className="lg:sticky lg:top-[6.15rem]">
              <div className="rounded-[2.4rem] border border-[rgba(77,29,23,0.1)] bg-[linear-gradient(180deg,rgba(255,250,247,0.9),rgba(247,232,223,0.84))] px-8 py-9 shadow-[0_20px_70px_rgba(112,53,38,0.08)]">
                <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--color-accent)]">
                  Story
                </p>
                <h2 className="mt-4 max-w-lg font-serif text-5xl leading-[0.96] text-[color:var(--color-ink)] sm:text-[4.3rem]">
                  Scroll through the product logic one step at a time.
                </h2>
                <p className="mt-5 max-w-lg text-base leading-8 text-[color:var(--color-ink-soft)]">
                  This should read like a sequence, not a collage. As the user scrolls,
                  one layer takes focus, then hands the story to the next.
                </p>

                <div className="mt-10 space-y-3">
                  {storySteps.map((step, index) => {
                    const isActive = activeStoryIndex === index;

                    return (
                      <motion.a
                        key={step.id}
                        href={`#story-step-${step.id}`}
                        animate={{ x: isActive ? 12 : 0, opacity: isActive ? 1 : 0.68 }}
                        transition={{ type: "spring", stiffness: 260, damping: 28 }}
                        className={`block rounded-[1.6rem] border px-5 py-5 transition-colors duration-300 ${
                          isActive
                            ? "border-[rgba(158,43,37,0.18)] bg-[rgba(255,251,248,0.96)] shadow-[0_18px_40px_rgba(112,53,38,0.08)]"
                            : "border-[rgba(77,29,23,0.08)] bg-[rgba(255,250,247,0.58)] hover:bg-[rgba(255,250,247,0.78)]"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <span className="mt-0.5 text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-accent)]">
                            {step.id}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-4">
                              <p className="text-base font-semibold text-[color:var(--color-ink)]">
                                {step.kicker}
                              </p>
                              <span
                                className={`h-2.5 w-2.5 rounded-full transition-colors ${
                                  isActive
                                    ? "bg-[color:var(--color-accent)]"
                                    : "bg-[rgba(77,29,23,0.14)]"
                                }`}
                              />
                            </div>
                            <p className="mt-1 text-sm leading-7 text-[color:var(--color-ink-soft)]">
                              {step.railCopy}
                            </p>
                          </div>
                        </div>
                      </motion.a>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-8 pb-2">
              {storySteps.map((step, index) => {
                const Icon = step.icon;
                const isActive = activeStoryIndex === index;

                return (
                  <motion.article
                    id={`story-step-${step.id}`}
                    key={step.id}
                    initial={{ opacity: 0, y: 28 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-12% 0px -18% 0px" }}
                    transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
                    animate={{ scale: isActive ? 1 : 0.975, opacity: isActive ? 1 : 0.86 }}
                    className="rounded-[2.5rem] border border-[rgba(77,29,23,0.1)] bg-[linear-gradient(180deg,rgba(255,252,249,0.98),rgba(247,232,223,0.88))] p-7 shadow-[0_26px_70px_rgba(112,53,38,0.1)] lg:sticky lg:top-[6.5rem] lg:min-h-[74svh] lg:p-9"
                  >
                    <div className="flex h-full flex-col justify-between gap-10">
                      <div className="grid gap-8 lg:grid-cols-[0.64fr_0.36fr]">
                        <div>
                          <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(158,43,37,0.08)] text-[color:var(--color-accent)]">
                              <Icon className="h-6 w-6" />
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--color-accent)]">
                                {step.kicker}
                              </p>
                              <p className="mt-2 text-xs uppercase tracking-[0.22em] text-[color:var(--color-sage)]">
                                Layer {step.id} of 03
                              </p>
                            </div>
                          </div>

                          <h3 className="mt-8 max-w-2xl font-serif text-[3rem] leading-[0.94] text-[color:var(--color-ink)] sm:text-[3.45rem]">
                            {step.title}
                          </h3>
                          <p className="mt-6 max-w-2xl text-lg leading-8 text-[color:var(--color-ink-soft)]">
                            {step.body}
                          </p>
                        </div>

                        <div className="rounded-[1.9rem] border border-[rgba(77,29,23,0.08)] bg-[rgba(255,250,247,0.78)] p-5">
                          <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--color-sage)]">
                            Core signals
                          </p>
                          <div className="mt-6 space-y-3">
                            {step.pills.map((pill) => (
                              <div
                                key={pill}
                                className="flex items-center gap-3 rounded-2xl border border-[rgba(77,29,23,0.08)] bg-white/72 px-4 py-3"
                              >
                                <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--color-accent)]" />
                                <span className="text-sm text-[color:var(--color-ink)]">{pill}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-[1.12fr_0.88fr]">
                        <div className="rounded-[1.7rem] border border-[rgba(77,29,23,0.08)] bg-[rgba(255,250,247,0.72)] px-5 py-5">
                          <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--color-sage)]">
                            Why this layer matters
                          </p>
                          <p className="mt-3 text-base leading-7 text-[color:var(--color-ink)]">
                            {step.support}
                          </p>
                        </div>
                        <div className="rounded-[1.7rem] border border-[rgba(158,43,37,0.12)] bg-[rgba(158,43,37,0.04)] px-5 py-5">
                          <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--color-accent)]">
                            System stance
                          </p>
                          <p className="mt-3 text-2xl font-semibold text-[color:var(--color-ink)]">
                            {step.stance}
                          </p>
                          <p className="mt-3 text-sm leading-7 text-[color:var(--color-ink-soft)]">
                            {step.detail}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="-mt-4 px-6 py-8">
        <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-4">
          {cards.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.7, delay: index * 0.06 }}
                className="rounded-[2rem] border border-[rgba(77,29,23,0.1)] bg-[rgba(255,250,247,0.78)] p-6"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(158,43,37,0.08)] text-[color:var(--color-accent)]">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-6 text-2xl font-semibold text-[color:var(--color-ink)]">
                  {card.title}
                </h3>
                <p className="mt-4 text-sm leading-7 text-[color:var(--color-ink-soft)]">
                  {card.text}
                </p>
              </motion.div>
            );
          })}
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto grid max-w-7xl gap-10 rounded-[2.4rem] border border-[rgba(77,29,23,0.1)] bg-[linear-gradient(135deg,rgba(255,248,243,0.92),rgba(247,232,223,0.86))] p-8 md:p-10 lg:grid-cols-[0.98fr_1.02fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--color-accent)]">
              Shipping Today
            </p>
            <h2 className="mt-4 font-serif text-4xl text-[color:var(--color-ink)] sm:text-5xl">
              The live route already proves the product. The website just needs to sell it like one.
            </h2>
            <p className="mt-6 max-w-xl text-base leading-8 text-[color:var(--color-ink-soft)]">
              Photo quality checks, face analysis, look selection, and tutorial generation are
              already integrated. The site should explain that clearly and move users into the flow.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <InfoTile label="Photo quality checks" value="Client-side" />
            <InfoTile label="Face analysis" value="Live API" />
            <InfoTile label="Tutorial generation" value="Live API" />
            <InfoTile label="Next release" value="Prompt + products" />
          </div>
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[1.7rem] border border-[rgba(77,29,23,0.1)] bg-[rgba(255,250,247,0.76)] p-5">
      <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--color-sage)]">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-[color:var(--color-ink)]">{value}</p>
      <p className="mt-2 text-sm text-[color:var(--color-ink-soft)]">{detail}</p>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.6rem] border border-[rgba(77,29,23,0.1)] bg-[rgba(255,250,247,0.72)] p-5">
      <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--color-sage)]">{label}</p>
      <p className="mt-3 text-xl font-semibold text-[color:var(--color-ink)]">{value}</p>
    </div>
  );
}
