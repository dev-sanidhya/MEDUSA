"use client";

/**
 * PhotoCapture.tsx
 * Handles photo upload, runs MediaPipe on the client via a worker,
 * overlays detected landmarks on the photo,
 * and shows precision feedback to the user.
 */

import { useRef, useState, useCallback } from "react";
import Image from "next/image";
import {
  LANDMARK_INDICES,
  type RawLandmark,
} from "@/lib/face-detector";
import { detectFaceLandmarksInWorker } from "@/lib/face-detection-worker";
import { calculateFaceProfile } from "@/lib/geometry-calculator";
import { scorePrecision, type PrecisionReport } from "@/lib/precision-scorer";
import type { FaceProfile } from "@/lib/geometry-calculator";

export interface CapturedPhoto {
  file: File;
  base64: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  geometryProfile: FaceProfile;
  precisionReport: PrecisionReport;
  previewUrl: string;
  cleanPhotoUrl: string;
  landmarks: RawLandmark[];
  imageWidth: number;
  imageHeight: number;
}

interface PhotoCaptureProps {
  photoNumber: number;
  onPhotoCaptured: (photo: CapturedPhoto) => void;
  instruction?: string;
  disabled?: boolean;
}

export function PhotoCapture({
  photoNumber,
  onPhotoCaptured,
  instruction,
  disabled,
}: PhotoCaptureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [precisionScore, setPrecisionScore] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (JPG, PNG, or WebP).");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setPreviewUrl(null);
    setPrecisionScore(null);

    try {
      const detection = await detectFaceLandmarksInWorker(file);

      if (!detection) {
        setError(
          "I couldn't detect a face in this photo. Please make sure your face is fully visible and well-lit."
        );
        setIsProcessing(false);
        return;
      }

      const profile = calculateFaceProfile(
        detection.landmarks,
        detection.imageWidth,
        detection.imageHeight
      );

      const precision = scorePrecision(detection);
      setPrecisionScore(precision.overallScore);

      const bitmap = await createImageBitmap(file);
      const canvas = canvasRef.current!;
      canvas.width = detection.imageWidth;
      canvas.height = detection.imageHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(bitmap, 0, 0);

      const cleanPhotoUrl = canvas.toDataURL("image/jpeg", 0.92);

      bitmap.close();
      drawLandmarkOverlay(ctx, detection.landmarks, detection.imageWidth, detection.imageHeight, precision);

      const preview = canvas.toDataURL("image/jpeg", 0.92);
      setPreviewUrl(preview);

      const base64 = await fileToBase64(file);
      const mimeType = (
        file.type === "image/png" ? "image/png" :
        file.type === "image/webp" ? "image/webp" : "image/jpeg"
      ) as CapturedPhoto["mimeType"];

      onPhotoCaptured({
        file,
        base64,
        mimeType,
        geometryProfile: profile,
        precisionReport: precision,
        previewUrl: preview,
        cleanPhotoUrl,
        landmarks: detection.landmarks,
        imageWidth: detection.imageWidth,
        imageHeight: detection.imageHeight,
      });
    } catch (err) {
      console.error(err);
      setError("Something went wrong processing your photo. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [onPhotoCaptured]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div className="w-full">
      <canvas ref={canvasRef} className="hidden" />

      {instruction && (
        <div className="mb-5 rounded-[1.4rem] border border-rose-500/20 bg-rose-500/8 px-5 py-4 text-sm text-white/72 leading-relaxed backdrop-blur-sm">
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.22em] text-rose-300">
            {photoNumber === 1 ? "For your first photo:" : `Photo ${photoNumber} - what to change:`}
          </span>
          {instruction}
        </div>
      )}

      {!previewUrl && (
        <div
          className={`relative overflow-hidden rounded-[2rem] border border-dashed transition-all cursor-pointer
            ${isDragging ? "border-rose-400 bg-[rgba(244,63,94,0.08)]" : "border-white/12 bg-[rgba(13,13,20,0.72)] hover:border-rose-400/45 hover:bg-[rgba(244,63,94,0.04)]"}
            ${disabled ? "opacity-50 pointer-events-none" : ""}
          `}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: "radial-gradient(circle at top, rgba(244,63,94,0.1), transparent 58%)" }}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
            disabled={disabled}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="user"
            className="hidden"
            onChange={handleFileChange}
            disabled={disabled}
          />

          <div className="relative flex flex-col items-center justify-center px-6 py-16 text-center">
            {isProcessing ? (
              <>
                <div className="mb-5 h-14 w-14 rounded-full border border-rose-400/25 border-t-rose-400 animate-spin" />
                <p className="font-medium text-white">Reading your photo...</p>
                <p className="mt-1 text-sm text-white/45">Mapping your features</p>
              </>
            ) : (
              <>
                <div className="mb-5 flex h-18 w-18 items-center justify-center rounded-full border border-rose-500/20 bg-rose-500/10">
                  <svg className="h-8 w-8 text-rose-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
                  </svg>
                </div>
                <p className="text-lg font-semibold text-white">
                  {photoNumber === 1 ? "Upload your photo" : `Upload photo ${photoNumber}`}
                </p>
                <p className="mt-1 text-sm text-white/45">
                  Take a live selfie or upload one you already have
                </p>
                <div className="mt-6 flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      cameraInputRef.current?.click();
                    }}
                    className="inline-flex items-center justify-center rounded-full bg-rose-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-rose-400"
                  >
                    Take Live Photo
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="inline-flex items-center justify-center rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-white/75 transition-colors hover:border-white/18 hover:bg-white/[0.04]"
                  >
                    Upload From Device
                  </button>
                </div>
                <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-white/35">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                  Best with a clear, straight-on photo
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {previewUrl && (
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-black shadow-[0_14px_40px_rgba(0,0,0,0.45)]">
          <Image
            src={previewUrl}
            alt="Your photo with face mapping"
            width={900}
            height={1200}
            unoptimized
            className="w-full"
          />

          {precisionScore !== null && (
            <div className={`absolute right-3 top-3 rounded-full px-3 py-1.5 text-xs font-semibold backdrop-blur-sm
              ${precisionScore >= 78
                ? "bg-emerald-500/80 text-white"
                : precisionScore >= 55
                ? "bg-amber-500/80 text-stone-950"
                : "bg-rose-500/85 text-white"
              }`}>
              {precisionScore >= 78 ? "High Precision" : precisionScore >= 55 ? "Medium Precision" : "Low Precision"}
              {" "}{precisionScore}/100
            </div>
          )}

          <button
            onClick={() => { setPreviewUrl(null); setPrecisionScore(null); }}
            className="absolute bottom-3 right-3 rounded-full border border-white/12 bg-black/55 px-3 py-1.5 text-xs text-white/85 backdrop-blur-sm transition-colors hover:bg-black/75"
          >
            Retake
          </button>
        </div>
      )}

      {error && (
        <div className="mt-3 rounded-2xl border border-rose-500/18 bg-rose-500/8 p-3 text-sm text-rose-200">
          {error}
        </div>
      )}
    </div>
  );
}

function drawLandmarkOverlay(
  ctx: CanvasRenderingContext2D,
  landmarks: RawLandmark[],
  w: number,
  h: number,
  precision: PrecisionReport
) {
  const px = (idx: number): [number, number] => [
    landmarks[idx].x * w,
    landmarks[idx].y * h,
  ];

  const color = precision.overallScore >= 78
    ? "rgba(134, 239, 172, 0.9)"
    : precision.overallScore >= 55
    ? "rgba(253, 224, 71, 0.9)"
    : "rgba(252, 165, 165, 0.9)";

  ctx.lineWidth = 1;
  ctx.strokeStyle = color;

  drawPolyline(ctx, LANDMARK_INDICES.faceOval.map(i => px(i)), true, color, 1.5);
  drawPolyline(ctx, LANDMARK_INDICES.leftEyeUpper.map(i => px(i)), false, color, 1);
  drawPolyline(ctx, LANDMARK_INDICES.leftEyeLower.map(i => px(i)), false, color, 1);
  drawPolyline(ctx, LANDMARK_INDICES.rightEyeUpper.map(i => px(i)), false, color, 1);
  drawPolyline(ctx, LANDMARK_INDICES.rightEyeLower.map(i => px(i)), false, color, 1);
  drawPolyline(ctx, LANDMARK_INDICES.lipsOuter.map(i => px(i)), true, color, 1.2);
  drawPolyline(ctx, LANDMARK_INDICES.lipsInner.map(i => px(i)), true, "rgba(255,255,255,0.5)", 0.8);
  drawPolyline(ctx, LANDMARK_INDICES.leftEyebrow.map(i => px(i)), false, color, 1);
  drawPolyline(ctx, LANDMARK_INDICES.rightEyebrow.map(i => px(i)), false, color, 1);

  drawPolyline(ctx, [
    px(LANDMARK_INDICES.noseBridgeTop[0]),
    px(LANDMARK_INDICES.noseBridgeMid[0]),
    px(LANDMARK_INDICES.noseTip[0]),
    px(LANDMARK_INDICES.noseLeftWing[0]),
    px(LANDMARK_INDICES.noseRightWing[0]),
    px(LANDMARK_INDICES.noseTip[0]),
  ], false, color, 1);

  const keyPoints = [
    LANDMARK_INDICES.foreheadTop[0],
    LANDMARK_INDICES.chinBottom[0],
    LANDMARK_INDICES.leftCheekbone[0],
    LANDMARK_INDICES.rightCheekbone[0],
    LANDMARK_INDICES.leftTemple[0],
    LANDMARK_INDICES.rightTemple[0],
    LANDMARK_INDICES.noseTip[0],
  ];

  for (const idx of keyPoints) {
    const [x, y] = px(idx);
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }
}

function drawPolyline(
  ctx: CanvasRenderingContext2D,
  points: [number, number][],
  closed: boolean,
  color: string,
  lineWidth: number
) {
  if (points.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i][0], points[i][1]);
  }
  if (closed) ctx.closePath();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
