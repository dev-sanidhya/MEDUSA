"use client";

import { useState } from "react";
import { LOOK_PRESENTATIONS } from "@/lib/medusa/look-config";
import type { ProfileExplicitPreferences } from "@/lib/persistence/types";

interface Props {
  initialPreferences?: ProfileExplicitPreferences | null;
  onSubmit: (payload: ProfileExplicitPreferences) => Promise<void>;
  title?: string;
  body?: string;
  submitLabel?: string;
  compact?: boolean;
}

export function PreferenceOnboardingPanel({
  initialPreferences,
  onSubmit,
  title = "Set Your Taste Profile",
  body = "Give MEDUSA a few direct signals so your next recommendations start closer to your actual style.",
  submitLabel = "Save Preferences",
  compact = false,
}: Props) {
  const [skillLevel, setSkillLevel] = useState<ProfileExplicitPreferences["skillLevel"]>(
    initialPreferences?.skillLevel ?? null
  );
  const [intensityPreference, setIntensityPreference] = useState<
    ProfileExplicitPreferences["intensityPreference"]
  >(initialPreferences?.intensityPreference ?? null);
  const [finishPreference, setFinishPreference] = useState<
    ProfileExplicitPreferences["finishPreference"]
  >(initialPreferences?.finishPreference ?? null);
  const [styleMood, setStyleMood] = useState<ProfileExplicitPreferences["styleMood"]>(
    initialPreferences?.styleMood ?? null
  );
  const [definitionPreference, setDefinitionPreference] = useState<
    ProfileExplicitPreferences["definitionPreference"]
  >(initialPreferences?.definitionPreference ?? null);
  const [featureFocus, setFeatureFocus] = useState<ProfileExplicitPreferences["featureFocus"]>(
    initialPreferences?.featureFocus ?? null
  );
  const [preferredLooks, setPreferredLooks] = useState<string[]>(
    initialPreferences?.preferredLooks ?? []
  );
  const [dislikedLooks, setDislikedLooks] = useState<string[]>(
    initialPreferences?.dislikedLooks ?? []
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(initialPreferences?.completedOnboarding === true);

  const toggleLook = (
    lookId: string,
    current: string[],
    setCurrent: React.Dispatch<React.SetStateAction<string[]>>,
    opposite: string[],
    setOpposite: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setCurrent((value) =>
      value.includes(lookId) ? value.filter((item) => item !== lookId) : [...value, lookId]
    );
    if (opposite.includes(lookId)) {
      setOpposite((value) => value.filter((item) => item !== lookId));
    }
  };

  const handleSubmit = async () => {
    if (isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      await onSubmit({
        completedOnboarding: true,
        skillLevel,
        intensityPreference,
        finishPreference,
        styleMood,
        definitionPreference,
        featureFocus,
        preferredLooks,
        dislikedLooks,
      });
      setIsSaved(true);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="glass-card rounded-[2rem] border border-white/8 p-6">
      <p className="text-[11px] uppercase tracking-[0.3em] text-rose-300">{title}</p>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/52">{body}</p>

      {isSaved ? (
        <div className="mt-5 rounded-[1.35rem] border border-emerald-500/18 bg-emerald-500/[0.06] px-5 py-4 text-sm text-emerald-100/85">
          Saved. MEDUSA will use these profile preferences alongside your feedback history.
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          <PreferenceGroup
            label="Skill Level"
            options={[
              { id: "beginner", label: "Beginner" },
              { id: "intermediate", label: "Intermediate" },
              { id: "advanced", label: "Advanced" },
            ]}
            selected={skillLevel}
            onSelect={(value) => setSkillLevel(value as ProfileExplicitPreferences["skillLevel"])}
          />

          <PreferenceGroup
            label="Preferred Intensity"
            options={[
              { id: "soft", label: "Soft" },
              { id: "balanced", label: "Balanced" },
              { id: "bold", label: "Bold" },
            ]}
            selected={intensityPreference}
            onSelect={(value) =>
              setIntensityPreference(value as ProfileExplicitPreferences["intensityPreference"])
            }
          />

          <PreferenceGroup
            label="Preferred Finish"
            options={[
              { id: "glowy", label: "Glowy" },
              { id: "balanced", label: "Balanced" },
              { id: "matte", label: "Matte" },
            ]}
            selected={finishPreference}
            onSelect={(value) =>
              setFinishPreference(value as ProfileExplicitPreferences["finishPreference"])
            }
          />

          {!compact && (
            <PreferenceGroup
              label="Style Mood"
              options={[
                { id: "classic", label: "Classic" },
                { id: "soft", label: "Soft" },
                { id: "graphic", label: "Graphic" },
                { id: "experimental", label: "Experimental" },
              ]}
              selected={styleMood}
              onSelect={(value) => setStyleMood(value as ProfileExplicitPreferences["styleMood"])}
            />
          )}

          {!compact && (
            <PreferenceGroup
              label="Edge Preference"
              options={[
                { id: "diffused", label: "Diffused" },
                { id: "balanced", label: "Balanced" },
                { id: "sharp", label: "Sharp" },
              ]}
              selected={definitionPreference}
              onSelect={(value) =>
                setDefinitionPreference(value as ProfileExplicitPreferences["definitionPreference"])
              }
            />
          )}

          <PreferenceGroup
            label="Feature Focus"
            options={[
              { id: "eyes", label: "Eyes" },
              { id: "lips", label: "Lips" },
            ]}
            selected={featureFocus}
            onSelect={(value) => setFeatureFocus(value as ProfileExplicitPreferences["featureFocus"])}
          />

          <LookGroup
            label="Looks You Want More Of"
            values={preferredLooks}
            tone="preferred"
            onToggle={(lookId) =>
              toggleLook(lookId, preferredLooks, setPreferredLooks, dislikedLooks, setDislikedLooks)
            }
          />

          <LookGroup
            label="Looks You Usually Avoid"
            values={dislikedLooks}
            tone="discouraged"
            onToggle={(lookId) =>
              toggleLook(lookId, dislikedLooks, setDislikedLooks, preferredLooks, setPreferredLooks)
            }
          />

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="rounded-full bg-rose-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? "Saving..." : submitLabel}
          </button>
        </div>
      )}
    </div>
  );
}

function PreferenceGroup({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: Array<{ id: string; label: string }>;
  selected: string | null;
  onSelect: (value: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-[10px] uppercase tracking-[0.24em] text-white/34">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isActive = selected === option.id;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option.id)}
              className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.18em] transition-colors ${
                isActive
                  ? "border-rose-400/28 bg-rose-500/10 text-white"
                  : "border-white/10 bg-white/[0.02] text-white/48 hover:border-white/16 hover:text-white/74"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function LookGroup({
  label,
  values,
  onToggle,
  tone,
}: {
  label: string;
  values: string[];
  onToggle: (value: string) => void;
  tone: "preferred" | "discouraged";
}) {
  return (
    <div>
      <p className="mb-2 text-[10px] uppercase tracking-[0.24em] text-white/34">{label}</p>
      <div className="flex flex-wrap gap-2">
        {LOOK_PRESENTATIONS.map((option) => {
          const isActive = values.includes(option.id);

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onToggle(option.id)}
              className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.18em] transition-colors ${
                isActive
                  ? tone === "preferred"
                    ? "border-rose-400/28 bg-rose-500/10 text-white"
                    : "border-amber-400/18 bg-amber-500/[0.08] text-amber-100/84"
                  : "border-white/10 bg-white/[0.02] text-white/48 hover:border-white/16 hover:text-white/74"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
