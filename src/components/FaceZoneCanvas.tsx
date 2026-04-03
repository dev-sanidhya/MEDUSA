"use client";

import { useEffect, useRef, useState } from "react";
import type { RawLandmark } from "@/lib/face-detector";
import { LANDMARK_INDICES } from "@/lib/face-detector";
import { paintZone, getMotionGuides, ZONE_META, type ZoneKey, type MotionArrow } from "@/lib/face-zone-painter";

interface Props {
  photoUrl: string;
  landmarks: RawLandmark[];
  imageWidth: number;
  imageHeight: number;
  zone: ZoneKey;
  showMotionGuides?: boolean;
  showBadge?: boolean;
}

const CW = 600;
const CH = 800;

export function FaceZoneCanvas({
  photoUrl,
  landmarks,
  imageWidth,
  imageHeight,
  zone,
  showMotionGuides = true,
  showBadge = true,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [motionGuides, setMotionGuides] = useState<MotionArrow[]>([]);
  const meta = ZONE_META[zone];
  const useDefaultGuideStyle = zone === "brows" || zone === "eye_lid" || zone === "lash_line";
  const guideStroke = useDefaultGuideStyle ? "rgba(255,255,255,0.85)" : "rgba(120,205,255,0.95)";
  const guideDot = useDefaultGuideStyle ? "rgba(255,245,180,0.9)" : "rgba(120,205,255,0.95)";
  const guideLabel = useDefaultGuideStyle ? "rgba(255,255,255,0.75)" : "rgba(185,230,255,0.95)";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !landmarks.length) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width  = CW;
    canvas.height = CH;

    const img = new Image();
    img.onload = () => {
      // ── Face bbox ─────────────────────────────────────────────────────────
      const oval = LANDMARK_INDICES.faceOval;
      const fxs = oval.map(i => landmarks[i].x * imageWidth);
      const fys = oval.map(i => landmarks[i].y * imageHeight);
      const fMinX = Math.min(...fxs), fMaxX = Math.max(...fxs);
      const fMinY = Math.min(...fys), fMaxY = Math.max(...fys);
      const fW = fMaxX - fMinX;
      const fCX = (fMinX + fMaxX) / 2, fCY = (fMinY + fMaxY) / 2;

      // ── 3:4 portrait crop centred on face ─────────────────────────────────
      const srcW = fW * 1.45;
      const srcH = srcW * (CH / CW);
      let srcX = fCX - srcW / 2;
      let srcY = fCY - srcH * 0.46;
      srcX = Math.max(0, Math.min(srcX, imageWidth  - srcW));
      srcY = Math.max(0, Math.min(srcY, imageHeight - srcH));
      const finalW = Math.min(srcW, imageWidth  - srcX);
      const finalH = Math.min(srcH, imageHeight - srcY);

      // ── Draw image ────────────────────────────────────────────────────────
      ctx.drawImage(img, srcX, srcY, finalW, finalH, 0, 0, CW, CH);

      // Vignette
      const vig = ctx.createRadialGradient(CW/2, CH/2, Math.min(CW,CH)*0.28, CW/2, CH/2, Math.min(CW,CH)*0.72);
      vig.addColorStop(0, "rgba(0,0,0,0)");
      vig.addColorStop(1, "rgba(0,0,0,0.3)");
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, CW, CH);

      // ── Re-map landmarks to canvas space ──────────────────────────────────
      const scaleX = CW / finalW;
      const scaleY = CH / finalH;
      const mapped: RawLandmark[] = landmarks.map(lm => ({
        ...lm,
        x: ((lm.x * imageWidth  - srcX) * scaleX) / CW,
        y: ((lm.y * imageHeight - srcY) * scaleY) / CH,
      }));

      // ── Paint zone overlay ────────────────────────────────────────────────
      paintZone(ctx, mapped, zone, CW, CH);

      // ── Compute motion guides ─────────────────────────────────────────────
      setMotionGuides(getMotionGuides(mapped, zone, CW, CH));
    };
    img.src = photoUrl;
  }, [photoUrl, landmarks, zone, imageWidth, imageHeight]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden bg-stone-900">
      <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }} />

      {/* ── Animated motion guide SVG ──────────────────────────── */}
      {showMotionGuides && motionGuides.length > 0 && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <defs>
            <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill={guideStroke} />
            </marker>
            <filter id="glow">
              <feGaussianBlur stdDeviation="0.5" result="blur" />
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          {motionGuides.map((g, i) => {
            const isDot = g.dx === 0 && g.dy === 0;
            const x1 = g.x * 100;
            const y1 = g.y * 100;
            const len = Math.sqrt(g.dx * g.dx + g.dy * g.dy);
            const nx = len > 0 ? g.dx / len : 0;
            const ny = len > 0 ? g.dy / len : 0;
            const x2 = x1 + nx * 8;
            const y2 = y1 + ny * 8;

            return (
              <g key={i} filter="url(#glow)">
                {isDot ? (
                  // Pulsing dot for "tap here" zones (highlighter)
                  <circle cx={x1} cy={y1} r="1.8" fill={guideDot}>
                    <animate attributeName="r" values="1.2;2.8;1.2" dur="1.4s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.9;0.4;0.9" dur="1.4s" repeatCount="indefinite" />
                  </circle>
                ) : (
                  // Animated stroke arrow
                  <line
                    x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke={guideStroke}
                    strokeWidth="0.8"
                    strokeLinecap="round"
                    markerEnd="url(#arrowhead)"
                    strokeDasharray="10"
                    strokeDashoffset="10"
                  >
                    <animate
                      attributeName="strokeDashoffset"
                      values="10;0;10"
                      dur={`${1.2 + i * 0.15}s`}
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.2;1;0.2"
                      dur={`${1.2 + i * 0.15}s`}
                      repeatCount="indefinite"
                    />
                  </line>
                )}
              </g>
            );
          })}

          {/* Label for first guide */}
          {motionGuides[0]?.label && (
            <text
              x={motionGuides[0].x * 100}
              y={Math.min(97, motionGuides[0].y * 100 + 14)}
              textAnchor="middle"
              fill={guideLabel}
              fontSize="3.2"
              fontFamily="system-ui, sans-serif"
              letterSpacing="0.3"
            >
              {motionGuides[0].label.toUpperCase()}
            </text>
          )}
        </svg>
      )}

      {/* Zone badge */}
      {showBadge && (
        <div
          className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm text-white"
          style={{ background: "rgba(0,0,0,0.6)", border: `1px solid ${meta.accent}70`, fontSize: "11px" }}
        >
          <span style={{ color: meta.accent }}>●</span>
          <span className="ml-1">{meta.label}</span>
        </div>
      )}
    </div>
  );
}
