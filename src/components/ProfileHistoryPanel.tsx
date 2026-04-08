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
    <div className="glass-card rounded-[2rem] p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--rose-strong)]">Your Memory</p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--text-main)]">
            Recent reads and routines now stay attached to your profile, so the app can start keeping continuity.
          </p>
        </div>
        <div className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
          {history.tutorials.length} routine{history.tutorials.length === 1 ? "" : "s"} saved
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[1.5rem] border border-[var(--border-subtle)] bg-white/74 p-4">
          <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--text-muted)]">Taste Signals</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {history.preferenceSummary.recentLooks.map((look) => (
              <span
                key={look}
                className="rounded-full border border-[var(--border-subtle)] bg-white/76 px-4 py-2 text-xs uppercase tracking-[0.18em] text-[var(--text-main)]"
              >
                {look}
              </span>
            ))}
            {history.preferenceSummary.recentLooks.length === 0 && (
              <span className="text-sm text-[var(--text-main)]">No saved looks yet.</span>
            )}
          </div>

          {(history.preferenceSummary.preferredLooks.length > 0 || history.preferenceSummary.intensityPreference) && (
            <div className="mt-4 space-y-2 text-sm text-[var(--text-main)]">
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

        <div className="rounded-[1.5rem] border border-[var(--border-subtle)] bg-white/74 p-4">
          <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--text-muted)]">Recent Analysis Reads</p>
          <div className="mt-3 space-y-3">
            {history.analyses.slice(0, 2).map((analysis) => (
              <div key={analysis.id} className="rounded-[1.2rem] border border-[var(--border-subtle)] bg-white/78 px-4 py-3">
                <p className="text-sm text-[var(--text-strong)]">
                  {analysis.analysisSummary?.personalReading ?? "Saved analysis"}
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  {analysis.analysisSummary?.faceShape ?? "face read"} · {analysis.photoCount} photo{analysis.photoCount === 1 ? "" : "s"}
                </p>
              </div>
            ))}
            {history.analyses.length === 0 && (
              <p className="text-sm text-[var(--text-main)]">Your next completed analysis will appear here.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
