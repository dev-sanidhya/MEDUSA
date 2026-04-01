"use client";

import { useState } from "react";
import type {
  GenerateTutorialResult,
  TutorialStep,
} from "@/app/api/generate-tutorial/route";
import type { RawLandmark } from "@/lib/face-detector";
import { FaceZoneCanvas } from "@/components/FaceZoneCanvas";

const CATEGORY_TAG: Record<TutorialStep["category"], string> = {
  prep: "Prep",
  base: "Base",
  eyes: "Eyes",
  brows: "Brows",
  lips: "Lips",
  face: "Face",
  finish: "Finish",
};

const CATEGORY_COLOR: Record<TutorialStep["category"], string> = {
  prep: "text-[color:var(--color-ink)] bg-[rgba(77,29,23,0.06)]",
  base: "text-[color:var(--color-accent)] bg-[rgba(158,43,37,0.08)]",
  eyes: "text-[color:var(--color-plum)] bg-[rgba(110,31,40,0.08)]",
  brows: "text-[color:var(--color-ink)] bg-[rgba(77,29,23,0.06)]",
  lips: "text-[color:var(--color-accent)] bg-[rgba(201,131,91,0.10)]",
  face: "text-[color:var(--color-gold-500)] bg-[rgba(181,123,68,0.10)]",
  finish: "text-[color:var(--color-sage)] bg-[rgba(127,93,86,0.10)]",
};

interface FacePhoto {
  photoUrl: string;
  landmarks: RawLandmark[];
  imageWidth: number;
  imageHeight: number;
}

interface Props {
  tutorial: GenerateTutorialResult;
  facePhoto: FacePhoto;
  onRestart: () => void;
  onChooseAnotherLook: () => void;
}

export function TutorialDisplay({
  tutorial,
  facePhoto,
  onRestart,
  onChooseAnotherLook,
}: Props) {
  const [activeStep, setActiveStep] = useState(0);
  const step = tutorial.steps[activeStep];
  const total = tutorial.steps.length;
  const isLast = activeStep === total - 1;

  return (
    <main className="flex min-h-[calc(100vh-5rem)] flex-col overflow-hidden px-4 pb-6 pt-6 text-[color:var(--color-ink)] md:px-6">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 pb-4">
        <p className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-accent)]">
          {tutorial.lookName}
        </p>
        <div className="flex flex-1 gap-1">
          {tutorial.steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveStep(i)}
              className={`h-1 flex-1 rounded-full transition-all duration-200 ${
                i === activeStep
                  ? "bg-[color:var(--color-accent)]"
                  : i < activeStep
                    ? "bg-[rgba(158,43,37,0.32)]"
                    : "bg-[rgba(77,29,23,0.12)]"
              }`}
            />
          ))}
        </div>
        <p className="shrink-0 text-xs text-[color:var(--color-sage)]">
          {activeStep + 1} / {total}
        </p>
      </div>

      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-3 overflow-hidden lg:flex-row">
        <div className="hidden shrink-0 lg:block lg:w-[45%]" style={{ maxHeight: "80vh" }}>
          <div className="h-full overflow-hidden rounded-[2rem] border border-[rgba(77,29,23,0.1)] bg-[rgba(255,250,247,0.88)] p-4 shadow-[0_14px_40px_rgba(111,58,41,0.05)]">
            <FaceZoneCanvas
              photoUrl={facePhoto.photoUrl}
              landmarks={facePhoto.landmarks}
              imageWidth={facePhoto.imageWidth}
              imageHeight={facePhoto.imageHeight}
              zone={step.zoneKey}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="flex min-h-full flex-col rounded-[2rem] border border-[rgba(77,29,23,0.1)] bg-[rgba(255,250,247,0.88)] p-4 shadow-[0_14px_40px_rgba(111,58,41,0.05)] md:p-5">
            <div className="mb-4 overflow-hidden rounded-[1.6rem] border border-[rgba(77,29,23,0.08)] bg-[rgba(255,247,241,0.82)] p-3 lg:hidden">
              <FaceZoneCanvas
                photoUrl={facePhoto.photoUrl}
                landmarks={facePhoto.landmarks}
                imageWidth={facePhoto.imageWidth}
                imageHeight={facePhoto.imageHeight}
                zone={step.zoneKey}
              />
            </div>

            <div className="mb-2">
              <p className="text-sm leading-7 text-[color:var(--color-ink-soft)]">{tutorial.lookDescription}</p>
            </div>

            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[color:var(--color-accent)] text-xs font-bold text-white">
                {activeStep + 1}
              </div>
              <div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${CATEGORY_COLOR[step.category]}`}
                >
                  {CATEGORY_TAG[step.category]}
                </span>
                <p className="mt-2 text-base font-semibold leading-snug text-[color:var(--color-ink)] md:text-lg">
                  {step.title}
                </p>
              </div>
            </div>

            <div className="mb-3 rounded-[1.4rem] border border-[rgba(77,29,23,0.08)] bg-white/70 p-4">
              <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-[color:var(--color-sage)]">
                What you need
              </p>
              <p className="text-sm font-medium text-[color:var(--color-ink)]">{step.productType}</p>
              <p className="mt-1 text-xs leading-relaxed text-[color:var(--color-ink-soft)]">
                {step.productColor}
              </p>
            </div>

            <div className="mb-3">
              <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-[color:var(--color-sage)]">
                What to do
              </p>
              <p className="text-sm leading-7 text-[color:var(--color-ink)]">{step.instruction}</p>
            </div>

            <div className="mb-3">
              <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-[color:var(--color-sage)]">
                How to do it
              </p>
              <p className="text-xs leading-7 text-[color:var(--color-ink-soft)]">{step.technique}</p>
            </div>

            <div className="mb-4 rounded-[1.4rem] bg-[rgba(77,29,23,0.05)] p-4">
              <div className="mb-1 flex items-center gap-1.5">
                <span className="text-[10px] text-[color:var(--color-accent)]">✕</span>
                <p className="text-[9px] font-bold uppercase tracking-widest text-[color:var(--color-sage)]">
                  Skip this
                </p>
              </div>
              <p className="text-xs leading-7 text-[color:var(--color-ink-soft)]">{step.avoid}</p>
            </div>

            {isLast && (
              <div className="mb-3 rounded-[1.4rem] border border-[color:var(--color-accent-soft)] bg-[rgba(201,131,91,0.12)] p-4">
                <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-[color:var(--color-accent)]">
                  You&apos;re done ✦
                </p>
                <p className="text-xs leading-7 text-[color:var(--color-ink)]">{tutorial.closingNote}</p>
              </div>
            )}

            <div className="mt-auto flex gap-2 pt-2">
              {activeStep > 0 && (
                <button
                  onClick={() => setActiveStep((i) => i - 1)}
                  className="flex-1 rounded-xl border border-[rgba(77,29,23,0.12)] py-3 text-sm font-medium text-[color:var(--color-ink-soft)]"
                >
                  ← Back
                </button>
              )}
              {!isLast ? (
                <button
                  onClick={() => setActiveStep((i) => i + 1)}
                  className="flex-1 rounded-xl bg-[color:var(--color-accent)] py-3 text-sm font-semibold text-white transition-colors"
                >
                  Next →
                </button>
              ) : (
                <>
                  <button
                    onClick={onChooseAnotherLook}
                    className="flex-1 rounded-xl bg-[color:var(--color-accent)] py-3 text-sm font-semibold text-white transition-colors"
                  >
                    Try Another Look
                  </button>
                  <button
                    onClick={onRestart}
                    className="flex-1 rounded-xl border border-[rgba(77,29,23,0.12)] py-3 text-sm font-medium text-[color:var(--color-ink-soft)]"
                  >
                    New Analysis
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
