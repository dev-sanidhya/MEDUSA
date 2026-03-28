"use client";

/**
 * LookSelector.tsx
 * Let the user pick a makeup look before the tutorial is generated.
 */

import type { LookId } from "@/app/api/generate-tutorial/route";

interface Look {
  id: LookId;
  label: string;
  subtitle: string;
  tag: string; // intensity/style descriptor
}

const LOOKS: Look[] = [
  { id: "natural",       label: "Natural",       subtitle: "Enhance, don't cover",     tag: "Minimal" },
  { id: "soft-glam",     label: "Soft Glam",     subtitle: "Effortless elegance",       tag: "Polished" },
  { id: "evening",       label: "Evening",        subtitle: "Dramatic & dimensional",    tag: "Full face" },
  { id: "bold-lip",      label: "Bold Lip",       subtitle: "One statement feature",     tag: "Focussed" },
  { id: "monochromatic", label: "Mono",           subtitle: "Tone-on-tone flush",        tag: "Cohesive" },
  { id: "editorial",     label: "Editorial",      subtitle: "High fashion edge",         tag: "Creative" },
];

interface Props {
  onSelect: (look: LookId) => void;
}

export function LookSelector({ onSelect }: Props) {
  return (
    <main className="min-h-screen bg-stone-950 px-5 py-12">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "Georgia, serif" }}>
            Choose Your Look
          </h1>
          <p className="text-stone-400 text-sm mt-3 leading-relaxed">
            I&apos;ll build a tutorial tailored to your exact face geometry.
            <br />Pick the result you want to achieve.
          </p>
        </div>

        {/* Look grid */}
        <div className="grid grid-cols-2 gap-3">
          {LOOKS.map((look) => (
            <button
              key={look.id}
              onClick={() => onSelect(look.id)}
              className="group relative bg-stone-900 hover:bg-stone-800 border border-stone-800 hover:border-rose-500/50 rounded-2xl p-5 text-left transition-all duration-200 active:scale-[0.97]"
            >
              {/* Tag */}
              <span className="inline-block text-[10px] font-semibold uppercase tracking-widest text-rose-400 mb-3">
                {look.tag}
              </span>

              {/* Label */}
              <p className="text-white font-semibold text-lg leading-tight">
                {look.label}
              </p>

              {/* Subtitle */}
              <p className="text-stone-500 text-xs mt-1 group-hover:text-stone-400 transition-colors">
                {look.subtitle}
              </p>

              {/* Hover arrow */}
              <span className="absolute bottom-4 right-4 text-stone-700 group-hover:text-rose-400 transition-colors text-sm">
                →
              </span>
            </button>
          ))}
        </div>

        <p className="text-center text-stone-600 text-xs mt-8">
          Your analysis is already complete — this just tells me where to take you.
        </p>
      </div>
    </main>
  );
}
