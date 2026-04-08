"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { FeedbackPanel } from "@/components/FeedbackPanel";
import { PhotoCapture, type CapturedPhoto } from "@/components/PhotoCapture";
import { FaceAnalysisDisplay } from "@/components/FaceAnalysisDisplay";
import { LookSelector } from "@/components/LookSelector";
import { PreferenceOnboardingPanel } from "@/components/PreferenceOnboardingPanel";
import { ProfileHistoryPanel } from "@/components/ProfileHistoryPanel";
import { TutorialDisplay } from "@/components/TutorialDisplay";
import { MedusaLogo } from "@/components/MedusaLogo";
import type { AnalyzeFaceRequest, FaceAnalysisResult } from "../api/analyze-face/route";
import type { FeedbackRequest } from "../api/feedback/route";
import type {
  EditorialSubtype,
  GenerateTutorialRequest,
  GenerateTutorialResult,
  LookId,
} from "../api/generate-tutorial/route";
import type { ProfileHistoryResult } from "../api/profile/history/route";
import type { ProfileExplicitPreferences } from "@/lib/persistence/types";

type ResolvedFaceAnalysis = NonNullable<FaceAnalysisResult["faceAnalysis"]>;

type AppStage =
  | "welcome"
  | "capturing"
  | "analyzing"
  | "tone_override"
  | "analysis_complete"
  | "look_selection"
  | "generating_tutorial"
  | "tutorial";

const STAGES: AppStage[] = [
  "welcome",
  "capturing",
  "analyzing",
  "tone_override",
  "analysis_complete",
  "look_selection",
  "generating_tutorial",
  "tutorial",
];

export default function MedusaApp() {
  const [stage, setStage] = useState<AppStage>("welcome");
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
  const [agentMessage, setAgentMessage] = useState<string | null>(null);
  const [photoInstruction, setPhotoInstruction] = useState<string | undefined>(undefined);
  const [analysisResult, setAnalysisResult] = useState<ResolvedFaceAnalysis | null>(null);
  const [analysisRunId, setAnalysisRunId] = useState<string | null>(null);
  const [selectedSkinTone, setSelectedSkinTone] = useState<ResolvedFaceAnalysis["skinTone"] | null>(null);
  const [selectedSkinUndertone, setSelectedSkinUndertone] = useState<ResolvedFaceAnalysis["skinUndertone"] | null>(null);
  const [tutorialResult, setTutorialResult] = useState<GenerateTutorialResult | null>(null);
  const [tutorialRunId, setTutorialRunId] = useState<string | null>(null);
  const [history, setHistory] = useState<ProfileHistoryResult | null>(null);
  const [showProfileRefine, setShowProfileRefine] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentPhotoNumber = capturedPhotos.length + 1;

  useEffect(() => {
    void loadProfileHistory();
  }, []);

  const loadProfileHistory = async (activeAnalysisRunId?: string | null) => {
    try {
      const params = new URLSearchParams({ limit: "6" });

      if (activeAnalysisRunId) {
        params.set("analysisRunId", activeAnalysisRunId);
      }

      const res = await fetch(`/api/profile/history?${params.toString()}`);

      if (!res.ok) {
        return;
      }

      const result: ProfileHistoryResult = await res.json();
      setHistory(result);
    } catch (err) {
      console.error("[profile-history]", err);
    }
  };

  const submitFeedback = async (payload: FeedbackRequest) => {
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error ?? `API error: ${res.status}`);
    }

    await loadProfileHistory(analysisRunId);
    setShowProfileRefine(false);
  };

  const saveProfilePreferences = async (payload: ProfileExplicitPreferences) => {
    const res = await fetch("/api/profile/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error ?? `API error: ${res.status}`);
    }

    await loadProfileHistory(analysisRunId);
  };

  const handlePhotoCaptured = async (photo: CapturedPhoto) => {
    const allPhotos = [...capturedPhotos, photo];
    setCapturedPhotos(allPhotos);
    setStage("analyzing");
    setError(null);

    try {
      const requestBody: AnalyzeFaceRequest = {
        photos: allPhotos.map((capturedPhoto) => ({
          base64: capturedPhoto.base64,
          mimeType: capturedPhoto.mimeType,
          geometryProfile: capturedPhoto.geometryProfile,
          precisionReport: capturedPhoto.precisionReport,
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
      setAnalysisRunId(result.analysisRunId ?? null);

      if (result.status === "needs_more_photos" && result.photoRequest) {
        setAgentMessage(result.photoRequest.message);
        setPhotoInstruction(result.photoRequest.specificInstruction);
        setStage("capturing");
      } else if (result.status === "analysis_complete" && result.faceAnalysis) {
        setAnalysisResult(result.faceAnalysis);
        setSelectedSkinTone(result.faceAnalysis.skinToneOptions[0] ?? result.faceAnalysis.skinTone);
        setSelectedSkinUndertone(result.faceAnalysis.skinUndertoneOptions[0] ?? result.faceAnalysis.skinUndertone);
        setStage("analysis_complete");
        void loadProfileHistory(result.analysisRunId ?? null);
      } else {
        throw new Error("Unexpected agent response");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      console.error(err);
      setError(msg);
      setStage("capturing");
    }
  };

  const handleLookSelected = async (look: LookId) => {
    if (look === "editorial") {
      await generateSelectedLookTutorial("editorial", "sharp");
    } else {
      await generateSelectedLookTutorial(look);
    }
  };

  const generateSelectedLookTutorial = async (
    look: LookId,
    editorialSubtype?: EditorialSubtype
  ) => {
    if (!analysisResult || !selectedSkinTone || !selectedSkinUndertone) return;
    setStage("generating_tutorial");
    setError(null);

    try {
      const requestBody: GenerateTutorialRequest = {
        analysisRunId,
        faceAnalysis: {
          ...analysisResult,
          skinTone: selectedSkinTone,
          skinUndertone: selectedSkinUndertone,
        },
        selectedLook: look,
        selectedEditorialSubtype: editorialSubtype,
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
      setTutorialRunId(tutorial.tutorialRunId ?? null);
      setStage("tutorial");
      void loadProfileHistory(analysisRunId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
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
    setAnalysisRunId(null);
    setSelectedSkinTone(null);
    setSelectedSkinUndertone(null);
    setTutorialResult(null);
    setTutorialRunId(null);
    setShowProfileRefine(false);
    setError(null);
  };

  const handleChooseAnotherLook = () => {
    setTutorialResult(null);
    setTutorialRunId(null);
    setShowProfileRefine(false);
    setError(null);
    setStage("look_selection");
  };

  const handleOpenToneOverride = () => {
    setStage("tone_override");
  };

  const handleConfirmToneOverride = () => {
    if (!selectedSkinTone || !selectedSkinUndertone) return;
    setStage("analysis_complete");
  };

  if (stage === "welcome") {
    return (
      <AppFrame stage={stage}>
        <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-20">
          <div className="grid w-full gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <p className="mb-5 text-xs uppercase tracking-[0.32em] text-[var(--rose-strong)]">Face Analysis</p>
              <h1
                className="text-[clamp(3.5rem,9vw,6.8rem)] font-semibold leading-none text-[var(--text-strong)]"
                style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
              >
                Get a routine
                <br />
                shaped to
                <br />
                your face.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-[var(--text-main)] md:text-lg">
                Upload a photo, let MEDUSA read your features, then get step-by-step
                placement and technique built around your eyes, lips, structure, and tone.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                {[
                  "478 facial landmarks",
                  "Client-side processing",
                  "Specific placement notes",
                ].map((pill) => (
                  <span
                    key={pill}
                    className="rounded-full border border-[var(--border-subtle)] bg-white/70 px-4 py-2 text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]"
                  >
                    {pill}
                  </span>
                ))}
              </div>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => setStage("capturing")}
                  className="medusa-button-primary px-8 py-4 text-sm font-semibold uppercase tracking-[0.16em] transition-transform hover:-translate-y-0.5"
                >
                  Begin Analysis
                </button>
                <Link
                  href="/"
                  className="medusa-button-secondary px-8 py-4 text-sm uppercase tracking-[0.16em] transition-colors hover:bg-white/90"
                >
                  Back to Home
                </Link>
              </div>

              {history && (
                <div className="mt-10">
                  <ProfileHistoryPanel history={history} />
                </div>
              )}
            </div>

            <div className="glass-card noise relative overflow-hidden rounded-[2.4rem] p-7">
              <div
                className="pointer-events-none absolute inset-0"
                style={{ background: "radial-gradient(circle at top right, rgba(240,179,154,0.24), transparent 55%)" }}
              />
              <div className="relative">
                <div className="mb-7 flex justify-center">
                  <MedusaLogo size="lg" showTagline animated />
                </div>

                <div className="space-y-4">
                  {[
                    ["01", "Capture", "One clean photo, or up to three if the model needs a better read."],
                    ["02", "Analyze", "MEDUSA reads structure, eye set, lip proportions, and tone cues locally."],
                    ["03", "Write", "MEDUSA turns the read into placement notes, technique, and what to avoid."],
                  ].map(([num, title, body]) => (
                    <div key={num} className="rounded-[1.6rem] border border-[var(--border-subtle)] bg-white/72 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-[0.24em] text-[var(--rose-strong)]">Step {num}</span>
                        <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">{title}</span>
                      </div>
                      <p
                        className="mt-3 text-2xl font-semibold text-[var(--text-strong)]"
                        style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
                      >
                        {title}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-[var(--text-main)]">{body}</p>
                    </div>
                  ))}
                </div>

                <p className="mt-6 text-center text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">
                  Every routine starts with your actual features.
                </p>
              </div>
            </div>
          </div>
        </main>
      </AppFrame>
    );
  }

  if (stage === "capturing") {
    return (
      <AppFrame stage={stage}>
        <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-10">
          <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="space-y-6">
              <HeroPanel
                eyebrow={`Step ${String(Math.min(currentPhotoNumber, 3)).padStart(2, "0")} / Capture`}
                title="Start with a clean photo."
                body="Natural light, a straight angle, and a clear view of your face give MEDUSA the best read."
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    "Straight-on angle",
                    "No heavy shadows",
                    "Forehead to chin visible",
                    "Hair pulled away",
                  ].map((tip) => (
                    <div key={tip} className="rounded-2xl border border-[var(--border-subtle)] bg-white/75 px-4 py-3 text-sm text-[var(--text-main)]">
                      {tip}
                    </div>
                  ))}
                </div>
              </HeroPanel>

              <div className="glass-card rounded-[2rem] p-6">
                <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--text-muted)]">Capture Progress</p>
                <div className="mt-5 flex gap-3">
                  {[0, 1, 2].map((index) => {
                    const isComplete = index < capturedPhotos.length;
                    const isActive = index === capturedPhotos.length;

                    return (
                      <div key={index} className="flex-1">
                        <div
                          className={`h-1 rounded-full ${
                            isComplete ? "bg-[var(--rose)]" : isActive ? "bg-[var(--text-muted)]/45" : "bg-[var(--border-subtle)]"
                          }`}
                        />
                        <p className="mt-2 text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                          Photo {index + 1}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {capturedPhotos.length > 0 && (
                  <div className="mt-6 grid grid-cols-3 gap-3">
                    {capturedPhotos.map((photo, index) => (
                      <div key={`${photo.previewUrl}-${index}`} className="overflow-hidden rounded-[1.25rem] border border-[var(--border-subtle)] bg-[#f7ebe4]">
                        <Image
                          src={photo.previewUrl}
                          alt={`Photo ${index + 1}`}
                          width={240}
                          height={320}
                          unoptimized
                          className="aspect-[3/4] w-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="glass-card rounded-[2rem] p-6">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--rose-strong)]">Upload Panel</p>
                  <p className="mt-2 text-sm text-[var(--text-main)]">Photo {currentPhotoNumber} of up to 3</p>
                </div>
                <div className="rounded-full border border-[var(--border-subtle)] bg-white/70 px-3 py-1.5 text-xs text-[var(--text-muted)]">
                  Precision first
                </div>
              </div>

              {agentMessage && (
                <div className="mb-5 rounded-[1.6rem] border border-[rgba(220,127,139,0.24)] bg-[var(--bg-soft-rose)] p-5">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--rose-strong)]">One more angle needed</p>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--text-main)]">{agentMessage}</p>
                </div>
              )}

              <PhotoCapture
                photoNumber={currentPhotoNumber}
                onPhotoCaptured={handlePhotoCaptured}
                instruction={photoInstruction}
              />

              {error && <ErrorBanner message={error} />}
            </div>
          </div>
        </main>
      </AppFrame>
    );
  }

  if (stage === "analyzing") {
    return (
      <ProcessingScreen
        stage={stage}
        eyebrow="Step 02 / Reading"
        title="Reading your features."
        body="Processing your photos, checking the read, and finding the closest tone and undertone match."
        items={[
          "Checking photo quality",
          "Reading face shape",
          "Reading eyes and lips",
          "Matching skin tone",
          "Matching undertone",
        ]}
      />
    );
  }

  if (stage === "tone_override" && analysisResult && selectedSkinTone && selectedSkinUndertone) {
    return (
      <ToneConfirmationScreen
        analysis={analysisResult}
        selectedSkinTone={selectedSkinTone}
        selectedSkinUndertone={selectedSkinUndertone}
        onSelectSkinTone={setSelectedSkinTone}
        onSelectSkinUndertone={setSelectedSkinUndertone}
        onConfirm={handleConfirmToneOverride}
        onBack={() => setStage("analysis_complete")}
      />
    );
  }

  if (stage === "analysis_complete" && analysisResult && selectedSkinTone && selectedSkinUndertone) {
    return (
      <AppFrame stage={stage}>
        <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-10">
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <HeroHeader
              eyebrow="Step 02 / Complete"
              title="Your quick read."
              body={`${
                capturedPhotos.length
              } photo${capturedPhotos.length > 1 ? "s" : ""} analyzed with ${
                capturedPhotos[capturedPhotos.length - 1]?.precisionReport.overallScore ?? 0
              }/100 photo quality.`}
            />
            <button
              onClick={handleRestart}
              className="medusa-button-secondary px-5 py-3 text-sm transition-colors hover:bg-white/90"
            >
              Start Over
            </button>
          </div>

          <FaceAnalysisDisplay
            analysis={analysisResult}
            facePhoto={{
              photoUrl: capturedPhotos[capturedPhotos.length - 1].cleanPhotoUrl,
              landmarks: capturedPhotos[capturedPhotos.length - 1].landmarks,
              imageWidth: capturedPhotos[capturedPhotos.length - 1].imageWidth,
              imageHeight: capturedPhotos[capturedPhotos.length - 1].imageHeight,
            }}
            selectedSkinTone={selectedSkinTone}
            selectedSkinUndertone={selectedSkinUndertone}
            onProceed={() => setStage("look_selection")}
            onAdjustTone={handleOpenToneOverride}
          />

          {analysisRunId && (
            <div className="mt-6">
              <FeedbackPanel
                title="Rate This Face Read"
                body="Tell MEDUSA whether this read felt right. This is the first layer of personal memory."
                tagOptions={[
                  { id: "accurate", label: "Accurate" },
                  { id: "face_fit", label: "Face Fit" },
                  { id: "tone_right", label: "Tone Right" },
                  { id: "tone_off", label: "Tone Off" },
                  { id: "missed_feature", label: "Missed Feature" },
                  { id: "too_generic", label: "Too Generic" },
                ]}
                submitLabel="Save Analysis Feedback"
                onSubmit={({ rating, tags }) =>
                  submitFeedback({
                    eventType: "analysis_rating",
                    analysisRunId,
                    rating,
                    tags,
                  })
                }
              />
            </div>
          )}
        </main>
      </AppFrame>
    );
  }

  if (stage === "look_selection") {
    return (
      <>
        {showProfileRefine && history && (
          <div className="mx-auto max-w-6xl px-6 pt-10">
            <PreferenceOnboardingPanel
              initialPreferences={history.explicitPreferences}
              title={
                history.explicitPreferences.completedOnboarding
                  ? "Refine Your Taste Profile"
                  : "Set Your Taste Profile"
              }
              body="Tune MEDUSA before you choose a direction. This changes recommendation bias, not your face-fit rules."
              submitLabel="Save Profile"
              compact
              onSubmit={saveProfilePreferences}
            />
          </div>
        )}
        <LookSelector
          onSelect={handleLookSelected}
          analysis={analysisResult}
          explicitPreferences={history?.explicitPreferences ?? null}
          preferenceSummary={history?.preferenceSummary ?? null}
          recommendedLooks={history?.recommendedLooks ?? null}
          onRefineProfile={() => setShowProfileRefine((value) => !value)}
        />
        {error && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2">
            <ErrorBanner message={error} />
          </div>
        )}
      </>
    );
  }

  if (stage === "generating_tutorial") {
    return (
      <ProcessingScreen
        stage={stage}
        eyebrow="Step 03 / Writing"
        title="Writing your routine."
        body="Turning your analysis into placement notes, technique, and what to avoid on your features."
        items={[
          "Reviewing your face analysis",
          "Personalizing each step",
          "Calculating placements",
          "Writing what to avoid",
          "Finalizing your routine",
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
        feedbackSlot={
          <>
            {tutorialRunId ? (
              <FeedbackPanel
                title="Rate This Routine"
                body="Tell MEDUSA what landed and what did not. This feedback will start shaping both recommendations and tutorial tone."
                tagOptions={[
                  { id: "felt_like_me", label: "Felt Like Me" },
                  { id: "clean_luxury", label: "Clean Luxury" },
                  { id: "fresh_glow", label: "Fresh Glow" },
                  { id: "soft_blend", label: "Soft Blend" },
                  { id: "sharp_definition", label: "Sharp Definition" },
                  { id: "eye_focus", label: "Eye Focus" },
                  { id: "lip_focus", label: "Lip Focus" },
                  { id: "not_my_style", label: "Not My Style" },
                  { id: "too_bold", label: "Too Bold" },
                  { id: "too_soft", label: "Too Soft" },
                  { id: "too_generic", label: "Too Generic" },
                ]}
                submitLabel="Save Routine Feedback"
                onSubmit={({ rating, tags }) =>
                  submitFeedback({
                    eventType: "tutorial_rating",
                    analysisRunId,
                    tutorialRunId,
                    rating,
                    tags,
                  })
                }
              />
            ) : null}
            {history && !history.explicitPreferences.completedOnboarding ? (
              <PreferenceOnboardingPanel
                initialPreferences={history.explicitPreferences}
                title="Tune What MEDUSA Shows You Next"
                body="Save a few defaults now and the next recommendation pass will stop feeling generic."
                submitLabel="Save Taste Profile"
                compact
                onSubmit={saveProfilePreferences}
              />
            ) : null}
          </>
        }
      />
    );
  }

  return null;
}

function AppFrame({
  stage,
  children,
}: {
  stage: AppStage;
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-transparent text-[var(--text-main)]">
      <AppBackdrop stage={stage} />
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 pt-8">
        <Link href="/" aria-label="MEDUSA home">
          <MedusaLogo size="sm" />
        </Link>
        <div className="rounded-full border border-[var(--border-subtle)] bg-white/78 px-4 py-2 text-[10px] uppercase tracking-[0.28em] text-[var(--text-muted)]">
          {getStageLabel(stage)}
        </div>
      </header>
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function AppBackdrop({ stage }: { stage: AppStage }) {
  const gradients: Record<AppStage, string> = {
    welcome: "radial-gradient(circle at 18% 25%, rgba(248,212,200,0.62), transparent 34%), radial-gradient(circle at 82% 18%, rgba(253,232,228,0.75), transparent 28%)",
    capturing: "radial-gradient(circle at 20% 25%, rgba(240,179,154,0.34), transparent 32%), radial-gradient(circle at 85% 75%, rgba(253,232,228,0.92), transparent 30%)",
    analyzing: "radial-gradient(circle at 50% 28%, rgba(248,212,200,0.58), transparent 34%)",
    tone_override: "radial-gradient(circle at 50% 20%, rgba(248,212,200,0.5), transparent 28%), radial-gradient(circle at 15% 80%, rgba(255,255,255,0.6), transparent 26%)",
    analysis_complete: "radial-gradient(circle at 80% 20%, rgba(240,179,154,0.3), transparent 30%), radial-gradient(circle at 10% 75%, rgba(253,232,228,0.84), transparent 28%)",
    look_selection: "radial-gradient(circle at 16% 18%, rgba(248,212,200,0.54), transparent 28%), radial-gradient(circle at 84% 82%, rgba(253,232,228,0.9), transparent 28%)",
    generating_tutorial: "radial-gradient(circle at 50% 28%, rgba(248,212,200,0.56), transparent 34%)",
    tutorial: "radial-gradient(circle at 82% 18%, rgba(240,179,154,0.28), transparent 30%), radial-gradient(circle at 12% 85%, rgba(253,232,228,0.85), transparent 28%)",
  };

  return (
    <>
      <div className="absolute inset-0 opacity-95" style={{ background: gradients[stage] }} />
      <div className="absolute inset-0 opacity-[0.1]">
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="medusa-grid" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="#d2b6ad" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#medusa-grid)" />
        </svg>
      </div>
    </>
  );
}

function HeroHeader({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="mb-4 text-xs uppercase tracking-[0.3em] text-[var(--rose-strong)]">{eyebrow}</p>
      <h1
        className="text-5xl font-semibold leading-none text-[var(--text-strong)] md:text-6xl"
        style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
      >
        {title}
      </h1>
      <p className="mt-5 text-sm leading-relaxed text-[var(--text-main)] md:text-base">{body}</p>
    </div>
  );
}

function HeroPanel({
  eyebrow,
  title,
  body,
  children,
}: {
  eyebrow: string;
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass-card rounded-[2rem] p-6">
      <p className="mb-4 text-xs uppercase tracking-[0.28em] text-[var(--rose-strong)]">{eyebrow}</p>
      <h1
        className="text-4xl font-semibold leading-none text-[var(--text-strong)] md:text-5xl"
        style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
      >
        {title}
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-[var(--text-main)] md:text-base">{body}</p>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function ProcessingScreen({
  stage,
  eyebrow,
  title,
  body,
  items,
}: {
  stage: AppStage;
  eyebrow: string;
  title: string;
  body: string;
  items: string[];
}) {
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    const startedAt = Date.now();
    const interval = window.setInterval(() => {
      setElapsedMs(Date.now() - startedAt);
    }, 120);

    return () => window.clearInterval(interval);
  }, []);

  const targetDurationMs = stage === "analyzing" ? 12000 : 15000;
  const progress = Math.min(elapsedMs / targetDurationMs, 0.92);
  const visibleProgress = Math.max(progress, 0.06);
  const completedCount = Math.min(
    items.length - 1,
    Math.floor(progress * items.length)
  );
  const activeIndex = completedCount;
  const activeItem = items[activeIndex];
  const displayPercent = Math.round(visibleProgress * 100);

  const copy =
    stage === "analyzing"
      ? {
          chapter: "Facial Read",
          eyebrowNote: "MEDUSA is reading your structure, tone, and feature emphasis.",
          statusLabel: "Geometry locked",
          detail: "This pass stays strict. The screen moves forward once, then holds while the face read finishes.",
          capsule: "Feature extraction in motion",
          terminalLabel: "Reading your face",
          terminalBody: "Checking structure, face fit, and tone cues without relaxing the precision gate.",
          ambientWord: "ANALYZE",
        }
      : {
          chapter: "Routine Draft",
          eyebrowNote: "MEDUSA is shaping your selected look around the face read.",
          statusLabel: "Look architecture active",
          detail: "The draft builds forward and settles into finalization instead of looping back through the same motions.",
          capsule: "Face-fit routine composition",
          terminalLabel: "Writing your routine",
          terminalBody: "Matching placement, finish, and emphasis to your actual features while keeping the look distinct.",
          ambientWord: "COMPOSE",
        };

  return (
    <AppFrame stage={stage}>
      <main className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center px-6 py-16">
        <div className="pointer-events-none absolute inset-x-6 top-1/2 -translate-y-1/2 overflow-hidden">
          <div
            className="text-center text-[clamp(6rem,22vw,18rem)] font-semibold leading-none text-[rgba(111,77,69,0.07)]"
            style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
          >
            {copy.ambientWord}
          </div>
        </div>

        <div className="relative w-full">
          <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-[rgba(220,127,139,0.24)] bg-[var(--bg-soft-rose)] px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-[var(--rose-strong)]">
                {eyebrow}
              </span>
              <span className="rounded-full border border-[var(--border-subtle)] bg-white/72 px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-[var(--text-muted)]">
                {copy.capsule}
              </span>
            </div>
            <div className="rounded-full border border-[var(--border-subtle)] bg-white/72 px-5 py-2 text-[11px] uppercase tracking-[0.26em] text-[var(--text-muted)]">
              {copy.statusLabel}
            </div>
          </div>

          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--text-muted)]">{copy.chapter}</p>
              <h1
                className="mt-5 max-w-4xl text-[clamp(3.6rem,8vw,7rem)] font-semibold leading-[0.92] text-[var(--text-strong)]"
                style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
              >
                {title}
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-relaxed text-[var(--text-main)] md:text-lg">{body}</p>

              <div className="mt-10 rounded-[2rem] border border-[var(--border-subtle)] bg-white/74 p-6 shadow-[var(--shadow-soft)]">
                <div className="flex items-end justify-between gap-6">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--text-muted)]">Live status</p>
                    <p className="mt-3 text-2xl text-[var(--text-strong)]">{activeItem}</p>
                    <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--text-main)]">{copy.eyebrowNote}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">Visible progress</p>
                    <p className="mt-3 text-5xl tabular-nums text-[var(--text-strong)]">{displayPercent}%</p>
                  </div>
                </div>

                <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-[var(--border-subtle)]">
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: `${displayPercent}%` }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="medusa-progress h-full rounded-full"
                  />
                </div>
              </div>
            </div>

            <div className="glass-card relative overflow-hidden rounded-[2.8rem] p-8">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(240,179,154,0.2),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(253,232,228,0.7),transparent_30%)]" />
              <div className="relative">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--rose-strong)]">MEDUSA Pass</p>
                    <p className="mt-3 text-sm leading-relaxed text-[var(--text-main)]">{copy.detail}</p>
                  </div>
                  <div className="rounded-full border border-[var(--border-subtle)] bg-white/75 px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
                    Hold to finalization
                  </div>
                </div>

                <div className="mt-10 space-y-4">
                  {items.map((item, index) => {
                    const isComplete = index < completedCount;
                    const isCurrent = index === completedCount;

                    return (
                      <motion.div
                        key={item}
                        initial={false}
                        animate={{
                          opacity: isCurrent ? 1 : isComplete ? 0.78 : 0.36,
                          y: isCurrent ? -2 : 0,
                        }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        className={`rounded-[1.6rem] border px-5 py-5 ${
                          isCurrent
                            ? "border-[rgba(220,127,139,0.24)] bg-[var(--bg-soft-rose)]"
                            : isComplete
                              ? "border-[var(--border-subtle)] bg-white/70"
                              : "border-[var(--border-subtle)] bg-transparent"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div
                              className={`flex h-10 w-10 items-center justify-center rounded-full border text-[11px] uppercase tracking-[0.18em] ${
                                isCurrent
                                  ? "border-[rgba(220,127,139,0.28)] bg-white/80 text-[var(--rose-strong)]"
                                  : isComplete
                                    ? "border-[var(--border-subtle)] bg-white/70 text-[var(--text-main)]"
                                    : "border-[var(--border-subtle)] text-[var(--text-muted)]"
                              }`}
                            >
                              {String(index + 1).padStart(2, "0")}
                            </div>
                            <div>
                              <p className="text-sm text-[var(--text-strong)]">{item}</p>
                              <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
                                {isCurrent ? "Current focus" : isComplete ? "Passed" : "Pending"}
                              </p>
                            </div>
                          </div>
                          <div
                            className={`h-2.5 w-14 rounded-full ${
                              isCurrent
                                ? "medusa-progress"
                                : isComplete
                                  ? "bg-[var(--apricot)]"
                                  : "bg-[var(--border-subtle)]"
                            }`}
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                <div className="mt-8 rounded-[1.8rem] border border-[var(--border-subtle)] bg-white/72 px-5 py-5">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--text-muted)]">{copy.terminalLabel}</p>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--text-main)]">{copy.terminalBody}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </AppFrame>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-[rgba(220,127,139,0.24)] bg-[var(--bg-soft-rose)] px-5 py-3 text-sm text-[var(--text-main)] backdrop-blur-sm">
      {message}
    </div>
  );
}

function ToneConfirmationScreen({
  analysis,
  selectedSkinTone,
  selectedSkinUndertone,
  onSelectSkinTone,
  onSelectSkinUndertone,
  onConfirm,
  onBack,
}: {
  analysis: ResolvedFaceAnalysis;
  selectedSkinTone: ResolvedFaceAnalysis["skinTone"];
  selectedSkinUndertone: ResolvedFaceAnalysis["skinUndertone"];
  onSelectSkinTone: (value: ResolvedFaceAnalysis["skinTone"]) => void;
  onSelectSkinUndertone: (value: ResolvedFaceAnalysis["skinUndertone"]) => void;
  onConfirm: () => void;
  onBack: () => void;
}) {
  return (
    <AppFrame stage="tone_override">
      <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="glass-card w-full overflow-hidden rounded-[2.6rem]"
        >
          <div
            className="border-b border-[var(--border-subtle)] px-8 py-8 md:px-10"
            style={{ background: "radial-gradient(circle at top, rgba(248,212,200,0.5), transparent 60%)" }}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-[rgba(220,127,139,0.24)] bg-[var(--bg-soft-rose)] px-4 py-2 text-[11px] uppercase tracking-[0.26em] text-[var(--rose-strong)]"
            >
              <span className="h-2 w-2 rounded-full bg-[var(--rose)] animate-pulse" />
              Adjust If Needed
            </motion.div>
            <h1
              className="max-w-3xl text-4xl font-semibold leading-tight text-[var(--text-strong)] md:text-6xl"
              style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
            >
              Want to adjust
              <br />
              the tone match?
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--text-main)]">
              We already chose the closest skin tone and undertone from your photos. If it feels off, update it here.
            </p>
            <div className="mt-6 rounded-[1.4rem] border border-[var(--border-subtle)] bg-white/72 px-5 py-4">
              <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">What we noticed</p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-main)]">{analysis.skinToneExplanation}</p>
            </div>
          </div>

          <div className="grid gap-6 px-8 py-8 md:px-10 lg:grid-cols-2">
            <ToneChoiceCard
              title="Skin Tone"
              subtitle="Choose the closest overall depth."
              options={analysis.skinToneOptions}
              selected={selectedSkinTone}
              onSelect={onSelectSkinTone}
            />
            <ToneChoiceCard
              title="Undertone"
              subtitle="Choose the warmth or coolness you match best."
              options={analysis.skinUndertoneOptions}
              selected={selectedSkinUndertone}
              onSelect={onSelectSkinUndertone}
              formatLabel={(value) => `${value} undertone`}
            />
          </div>

          <div className="flex flex-col gap-4 border-t border-[var(--border-subtle)] px-8 py-6 md:flex-row md:items-center md:justify-between md:px-10">
            <p className="text-sm text-[var(--text-muted)]">
              Selected: <span className="capitalize text-[var(--text-strong)]">{selectedSkinTone}</span> /{" "}
              <span className="capitalize text-[var(--text-strong)]">{selectedSkinUndertone}</span> undertone
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={onBack}
                className="medusa-button-secondary px-6 py-4 text-sm font-semibold transition-colors hover:bg-white/90"
              >
                Keep This Match
              </button>
              <button
                onClick={onConfirm}
                className="medusa-button-primary px-8 py-4 text-sm font-semibold transition-transform hover:-translate-y-0.5"
              >
                Save My Changes
              </button>
            </div>
          </div>
        </motion.div>
      </main>
    </AppFrame>
  );
}

function ToneChoiceCard<T extends string>({
  title,
  subtitle,
  options,
  selected,
  onSelect,
  formatLabel,
}: {
  title: string;
  subtitle: string;
  options: T[];
  selected: T;
  onSelect: (value: T) => void;
  formatLabel?: (value: T) => string;
}) {
  return (
    <div className="rounded-[2rem] border border-[var(--border-subtle)] bg-white/72 p-5">
      <p className="text-[11px] uppercase tracking-[0.26em] text-[var(--rose-strong)]">{title}</p>
      <p className="mt-3 text-sm leading-relaxed text-[var(--text-main)]">{subtitle}</p>
      <div className="mt-5 grid gap-3">
        {options.map((option, index) => {
          const isSelected = selected === option;

          return (
            <motion.button
              key={option}
              type="button"
              onClick={() => onSelect(option)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className={`rounded-[1.4rem] border px-4 py-4 text-left transition-all ${
                isSelected
                  ? "border-[rgba(220,127,139,0.24)] bg-[var(--bg-soft-rose)] shadow-[var(--shadow-soft)]"
                  : "border-[var(--border-subtle)] bg-white/75 hover:border-[var(--border-strong)] hover:bg-white"
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
                    Option {index + 1}
                  </p>
                  <p className="mt-2 text-lg font-medium capitalize text-[var(--text-strong)]">
                    {formatLabel ? formatLabel(option) : option}
                  </p>
                </div>
                <div
                  className={`h-5 w-5 rounded-full border ${
                    isSelected ? "border-[var(--rose-strong)] bg-[var(--rose)]/90" : "border-[var(--border-strong)]"
                  }`}
                />
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function getStageLabel(stage: AppStage) {
  const index = STAGES.indexOf(stage);
  return index >= 0 ? `${String(index + 1).padStart(2, "0")} / ${String(STAGES.length).padStart(2, "0")}` : "MEDUSA";
}
