"use client";

import type { FaceAnalysisResult } from "@/app/api/analyze-face/route";
import type { LookId } from "@/app/api/generate-tutorial/route";
import type { ProfileHistoryResult } from "@/app/api/profile/history/route";
import { LOOK_DEFINITIONS, LOOK_PRESENTATIONS } from "@/lib/medusa/look-config";

type ResolvedFaceAnalysis = NonNullable<FaceAnalysisResult["faceAnalysis"]>;

interface Props {
  onSelect: (look: LookId) => void;
  analysis?: ResolvedFaceAnalysis | null;
  preferenceSummary?: ProfileHistoryResult["preferenceSummary"] | null;
}

export function LookSelector({ onSelect, analysis, preferenceSummary }: Props) {
  const preferredLooks = new Set(preferenceSummary?.preferredLooks ?? []);
  const discouragedLooks = new Set(preferenceSummary?.discouragedLooks ?? []);
  const recentLooks = new Set(preferenceSummary?.recentLooks ?? []);
  const rankedLooks = [...LOOK_PRESENTATIONS]
    .map((look) => ({
      look,
      score: scoreLook(look.id, analysis, preferenceSummary),
    }))
    .sort((a, b) => b.score - a.score);
  const topLookId = rankedLooks[0]?.look.id ?? null;

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
          {topLookId && (
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-rose-100/72">
              MEDUSA would start with {LOOK_DEFINITIONS[topLookId].label.toLowerCase()} for your
              current face read and saved taste signals.
            </p>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rankedLooks.map(({ look }, index) => {
            const isPreferred = preferredLooks.has(look.id);
            const isDiscouraged = discouragedLooks.has(look.id);
            const isRecent = recentLooks.has(look.id);
            const isTopMatch = topLookId === look.id;

            return (
              <button
                key={look.id}
                onClick={() => onSelect(look.id)}
                className={`group relative overflow-hidden rounded-[2rem] border bg-[rgba(13,13,20,0.8)] p-6 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_24px_80px_rgba(0,0,0,0.35)] ${
                  isTopMatch
                    ? "border-rose-300/36 hover:border-rose-200/48"
                    : isPreferred
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
                      Face read holds
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
                    {isTopMatch && (
                      <span className="rounded-full border border-rose-300/26 bg-rose-500/14 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-rose-100">
                        Best Match
                      </span>
                    )}
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
                        Lower Match
                      </span>
                    )}
                  </div>

                  <div className="mt-8 flex items-center gap-2 text-sm font-medium text-rose-300">
                    Choose this look
                    <span className="transition-transform group-hover:translate-x-1">-&gt;</span>
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

function scoreLook(
  lookId: LookId,
  analysis?: ResolvedFaceAnalysis | null,
  preferenceSummary?: ProfileHistoryResult["preferenceSummary"] | null
) {
  let score = 0;

  if (preferenceSummary?.preferredLooks.includes(lookId)) score += 5;
  if (preferenceSummary?.discouragedLooks.includes(lookId)) score -= 4;
  if (preferenceSummary?.recentLooks.includes(lookId)) score += 1;

  const intensityPreference = preferenceSummary?.intensityPreference;
  if (intensityPreference && LOOK_DEFINITIONS[lookId].engine.defaultIntensity === intensityPreference) {
    score += 2;
  }

  switch (preferenceSummary?.styleMood) {
    case "classic":
      if (lookId === "natural" || lookId === "soft-glam" || lookId === "monochromatic") score += 2;
      break;
    case "soft":
      if (lookId === "natural" || lookId === "soft-glam" || lookId === "monochromatic") score += 2;
      break;
    case "graphic":
      if (lookId === "editorial" || lookId === "evening") score += 2;
      break;
    case "experimental":
      if (lookId === "editorial" || lookId === "monochromatic") score += 2;
      break;
  }

  switch (preferenceSummary?.finishPreference) {
    case "glowy":
      if (lookId === "natural" || lookId === "soft-glam" || lookId === "monochromatic") score += 2;
      break;
    case "matte":
      if (lookId === "evening" || lookId === "bold-lip" || lookId === "editorial") score += 2;
      break;
  }

  switch (preferenceSummary?.definitionPreference) {
    case "sharp":
      if (lookId === "editorial" || lookId === "evening") score += 2;
      break;
    case "diffused":
      if (lookId === "natural" || lookId === "soft-glam" || lookId === "monochromatic") score += 2;
      break;
  }

  if (
    preferenceSummary?.featureFocus === "eyes" &&
    (lookId === "soft-glam" || lookId === "editorial" || lookId === "evening")
  ) {
    score += 1;
  }

  if (
    preferenceSummary?.featureFocus === "lips" &&
    (lookId === "bold-lip" || lookId === "monochromatic")
  ) {
    score += 1;
  }

  if (analysis?.skinUndertone === "warm" && (lookId === "soft-glam" || lookId === "monochromatic")) {
    score += 1;
  }

  if (analysis?.beautyHighlights.some((item) => /lip/i.test(item)) && lookId === "bold-lip") {
    score += 1;
  }

  if (
    analysis?.beautyHighlights.some((item) => /eye/i.test(item)) &&
    (lookId === "soft-glam" || lookId === "editorial")
  ) {
    score += 1;
  }

  return score;
}
