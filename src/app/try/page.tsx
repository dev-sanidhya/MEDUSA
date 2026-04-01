"use client";

import { useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { PhotoCapture, type CapturedPhoto } from "@/components/PhotoCapture";
import { FaceAnalysisDisplay } from "@/components/FaceAnalysisDisplay";
import { LookSelector } from "@/components/LookSelector";
import { TutorialDisplay } from "@/components/TutorialDisplay";
import type {
  AnalyzeFaceRequest,
  FaceAnalysisResult,
} from "../api/analyze-face/route";
import type {
  GenerateTutorialRequest,
  GenerateTutorialResult,
  LookId,
} from "../api/generate-tutorial/route";

type AppStage =
  | "welcome"
  | "capturing"
  | "analyzing"
  | "analysis_complete"
  | "look_selection"
  | "generating_tutorial"
  | "tutorial";

export default function MedusaPage() {
  const [stage, setStage] = useState<AppStage>("welcome");
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
  const [agentMessage, setAgentMessage] = useState<string | null>(null);
  const [photoInstruction, setPhotoInstruction] = useState<string | undefined>(undefined);
  const [analysisResult, setAnalysisResult] =
    useState<FaceAnalysisResult["faceAnalysis"] | null>(null);
  const [tutorialResult, setTutorialResult] =
    useState<GenerateTutorialResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentPhotoNumber = capturedPhotos.length + 1;

  const handlePhotoCaptured = async (photo: CapturedPhoto) => {
    const allPhotos = [...capturedPhotos, photo];
    setCapturedPhotos(allPhotos);
    setStage("analyzing");
    setError(null);

    try {
      const requestBody: AnalyzeFaceRequest = {
        photos: allPhotos.map((p) => ({
          base64: p.base64,
          mimeType: p.mimeType,
          geometryProfile: p.geometryProfile,
          precisionReport: p.precisionReport,
        })),
      };

      const res = await fetch("/api/analyze-face", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error ?? `API error: ${res.status}`);
      }

      const result: FaceAnalysisResult = await res.json();

      if (result.status === "needs_more_photos" && result.photoRequest) {
        setAgentMessage(result.photoRequest.message);
        setPhotoInstruction(result.photoRequest.specificInstruction);
        setStage("capturing");
      } else if (result.status === "analysis_complete" && result.faceAnalysis) {
        setAnalysisResult(result.faceAnalysis);
        setStage("analysis_complete");
      } else {
        throw new Error("Unexpected agent response");
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      console.error(err);
      setError(msg);
      setStage("capturing");
    }
  };

  const handleLookSelected = async (look: LookId) => {
    if (!analysisResult) return;
    setStage("generating_tutorial");
    setError(null);

    try {
      const requestBody: GenerateTutorialRequest = {
        faceAnalysis: analysisResult,
        selectedLook: look,
      };

      const res = await fetch("/api/generate-tutorial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error ?? `API error: ${res.status}`);
      }

      const tutorial: GenerateTutorialResult = await res.json();
      setTutorialResult(tutorial);
      setStage("tutorial");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      console.error(err);
      setError(msg);
      setStage("look_selection");
    }
  };

  const handleRestart = () => {
    setStage("welcome");
    setCapturedPhotos([]);
    setAgentMessage(null);
    setPhotoInstruction(undefined);
    setAnalysisResult(null);
    setTutorialResult(null);
    setError(null);
  };

  const handleChooseAnotherLook = () => {
    setTutorialResult(null);
    setError(null);
    setStage("look_selection");
  };

  if (stage === "welcome") {
    return (
      <main className="px-6 pb-24 pt-16 text-[color:var(--color-ink)]">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.04fr_0.96fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(77,29,23,0.1)] bg-[rgba(255,247,241,0.78)] px-4 py-2 text-xs uppercase tracking-[0.24em] text-[color:var(--color-sage)]">
              <Sparkles className="h-4 w-4 text-[color:var(--color-accent)]" />
              Live MVP
            </div>
            <h1 className="mt-7 max-w-4xl font-serif text-6xl leading-[0.92] text-[color:var(--color-ink)] sm:text-7xl">
              Upload the face. Read the structure. Build the tutorial.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-[color:var(--color-ink-soft)]">
              This is the live product route. The frontend here is wired to the face analysis API
              and the tutorial generation API, so users are not stepping into a fake demo.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {[
                "Guided photo upload with confidence checks",
                "Face and skin analysis before tutorial generation",
                "Look selection mapped to the user’s own structure",
                "Live personalized output, not static beauty copy",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-[1.6rem] border border-[rgba(77,29,23,0.1)] bg-[rgba(255,250,247,0.76)] px-5 py-4 text-sm leading-7 text-[color:var(--color-ink-soft)]"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2.2rem] border border-[rgba(77,29,23,0.1)] bg-[linear-gradient(135deg,rgba(255,248,243,0.92),rgba(247,232,223,0.88))] p-7 shadow-[0_18px_60px_rgba(112,53,38,0.08)]">
            <div className="rounded-[1.8rem] border border-[rgba(77,29,23,0.1)] bg-[rgba(255,251,248,0.8)] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--color-sage)]">
                    Flow
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-[color:var(--color-ink)]">
                    Capture → Analyze → Build
                  </p>
                </div>
                <div className="rounded-full border border-[rgba(77,29,23,0.1)] bg-[rgba(158,43,37,0.06)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[color:var(--color-accent)]">
                  Ready
                </div>
              </div>

              <div className="mt-8 space-y-4">
                {[
                  ["01", "Upload the first guided face photo"],
                  ["02", "MEDUSA checks framing, angles, and visibility"],
                  ["03", "If needed, it requests a better image"],
                  ["04", "Analysis and tutorial generation begin"],
                ].map(([step, text]) => (
                  <div
                    key={step}
                    className="flex items-center gap-4 rounded-2xl border border-[rgba(77,29,23,0.08)] bg-white/72 px-4 py-4"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(158,43,37,0.08)] text-xs font-semibold text-[color:var(--color-accent)]">
                      {step}
                    </div>
                    <p className="text-sm text-[color:var(--color-ink)]">{text}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setStage("capturing")}
                className="mt-8 inline-flex w-full items-center justify-center gap-3 rounded-full bg-[color:var(--color-accent)] px-6 py-4 text-sm font-semibold uppercase tracking-[0.16em] text-white"
              >
                Begin Analysis
                <ArrowRight className="h-4 w-4" />
              </button>

              <p className="mt-4 text-center text-xs uppercase tracking-[0.2em] text-[color:var(--color-sage)]">
                Live route. Real backend integration.
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (stage === "capturing") {
    return (
      <main className="px-6 pb-24 pt-14 text-[color:var(--color-ink)]">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--color-accent)]">
                Capture
              </p>
              <h1 className="mt-3 font-serif text-5xl text-[color:var(--color-ink)] sm:text-6xl">
                Upload the image MEDUSA needs for a confident face read.
              </h1>
            </div>
            <p className="max-w-xl text-sm leading-7 text-[color:var(--color-ink-soft)]">
              Photo {currentPhotoNumber} of up to 3. The system only asks for more input when the
              framing, angle, or visibility is not good enough to trust the analysis.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[2rem] border border-[rgba(77,29,23,0.1)] bg-[rgba(255,250,247,0.82)] p-5 shadow-[0_14px_40px_rgba(111,58,41,0.05)] md:p-6">
              <PhotoCapture
                photoNumber={currentPhotoNumber}
                onPhotoCaptured={handlePhotoCaptured}
                instruction={photoInstruction}
              />
            </div>

            <div className="space-y-6">
              {agentMessage && (
                <div className="rounded-[1.8rem] border border-[color:var(--color-accent-soft)] bg-[rgba(201,131,91,0.12)] p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--color-accent)]">
                    Additional Input Needed
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[color:var(--color-ink)]">{agentMessage}</p>
                </div>
              )}

              {capturedPhotos.length > 0 && (
                <div className="rounded-[1.8rem] border border-[rgba(77,29,23,0.1)] bg-[rgba(255,250,247,0.76)] p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--color-sage)]">
                    Captured So Far
                  </p>
                  <div className="mt-4 flex gap-3">
                    {capturedPhotos.map((p, i) => (
                      <div key={i} className="relative h-20 w-20 overflow-hidden rounded-2xl border border-[rgba(77,29,23,0.08)]">
                        {/* Data URLs from the capture flow are not supported by next/image here. */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.previewUrl}
                          alt={`Photo ${i + 1}`}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-[rgba(36,19,16,0.14)]" />
                        <div className="absolute bottom-2 left-2 text-xs font-semibold text-white">
                          {i + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-[1.8rem] border border-[rgba(77,29,23,0.1)] bg-[rgba(255,250,247,0.76)] p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--color-sage)]">
                  Best Results
                </p>
                <div className="mt-4 space-y-3">
                  {[
                    "Face the camera straight on first.",
                    "Use soft clean light and keep the full face visible.",
                    "Pull hair away from the face when possible.",
                    "Keep the frame stable and avoid exaggerated expression.",
                  ].map((tip) => (
                    <p key={tip} className="text-sm leading-7 text-[color:var(--color-ink-soft)]">
                      {tip}
                    </p>
                  ))}
                </div>
              </div>

              {error && (
                <div className="rounded-[1.6rem] border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-700">
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (stage === "analyzing") {
    return (
      <LoadingStage
        label="Analyzing"
        title="Reading the geometry of your face."
        description="Mapping proportions, measuring structure, and deciding whether MEDUSA has enough confidence to proceed."
        steps={[
          "Checking angle and facial visibility",
          "Reading eye, lip, brow, and face structure",
          "Assessing visible skin information",
          "Preparing your face analysis",
        ]}
      />
    );
  }

  if (stage === "analysis_complete" && analysisResult) {
    return (
      <main className="px-6 pb-24 pt-14 text-[color:var(--color-ink)]">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--color-accent)]">
                Analysis Complete
              </p>
              <h1 className="mt-3 font-serif text-5xl text-[color:var(--color-ink)] sm:text-6xl">
                MEDUSA has enough detail to build around this face.
              </h1>
            </div>
            <p className="max-w-xl text-sm leading-7 text-[color:var(--color-ink-soft)]">
              {capturedPhotos.length} photo{capturedPhotos.length > 1 ? "s" : ""} analyzed.
              Precision score:{" "}
              {capturedPhotos[capturedPhotos.length - 1]?.precisionReport.overallScore}/100.
            </p>
          </div>
          <FaceAnalysisDisplay
            analysis={analysisResult}
            onProceed={() => setStage("look_selection")}
          />
        </div>
      </main>
    );
  }

  if (stage === "look_selection") {
    return (
      <>
        <LookSelector onSelect={handleLookSelected} />
        {error && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full border border-red-500/20 bg-red-500/10 px-5 py-3 text-sm text-red-700 shadow-lg shadow-[rgba(112,53,38,0.08)]">
            {error}
          </div>
        )}
      </>
    );
  }

  if (stage === "generating_tutorial") {
    return (
      <LoadingStage
        label="Generating"
        title="Building your personalized tutorial."
        description="MEDUSA is turning the face analysis and the chosen look into practical steps, product guidance, and placement instructions."
        steps={[
          "Reviewing the face analysis",
          "Mapping placement for your selected look",
          "Writing step-by-step technique notes",
          "Finalizing the tutorial sequence",
        ]}
      />
    );
  }

  if (stage === "tutorial" && tutorialResult) {
    const lastPhoto = capturedPhotos[capturedPhotos.length - 1];
    return (
      <TutorialDisplay
        tutorial={tutorialResult}
        facePhoto={{
          photoUrl: lastPhoto.cleanPhotoUrl,
          landmarks: lastPhoto.landmarks,
          imageWidth: lastPhoto.imageWidth,
          imageHeight: lastPhoto.imageHeight,
        }}
        onChooseAnotherLook={handleChooseAnotherLook}
        onRestart={handleRestart}
      />
    );
  }

  return null;
}

function LoadingStage({
  label,
  title,
  description,
  steps,
}: {
  label: string;
  title: string;
  description: string;
  steps: string[];
}) {
  return (
    <main className="flex min-h-[calc(100vh-5rem)] items-center px-6 py-14 text-[color:var(--color-ink)]">
      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[2rem] border border-[rgba(77,29,23,0.1)] bg-[rgba(255,250,247,0.82)] p-7 shadow-[0_14px_40px_rgba(111,58,41,0.05)]">
          <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--color-accent)]">
            {label}
          </p>
          <h1 className="mt-4 font-serif text-5xl text-[color:var(--color-ink)]">{title}</h1>
          <p className="mt-5 max-w-xl text-sm leading-7 text-[color:var(--color-ink-soft)]">{description}</p>

          <div className="mt-8 space-y-4">
            {steps.map((step) => (
              <div
                key={step}
                className="flex items-center gap-4 rounded-2xl border border-[rgba(77,29,23,0.08)] bg-white/72 px-4 py-4"
              >
                <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--color-accent)] animate-pulse" />
                <span className="text-sm text-[color:var(--color-ink)]">{step}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center rounded-[2rem] border border-[rgba(77,29,23,0.1)] bg-[linear-gradient(135deg,rgba(255,248,243,0.9),rgba(247,232,223,0.84))] p-10">
          <div className="relative flex h-72 w-72 items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-[rgba(77,29,23,0.08)]" />
            <div className="absolute inset-8 rounded-full border border-[rgba(77,29,23,0.12)]" />
            <div className="absolute inset-16 rounded-full border border-[rgba(77,29,23,0.14)]" />
            <div className="absolute h-14 w-14 rounded-full bg-[rgba(201,131,91,0.55)] blur-2xl" />
            <div className="absolute inset-0 animate-spin rounded-full border-t border-[color:var(--color-accent)]/60 border-r border-transparent border-b border-transparent border-l border-transparent [animation-duration:7s]" />
            <div className="absolute inset-10 animate-spin rounded-full border-t border-[color:var(--color-sage)]/45 border-r border-transparent border-b border-transparent border-l border-transparent [animation-duration:10s] [animation-direction:reverse]" />
          </div>
        </div>
      </div>
    </main>
  );
}
