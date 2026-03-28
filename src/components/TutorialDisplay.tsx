"use client";

/**
 * TutorialDisplay.tsx
 * Single-screen layout: compact face zone at top, scrollable step card below.
 * Everything visible without scrolling the page itself.
 */

import { useState } from "react";
import type { GenerateTutorialResult, TutorialStep } from "@/app/api/generate-tutorial/route";
import type { RawLandmark } from "@/lib/face-detector";
import { FaceZoneCanvas } from "@/components/FaceZoneCanvas";

const CATEGORY_TAG: Record<TutorialStep["category"], string> = {
  prep: "Prep", base: "Base", eyes: "Eyes",
  brows: "Brows", lips: "Lips", face: "Face", finish: "Finish",
};
const CATEGORY_COLOR: Record<TutorialStep["category"], string> = {
  prep:   "text-stone-500  bg-stone-100",
  base:   "text-amber-700  bg-amber-50",
  eyes:   "text-violet-700 bg-violet-50",
  brows:  "text-stone-700  bg-stone-100",
  lips:   "text-rose-700   bg-rose-50",
  face:   "text-orange-700 bg-orange-50",
  finish: "text-emerald-700 bg-emerald-50",
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
}

export function TutorialDisplay({ tutorial, facePhoto, onRestart }: Props) {
  const [activeStep, setActiveStep] = useState(0);
  const step = tutorial.steps[activeStep];
  const total = tutorial.steps.length;
  const isLast = activeStep === total - 1;

  return (
    // Full-screen, no page scroll — inner sections scroll independently
    <main className="h-screen bg-stone-950 flex flex-col overflow-hidden">

      {/* ── Top bar ─────────────────────────────────────────────── */}
      <div className="shrink-0 px-5 pt-5 pb-2">
        <div className="flex items-center justify-between mb-0.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-rose-400">
            {tutorial.lookName}
          </p>
          <p className="text-xs text-stone-500">{activeStep + 1} / {total}</p>
        </div>

        {/* Progress bar */}
        <div className="flex gap-1 mt-2">
          {tutorial.steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveStep(i)}
              className={`h-1 rounded-full flex-1 transition-all duration-200 ${
                i === activeStep ? "bg-rose-500" : i < activeStep ? "bg-stone-600" : "bg-stone-800"
              }`}
            />
          ))}
        </div>
      </div>

      {/* ── Face zone image — fixed, compact ────────────────────── */}
      <div className="shrink-0 px-4 pt-2 pb-0">
        <FaceZoneCanvas
          photoUrl={facePhoto.photoUrl}
          landmarks={facePhoto.landmarks}
          imageWidth={facePhoto.imageWidth}
          imageHeight={facePhoto.imageHeight}
          zone={step.zoneKey}
        />
      </div>

      {/* ── Step card — scrollable ───────────────────────────────── */}
      <div className="flex-1 overflow-y-auto bg-stone-50 rounded-t-3xl mt-3">
        <div className="px-5 pt-5 pb-8">

          {/* Step title */}
          <div className="flex items-start gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-stone-900 text-white flex items-center justify-center shrink-0 text-xs font-bold">
              {activeStep + 1}
            </div>
            <div>
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${CATEGORY_COLOR[step.category]}`}>
                {CATEGORY_TAG[step.category]}
              </span>
              <p className="text-stone-900 font-semibold text-lg leading-snug mt-0.5">{step.title}</p>
            </div>
          </div>

          {/* Product */}
          <div className="bg-white border border-stone-100 rounded-2xl p-4 mb-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1.5">What you need</p>
            <p className="text-stone-900 text-sm font-medium">{step.productType}</p>
            <p className="text-stone-500 text-xs mt-1 leading-relaxed">{step.productColor}</p>
          </div>

          {/* What to do */}
          <div className="mb-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1.5">What to do</p>
            <p className="text-stone-800 text-[15px] leading-relaxed">{step.instruction}</p>
          </div>

          {/* How to do it */}
          <div className="mb-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1.5">How to do it</p>
            <p className="text-stone-700 text-sm leading-relaxed">{step.technique}</p>
          </div>

          {/* Don't */}
          <div className="bg-stone-900 rounded-2xl p-4 mb-5">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-rose-400 text-xs">✕</span>
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Skip this</p>
            </div>
            <p className="text-stone-300 text-xs leading-relaxed">{step.avoid}</p>
          </div>

          {/* Nav */}
          <div className="flex gap-3">
            {activeStep > 0 && (
              <button
                onClick={() => setActiveStep(i => i - 1)}
                className="flex-1 py-3.5 border border-stone-200 text-stone-600 rounded-2xl text-sm font-medium hover:border-stone-300 transition-colors"
              >
                ← Back
              </button>
            )}

            {!isLast ? (
              <button
                onClick={() => setActiveStep(i => i + 1)}
                className="flex-1 py-3.5 bg-stone-900 hover:bg-stone-800 text-white rounded-2xl text-sm font-semibold transition-colors"
              >
                Next →
              </button>
            ) : (
              <div className="flex-1 space-y-3">
                <div className="bg-gradient-to-br from-rose-50 to-stone-50 border border-rose-100 rounded-2xl p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-rose-400 mb-1.5">You&apos;re done ✦</p>
                  <p className="text-stone-700 text-sm leading-relaxed">{tutorial.closingNote}</p>
                </div>
                <button
                  onClick={onRestart}
                  className="w-full py-3.5 border border-stone-200 text-stone-600 rounded-2xl text-sm font-medium"
                >
                  Start a New Analysis
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
