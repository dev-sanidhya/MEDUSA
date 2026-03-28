"use client";

/**
 * page.tsx — Medusa main page
 * Flow:
 * 1. welcome → capturing → analyzing → analysis_complete
 * 2. look_selection → generating_tutorial → tutorial
 */

import { useState } from "react";
import { PhotoCapture, type CapturedPhoto } from "@/components/PhotoCapture";
import { FaceAnalysisDisplay } from "@/components/FaceAnalysisDisplay";
import { LookSelector } from "@/components/LookSelector";
import { TutorialDisplay } from "@/components/TutorialDisplay";
import type { AnalyzeFaceRequest, FaceAnalysisResult } from "./api/analyze-face/route";
import type { GenerateTutorialRequest, GenerateTutorialResult, LookId } from "./api/generate-tutorial/route";

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
  const [analysisResult, setAnalysisResult] = useState<FaceAnalysisResult["faceAnalysis"] | null>(null);
  const [tutorialResult, setTutorialResult] = useState<GenerateTutorialResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentPhotoNumber = capturedPhotos.length + 1;

  // ─── Step 1: photo captured → send to analyze-face ───────────────────────
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
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      console.error(err);
      setError(msg);
      setStage("capturing");
    }
  };

  // ─── Step 2: look selected → generate tutorial ────────────────────────────
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
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      console.error(err);
      setError(msg);
      setStage("look_selection");
    }
  };

  // ─── Full restart ─────────────────────────────────────────────────────────
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

  // ─── WELCOME ───────────────────────────────────────────────────────────────
  if (stage === "welcome") {
    return (
      <main className="min-h-screen bg-stone-950 flex flex-col items-center justify-center px-6">
        <div className="max-w-md w-full text-center space-y-8">
          <div>
            <h1 className="text-6xl font-bold tracking-tight text-white" style={{ fontFamily: "Georgia, serif" }}>
              MEDUSA
            </h1>
            <p className="text-stone-400 text-sm tracking-[0.3em] uppercase mt-2">AI Makeup Artist</p>
          </div>

          <p className="text-stone-300 text-base leading-relaxed">
            Your face is unique. Your tutorial should be too.
            <br />
            <span className="text-stone-500 text-sm">
              Upload a selfie and I&apos;ll map your face with 478-point precision —
              then build your personalized step-by-step tutorial.
            </span>
          </p>

          <div className="bg-stone-900 rounded-2xl p-5 text-left space-y-3">
            {[
              ["◈", "I'll analyze your exact face geometry"],
              ["◉", "I'll read your skin tone and undertone"],
              ["✦", "I'll tell you what to do — and what to avoid — for YOUR face"],
            ].map(([icon, text]) => (
              <div key={text} className="flex items-center gap-3">
                <span className="text-rose-400 text-lg w-5">{icon}</span>
                <span className="text-stone-300 text-sm">{text}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => setStage("capturing")}
            className="w-full py-4 bg-rose-500 hover:bg-rose-400 text-white font-semibold rounded-2xl transition-colors text-[15px] tracking-wide"
          >
            Begin My Analysis →
          </button>

          <p className="text-stone-600 text-xs">
            Your photo is processed locally — never stored on our servers.
          </p>
        </div>
      </main>
    );
  }

  // ─── CAPTURING ─────────────────────────────────────────────────────────────
  if (stage === "capturing") {
    return (
      <main className="min-h-screen bg-stone-50 px-5 py-10">
        <div className="max-w-lg mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-stone-900" style={{ fontFamily: "Georgia, serif" }}>MEDUSA</h1>
            <p className="text-stone-400 text-sm mt-1">Photo {currentPhotoNumber} of up to 3</p>
          </div>

          {agentMessage && (
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-rose-500 text-sm">✦</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-rose-500 uppercase tracking-wider mb-1">
                    I need one more photo
                  </p>
                  <p className="text-stone-700 text-sm leading-relaxed">{agentMessage}</p>
                </div>
              </div>
            </div>
          )}

          {capturedPhotos.length > 0 && (
            <div className="flex gap-2">
              {capturedPhotos.map((p, i) => (
                <div key={i} className="relative rounded-lg overflow-hidden w-16 h-16 bg-stone-200">
                  <img src={p.previewUrl} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{i + 1}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {currentPhotoNumber === 1 && (
            <div className="bg-stone-100 rounded-xl p-4 space-y-1.5">
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">For best results</p>
              {[
                "Face the camera directly — straight on",
                "Natural light, no harsh flash",
                "Hair pulled back, full face visible",
                "Neutral expression, mouth closed",
                "Full face in frame — forehead to chin",
              ].map((tip) => (
                <div key={tip} className="flex items-start gap-2">
                  <span className="text-rose-400 text-xs mt-0.5">·</span>
                  <span className="text-stone-600 text-xs">{tip}</span>
                </div>
              ))}
            </div>
          )}

          <PhotoCapture
            photoNumber={currentPhotoNumber}
            onPhotoCaptured={handlePhotoCaptured}
            instruction={photoInstruction}
          />

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {error}
            </div>
          )}
        </div>
      </main>
    );
  }

  // ─── ANALYZING ─────────────────────────────────────────────────────────────
  if (stage === "analyzing") {
    return (
      <main className="min-h-screen bg-stone-950 flex flex-col items-center justify-center px-6">
        <div className="text-center space-y-6">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 border-2 border-rose-800 rounded-full animate-ping opacity-30" />
            <div className="absolute inset-2 border-2 border-rose-500 rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-rose-400 text-2xl">✦</span>
            </div>
          </div>
          <div>
            <h2 className="text-white text-xl font-semibold">Reading your face</h2>
            <p className="text-stone-400 text-sm mt-2">
              Analyzing 478 landmark points · Measuring face geometry · Assessing skin tone
            </p>
          </div>
          <div className="space-y-2 text-left max-w-xs mx-auto">
            {[
              "Mapping face structure...",
              "Calculating eye geometry...",
              "Measuring lip proportions...",
              "Classifying face shape...",
              "Reading skin tone...",
            ].map((step) => (
              <div key={step} className="flex items-center gap-2 text-stone-500 text-xs">
                <span className="w-1 h-1 bg-rose-500 rounded-full animate-pulse" />
                {step}
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  // ─── ANALYSIS COMPLETE ─────────────────────────────────────────────────────
  if (stage === "analysis_complete" && analysisResult) {
    return (
      <main className="min-h-screen bg-stone-50 px-5 py-10">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-stone-900" style={{ fontFamily: "Georgia, serif" }}>
              Your Face Analysis
            </h1>
            <p className="text-stone-400 text-sm mt-2">
              {capturedPhotos.length} photo{capturedPhotos.length > 1 ? "s" : ""} analyzed ·{" "}
              {capturedPhotos[capturedPhotos.length - 1]?.precisionReport.overallScore}/100 precision
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

  // ─── LOOK SELECTION ────────────────────────────────────────────────────────
  if (stage === "look_selection") {
    return (
      <>
        <LookSelector onSelect={handleLookSelected} />
        {error && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 bg-red-900 text-red-100 text-sm rounded-xl shadow-lg">
            {error}
          </div>
        )}
      </>
    );
  }

  // ─── GENERATING TUTORIAL ───────────────────────────────────────────────────
  if (stage === "generating_tutorial") {
    return (
      <main className="min-h-screen bg-stone-950 flex flex-col items-center justify-center px-6">
        <div className="text-center space-y-6">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 border-2 border-rose-800 rounded-full animate-ping opacity-30" />
            <div className="absolute inset-2 border-2 border-rose-500 rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-rose-400 text-2xl">◈</span>
            </div>
          </div>
          <div>
            <h2 className="text-white text-xl font-semibold">Building your tutorial</h2>
            <p className="text-stone-400 text-sm mt-2">
              Writing steps personalized to your exact face geometry
            </p>
          </div>
          <div className="space-y-2 text-left max-w-xs mx-auto">
            {[
              "Reviewing your face analysis...",
              "Personalizing each step...",
              "Calculating placement for your features...",
              "Writing geometry-backed warnings...",
              "Finalizing your tutorial...",
            ].map((step) => (
              <div key={step} className="flex items-center gap-2 text-stone-500 text-xs">
                <span className="w-1 h-1 bg-rose-500 rounded-full animate-pulse" />
                {step}
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  // ─── TUTORIAL ─────────────────────────────────────────────────────────────
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
