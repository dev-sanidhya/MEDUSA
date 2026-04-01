"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  Palette,
  ShoppingBag,
  Sparkles,
} from "lucide-react";

const roadmap = [
  {
    icon: Palette,
    title: "Expanded Tutorial Library",
    summary:
      "More looks, more moods, more finished outcomes. Everyday polish, statement evenings, editorial experiments, and niche occasions all become first-class tutorials instead of one-offs.",
    accent: "from-[rgba(219,136,109,0.35)] to-transparent",
  },
  {
    icon: Bot,
    title: "Prompt-Based Custom Tutorials",
    summary:
      "The user will be able to describe the look they want in plain language. MEDUSA will translate that request into a face-specific tutorial rather than serving a generic style card.",
    accent: "from-[rgba(129,164,156,0.35)] to-transparent",
  },
  {
    icon: ShoppingBag,
    title: "Structural Product Recommendations",
    summary:
      "Recommendation logic will move beyond popularity and into fit: product types, finishes, placement behavior, and shades that support the structure and tone of the user’s face.",
    accent: "from-[rgba(117,92,138,0.32)] to-transparent",
  },
];

export default function UpcomingPage() {
  return (
    <div className="overflow-hidden px-6 pb-24 pt-16">
      <div className="mx-auto max-w-7xl">
        <motion.section
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
          className="grid gap-12 pb-18 pt-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-end"
        >
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.24em] text-zinc-300 backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-[color:var(--color-plum)]" />
              V2 Roadmap
            </div>
            <h1 className="mt-7 font-serif text-6xl leading-[0.92] text-white sm:text-7xl">
              Where MEDUSA goes after the MVP is live.
            </h1>
          </div>
          <p className="max-w-2xl text-lg leading-8 text-zinc-400">
            The current release proves the analysis-to-tutorial flow. The next release turns
            it into a broader beauty platform with more content, more generative flexibility,
            and product intelligence layered on top of the face analysis engine.
          </p>
        </motion.section>

        <section className="space-y-8">
          {roadmap.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.article
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-120px" }}
                transition={{ duration: 0.8, delay: index * 0.08 }}
                className="grid gap-8 rounded-[2.2rem] border border-white/8 bg-[linear-gradient(145deg,rgba(18,18,22,0.96),rgba(8,8,10,0.92))] p-7 md:p-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center"
              >
                <div className="relative overflow-hidden rounded-[1.8rem] border border-white/8 bg-black/25 p-6">
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.accent} opacity-70`} />
                  <div className="relative">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    <div className="mt-10 space-y-3">
                      {[1, 2, 3].map((bar) => (
                        <div
                          key={bar}
                          className="h-2 rounded-full bg-white/10"
                          style={{ width: `${78 - bar * 12}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
                    Roadmap {String(index + 1).padStart(2, "0")}
                  </p>
                  <h2 className="mt-4 font-serif text-4xl text-white">{item.title}</h2>
                  <p className="mt-5 max-w-2xl text-base leading-8 text-zinc-400">
                    {item.summary}
                  </p>
                </div>
              </motion.article>
            );
          })}
        </section>

        <section className="mt-20 grid gap-5 lg:grid-cols-3">
          {[
            ["Today", "Face analysis and live tutorial generation"],
            ["Next", "Prompt-led custom tutorials"],
            ["Then", "Product recommendations tuned to structure and tone"],
          ].map(([label, text]) => (
            <div
              key={label}
              className="rounded-[1.8rem] border border-white/8 bg-white/[0.035] p-6"
            >
              <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--color-accent)]">
                {label}
              </p>
              <p className="mt-4 text-lg leading-8 text-zinc-200">{text}</p>
            </div>
          ))}
        </section>

        <section className="mt-20 rounded-[2.4rem] border border-white/8 bg-[radial-gradient(circle_at_top,rgba(117,92,138,0.17),transparent_30%),linear-gradient(180deg,rgba(16,16,19,0.94),rgba(8,8,10,0.96))] px-8 py-14">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--color-plum)]">
                Ready Now
              </p>
              <h2 className="mt-4 font-serif text-4xl text-white sm:text-5xl">
                The roadmap is strong, but the strongest move is still to show the live MVP.
              </h2>
            </div>
            <Link
              href="/try"
              className="inline-flex items-center gap-3 rounded-full bg-white px-7 py-4 text-sm font-semibold uppercase tracking-[0.16em] text-black"
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
