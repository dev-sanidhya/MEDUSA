"use client";

import { useEffect, useState } from "react";
import type { FaceAnalysisResult } from "@/app/api/analyze-face/route";
import type { ZoneKey } from "@/app/api/generate-tutorial/route";
import type { RawLandmark } from "@/lib/face-detector";
import { FaceZoneCanvas } from "@/components/FaceZoneCanvas";

type ResolvedFaceAnalysis = NonNullable<FaceAnalysisResult["faceAnalysis"]>;

interface FacePhoto {
  photoUrl: string;
  landmarks: RawLandmark[];
  imageWidth: number;
  imageHeight: number;
}

interface Props {
  analysis: ResolvedFaceAnalysis;
  facePhoto: FacePhoto;
  selectedSkinTone: ResolvedFaceAnalysis["skinTone"];
  selectedSkinUndertone: ResolvedFaceAnalysis["skinUndertone"];
  onProceed: () => void;
  onAdjustTone: () => void;
}

export function FaceAnalysisDisplay({
  analysis,
  facePhoto,
  selectedSkinTone,
  selectedSkinUndertone,
  onProceed,
  onAdjustTone,
}: Props) {
  const spotlights = [
    {
      id: "shape",
      label: "Face shape",
      kicker: analysis.faceShape,
      zone: "full_face" as ZoneKey,
      title: "Your face shape sets the balance.",
      body: analysis.faceShapeExplanation,
    },
    {
      id: "tone",
      label: "Tone match",
      kicker: `${selectedSkinTone} · ${selectedSkinUndertone}`,
      zone: "t_zone" as ZoneKey,
      title: "Your tone reads clear and consistent.",
      body: analysis.skinToneExplanation,
    },
    {
      id: "eyes",
      label: "Eyes",
      kicker: `${analysis.eyes.shape} · ${analysis.eyes.set}`,
      zone: "eye_lid" as ZoneKey,
      title: "Your eyes can carry shape easily.",
      body: analysis.eyes.specificCharacteristics,
    },
    {
      id: "lips",
      label: "Lips",
      kicker: analysis.lips.description,
      zone: "lips" as ZoneKey,
      title: "Your lips are already a standout feature.",
      body: analysis.lips.specificCharacteristics,
    },
  ];

  const [activeSpotlight, setActiveSpotlight] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSpotlight((current) => (current + 1) % spotlights.length);
    }, 2800);

    return () => window.clearInterval(timer);
  }, [spotlights.length]);

  const activeFeature = spotlights[activeSpotlight];
  const tonePalette = getTonePalette(selectedSkinTone, selectedSkinUndertone);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="glass-card rounded-[2.25rem] border border-rose-500/15 p-7 md:p-8">
          <div className="mb-4 flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-rose-500/20 bg-rose-500/10 text-rose-300">
              ✦
            </span>
            <div>
              <p className="text-[11px] uppercase tracking-[0.3em] text-rose-300">Your Quick Read</p>
              <p className="mt-1 text-sm text-white/35">Short, simple, and based on your photos.</p>
            </div>
          </div>

          <p className="text-lg leading-relaxed text-white/82">{analysis.personalReading}</p>

          {analysis.precisionLevel === "medium" && (
            <p className="mt-4 rounded-2xl border border-white/8 bg-white/4 px-4 py-3 text-sm leading-relaxed text-white/52">
              {analysis.precisionNote}
            </p>
          )}
        </div>

        <div className="glass-card rounded-[2.25rem] border border-white/8 p-7 md:p-8">
          <p className="text-[11px] uppercase tracking-[0.3em] text-white/35">Best Features To Play Up</p>
          <div className="mt-5 flex flex-wrap gap-3">
            {analysis.beautyHighlights.map((highlight) => (
              <span
                key={highlight}
                className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white/72"
              >
                {highlight}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="glass-card relative overflow-hidden rounded-[2.25rem] border border-white/8 p-4 md:p-5">
          <div
            className="pointer-events-none absolute inset-0 opacity-90"
            style={{
              background:
                "radial-gradient(circle at top right, rgba(96,165,250,0.12), transparent 52%), radial-gradient(circle at bottom left, rgba(244,63,94,0.08), transparent 44%)",
            }}
          />
          <div className="relative overflow-hidden rounded-[1.75rem] border border-white/8 bg-black">
            <FaceZoneCanvas
              photoUrl={facePhoto.photoUrl}
              landmarks={facePhoto.landmarks}
              imageWidth={facePhoto.imageWidth}
              imageHeight={facePhoto.imageHeight}
              zone={activeFeature.zone}
              showMotionGuides={false}
              showBadge={false}
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent px-5 py-5">
              <p className="text-[10px] uppercase tracking-[0.24em] text-rose-300">Feature Spotlight</p>
              <p
                className="mt-2 text-2xl font-semibold text-white"
                style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
              >
                {activeFeature.title}
              </p>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-white/72">{activeFeature.body}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          <div className="glass-card rounded-[2.25rem] border border-white/8 p-6 md:p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.3em] text-white/35">What Stood Out</p>
                <p className="mt-2 text-sm leading-relaxed text-white/48">
                  These are the main features shaping your tutorial.
                </p>
              </div>
              <div className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/35">
                Live Read
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              {spotlights.map((feature, index) => {
                const isActive = index === activeSpotlight;

                return (
                  <button
                    key={feature.id}
                    type="button"
                    onClick={() => setActiveSpotlight(index)}
                    className={`rounded-[1.35rem] border px-4 py-4 text-left transition-all ${
                      isActive
                        ? "border-rose-400/30 bg-rose-500/[0.08] shadow-[0_0_24px_rgba(244,63,94,0.08)]"
                        : "border-white/8 bg-white/[0.03] hover:border-white/16 hover:bg-white/[0.05]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-white/28">{feature.label}</p>
                        <p className="mt-2 text-sm font-medium capitalize text-white/84">{feature.kicker}</p>
                        <p className="mt-2 text-sm leading-relaxed text-white/50">{feature.body}</p>
                      </div>
                      <div className={`mt-1 h-2.5 w-2.5 rounded-full ${isActive ? "bg-rose-300" : "bg-white/16"}`} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="glass-card rounded-[2.25rem] border border-white/8 p-6 md:p-7">
            <p className="text-[11px] uppercase tracking-[0.3em] text-white/35">Colors That Should Flatter You</p>
            <p className="mt-2 text-sm leading-relaxed text-white/48">
              Based on your current tone match, these families should feel the easiest and most natural to wear.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {tonePalette.map((swatch) => (
                <div
                  key={swatch.name}
                  className="rounded-[1.35rem] border border-white/8 bg-white/[0.03] p-4"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-11 w-11 rounded-full border border-white/10"
                      style={{ background: swatch.color }}
                    />
                    <div>
                      <p className="text-sm font-medium text-white/82">{swatch.name}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/28">{swatch.note}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Section title="Face Shape" icon="◈" accent="rose">
          <div className="mb-3 flex flex-wrap gap-2">
            <Tag label={analysis.faceShape} />
          </div>
          <FeatureNote title="What we noticed" body={analysis.faceShapeExplanation} />
          <MiniGuidance workWith={analysis.faceShapeWorkWith} avoid={analysis.faceShapeAvoid} />
        </Section>

        <Section title="Closest Tone Match" icon="◉" accent="amber">
          <FeatureNote title="What we noticed" body={analysis.skinToneExplanation} />
          <div className="mt-3 flex flex-wrap gap-2">
            <Tag label={selectedSkinTone} />
            <Tag label={`${selectedSkinUndertone} undertone`} variant="soft" />
          </div>
          <MiniGuidance workWith={analysis.skinToneWorkWith} avoid={analysis.skinToneAvoid} />
        </Section>

        <Section title="Eyes" icon="◎" accent="violet">
          <div className="mb-2 flex flex-wrap gap-2">
            <Tag label={analysis.eyes.shape} />
            <Tag label={analysis.eyes.set} variant="soft" />
          </div>
          <FeatureNote title="What we noticed" body={analysis.eyes.specificCharacteristics} />
          <p className="mt-3 text-sm leading-relaxed text-white/68">{analysis.eyes.makeupImplication}</p>
          <MiniGuidance workWith={analysis.eyes.workWith} avoid={analysis.eyes.avoid} />
        </Section>

        <Section title="Lips" icon="◌" accent="rose">
          <FeatureNote title="What we noticed" body={analysis.lips.specificCharacteristics} />
          <p className="mt-3 text-sm leading-relaxed text-white/68">{analysis.lips.makeupImplication}</p>
          <MiniGuidance workWith={analysis.lips.workWith} avoid={analysis.lips.avoid} />
        </Section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="glass-card relative overflow-hidden rounded-[2rem] border border-white/8 p-6 md:p-7">
          <div
            className="pointer-events-none absolute inset-0 opacity-90"
            style={{ background: "radial-gradient(circle at top right, rgba(255,255,255,0.05), transparent 58%)" }}
          />
          <div className="relative">
            <div className="mb-5 flex items-center gap-2.5">
              <span className="text-sm text-rose-300">⌒</span>
              <span className="text-[11px] uppercase tracking-[0.28em] text-white/35">Keep It Simple</span>
            </div>

            <div className="space-y-3">
              {analysis.makeupPriorities.map((priority, index) => (
                <div
                  key={priority}
                  className="flex items-start gap-4 rounded-[1.3rem] border border-white/8 bg-white/[0.03] px-5 py-4"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-rose-500/20 bg-rose-500/10 text-xs font-semibold text-rose-200">
                    {index + 1}
                  </div>
                  <p className="pt-1 text-sm leading-relaxed text-white/74">{priority}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="glass-card relative overflow-hidden rounded-[2rem] border border-white/8 p-6 md:p-7">
          <div
            className="pointer-events-none absolute inset-0 opacity-90"
            style={{ background: "radial-gradient(circle at top right, rgba(244,63,94,0.08), transparent 58%)" }}
          />
          <div className="relative">
            <div className="mb-5 flex items-center gap-2.5">
              <span className="text-sm text-rose-300">✕</span>
              <span className="text-[11px] uppercase tracking-[0.28em] text-white/35">Skip These</span>
            </div>

            <div className="grid gap-3">
              {analysis.avoidTechniques.map((avoid) => (
                <div
                  key={avoid}
                  className="rounded-[1.3rem] border border-rose-500/14 bg-rose-500/[0.05] px-5 py-4"
                >
                  <p className="text-sm leading-relaxed text-rose-100/82">{avoid}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={onProceed}
          className="group inline-flex w-full items-center justify-center gap-3 rounded-full bg-rose-500 px-8 py-4 text-[15px] font-semibold text-white transition-all duration-200 hover:bg-rose-400 hover:shadow-[0_0_40px_rgba(244,63,94,0.25)]"
        >
          Continue With This Match
          <span className="transition-transform group-hover:translate-x-1">-&gt;</span>
        </button>
        <button
          onClick={onAdjustTone}
          className="inline-flex w-full items-center justify-center rounded-full border border-white/10 px-8 py-4 text-[15px] font-semibold text-white/72 transition-colors hover:border-white/18 hover:bg-white/[0.04]"
        >
          Choose My Own Tone
        </button>
      </div>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
  className = "",
  accent = "neutral",
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
  className?: string;
  accent?: "rose" | "amber" | "violet" | "neutral";
}) {
  const accents = {
    rose: "radial-gradient(circle at top right, rgba(244,63,94,0.12), transparent 58%)",
    amber: "radial-gradient(circle at top right, rgba(245,158,11,0.1), transparent 58%)",
    violet: "radial-gradient(circle at top right, rgba(168,85,247,0.1), transparent 58%)",
    neutral: "radial-gradient(circle at top right, rgba(255,255,255,0.05), transparent 58%)",
  } as const;

  return (
    <div className={`glass-card relative overflow-hidden rounded-[2rem] border border-white/8 p-6 md:p-7 ${className}`}>
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{ background: accents[accent] }}
      />
      <div className="relative mb-4 flex items-center gap-2.5">
        <span className="text-sm text-rose-300">{icon}</span>
        <span className="text-[11px] uppercase tracking-[0.28em] text-white/35">{title}</span>
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}

function Tag({ label, variant = "primary" }: { label: string; variant?: "primary" | "soft" }) {
  return (
    <span
      className={`inline-flex rounded-full px-4 py-1.5 text-[11px] font-semibold capitalize transition-colors ${
        variant === "primary"
          ? "border border-rose-500/25 bg-rose-500/10 text-rose-200"
          : "border border-white/10 bg-white/[0.04] text-white/62"
      }`}
    >
      {label}
    </span>
  );
}

function FeatureNote({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[1.35rem] border border-white/8 bg-white/[0.03] px-5 py-4">
      <p className="text-[10px] uppercase tracking-[0.22em] text-white/30">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-white/62">{body}</p>
    </div>
  );
}

function MiniGuidance({ workWith, avoid }: { workWith: string; avoid: string }) {
  return (
    <div className="mt-5 grid gap-3">
      <div className="rounded-[1.35rem] border border-emerald-500/18 bg-emerald-500/[0.06] px-5 py-4">
        <p className="text-[10px] uppercase tracking-[0.22em] text-emerald-300/85">Do</p>
        <p className="mt-2 text-sm leading-relaxed text-emerald-100/85">{workWith}</p>
      </div>
      <div className="rounded-[1.35rem] border border-rose-500/18 bg-rose-500/[0.06] px-5 py-4">
        <p className="text-[10px] uppercase tracking-[0.22em] text-rose-300/85">Don&apos;t</p>
        <p className="mt-2 text-sm leading-relaxed text-rose-100/85">{avoid}</p>
      </div>
    </div>
  );
}

function getTonePalette(
  skinTone: ResolvedFaceAnalysis["skinTone"],
  skinUndertone: ResolvedFaceAnalysis["skinUndertone"]
) {
  const paletteMap: Record<
    ResolvedFaceAnalysis["skinUndertone"],
    Array<{ name: string; color: string; note: string }>
  > = {
    warm: [
      { name: "Terracotta", color: "#B85F41", note: "warm lips / cheeks" },
      { name: "Soft Peach", color: "#E2A17F", note: "easy everyday blush" },
      { name: "Bronzed Gold", color: "#A77B36", note: "glow / shimmer" },
      { name: "Warm Brown", color: "#7A4F36", note: "eyes / contour" },
    ],
    neutral: [
      { name: "Muted Rose", color: "#B67882", note: "balanced cheeks" },
      { name: "Taupe Nude", color: "#9B7C72", note: "soft eyes / lips" },
      { name: "Champagne", color: "#C7AE8A", note: "highlight / lid" },
      { name: "Cocoa", color: "#6E4A3A", note: "definition" },
    ],
    cool: [
      { name: "Dusty Berry", color: "#9C5D74", note: "lips / cheeks" },
      { name: "Mauve Pink", color: "#B689A2", note: "soft glam tones" },
      { name: "Cool Taupe", color: "#8C7A80", note: "eyes / sculpt" },
      { name: "Icy Champagne", color: "#D4C6C1", note: "light reflect" },
    ],
  };

  const depthAccent: Record<ResolvedFaceAnalysis["skinTone"], string> = {
    fair: "lighter finish",
    light: "lighter finish",
    wheatish: "mid-tone friendly",
    medium: "mid-tone friendly",
    tan: "richer payoff",
    deep: "deeper payoff",
  };

  return paletteMap[skinUndertone].map((item) => ({
    ...item,
    note: `${item.note} · ${depthAccent[skinTone]}`,
  }));
}
