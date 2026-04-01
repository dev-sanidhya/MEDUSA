"use client";

import type { LookId } from "@/app/api/generate-tutorial/route";

interface Look {
  id: LookId;
  label: string;
  subtitle: string;
  tag: string;
}

const LOOKS: Look[] = [
  { id: "natural", label: "Natural", subtitle: "Enhance, don't cover", tag: "Minimal" },
  { id: "soft-glam", label: "Soft Glam", subtitle: "Effortless elegance", tag: "Polished" },
  { id: "evening", label: "Evening", subtitle: "Dramatic and dimensional", tag: "Full face" },
  { id: "bold-lip", label: "Bold Lip", subtitle: "One statement feature", tag: "Focused" },
  { id: "monochromatic", label: "Monochromatic", subtitle: "Tone-on-tone flush", tag: "Cohesive" },
  { id: "editorial", label: "Editorial", subtitle: "High-fashion edge", tag: "Creative" },
];

interface Props {
  onSelect: (look: LookId) => void;
}

export function LookSelector({ onSelect }: Props) {
  return (
    <main className="px-6 pb-24 pt-14 text-[color:var(--color-ink)]">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--color-accent)]">
              Look Selection
            </p>
            <h1 className="mt-3 text-3xl font-bold text-[color:var(--color-ink)]" style={{ fontFamily: "var(--font-serif)" }}>
              Choose the direction for your tutorial.
            </h1>
          </div>
          <p className="max-w-xl text-sm leading-7 text-[color:var(--color-ink-soft)]">
            The face analysis is already complete. This step only changes the aesthetic result
            MEDUSA builds around the geometry it just read.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {LOOKS.map((look) => (
            <button
              key={look.id}
              onClick={() => onSelect(look.id)}
              className="group relative rounded-[1.8rem] border border-[rgba(77,29,23,0.1)] bg-[rgba(255,250,247,0.82)] p-6 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_14px_36px_rgba(111,58,41,0.08)] active:scale-[0.985]"
            >
              <span className="mb-4 inline-block text-[10px] font-semibold uppercase tracking-widest text-[color:var(--color-accent)]">
                {look.tag}
              </span>

              <p className="text-lg font-semibold leading-tight text-[color:var(--color-ink)]">{look.label}</p>
              <p className="mt-2 text-xs text-[color:var(--color-ink-soft)] transition-colors">
                {look.subtitle}
              </p>

              <span className="absolute bottom-5 right-5 text-sm text-[color:var(--color-sage)] transition-colors group-hover:text-[color:var(--color-accent)]">
                →
              </span>
            </button>
          ))}
        </div>

        <p className="mt-8 text-center text-xs uppercase tracking-[0.2em] text-[color:var(--color-sage)]">
          Analysis done. Now choose the mood.
        </p>
      </div>
    </main>
  );
}
