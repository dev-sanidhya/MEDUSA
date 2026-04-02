"use client";

import { useState } from "react";
import type { GenerateTutorialResult, TutorialStep } from "@/app/api/generate-tutorial/route";
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
  prep: "border-white/10 bg-white/[0.04] text-white/60",
  base: "border-amber-500/20 bg-amber-500/10 text-amber-200",
  eyes: "border-violet-500/20 bg-violet-500/10 text-violet-200",
  brows: "border-white/10 bg-white/[0.04] text-white/60",
  lips: "border-rose-500/20 bg-rose-500/10 text-rose-200",
  face: "border-orange-500/20 bg-orange-500/10 text-orange-200",
  finish: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
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
  feedbackSlot?: React.ReactNode;
}

export function TutorialDisplay({
  tutorial,
  facePhoto,
  onRestart,
  onChooseAnotherLook,
  feedbackSlot,
}: Props) {
  const [activeStep, setActiveStep] = useState(0);
  const step = tutorial.steps[activeStep];
  const total = tutorial.steps.length;
  const isLast = activeStep === total - 1;

  return (
    <main className="min-h-screen bg-[#050508] px-6 py-8 text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="mb-3 text-xs uppercase tracking-[0.3em] text-rose-400">{tutorial.lookName}</p>
            <h1
              className="text-4xl font-semibold leading-none md:text-6xl"
              style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
            >
              Your routine.
              <br />
              <span style={{ fontStyle: "italic" }}>Step by step.</span>
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-white/45 md:text-base">
              Every step below is based on your face map, your proportions, and the look you picked.
            </p>
          </div>

          <div className="glass-card rounded-full border border-white/8 px-5 py-3 text-sm text-white/48">
            Step {activeStep + 1} of {total}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="glass-card rounded-[2rem] border border-white/8 p-3">
            <div className="overflow-hidden rounded-[1.5rem]">
              <FaceZoneCanvas
                photoUrl={facePhoto.photoUrl}
                landmarks={facePhoto.landmarks}
                imageWidth={facePhoto.imageWidth}
                imageHeight={facePhoto.imageHeight}
                zone={step.zoneKey}
              />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {tutorial.steps.map((tutorialStep, index) => (
                <button
                  key={`${tutorialStep.title}-${index}`}
                  onClick={() => setActiveStep(index)}
                  className={`rounded-2xl border px-3 py-3 text-left transition-colors ${
                    index === activeStep
                      ? "border-rose-400/30 bg-rose-500/12"
                      : "border-white/8 bg-white/[0.02] hover:border-white/16 hover:bg-white/[0.04]"
                  }`}
                >
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/28">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <p className="mt-2 text-sm font-medium leading-tight text-white/82">{tutorialStep.title}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card flex min-h-[42rem] flex-col rounded-[2rem] border border-white/8 p-6">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <div className={`inline-flex rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.24em] ${CATEGORY_COLOR[step.category]}`}>
                  {CATEGORY_TAG[step.category]}
                </div>
                <h2
                  className="mt-4 text-3xl font-semibold leading-tight text-white md:text-4xl"
                  style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
                >
                  {step.title}
                </h2>
              </div>
              <div className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/35">
                {activeStep + 1}/{total}
              </div>
            </div>

            <div className="grid gap-4">
              <InfoBlock eyebrow="What You Need">
                <p className="text-base font-medium text-white">{step.productType}</p>
                <p className="mt-1 text-sm leading-relaxed text-white/45">{step.productColor}</p>
              </InfoBlock>

              <InfoBlock eyebrow="Placement">
                <p className="text-base leading-relaxed text-white/78">{step.instruction}</p>
              </InfoBlock>

              <InfoBlock eyebrow="Technique">
                <p className="text-sm leading-relaxed text-white/58">{step.technique}</p>
              </InfoBlock>

              <div className="rounded-[1.5rem] border border-rose-500/16 bg-rose-500/[0.06] p-4">
                <p className="text-[10px] uppercase tracking-[0.24em] text-rose-300">Avoid This</p>
                <p className="mt-2 text-sm leading-relaxed text-rose-100/82">{step.avoid}</p>
              </div>

              {isLast && (
                <>
                  <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-4">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-white/32">Closing Note</p>
                    <p className="mt-2 text-sm leading-relaxed text-white/68">{tutorial.closingNote}</p>
                  </div>
                  {feedbackSlot}
                </>
              )}
            </div>

            <div className="mt-auto pt-8">
              <div className="mb-4 h-1 w-full overflow-hidden rounded-full bg-white/6">
                <div
                  className="h-full rounded-full bg-rose-500 transition-all duration-300"
                  style={{ width: `${((activeStep + 1) / total) * 100}%` }}
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                {activeStep > 0 && (
                  <button
                    onClick={() => setActiveStep((index) => index - 1)}
                    className="inline-flex items-center justify-center rounded-full border border-white/10 px-5 py-3 text-sm text-white/68 transition-colors hover:border-white/18 hover:bg-white/[0.04]"
                  >
                    Previous Step
                  </button>
                )}

                {!isLast ? (
                  <button
                    onClick={() => setActiveStep((index) => index + 1)}
                    className="inline-flex items-center justify-center rounded-full bg-rose-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-rose-400"
                  >
                    Next Step
                  </button>
                ) : (
                  <>
                    <button
                      onClick={onChooseAnotherLook}
                      className="inline-flex items-center justify-center rounded-full bg-rose-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-rose-400"
                    >
                      Try Another Look
                    </button>
                    <button
                      onClick={onRestart}
                      className="inline-flex items-center justify-center rounded-full border border-white/10 px-6 py-3 text-sm text-white/68 transition-colors hover:border-white/18 hover:bg-white/[0.04]"
                    >
                      New Analysis
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function InfoBlock({
  eyebrow,
  children,
}: {
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-4">
      <p className="text-[10px] uppercase tracking-[0.24em] text-white/32">{eyebrow}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}
