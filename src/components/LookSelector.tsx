"use client";

import type { LookId } from "@/app/api/generate-tutorial/route";
import type { ProfileHistoryResult } from "@/app/api/profile/history/route";

interface Look {
  id: LookId;
  label: string;
  subtitle: string;
  tag: string;
  accent: string;
}

const LOOKS: Look[] = [
  { id: "natural", label: "Natural", subtitle: "Enhance, don't cover", tag: "Minimal", accent: "rgba(244,63,94,0.18)" },
  { id: "soft-glam", label: "Soft Glam", subtitle: "Effortless elegance", tag: "Polished", accent: "rgba(255,255,255,0.1)" },
  { id: "evening", label: "Evening", subtitle: "Dramatic and dimensional", tag: "Full Face", accent: "rgba(190,24,93,0.24)" },
  { id: "bold-lip", label: "Bold Lip", subtitle: "One statement feature", tag: "Focused", accent: "rgba(251,113,133,0.18)" },
  { id: "monochromatic", label: "Monochromatic", subtitle: "Tone-on-tone flush", tag: "Cohesive", accent: "rgba(255,255,255,0.08)" },
  { id: "editorial", label: "Editorial", subtitle: "High fashion edge, then pick a style", tag: "Creative", accent: "rgba(109,40,217,0.16)" },
];

interface Props {
  onSelect: (look: LookId) => void;
  preferenceSummary?: ProfileHistoryResult["preferenceSummary"] | null;
}

export function LookSelector({ onSelect, preferenceSummary }: Props) {
  const preferredLooks = new Set(preferenceSummary?.preferredLooks ?? []);
  const discouragedLooks = new Set(preferenceSummary?.discouragedLooks ?? []);
  const recentLooks = new Set(preferenceSummary?.recentLooks ?? []);

  return (
    <main className="min-h-screen bg-[#050508] px-6 py-12 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 max-w-2xl">
          <p className="mb-4 text-xs uppercase tracking-[0.3em] text-rose-400">Step 03</p>
          <h1
            className="text-5xl font-semibold leading-none md:text-7xl"
            style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
          >
            Choose the look.
            <br />
            <span style={{ fontStyle: "italic" }}>Keep the fit.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/48">
            Your face read is done. This step only changes the mood, intensity,
            and finish MEDUSA builds around it.
          </p>
          {preferenceSummary && preferenceSummary.preferredLooks.length > 0 && (
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-rose-100/72">
              Based on your saved feedback, MEDUSA would start with {preferenceSummary.preferredLooks.slice(0, 2).join(" or ")}.
            </p>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {LOOKS.map((look, index) => {
            const isPreferred = preferredLooks.has(look.id);
            const isDiscouraged = discouragedLooks.has(look.id);
            const isRecent = recentLooks.has(look.id);

            return (
              <button
                key={look.id}
                onClick={() => onSelect(look.id)}
                className={`group relative overflow-hidden rounded-[2rem] border bg-[rgba(13,13,20,0.8)] p-6 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_24px_80px_rgba(0,0,0,0.35)] ${
                  isPreferred
                    ? "border-rose-400/28 hover:border-rose-300/42"
                    : "border-white/8 hover:border-rose-400/30"
                }`}
              >
                <div
                  className="pointer-events-none absolute inset-0 opacity-90 transition-opacity duration-200 group-hover:opacity-100"
                  style={{ background: `radial-gradient(circle at top right, ${look.accent}, transparent 56%)` }}
                />
                <div className="relative">
                  <div className="mb-10 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.24em] text-rose-300">{look.tag}</p>
                      <p className="mt-2 text-[11px] uppercase tracking-[0.22em] text-white/22">
                        Look {String(index + 1).padStart(2, "0")}
                      </p>
                    </div>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/35">
                      Face-fit
                    </span>
                  </div>

                  <h2
                    className="text-3xl font-semibold leading-none text-white"
                    style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
                  >
                    {look.label}
                  </h2>
                  <p className="mt-3 max-w-[24ch] text-sm leading-relaxed text-white/48">
                    {look.subtitle}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {isPreferred && (
                      <span className="rounded-full border border-rose-400/22 bg-rose-500/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-rose-100/88">
                        Preferred
                      </span>
                    )}
                    {isRecent && (
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-white/58">
                        Recent
                      </span>
                    )}
                    {isDiscouraged && (
                      <span className="rounded-full border border-amber-400/18 bg-amber-500/[0.08] px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-amber-100/78">
                        Lower Taste Match
                      </span>
                    )}
                  </div>

                  <div className="mt-8 flex items-center gap-2 text-sm font-medium text-rose-300">
                    Choose this look
                    <span className="transition-transform group-hover:translate-x-1">â†’</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <p className="mt-8 text-center text-xs uppercase tracking-[0.22em] text-white/22">
          Placement and cautions stay specific to your face. Only the look direction changes.
        </p>
      </div>
    </main>
  );
}
