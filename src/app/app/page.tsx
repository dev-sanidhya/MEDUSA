"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { PhotoCapture, type CapturedPhoto } from "@/components/PhotoCapture";
import { FaceAnalysisDisplay } from "@/components/FaceAnalysisDisplay";
import { LookSelector } from "@/components/LookSelector";
import { TutorialDisplay } from "@/components/TutorialDisplay";
import { MedusaLogo } from "@/components/MedusaLogo";
import type { AnalyzeFaceRequest, FaceAnalysisResult } from "../api/analyze-face/route";
import type {
  EditorialSubtype,
  GenerateTutorialRequest,
  GenerateTutorialResult,
  LookId,
} from "../api/generate-tutorial/route";

type ResolvedFaceAnalysis = NonNullable<FaceAnalysisResult["faceAnalysis"]>;

type AppStage =
  | "welcome"
  | "capturing"
  | "analyzing"
  | "tone_override"
  | "analysis_complete"
  | "look_selection"
  | "editorial_selection"
  | "generating_tutorial"
  | "tutorial";

const STAGES: AppStage[] = [
  "welcome",
  "capturing",
  "analyzing",
  "tone_override",
  "analysis_complete",
  "look_selection",
  "editorial_selection",
  "generating_tutorial",
  "tutorial",
];

export default function MedusaApp() {
  const [stage, setStage] = useState<AppStage>("welcome");
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
  const [agentMessage, setAgentMessage] = useState<string | null>(null);
  const [photoInstruction, setPhotoInstruction] = useState<string | undefined>(undefined);
  const [analysisResult, setAnalysisResult] = useState<ResolvedFaceAnalysis | null>(null);
  const [selectedSkinTone, setSelectedSkinTone] = useState<ResolvedFaceAnalysis["skinTone"] | null>(null);
  const [selectedSkinUndertone, setSelectedSkinUndertone] = useState<ResolvedFaceAnalysis["skinUndertone"] | null>(null);
  const [selectedEditorialSubtype, setSelectedEditorialSubtype] = useState<EditorialSubtype | null>(null);
  const [tutorialResult, setTutorialResult] = useState<GenerateTutorialResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentPhotoNumber = capturedPhotos.length + 1;

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

      if (result.status === "needs_more_photos" && result.photoRequest) {
        setAgentMessage(result.photoRequest.message);
        setPhotoInstruction(result.photoRequest.specificInstruction);
        setStage("capturing");
      } else if (result.status === "analysis_complete" && result.faceAnalysis) {
        setAnalysisResult(result.faceAnalysis);
        setSelectedSkinTone(result.faceAnalysis.skinToneOptions[0] ?? result.faceAnalysis.skinTone);
        setSelectedSkinUndertone(result.faceAnalysis.skinUndertoneOptions[0] ?? result.faceAnalysis.skinUndertone);
        setStage("analysis_complete");
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
      setSelectedEditorialSubtype("sharp");
      setStage("editorial_selection");
      return;
    }

    await generateSelectedLookTutorial(look);
  };

  const handleEditorialSubtypeSelected = async (subtype: EditorialSubtype) => {
    setSelectedEditorialSubtype(subtype);
    await generateSelectedLookTutorial("editorial", subtype);
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
      setStage("tutorial");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      console.error(err);
      setError(msg);
      setStage(look === "editorial" ? "editorial_selection" : "look_selection");
    }
  };

  const handleRestart = () => {
    setStage("welcome");
    setCapturedPhotos([]);
    setAgentMessage(null);
    setPhotoInstruction(undefined);
    setAnalysisResult(null);
    setSelectedSkinTone(null);
    setSelectedSkinUndertone(null);
    setSelectedEditorialSubtype(null);
    setTutorialResult(null);
    setError(null);
  };

  const handleChooseAnotherLook = () => {
    setTutorialResult(null);
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
              <p className="mb-5 text-xs uppercase tracking-[0.32em] text-rose-400">Face Analysis</p>
              <h1
                className="text-[clamp(3.5rem,9vw,6.8rem)] font-semibold leading-none text-white"
                style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
              >
                Get a routine
                <br />
                shaped to
                <br />
                your face.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-white/48 md:text-lg">
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
                    className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs uppercase tracking-[0.18em] text-white/42"
                  >
                    {pill}
                  </span>
                ))}
              </div>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => setStage("capturing")}
                  className="rounded-full bg-rose-500 px-8 py-4 text-sm font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-rose-400"
                >
                  Begin Analysis
                </button>
                <Link
                  href="/"
                  className="rounded-full border border-white/10 px-8 py-4 text-sm uppercase tracking-[0.16em] text-white/55 transition-colors hover:border-white/18 hover:text-white/75"
                >
                  Back to Home
                </Link>
              </div>
            </div>

            <div className="glass-card noise relative overflow-hidden rounded-[2.4rem] border border-white/8 p-7">
              <div
                className="pointer-events-none absolute inset-0"
                style={{ background: "radial-gradient(circle at top right, rgba(244,63,94,0.18), transparent 55%)" }}
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
                    <div key={num} className="rounded-[1.6rem] border border-white/8 bg-white/[0.03] p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-[0.24em] text-rose-300">Step {num}</span>
                        <span className="text-[10px] uppercase tracking-[0.2em] text-white/22">{title}</span>
                      </div>
                      <p
                        className="mt-3 text-2xl font-semibold text-white"
                        style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
                      >
                        {title}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-white/45">{body}</p>
                    </div>
                  ))}
                </div>

                <p className="mt-6 text-center text-xs uppercase tracking-[0.22em] text-white/24">
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
                eyebrow={`Step ${String(Math.min(currentPhotoNumber, 3)).padStart(2, "0")} · Capture`}
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
                    <div key={tip} className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white/58">
                      {tip}
                    </div>
                  ))}
                </div>
              </HeroPanel>

              <div className="glass-card rounded-[2rem] border border-white/8 p-6">
                <p className="text-[11px] uppercase tracking-[0.28em] text-white/35">Capture Progress</p>
                <div className="mt-5 flex gap-3">
                  {[0, 1, 2].map((index) => {
                    const isComplete = index < capturedPhotos.length;
                    const isActive = index === capturedPhotos.length;

                    return (
                      <div key={index} className="flex-1">
                        <div
                          className={`h-1 rounded-full ${
                            isComplete ? "bg-rose-400" : isActive ? "bg-white/28" : "bg-white/8"
                          }`}
                        />
                        <p className="mt-2 text-[10px] uppercase tracking-[0.18em] text-white/25">
                          Photo {index + 1}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {capturedPhotos.length > 0 && (
                  <div className="mt-6 grid grid-cols-3 gap-3">
                    {capturedPhotos.map((photo, index) => (
                      <div key={`${photo.previewUrl}-${index}`} className="overflow-hidden rounded-[1.25rem] border border-white/10 bg-black">
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

            <div className="glass-card rounded-[2rem] border border-white/8 p-6">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.28em] text-rose-300">Upload Panel</p>
                  <p className="mt-2 text-sm text-white/45">Photo {currentPhotoNumber} of up to 3</p>
                </div>
                <div className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/35">
                  Precision first
                </div>
              </div>

              {agentMessage && (
                <div className="mb-5 rounded-[1.6rem] border border-rose-500/18 bg-rose-500/[0.06] p-5">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-rose-300">One more angle needed</p>
                  <p className="mt-2 text-sm leading-relaxed text-rose-100/82">{agentMessage}</p>
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
        eyebrow="Step 02 · Reading"
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
              eyebrow="Step 02 · Complete"
              title="Your quick read."
              body={`${
                capturedPhotos.length
              } photo${capturedPhotos.length > 1 ? "s" : ""} analyzed with ${
                capturedPhotos[capturedPhotos.length - 1]?.precisionReport.overallScore ?? 0
              }/100 photo quality.`}
            />
            <button
              onClick={handleRestart}
              className="rounded-full border border-white/10 px-5 py-3 text-sm text-white/58 transition-colors hover:border-white/16 hover:text-white/75"
            >
              Start Over
            </button>
          </div>

          <FaceAnalysisDisplay
            analysis={analysisResult}
            selectedSkinTone={selectedSkinTone}
            selectedSkinUndertone={selectedSkinUndertone}
            onProceed={() => setStage("look_selection")}
            onAdjustTone={handleOpenToneOverride}
          />
        </main>
      </AppFrame>
    );
  }

  if (stage === "look_selection") {
    return (
      <>
        <LookSelector onSelect={handleLookSelected} />
        {error && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2">
            <ErrorBanner message={error} />
          </div>
        )}
      </>
    );
  }

  if (stage === "editorial_selection") {
    return (
      <>
        <EditorialStyleSelector
          selected={selectedEditorialSubtype}
          onBack={() => setStage("look_selection")}
          onSelect={handleEditorialSubtypeSelected}
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
        eyebrow="Step 03 · Writing"
        title="Writing your routine."
        body="Turning your analysis into placement notes, technique, and cautions built for your proportions."
        items={[
          "Reviewing your face analysis",
          "Personalizing each step",
          "Calculating placements",
          "Writing geometry-backed warnings",
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
    <div className="relative min-h-screen overflow-hidden bg-[#050508] text-white">
      <AppBackdrop stage={stage} />
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 pt-8">
        <Link href="/" aria-label="MEDUSA home">
          <MedusaLogo size="sm" />
        </Link>
        <div className="rounded-full border border-white/8 px-4 py-2 text-[10px] uppercase tracking-[0.28em] text-white/30">
          {getStageLabel(stage)}
        </div>
      </header>
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function AppBackdrop({ stage }: { stage: AppStage }) {
  const gradients: Record<AppStage, string> = {
    welcome: "radial-gradient(circle at 18% 25%, rgba(244,63,94,0.16), transparent 34%), radial-gradient(circle at 82% 18%, rgba(255,255,255,0.05), transparent 26%)",
    capturing: "radial-gradient(circle at 20% 25%, rgba(244,63,94,0.14), transparent 32%), radial-gradient(circle at 85% 75%, rgba(109,40,217,0.08), transparent 30%)",
    analyzing: "radial-gradient(circle at 50% 28%, rgba(244,63,94,0.18), transparent 34%)",
    tone_override: "radial-gradient(circle at 50% 20%, rgba(244,63,94,0.18), transparent 28%), radial-gradient(circle at 15% 80%, rgba(255,255,255,0.04), transparent 26%)",
    analysis_complete: "radial-gradient(circle at 80% 20%, rgba(244,63,94,0.14), transparent 30%), radial-gradient(circle at 10% 75%, rgba(255,255,255,0.04), transparent 28%)",
    look_selection: "radial-gradient(circle at 16% 18%, rgba(244,63,94,0.12), transparent 28%), radial-gradient(circle at 84% 82%, rgba(109,40,217,0.09), transparent 28%)",
    editorial_selection: "radial-gradient(circle at 80% 16%, rgba(109,40,217,0.16), transparent 28%), radial-gradient(circle at 12% 82%, rgba(244,63,94,0.08), transparent 26%)",
    generating_tutorial: "radial-gradient(circle at 50% 28%, rgba(244,63,94,0.18), transparent 34%)",
    tutorial: "radial-gradient(circle at 82% 18%, rgba(244,63,94,0.12), transparent 30%), radial-gradient(circle at 12% 85%, rgba(255,255,255,0.04), transparent 28%)",
  };

  return (
    <>
      <div className="absolute inset-0 opacity-95" style={{ background: gradients[stage] }} />
      <div className="absolute inset-0 opacity-[0.03]">
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="medusa-grid" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="white" />
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
      <p className="mb-4 text-xs uppercase tracking-[0.3em] text-rose-400">{eyebrow}</p>
      <h1
        className="text-5xl font-semibold leading-none text-white md:text-6xl"
        style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
      >
        {title}
      </h1>
      <p className="mt-5 text-sm leading-relaxed text-white/48 md:text-base">{body}</p>
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
    <div className="glass-card rounded-[2rem] border border-white/8 p-6">
      <p className="mb-4 text-xs uppercase tracking-[0.28em] text-rose-400">{eyebrow}</p>
      <h1
        className="text-4xl font-semibold leading-none text-white md:text-5xl"
        style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
      >
        {title}
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-white/48 md:text-base">{body}</p>
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
  return (
    <AppFrame stage={stage}>
      <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-6 py-16">
        <div className="glass-card w-full rounded-[2.4rem] border border-white/8 px-8 py-12 text-center">
          <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full border border-rose-500/18 bg-rose-500/[0.06]">
            <div className="h-14 w-14 rounded-full border border-rose-400/22 border-t-rose-400 animate-spin" />
          </div>
          <p className="text-xs uppercase tracking-[0.3em] text-rose-400">{eyebrow}</p>
          <h1
            className="mt-4 text-5xl font-semibold leading-none text-white"
            style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
          >
            {title}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-white/45 md:text-base">{body}</p>

          <div className="mx-auto mt-10 max-w-xl space-y-3 text-left">
            {items.map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-full border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white/58"
              >
                <span className="h-2 w-2 rounded-full bg-rose-400 animate-pulse" />
                {item}...
              </div>
            ))}
          </div>
        </div>
      </main>
    </AppFrame>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.08] px-5 py-3 text-sm text-rose-100/85 backdrop-blur-sm">
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
          className="glass-card w-full overflow-hidden rounded-[2.6rem] border border-white/8"
        >
          <div
            className="border-b border-white/8 px-8 py-8 md:px-10"
            style={{ background: "radial-gradient(circle at top, rgba(244,63,94,0.12), transparent 60%)" }}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/8 px-4 py-2 text-[11px] uppercase tracking-[0.26em] text-rose-300"
            >
              <span className="h-2 w-2 rounded-full bg-rose-400 animate-pulse" />
              Adjust If Needed
            </motion.div>
            <h1
              className="max-w-3xl text-4xl font-semibold leading-tight text-white md:text-6xl"
              style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
            >
              Want to adjust
              <br />
              the tone match?
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/55">
              We already chose the closest skin tone and undertone from your photos. If it feels off, update it here.
            </p>
            <div className="mt-6 rounded-[1.4rem] border border-white/8 bg-white/[0.03] px-5 py-4">
              <p className="text-[10px] uppercase tracking-[0.22em] text-white/30">What we noticed</p>
              <p className="mt-2 text-sm leading-relaxed text-white/68">{analysis.skinToneExplanation}</p>
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

          <div className="flex flex-col gap-4 border-t border-white/8 px-8 py-6 md:flex-row md:items-center md:justify-between md:px-10">
            <p className="text-sm text-white/40">
              Selected: <span className="text-white/72 capitalize">{selectedSkinTone}</span> ·{" "}
              <span className="text-white/72 capitalize">{selectedSkinUndertone}</span> undertone
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={onBack}
                className="inline-flex items-center justify-center rounded-full border border-white/10 px-6 py-4 text-sm font-semibold text-white/72 transition-colors hover:border-white/18 hover:bg-white/[0.04]"
              >
                Keep Agent Match
              </button>
              <button
                onClick={onConfirm}
                className="inline-flex items-center justify-center rounded-full bg-rose-500 px-8 py-4 text-sm font-semibold text-white transition-all duration-200 hover:bg-rose-400 hover:shadow-[0_0_40px_rgba(244,63,94,0.25)]"
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
    <div className="rounded-[2rem] border border-white/8 bg-white/[0.03] p-5">
      <p className="text-[11px] uppercase tracking-[0.26em] text-rose-300">{title}</p>
      <p className="mt-3 text-sm leading-relaxed text-white/48">{subtitle}</p>
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
                  ? "border-rose-400/35 bg-rose-500/12 shadow-[0_0_24px_rgba(244,63,94,0.12)]"
                  : "border-white/8 bg-white/[0.02] hover:border-white/16 hover:bg-white/[0.04]"
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/28">
                    Option {index + 1}
                  </p>
                  <p className="mt-2 text-lg font-medium capitalize text-white/85">
                    {formatLabel ? formatLabel(option) : option}
                  </p>
                </div>
                <div
                  className={`h-5 w-5 rounded-full border ${
                    isSelected ? "border-rose-300 bg-rose-400/90" : "border-white/20"
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

const EDITORIAL_STYLES: Array<{
  id: EditorialSubtype;
  label: string;
  subtitle: string;
  body: string;
  accent: string;
}> = [
  {
    id: "sharp",
    label: "Sharp",
    subtitle: "Graphic and precise",
    body: "Clean lines, strong shape, crisp edges, and a high-fashion finish.",
    accent: "rgba(244,63,94,0.16)",
  },
  {
    id: "glossy",
    label: "Glossy",
    subtitle: "Wet-look shine",
    body: "Reflective lids or skin, fresh texture, and controlled shine that catches light.",
    accent: "rgba(96,165,250,0.16)",
  },
  {
    id: "messy",
    label: "Messy",
    subtitle: "Lived-in and smudged",
    body: "Deliberately blurred, grungy, and undone, but still designed with intent.",
    accent: "rgba(168,85,247,0.16)",
  },
  {
    id: "soft",
    label: "Soft",
    subtitle: "Diffused and airy",
    body: "Washed color, blurred edges, and a gentler editorial look with less harsh contrast.",
    accent: "rgba(251,191,36,0.12)",
  },
];

function EditorialStyleSelector({
  selected,
  onSelect,
  onBack,
}: {
  selected: EditorialSubtype | null;
  onSelect: (style: EditorialSubtype) => void;
  onBack: () => void;
}) {
  return (
    <main className="min-h-screen bg-[#050508] px-6 py-12 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="mb-4 text-xs uppercase tracking-[0.3em] text-violet-300">Editorial Style</p>
            <h1
              className="text-5xl font-semibold leading-none md:text-7xl"
              style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
            >
              Pick your editorial
              <br />
              <span style={{ fontStyle: "italic" }}>direction.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/48">
              Editorial makeup is not just one look. Choose the mood you want, and MEDUSA will build the tutorial around that exact editorial style.
            </p>
          </div>
          <button
            onClick={onBack}
            className="rounded-full border border-white/10 px-6 py-3 text-sm text-white/62 transition-colors hover:border-white/18 hover:text-white/80"
          >
            Back to Looks
          </button>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {EDITORIAL_STYLES.map((style) => {
            const isSelected = selected === style.id;

            return (
              <button
                key={style.id}
                onClick={() => onSelect(style.id)}
                className={`group relative overflow-hidden rounded-[2rem] border p-6 text-left transition-all duration-200 hover:-translate-y-1 ${
                  isSelected
                    ? "border-violet-300/35 bg-[rgba(18,18,28,0.92)] shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
                    : "border-white/8 bg-[rgba(13,13,20,0.8)] hover:border-violet-300/24"
                }`}
              >
                <div
                  className="pointer-events-none absolute inset-0 opacity-95 transition-opacity duration-200 group-hover:opacity-100"
                  style={{ background: `radial-gradient(circle at top right, ${style.accent}, transparent 56%)` }}
                />
                <div className="relative">
                  <div className="mb-10 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.24em] text-violet-300">{style.subtitle}</p>
                      <p className="mt-2 text-[11px] uppercase tracking-[0.22em] text-white/22">
                        Editorial
                      </p>
                    </div>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/35">
                      Style
                    </span>
                  </div>

                  <h2
                    className="text-3xl font-semibold leading-none text-white"
                    style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
                  >
                    {style.label}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-white/48">
                    {style.body}
                  </p>

                  <div className="mt-8 flex items-center gap-2 text-sm font-medium text-violet-300">
                    Build this editorial tutorial
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </main>
  );
}

function getStageLabel(stage: AppStage) {
  const index = STAGES.indexOf(stage);
  return index >= 0 ? `${String(index + 1).padStart(2, "0")} / ${String(STAGES.length).padStart(2, "0")}` : "MEDUSA";
}
