"use client";

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
    <main className="h-screen bg-stone-950 flex flex-col overflow-hidden">

      {/* ── Top bar ── */}
      <div className="shrink-0 px-5 pt-4 pb-2 flex items-center justify-between gap-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-rose-400 shrink-0">
          {tutorial.lookName}
        </p>
        {/* Progress bar */}
        <div className="flex gap-1 flex-1">
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
        <p className="text-xs text-stone-500 shrink-0">{activeStep + 1} / {total}</p>
      </div>

      {/* ── Side-by-side body ── */}
      <div className="flex-1 flex gap-0 overflow-hidden px-4 pb-4 gap-3">

        {/* LEFT — face zone image, max 80vh tall */}
        <div className="shrink-0 w-[45%]" style={{ maxHeight: "80vh" }}>
          <div className="h-full rounded-2xl overflow-hidden">
            <FaceZoneCanvas
              photoUrl={facePhoto.photoUrl}
              landmarks={facePhoto.landmarks}
              imageWidth={facePhoto.imageWidth}
              imageHeight={facePhoto.imageHeight}
              zone={step.zoneKey}
            />
          </div>
        </div>

        {/* RIGHT — step description, scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="bg-stone-50 rounded-2xl p-4 min-h-full flex flex-col">

            {/* Step title */}
            <div className="flex items-start gap-2 mb-4">
              <div className="w-7 h-7 rounded-full bg-stone-900 text-white flex items-center justify-center shrink-0 text-xs font-bold">
                {activeStep + 1}
              </div>
              <div>
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${CATEGORY_COLOR[step.category]}`}>
                  {CATEGORY_TAG[step.category]}
                </span>
                <p className="text-stone-900 font-semibold text-base leading-snug mt-1">{step.title}</p>
              </div>
            </div>

            {/* Product */}
            <div className="bg-white border border-stone-100 rounded-xl p-3 mb-3">
              <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400 mb-1">What you need</p>
              <p className="text-stone-900 text-sm font-medium">{step.productType}</p>
              <p className="text-stone-400 text-xs mt-0.5 leading-relaxed">{step.productColor}</p>
            </div>

            {/* What to do */}
            <div className="mb-3">
              <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400 mb-1">What to do</p>
              <p className="text-stone-800 text-sm leading-relaxed">{step.instruction}</p>
            </div>

            {/* How */}
            <div className="mb-3">
              <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400 mb-1">How to do it</p>
              <p className="text-stone-600 text-xs leading-relaxed">{step.technique}</p>
            </div>

            {/* Don't */}
            <div className="bg-stone-900 rounded-xl p-3 mb-4">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-rose-400 text-[10px]">✕</span>
                <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400">Skip this</p>
              </div>
              <p className="text-stone-300 text-xs leading-relaxed">{step.avoid}</p>
            </div>

            {/* Closing note on last step */}
            {isLast && (
              <div className="bg-gradient-to-br from-rose-50 to-stone-50 border border-rose-100 rounded-xl p-3 mb-3">
                <p className="text-[9px] font-bold uppercase tracking-widest text-rose-400 mb-1">You&apos;re done ✦</p>
                <p className="text-stone-700 text-xs leading-relaxed">{tutorial.closingNote}</p>
              </div>
            )}

            {/* Nav — push to bottom */}
            <div className="mt-auto pt-2 flex gap-2">
              {activeStep > 0 && (
                <button
                  onClick={() => setActiveStep(i => i - 1)}
                  className="flex-1 py-3 border border-stone-200 text-stone-600 rounded-xl text-sm font-medium"
                >
                  ← Back
                </button>
              )}
              {!isLast ? (
                <button
                  onClick={() => setActiveStep(i => i + 1)}
                  className="flex-1 py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  Next →
                </button>
              ) : (
                <button
                  onClick={onRestart}
                  className="flex-1 py-3 border border-stone-200 text-stone-600 rounded-xl text-sm font-medium"
                >
                  New Analysis
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
