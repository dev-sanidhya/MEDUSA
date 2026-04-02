"use client";

import type { FaceAnalysisResult } from "@/app/api/analyze-face/route";

type ResolvedFaceAnalysis = NonNullable<FaceAnalysisResult["faceAnalysis"]>;

interface Props {
  analysis: ResolvedFaceAnalysis;
  selectedSkinTone: ResolvedFaceAnalysis["skinTone"];
  selectedSkinUndertone: ResolvedFaceAnalysis["skinUndertone"];
  onProceed: () => void;
  onAdjustTone: () => void;
}

export function FaceAnalysisDisplay({
  analysis,
  selectedSkinTone,
  selectedSkinUndertone,
  onProceed,
  onAdjustTone,
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
          <FeatureNote
            title="What we noticed"
            body={analysis.faceShapeExplanation}
          />
          <MiniGuidance workWith={analysis.faceShapeWorkWith} avoid={analysis.faceShapeAvoid} />
        </Section>

        <Section title="Closest Tone Match" icon="◉">
          <FeatureNote
            title="What we noticed"
            body={analysis.skinToneExplanation}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <Tag label={selectedSkinTone} />
            <Tag label={`${selectedSkinUndertone} undertone`} variant="soft" />
          </div>
          <MiniGuidance workWith={analysis.skinToneWorkWith} avoid={analysis.skinToneAvoid} />
        </Section>

        <Section title="Eyes" icon="◎">
          <div className="mb-2 flex flex-wrap gap-2">
            <Tag label={analysis.eyes.shape} />
            <Tag label={analysis.eyes.set} variant="soft" />
          </div>
          <FeatureNote
            title="What we noticed"
            body={analysis.eyes.specificCharacteristics}
          />
          <p className="mt-3 text-sm leading-relaxed text-white/68">{analysis.eyes.makeupImplication}</p>
          <MiniGuidance workWith={analysis.eyes.workWith} avoid={analysis.eyes.avoid} />
        </Section>

        <Section title="Lips" icon="◌">
          <FeatureNote
            title="What we noticed"
            body={analysis.lips.specificCharacteristics}
          />
          <p className="mt-3 text-sm leading-relaxed text-white/68">{analysis.lips.makeupImplication}</p>
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

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={onProceed}
          className="group inline-flex w-full items-center justify-center gap-3 rounded-full bg-rose-500 px-8 py-4 text-[15px] font-semibold text-white transition-all duration-200 hover:bg-rose-400 hover:shadow-[0_0_40px_rgba(244,63,94,0.25)]"
        >
          Continue With This Match
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </button>
        <button
          onClick={onAdjustTone}
          className="inline-flex w-full items-center justify-center rounded-full border border-white/10 px-8 py-4 text-[15px] font-semibold text-white/72 transition-colors hover:border-white/18 hover:bg-white/[0.04]"
        >
          Choose My Own Tone
        </button>
      </div>
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
      className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold capitalize transition-colors ${
        variant === "primary"
          ? "border border-rose-500/25 bg-rose-500/10 text-rose-200"
          : "border border-white/10 bg-white/[0.04] text-white/62"
      }`}
    >
      {label}
    </span>
  );
}

function FeatureNote({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[1.2rem] border border-white/8 bg-white/[0.03] px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.22em] text-white/30">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-white/62">{body}</p>
    </div>
  );
}

function MiniGuidance({ workWith, avoid }: { workWith: string; avoid: string }) {
  return (
    <div className="mt-4 grid gap-2">
      <div className="rounded-[1.2rem] border border-emerald-500/18 bg-emerald-500/[0.06] px-4 py-3">
        <p className="text-[10px] uppercase tracking-[0.22em] text-emerald-300/85">Do</p>
        <p className="mt-2 text-sm leading-relaxed text-emerald-100/85">{workWith}</p>
      </div>
      <div className="rounded-[1.2rem] border border-rose-500/18 bg-rose-500/[0.06] px-4 py-3">
        <p className="text-[10px] uppercase tracking-[0.22em] text-rose-300/85">Don&apos;t</p>
        <p className="mt-2 text-sm leading-relaxed text-rose-100/85">{avoid}</p>
      </div>
    </div>
  );
}
