"use client";

import type { FaceAnalysisResult } from "@/app/api/analyze-face/route";
import type { LookId } from "@/app/api/generate-tutorial/route";
import type { ProfileHistoryResult } from "@/app/api/profile/history/route";
import { LOOK_DEFINITIONS, LOOK_PRESENTATIONS } from "@/lib/medusa/look-config";

type ResolvedFaceAnalysis = NonNullable<FaceAnalysisResult["faceAnalysis"]>;

interface Props {
  onSelect: (look: LookId) => void;
  analysis?: ResolvedFaceAnalysis | null;
  explicitPreferences?: ProfileHistoryResult["explicitPreferences"] | null;
  preferenceSummary?: ProfileHistoryResult["preferenceSummary"] | null;
  recommendedLooks?: ProfileHistoryResult["recommendedLooks"] | null;
  onRefineProfile?: () => void;
}

export function LookSelector({
  onSelect,
  analysis,
  explicitPreferences,
  preferenceSummary,
  recommendedLooks,
  onRefineProfile,
}: Props) {
  const preferredLooks = new Set(preferenceSummary?.preferredLooks ?? []);
  const discouragedLooks = new Set(preferenceSummary?.discouragedLooks ?? []);
  const recentLooks = new Set(preferenceSummary?.recentLooks ?? []);
  const recommendedMap = new Map(
    (recommendedLooks ?? []).map((recommendation) => [recommendation.lookId, recommendation])
  );
  const rankedLooks = [
    ...LOOK_PRESENTATIONS.filter((look) => recommendedMap.has(look.id)),
    ...LOOK_PRESENTATIONS.filter((look) => !recommendedMap.has(look.id)),
  ];
  const topRecommendation = recommendedLooks?.[0] ?? null;
  const topLookId = topRecommendation?.lookId ?? null;

  return (
    <main className="min-h-screen bg-transparent px-6 py-12 text-[var(--text-main)]">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 max-w-2xl">
          <p className="mb-4 text-xs uppercase tracking-[0.3em] text-[var(--rose-strong)]">Step 03</p>
          <h1
            className="text-5xl font-semibold leading-none text-[var(--text-strong)] md:text-7xl"
            style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
          >
            Choose the look.
            <br />
            <span style={{ fontStyle: "italic" }}>Keep the fit.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-[var(--text-main)]">
            Your face read is done. This step only changes the mood, intensity,
            and finish MEDUSA builds around it.
          </p>
          {topLookId && (
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-[var(--text-main)]">
              MEDUSA would start with {LOOK_DEFINITIONS[topLookId].label.toLowerCase()} for your
              current face read and taste memory.
            </p>
          )}
        </div>

        {(topLookId || preferenceSummary) && (
          <div className="mb-8 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[2rem] border border-[rgba(220,127,139,0.24)] bg-[var(--bg-soft-rose)] p-6 shadow-[var(--shadow-soft)]">
              <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--rose-strong)]">Recommended Direction</p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                {topLookId && (
                  <span className="rounded-full border border-[rgba(220,127,139,0.24)] bg-white/78 px-4 py-2 text-xs uppercase tracking-[0.18em] text-[var(--rose-strong)]">
                    {LOOK_DEFINITIONS[topLookId].label}
                  </span>
                )}
                {preferenceSummary?.intensityPreference && (
                  <span className="rounded-full border border-[var(--border-subtle)] bg-white/74 px-4 py-2 text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    {preferenceSummary.intensityPreference} intensity
                  </span>
                )}
                {preferenceSummary?.finishPreference && (
                  <span className="rounded-full border border-[var(--border-subtle)] bg-white/74 px-4 py-2 text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    {preferenceSummary.finishPreference} finish
                  </span>
                )}
                {preferenceSummary?.featureFocus && (
                  <span className="rounded-full border border-[var(--border-subtle)] bg-white/74 px-4 py-2 text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    {preferenceSummary.featureFocus} focus
                  </span>
                )}
              </div>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[var(--text-main)]">
                {topRecommendation?.rationale ?? buildRecommendationRationale(topLookId, preferenceSummary, analysis)}
              </p>
            </div>

            <div className="glass-card rounded-[2rem] p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--text-muted)]">Taste Profile</p>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--text-main)]">
                    {explicitPreferences?.completedOnboarding
                      ? "Your saved defaults are already shaping what MEDUSA prioritizes."
                      : "You can keep going, or tune your defaults before you choose a look."}
                  </p>
                </div>
                {onRefineProfile && (
                  <button
                    type="button"
                    onClick={onRefineProfile}
                    className="rounded-full border border-[var(--border-subtle)] bg-white/76 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-[var(--text-main)] transition-colors hover:bg-white"
                  >
                    {explicitPreferences?.completedOnboarding ? "Refine" : "Tune"}
                  </button>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {buildProfileChips(preferenceSummary).map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full border border-[var(--border-subtle)] bg-white/76 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rankedLooks.map((look, index) => {
            const isPreferred = preferredLooks.has(look.id);
            const isDiscouraged = discouragedLooks.has(look.id);
            const isRecent = recentLooks.has(look.id);
            const isTopMatch = topLookId === look.id;
            const recommendation = recommendedMap.get(look.id);

            return (
              <button
                key={look.id}
                onClick={() => onSelect(look.id)}
                className={`group relative overflow-hidden rounded-[2rem] border bg-white/82 p-6 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-soft)] ${
                  isTopMatch
                    ? "border-[rgba(220,127,139,0.3)] hover:border-[rgba(220,127,139,0.44)]"
                    : isPreferred
                      ? "border-[rgba(220,127,139,0.24)] hover:border-[rgba(220,127,139,0.4)]"
                      : "border-[var(--border-subtle)] hover:border-[rgba(220,127,139,0.26)]"
                }`}
              >
                <div
                  className="pointer-events-none absolute inset-0 opacity-90 transition-opacity duration-200 group-hover:opacity-100"
                  style={{ background: `radial-gradient(circle at top right, ${look.accent}, transparent 56%)` }}
                />
                <div className="relative">
                  <div className="mb-10 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--rose-strong)]">{look.tag}</p>
                      <p className="mt-2 text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
                        Look {String(index + 1).padStart(2, "0")}
                      </p>
                    </div>
                    <span className="rounded-full border border-[var(--border-subtle)] bg-white/76 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
                      Face read holds
                    </span>
                  </div>

                  <h2
                    className="text-3xl font-semibold leading-none text-[var(--text-strong)]"
                    style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
                  >
                    {look.label}
                  </h2>
                  <p className="mt-3 max-w-[24ch] text-sm leading-relaxed text-[var(--text-main)]">
                    {look.subtitle}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {isTopMatch && (
                        <span className="rounded-full border border-[rgba(220,127,139,0.24)] bg-white/78 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[var(--rose-strong)]">
                          Best Match
                        </span>
                    )}
                    {recommendation?.badges
                      .filter((badge) => !(
                        (badge === "preferred" && isPreferred) ||
                        (badge === "recent" && isRecent) ||
                        (badge === "lower match" && isDiscouraged)
                      ))
                      .map((badge) => (
                        <span
                          key={badge}
                          className="rounded-full border border-[var(--border-subtle)] bg-white/76 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]"
                        >
                          {badge}
                        </span>
                      ))}
                    {isPreferred && (
                      <span className="rounded-full border border-[rgba(220,127,139,0.24)] bg-[var(--bg-soft-rose)] px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[var(--rose-strong)]">
                        Preferred
                      </span>
                    )}
                    {isRecent && (
                      <span className="rounded-full border border-[var(--border-subtle)] bg-white/76 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                        Recent
                      </span>
                    )}
                    {isDiscouraged && (
                      <span className="rounded-full border border-amber-400/18 bg-amber-500/[0.08] px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-amber-700">
                        Lower Match
                      </span>
                    )}
                  </div>

                  <div className="mt-8 flex items-center gap-2 text-sm font-medium text-[var(--rose-strong)]">
                    Choose this look
                    <span className="transition-transform group-hover:translate-x-1">-&gt;</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <p className="mt-8 text-center text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">
          Placement and cautions stay specific to your face. Only the look direction changes.
        </p>
      </div>
    </main>
  );
}

function buildRecommendationRationale(
  topLookId: LookId | null,
  preferenceSummary?: ProfileHistoryResult["preferenceSummary"] | null,
  analysis?: ResolvedFaceAnalysis | null
) {
  if (!topLookId) {
    return "MEDUSA will keep the recommendation close to your face read until it has stronger taste memory.";
  }

  const reasons: string[] = [];

  if (preferenceSummary?.preferredLooks.includes(topLookId)) {
    reasons.push("you have already leaned toward this direction before");
  }

  if (preferenceSummary?.featureFocus === "eyes" && (topLookId === "soft-glam" || topLookId === "editorial" || topLookId === "evening")) {
    reasons.push("your profile keeps favoring eye-led placement");
  }

  if (preferenceSummary?.featureFocus === "lips" && (topLookId === "bold-lip" || topLookId === "monochromatic")) {
    reasons.push("your profile keeps favoring lip-led balance");
  }

  if (analysis?.beautyHighlights.some((item) => /eye/i.test(item)) && (topLookId === "soft-glam" || topLookId === "editorial")) {
    reasons.push("your current face read gives MEDUSA strong eye architecture to work with");
  }

  if (analysis?.beautyHighlights.some((item) => /lip/i.test(item)) && topLookId === "bold-lip") {
    reasons.push("your current face read can carry a stronger lip statement cleanly");
  }

  if (preferenceSummary?.intensityPreference) {
    reasons.push(`your saved taste currently sits closer to ${preferenceSummary.intensityPreference} intensity`);
  }

  return reasons.length > 0
    ? `This is leading because ${reasons.slice(0, 2).join(" and ")}.`
    : "This is currently the cleanest match between your face read and the preference signals MEDUSA has saved.";
}

function buildProfileChips(
  preferenceSummary?: ProfileHistoryResult["preferenceSummary"] | null
) {
  if (!preferenceSummary) {
    return ["no saved signals yet"];
  }

  const chips = [
    preferenceSummary.skillLevel ? `${preferenceSummary.skillLevel} skill` : null,
    preferenceSummary.intensityPreference ? `${preferenceSummary.intensityPreference} intensity` : null,
    preferenceSummary.finishPreference ? `${preferenceSummary.finishPreference} finish` : null,
    preferenceSummary.styleMood ? `${preferenceSummary.styleMood} mood` : null,
    preferenceSummary.featureFocus ? `${preferenceSummary.featureFocus} focus` : null,
  ].filter((value): value is string => Boolean(value));

  return chips.length > 0 ? chips : ["taste memory is still building"];
}
