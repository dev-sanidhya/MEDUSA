"use client";

/**
 * FaceZoneCanvas.tsx
 * Renders a 4:3 face crop centered on the face,
 * with the zone overlay drawn in the correct position.
 * Canvas is always compact — never taller than the container.
 */

import { useEffect, useRef } from "react";
import type { RawLandmark } from "@/lib/face-detector";
import { LANDMARK_INDICES } from "@/lib/face-detector";
import { paintZone, ZONE_META, type ZoneKey } from "@/lib/face-zone-painter";

interface Props {
  photoUrl: string;
  landmarks: RawLandmark[];
  imageWidth: number;
  imageHeight: number;
  zone: ZoneKey;
}

// Fixed internal canvas resolution — always 4:3
const CW = 800;
const CH = 600;

export function FaceZoneCanvas({ photoUrl, landmarks, imageWidth, imageHeight, zone }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const meta = ZONE_META[zone];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !landmarks.length) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width  = CW;
    canvas.height = CH;

    const img = new Image();
    img.onload = () => {
      // ── 1. Face centroid from face oval ───────────────────────────────────
      const oval = LANDMARK_INDICES.faceOval;
      const xs = oval.map(i => landmarks[i].x * imageWidth);
      const ys = oval.map(i => landmarks[i].y * imageHeight);
      const faceMinX = Math.min(...xs), faceMaxX = Math.max(...xs);
      const faceMinY = Math.min(...ys), faceMaxY = Math.max(...ys);
      const faceW    = faceMaxX - faceMinX;
      const faceH    = faceMaxY - faceMinY;
      const faceCX   = (faceMinX + faceMaxX) / 2;
      const faceCY   = (faceMinY + faceMaxY) / 2;

      // ── 2. Build a 4:3 source crop centered on the face ───────────────────
      // Make the face fill ~70% of the crop width — enough padding to see context
      const srcW = faceW * 1.55;
      const srcH = srcW * (CH / CW);   // keep 4:3

      // Bias face center slightly above canvas center (foreheads read better)
      let srcX = faceCX - srcW / 2;
      let srcY = faceCY - srcH * 0.48;

      // Clamp to image bounds
      srcX = Math.max(0, Math.min(srcX, imageWidth  - srcW));
      srcY = Math.max(0, Math.min(srcY, imageHeight - srcH));
      // If srcW/srcH exceed image dimensions, clamp and scale
      const finalW = Math.min(srcW, imageWidth);
      const finalH = Math.min(srcH, imageHeight);

      // ── 3. Draw cropped image onto fixed 4:3 canvas ───────────────────────
      ctx.drawImage(img, srcX, srcY, finalW, finalH, 0, 0, CW, CH);

      // ── 4. Subtle vignette ────────────────────────────────────────────────
      const vig = ctx.createRadialGradient(CW/2, CH/2, CW*0.25, CW/2, CH/2, CW*0.65);
      vig.addColorStop(0, "rgba(0,0,0,0)");
      vig.addColorStop(1, "rgba(0,0,0,0.28)");
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, CW, CH);

      // ── 5. Re-map landmarks to canvas space ───────────────────────────────
      const scaleX = CW / finalW;
      const scaleY = CH / finalH;

      const mapped: RawLandmark[] = landmarks.map(lm => ({
        ...lm,
        x: ((lm.x * imageWidth  - srcX) * scaleX) / CW,
        y: ((lm.y * imageHeight - srcY) * scaleY) / CH,
      }));

      // ── 6. Paint zone overlay ─────────────────────────────────────────────
      paintZone(ctx, mapped, zone, CW, CH);
    };
    img.src = photoUrl;
  }, [photoUrl, landmarks, zone, imageWidth, imageHeight]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-stone-900">
      {/* 4:3 — canvas intrinsic size handles aspect ratio correctly */}
      <canvas
        ref={canvasRef}
        style={{ display: "block", width: "100%", height: "auto" }}
      />

      {/* Zone badge */}
      <div
        className="absolute top-3 left-3 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm text-white"
        style={{ background: "rgba(0,0,0,0.6)", border: `1px solid ${meta.accent}70` }}
      >
        <span style={{ color: meta.accent }}>●</span>
        <span className="ml-1.5">{meta.label}</span>
      </div>
    </div>
  );
}
