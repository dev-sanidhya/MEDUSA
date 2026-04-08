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
  prep: "border-[var(--border-subtle)] bg-white/76 text-[var(--text-muted)]",
  base: "border-amber-500/20 bg-amber-500/10 text-amber-700",
  eyes: "border-violet-500/20 bg-violet-500/10 text-violet-700",
  brows: "border-[var(--border-subtle)] bg-white/76 text-[var(--text-muted)]",
  lips: "border-[rgba(220,127,139,0.24)] bg-[var(--bg-soft-rose)] text-[var(--rose-strong)]",
  face: "border-orange-500/20 bg-orange-500/10 text-orange-700",
  finish: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700",
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
    <main className="min-h-screen bg-transparent px-6 py-8 text-[var(--text-main)]">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="mb-3 text-xs uppercase tracking-[0.3em] text-[var(--rose-strong)]">{tutorial.lookName}</p>
            <h1
              className="text-4xl font-semibold leading-none text-[var(--text-strong)] md:text-6xl"
              style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
            >
              Your routine.
              <br />
              <span style={{ fontStyle: "italic" }}>Step by step.</span>
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-[var(--text-main)] md:text-base">
              Every step below is based on your face map, your proportions, and the look you picked.
            </p>
            {tutorial.lookVariant && (
              <div className="mt-5 inline-flex max-w-xl flex-col rounded-[1.4rem] border border-[rgba(220,127,139,0.24)] bg-[var(--bg-soft-rose)] px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--rose-strong)]">MEDUSA Picked</p>
                <p className="mt-2 text-sm font-medium text-[var(--text-strong)]">{tutorial.lookVariant.label}</p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-main)]">{tutorial.lookVariant.rationale}</p>
              </div>
            )}
          </div>

          <div className="glass-card rounded-full px-5 py-3 text-sm text-[var(--text-main)]">
            Step {activeStep + 1} of {total}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="glass-card rounded-[2rem] p-3">
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
                      ? "border-[rgba(220,127,139,0.24)] bg-[var(--bg-soft-rose)]"
                      : "border-[var(--border-subtle)] bg-white/74 hover:border-[var(--border-strong)] hover:bg-white"
                  }`}
                >
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <p className="mt-2 text-sm font-medium leading-tight text-[var(--text-strong)]">{tutorialStep.title}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card flex min-h-[42rem] flex-col rounded-[2rem] p-6">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <div className={`inline-flex rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.24em] ${CATEGORY_COLOR[step.category]}`}>
                  {CATEGORY_TAG[step.category]}
                </div>
                <h2
                  className="mt-4 text-3xl font-semibold leading-tight text-[var(--text-strong)] md:text-4xl"
                  style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
                >
                  {step.title}
                </h2>
              </div>
              <div className="rounded-full border border-[var(--border-subtle)] bg-white/76 px-3 py-1.5 text-xs text-[var(--text-muted)]">
                {activeStep + 1}/{total}
              </div>
            </div>

            <div className="grid gap-4">
              <InfoBlock eyebrow="What You Need">
                <p className="text-base font-medium text-[var(--text-strong)]">{step.productType}</p>
                <p className="mt-1 text-sm leading-relaxed text-[var(--text-main)]">{step.productColor}</p>
              </InfoBlock>

              <InfoBlock eyebrow="Placement">
                <p className="text-base leading-relaxed text-[var(--text-strong)]">{step.instruction}</p>
              </InfoBlock>

              <InfoBlock eyebrow="Technique">
                <p className="text-sm leading-relaxed text-[var(--text-main)]">{step.technique}</p>
              </InfoBlock>

              <div className="rounded-[1.5rem] border border-[rgba(220,127,139,0.24)] bg-[var(--bg-soft-rose)] p-4">
                <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--rose-strong)]">Avoid This</p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-main)]">{step.avoid}</p>
              </div>

              {isLast && (
                <>
                  <div className="rounded-[1.5rem] border border-[var(--border-subtle)] bg-white/74 p-4">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--text-muted)]">Closing Note</p>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--text-main)]">{tutorial.closingNote}</p>
                  </div>
                  {feedbackSlot}
                </>
              )}
            </div>

            <div className="mt-auto pt-8">
              <div className="mb-4 h-1 w-full overflow-hidden rounded-full bg-[var(--border-subtle)]">
                <div
                  className="medusa-progress h-full rounded-full transition-all duration-300"
                  style={{ width: `${((activeStep + 1) / total) * 100}%` }}
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                {activeStep > 0 && (
                  <button
                    onClick={() => setActiveStep((index) => index - 1)}
                    className="medusa-button-secondary px-5 py-3 text-sm transition-colors hover:bg-white/90"
                  >
                    Previous Step
                  </button>
                )}

                {!isLast ? (
                  <button
                    onClick={() => setActiveStep((index) => index + 1)}
                    className="medusa-button-primary px-6 py-3 text-sm font-semibold transition-transform hover:-translate-y-0.5"
                  >
                    Next Step
                  </button>
                ) : (
                  <>
                    <button
                      onClick={onChooseAnotherLook}
                      className="medusa-button-primary px-6 py-3 text-sm font-semibold transition-transform hover:-translate-y-0.5"
                    >
                      Try Another Look
                    </button>
                    <button
                      onClick={onRestart}
                      className="medusa-button-secondary px-6 py-3 text-sm transition-colors hover:bg-white/90"
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
    <div className="rounded-[1.5rem] border border-[var(--border-subtle)] bg-white/74 p-4">
      <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--text-muted)]">{eyebrow}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}
