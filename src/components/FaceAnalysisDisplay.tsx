"use client";

import type { FaceAnalysisResult } from "@/app/api/analyze-face/route";

interface Props {
  analysis: NonNullable<FaceAnalysisResult["faceAnalysis"]>;
  selectedSkinTone: FaceAnalysisResult["faceAnalysis"]["skinTone"];
  selectedSkinUndertone: FaceAnalysisResult["faceAnalysis"]["skinUndertone"];
  onSelectSkinTone: (value: FaceAnalysisResult["faceAnalysis"]["skinTone"]) => void;
  onSelectSkinUndertone: (value: FaceAnalysisResult["faceAnalysis"]["skinUndertone"]) => void;
  onProceed: () => void;
}

export function FaceAnalysisDisplay({
  analysis,
  selectedSkinTone,
  selectedSkinUndertone,
  onSelectSkinTone,
  onSelectSkinUndertone,
  onProceed,
}: Props) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="glass-card rounded-[2rem] border border-rose-500/15 p-6">
          <div className="mb-4 flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-rose-500/20 bg-rose-500/10 text-rose-300">
              ✦
            </span>
            <div>
              <p className="text-[11px] uppercase tracking-[0.3em] text-rose-300">Your Quick Read</p>
              <p className="mt-1 text-sm text-white/35">Short, simple, and based on your photos.</p>
            </div>
          </div>

          <p className="text-lg leading-relaxed text-white/82">{analysis.personalReading}</p>

          {analysis.precisionLevel === "medium" && (
            <p className="mt-4 rounded-2xl border border-white/8 bg-white/4 px-4 py-3 text-sm leading-relaxed text-white/52">
              {analysis.precisionNote}
            </p>
          )}
        </div>

        <div className="glass-card rounded-[2rem] border border-white/8 p-6">
          <p className="text-[11px] uppercase tracking-[0.3em] text-white/35">Best Features To Play Up</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {analysis.beautyHighlights.map((highlight) => (
              <span
                key={highlight}
                className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/72"
              >
                {highlight}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Section title="Face Shape" icon="◈">
          <div className="mb-3 flex flex-wrap gap-2">
            <Tag label={analysis.faceShape} />
          </div>
          <p className="text-sm leading-relaxed text-white/62">{analysis.faceShapeExplanation}</p>
          <MiniGuidance workWith={analysis.faceShapeWorkWith} avoid={analysis.faceShapeAvoid} />
        </Section>

        <Section title="Closest Tone Match" icon="◉">
          <p className="text-sm leading-relaxed text-white/62">{analysis.skinToneExplanation}</p>
          <OptionGroup
            className="mt-3"
            label="Pick the closest skin tone"
            options={analysis.skinToneOptions}
            selected={selectedSkinTone}
            onSelect={onSelectSkinTone}
          />
          <OptionGroup
            className="mt-3"
            label="Pick the closest undertone"
            options={analysis.skinUndertoneOptions}
            selected={selectedSkinUndertone}
            onSelect={onSelectSkinUndertone}
            formatLabel={(value) => `${value} undertone`}
            variant="soft"
          />
          <MiniGuidance workWith={analysis.skinToneWorkWith} avoid={analysis.skinToneAvoid} />
        </Section>

        <Section title="Eyes" icon="◎">
          <div className="mb-2 flex flex-wrap gap-2">
            <Tag label={analysis.eyes.shape} />
            <Tag label={analysis.eyes.set} variant="soft" />
          </div>
          <p className="text-sm leading-relaxed text-white/62">{analysis.eyes.makeupImplication}</p>
          <MiniGuidance workWith={analysis.eyes.workWith} avoid={analysis.eyes.avoid} />
        </Section>

        <Section title="Lips" icon="◌">
          <p className="text-sm leading-relaxed text-white/62">{analysis.lips.makeupImplication}</p>
          <MiniGuidance workWith={analysis.lips.workWith} avoid={analysis.lips.avoid} />
        </Section>

        <Section title="Keep It Simple" icon="⌒">
          <div className="mb-3 space-y-2">
            {analysis.makeupPriorities.map((priority) => (
              <div
                key={priority}
                className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm leading-relaxed text-white/72"
              >
                {priority}
              </div>
            ))}
          </div>
        </Section>

        <Section title="Skip These" icon="✕">
          <ul className="space-y-2">
            {analysis.avoidTechniques.map((avoid) => (
              <li key={avoid} className="flex items-start gap-2 text-sm leading-relaxed text-white/58">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-white/20" />
                {avoid}
              </li>
            ))}
          </ul>
        </Section>
      </div>

      <button
        onClick={onProceed}
        className="group inline-flex w-full items-center justify-center gap-3 rounded-full bg-rose-500 px-8 py-4 text-[15px] font-semibold text-white transition-all duration-200 hover:bg-rose-400 hover:shadow-[0_0_40px_rgba(244,63,94,0.25)]"
      >
        Start My Personalized Tutorial
        <span className="transition-transform group-hover:translate-x-1">→</span>
      </button>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass-card rounded-[1.75rem] border border-white/8 p-5">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="text-sm text-rose-300">{icon}</span>
        <span className="text-[11px] uppercase tracking-[0.28em] text-white/35">{title}</span>
      </div>
      {children}
    </div>
  );
}

function Tag({ label, variant = "primary" }: { label: string; variant?: "primary" | "soft" }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold capitalize ${
        variant === "primary"
          ? "border border-rose-500/25 bg-rose-500/10 text-rose-200"
          : "border border-white/10 bg-white/[0.04] text-white/62"
      }`}
    >
      {label}
    </span>
  );
}

function MiniGuidance({ workWith, avoid }: { workWith: string; avoid: string }) {
  return (
    <div className="mt-3 space-y-2">
      <div className="rounded-2xl border border-emerald-500/12 bg-emerald-500/[0.05] px-3 py-2 text-xs text-emerald-100/80">
        <span className="mr-2 uppercase tracking-[0.18em] text-emerald-300/80">Do</span>
        {workWith}
      </div>
      <div className="rounded-2xl border border-rose-500/12 bg-rose-500/[0.05] px-3 py-2 text-xs text-rose-100/80">
        <span className="mr-2 uppercase tracking-[0.18em] text-rose-300/80">Don&apos;t</span>
        {avoid}
      </div>
    </div>
  );
}

function OptionGroup<T extends string>({
  label,
  options,
  selected,
  onSelect,
  formatLabel,
  variant = "primary",
  className = "",
}: {
  label: string;
  options: T[];
  selected: T;
  onSelect: (value: T) => void;
  formatLabel?: (value: T) => string;
  variant?: "primary" | "soft";
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-white/32">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = option === selected;

          return (
            <button
              key={option}
              type="button"
              onClick={() => onSelect(option)}
              className={`rounded-full transition-colors ${
                isSelected ? "ring-1 ring-rose-300/60" : ""
              }`}
            >
              <Tag label={formatLabel ? formatLabel(option) : option} variant={variant} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
