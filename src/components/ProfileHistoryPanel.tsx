"use client";

import type { ProfileHistoryResult } from "@/app/api/profile/history/route";

interface Props {
  history: ProfileHistoryResult;
}

export function ProfileHistoryPanel({ history }: Props) {
  if (history.analyses.length === 0 && history.tutorials.length === 0) {
    return null;
  }

  return (
    <div className="glass-card rounded-[2rem] border border-white/8 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-rose-300">Your Memory</p>
          <p className="mt-2 text-sm leading-relaxed text-white/48">
            Recent reads and routines now stay attached to your profile, so the app can start keeping continuity.
          </p>
        </div>
        <div className="text-xs uppercase tracking-[0.2em] text-white/30">
          {history.tutorials.length} routine{history.tutorials.length === 1 ? "" : "s"} saved
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-4">
          <p className="text-[10px] uppercase tracking-[0.24em] text-white/30">Taste Signals</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {history.preferenceSummary.recentLooks.map((look) => (
              <span
                key={look}
                className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs uppercase tracking-[0.18em] text-white/68"
              >
                {look}
              </span>
            ))}
            {history.preferenceSummary.recentLooks.length === 0 && (
              <span className="text-sm text-white/42">No saved looks yet.</span>
            )}
          </div>

          {(history.preferenceSummary.preferredLooks.length > 0 || history.preferenceSummary.intensityPreference) && (
            <div className="mt-4 space-y-2 text-sm text-white/58">
              {history.preferenceSummary.preferredLooks.length > 0 && (
                <p>Leaning toward: {history.preferenceSummary.preferredLooks.join(", ")}</p>
              )}
              {history.preferenceSummary.intensityPreference && (
                <p>Preferred intensity: {history.preferenceSummary.intensityPreference}</p>
              )}
              {history.explicitPreferences.skillLevel && (
                <p>Skill level: {history.explicitPreferences.skillLevel}</p>
              )}
              {history.explicitPreferences.featureFocus && (
                <p>Feature focus: {history.explicitPreferences.featureFocus}</p>
              )}
            </div>
          )}
        </div>

        <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-4">
          <p className="text-[10px] uppercase tracking-[0.24em] text-white/30">Recent Analysis Reads</p>
          <div className="mt-3 space-y-3">
            {history.analyses.slice(0, 2).map((analysis) => (
              <div key={analysis.id} className="rounded-[1.2rem] border border-white/8 bg-black/20 px-4 py-3">
                <p className="text-sm text-white/76">
                  {analysis.analysisSummary?.personalReading ?? "Saved analysis"}
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-white/30">
                  {analysis.analysisSummary?.faceShape ?? "face read"} · {analysis.photoCount} photo{analysis.photoCount === 1 ? "" : "s"}
                </p>
              </div>
            ))}
            {history.analyses.length === 0 && (
              <p className="text-sm text-white/42">Your next completed analysis will appear here.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
