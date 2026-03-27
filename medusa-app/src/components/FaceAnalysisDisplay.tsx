"use client";

/**
 * FaceAnalysisDisplay.tsx
 * Shows the completed face analysis from the Claude agent —
 * the "face reading" that precedes the tutorial.
 */

import type { FaceAnalysisResult } from "@/app/api/analyze-face/route";

interface Props {
  analysis: NonNullable<FaceAnalysisResult["faceAnalysis"]>;
  onProceed: () => void;
}

export function FaceAnalysisDisplay({ analysis, onProceed }: Props) {
  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">

      {/* Personal reading */}
      <div className="bg-gradient-to-br from-rose-50 to-stone-50 border border-rose-100 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">✦</span>
          <span className="text-xs font-semibold uppercase tracking-widest text-rose-400">Your Face Reading</span>
        </div>
        <p className="text-stone-800 leading-relaxed text-[15px]">{analysis.personalReading}</p>

        {analysis.precisionLevel === "medium" && (
          <p className="mt-3 text-xs text-stone-400 italic">{analysis.precisionNote}</p>
        )}
      </div>

      {/* Face shape */}
      <Section title="Face Shape" icon="◈">
        <Tag label={analysis.faceShape} />
        <p className="text-stone-600 text-sm mt-2 leading-relaxed">{analysis.faceShapeExplanation}</p>
      </Section>

      {/* Skin */}
      <Section title="Skin Tone" icon="◉">
        <div className="flex gap-2 flex-wrap mb-2">
          <Tag label={analysis.skinTone} />
          <Tag label={`${analysis.skinUndertone} undertone`} variant="soft" />
        </div>
        <p className="text-stone-600 text-sm leading-relaxed">{analysis.skinToneExplanation}</p>
      </Section>

      {/* Eyes */}
      <Section title="Eyes" icon="◎">
        <div className="flex gap-2 flex-wrap mb-2">
          <Tag label={analysis.eyes.shape} />
          <Tag label={analysis.eyes.set} variant="soft" />
        </div>
        <p className="text-stone-600 text-sm leading-relaxed mb-1">{analysis.eyes.specificCharacteristics}</p>
        <Implication text={analysis.eyes.makeupImplication} />
      </Section>

      {/* Lips */}
      <Section title="Lips" icon="◌">
        <p className="text-stone-600 text-sm leading-relaxed mb-1">{analysis.lips.specificCharacteristics}</p>
        <Implication text={analysis.lips.makeupImplication} />
      </Section>

      {/* Brows */}
      <Section title="Brows" icon="⌒">
        <p className="text-stone-600 text-sm leading-relaxed mb-1">
          {analysis.brows.naturalShape}
          {analysis.brows.asymmetry && <> — {analysis.brows.asymmetry}</>}
        </p>
        <Implication text={analysis.brows.makeupImplication} />
      </Section>

      {/* Beauty highlights */}
      <Section title="Your Standout Features" icon="✦">
        <ul className="space-y-1.5">
          {analysis.beautyHighlights.map((h, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-stone-700">
              <span className="text-rose-400 mt-0.5">→</span>
              {h}
            </li>
          ))}
        </ul>
      </Section>

      {/* What to avoid */}
      <Section title="Techniques That Won't Work For You" icon="✕">
        <ul className="space-y-1.5">
          {analysis.avoidTechniques.map((a, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-stone-600">
              <span className="text-stone-400 mt-0.5">–</span>
              {a}
            </li>
          ))}
        </ul>
      </Section>

      {/* CTA */}
      <button
        onClick={onProceed}
        className="w-full py-4 bg-stone-900 hover:bg-stone-800 text-white font-semibold rounded-2xl transition-colors text-[15px] tracking-wide"
      >
        Start My Personalized Tutorial →
      </button>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-stone-100 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-stone-400 text-sm">{icon}</span>
        <span className="text-xs font-semibold uppercase tracking-widest text-stone-400">{title}</span>
      </div>
      {children}
    </div>
  );
}

function Tag({ label, variant = "primary" }: { label: string; variant?: "primary" | "soft" }) {
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold capitalize
      ${variant === "primary"
        ? "bg-rose-100 text-rose-700"
        : "bg-stone-100 text-stone-600"
      }`}>
      {label}
    </span>
  );
}

function Implication({ text }: { text: string }) {
  return (
    <div className="mt-2 pl-3 border-l-2 border-rose-200">
      <p className="text-xs text-rose-700 leading-relaxed font-medium">{text}</p>
    </div>
  );
}
