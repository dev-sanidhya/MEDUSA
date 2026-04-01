"use client";

import type { FaceAnalysisResult } from "@/app/api/analyze-face/route";

interface Props {
  analysis: NonNullable<FaceAnalysisResult["faceAnalysis"]>;
  onProceed: () => void;
}

export function FaceAnalysisDisplay({ analysis, onProceed }: Props) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="glass-card rounded-[2rem] border border-rose-500/15 p-7">
          <div className="mb-4 flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-rose-500/20 bg-rose-500/10 text-rose-300">
              ✦
            </span>
            <div>
              <p className="text-[11px] uppercase tracking-[0.3em] text-rose-300">Your Face Reading</p>
              <p className="mt-1 text-sm text-white/35">Built from your geometry, not a template.</p>
            </div>
          </div>

          <p className="text-lg leading-relaxed text-white/82">{analysis.personalReading}</p>

          {analysis.precisionLevel === "medium" && (
            <p className="mt-4 rounded-2xl border border-white/8 bg-white/4 px-4 py-3 text-sm leading-relaxed text-white/52">
              {analysis.precisionNote}
            </p>
          )}
        </div>

        <div className="glass-card rounded-[2rem] border border-white/8 p-7">
          <p className="text-[11px] uppercase tracking-[0.3em] text-white/35">Standout Features</p>
          <div className="mt-5 space-y-3">
            {analysis.beautyHighlights.map((highlight) => (
              <div
                key={highlight}
                className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm leading-relaxed text-white/72"
              >
                {highlight}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Section title="Face Shape" icon="◈">
          <div className="mb-3 flex flex-wrap gap-2">
            <Tag label={analysis.faceShape} />
          </div>
          <p className="text-sm leading-relaxed text-white/62">{analysis.faceShapeExplanation}</p>
        </Section>

        <Section title="Skin Tone" icon="◉">
          <div className="mb-3 flex flex-wrap gap-2">
            <Tag label={analysis.skinTone} />
            <Tag label={`${analysis.skinUndertone} undertone`} variant="soft" />
          </div>
          <p className="text-sm leading-relaxed text-white/62">{analysis.skinToneExplanation}</p>
        </Section>

        <Section title="Eyes" icon="◎">
          <div className="mb-3 flex flex-wrap gap-2">
            <Tag label={analysis.eyes.shape} />
            <Tag label={analysis.eyes.set} variant="soft" />
          </div>
          <p className="mb-2 text-sm leading-relaxed text-white/62">{analysis.eyes.specificCharacteristics}</p>
          <Implication text={analysis.eyes.makeupImplication} />
        </Section>

        <Section title="Lips" icon="◌">
          <p className="mb-2 text-sm leading-relaxed text-white/62">{analysis.lips.specificCharacteristics}</p>
          <Implication text={analysis.lips.makeupImplication} />
        </Section>

        <Section title="Brows" icon="⌒">
          <p className="mb-2 text-sm leading-relaxed text-white/62">
            {analysis.brows.naturalShape}
            {analysis.brows.asymmetry && <> — {analysis.brows.asymmetry}</>}
          </p>
          <Implication text={analysis.brows.makeupImplication} />
        </Section>

        <Section title="What To Avoid" icon="✕">
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

function Implication({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-rose-500/12 bg-rose-500/[0.06] px-4 py-3 text-sm leading-relaxed text-rose-100/82">
      {text}
    </div>
  );
}
