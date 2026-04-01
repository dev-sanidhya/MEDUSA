"use client";

import type { FaceAnalysisResult } from "@/app/api/analyze-face/route";

interface Props {
  analysis: NonNullable<FaceAnalysisResult["faceAnalysis"]>;
  onProceed: () => void;
}

export function FaceAnalysisDisplay({ analysis, onProceed }: Props) {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 text-[color:var(--color-ink)]">
      <div className="rounded-[2rem] border border-[rgba(77,29,23,0.1)] bg-[linear-gradient(135deg,rgba(255,248,243,0.94),rgba(247,232,223,0.88))] p-7 shadow-[0_14px_40px_rgba(111,58,41,0.05)]">
        <div className="mb-3 flex items-center gap-2">
          <span className="text-lg">✦</span>
          <span className="text-xs font-semibold uppercase tracking-widest text-[color:var(--color-accent)]">
            Your Face Reading
          </span>
        </div>
        <p className="text-[15px] leading-8 text-[color:var(--color-ink)]">{analysis.personalReading}</p>

        {analysis.precisionLevel === "medium" && (
          <p className="mt-3 text-xs italic text-[color:var(--color-sage)]">{analysis.precisionNote}</p>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Section title="Face Shape" icon="◈">
          <Tag label={analysis.faceShape} />
          <p className="mt-3 text-sm leading-7 text-[color:var(--color-ink-soft)]">{analysis.faceShapeExplanation}</p>
        </Section>

        <Section title="Skin Tone" icon="◉">
          <div className="mb-3 flex flex-wrap gap-2">
            <Tag label={analysis.skinTone} />
            <Tag label={`${analysis.skinUndertone} undertone`} variant="soft" />
          </div>
          <p className="text-sm leading-7 text-[color:var(--color-ink-soft)]">{analysis.skinToneExplanation}</p>
        </Section>

        <Section title="Eyes" icon="◎">
          <div className="mb-3 flex flex-wrap gap-2">
            <Tag label={analysis.eyes.shape} />
            <Tag label={analysis.eyes.set} variant="soft" />
          </div>
          <p className="mb-2 text-sm leading-7 text-[color:var(--color-ink-soft)]">{analysis.eyes.specificCharacteristics}</p>
          <Implication text={analysis.eyes.makeupImplication} />
        </Section>

        <Section title="Lips" icon="◌">
          <p className="mb-2 text-sm leading-7 text-[color:var(--color-ink-soft)]">{analysis.lips.specificCharacteristics}</p>
          <Implication text={analysis.lips.makeupImplication} />
        </Section>

        <Section title="Brows" icon="⌒">
          <p className="mb-2 text-sm leading-7 text-[color:var(--color-ink-soft)]">
            {analysis.brows.naturalShape}
            {analysis.brows.asymmetry && <> — {analysis.brows.asymmetry}</>}
          </p>
          <Implication text={analysis.brows.makeupImplication} />
        </Section>

        <Section title="Standout Features" icon="✦">
          <ul className="space-y-2">
            {analysis.beautyHighlights.map((h, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[color:var(--color-ink-soft)]">
                <span className="mt-0.5 text-[color:var(--color-accent)]">→</span>
                {h}
              </li>
            ))}
          </ul>
        </Section>
      </div>

      <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <Section title="Makeup Priorities" icon="◍">
          <ul className="space-y-2">
            {analysis.makeupPriorities.map((priority, i) => (
              <li key={priority} className="flex items-start gap-3 text-sm text-[color:var(--color-ink-soft)]">
                <span className="mt-0.5 text-xs font-semibold text-[color:var(--color-accent)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {priority}
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Techniques To Avoid" icon="✕">
          <ul className="space-y-2">
            {analysis.avoidTechniques.map((a, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[color:var(--color-ink-soft)]">
                <span className="mt-0.5 text-[color:var(--color-sage)]">–</span>
                {a}
              </li>
            ))}
          </ul>
        </Section>
      </div>

      <button
        onClick={onProceed}
        className="w-full rounded-full bg-[color:var(--color-accent)] py-4 text-[15px] font-semibold uppercase tracking-[0.16em] text-white transition-transform duration-300 hover:-translate-y-0.5"
      >
        Start Personalized Tutorial
      </button>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[1.8rem] border border-[rgba(77,29,23,0.1)] bg-[rgba(255,250,247,0.78)] p-5 shadow-[0_10px_28px_rgba(111,58,41,0.04)]">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-sm text-[color:var(--color-sage)]">{icon}</span>
        <span className="text-xs font-semibold uppercase tracking-widest text-[color:var(--color-sage)]">{title}</span>
      </div>
      {children}
    </div>
  );
}

function Tag({ label, variant = "primary" }: { label: string; variant?: "primary" | "soft" }) {
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold capitalize ${
        variant === "primary"
          ? "bg-[rgba(158,43,37,0.08)] text-[color:var(--color-accent)]"
          : "bg-[rgba(77,29,23,0.06)] text-[color:var(--color-ink-soft)]"
      }`}
    >
      {label}
    </span>
  );
}

function Implication({ text }: { text: string }) {
  return (
    <div className="mt-3 border-l-2 border-[color:var(--color-accent-soft)] pl-3">
      <p className="text-xs font-medium leading-6 text-[color:var(--color-accent)]">{text}</p>
    </div>
  );
}
