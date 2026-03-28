"use client";

/**
 * PhotoCapture.tsx
 * Handles photo upload, runs MediaPipe on the client,
 * overlays detected landmarks on the photo,
 * and shows precision feedback to the user.
 */

import { useRef, useState, useCallback } from "react";
import {
  detectFaceLandmarks,
  LANDMARK_INDICES,
  type RawLandmark,
} from "@/lib/face-detector";
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
  cleanPhotoUrl: string;      // face photo without landmark overlay — used for zone canvas
  landmarks: RawLandmark[];
  imageWidth: number;
  imageHeight: number;
}

interface PhotoCaptureProps {
  photoNumber: number;          // 1, 2, or 3
  onPhotoCaptured: (photo: CapturedPhoto) => void;
  instruction?: string;         // guidance from agent for this specific photo
  disabled?: boolean;
}

export function PhotoCapture({
  photoNumber,
  onPhotoCaptured,
  instruction,
  disabled,
}: PhotoCaptureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
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
      // Decode image into an in-memory bitmap — no URL dependency, works reliably with MediaPipe
      const bitmap = await createImageBitmap(file);

      // Run MediaPipe
      const detection = await detectFaceLandmarks(bitmap);

      if (!detection) {
        bitmap.close();
        setError(
          "I couldn't detect a face in this photo. Please make sure your face is fully visible and well-lit."
        );
        setIsProcessing(false);
        return;
      }

      // Calculate geometry
      const profile = calculateFaceProfile(
        detection.landmarks,
        detection.imageWidth,
        detection.imageHeight
      );

      // Score precision
      const precision = scorePrecision(detection);
      setPrecisionScore(precision.overallScore);

      // Draw preview with landmark overlay
      const canvas = canvasRef.current!;
      canvas.width = detection.imageWidth;
      canvas.height = detection.imageHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(bitmap, 0, 0);

      // Capture clean photo before drawing overlays
      const cleanPhotoUrl = canvas.toDataURL("image/jpeg", 0.92);

      bitmap.close();
      drawLandmarkOverlay(ctx, detection.landmarks, detection.imageWidth, detection.imageHeight, precision);

      const preview = canvas.toDataURL("image/jpeg", 0.92);
      setPreviewUrl(preview);

      // Convert original file to base64 for API
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
      {/* Hidden canvas for landmark rendering */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Instruction from agent */}
      {instruction && (
        <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-900 leading-relaxed">
          <span className="font-semibold block mb-1">
            {photoNumber === 1 ? "For your first photo:" : `Photo ${photoNumber} — what I need:`}
          </span>
          {instruction}
        </div>
      )}

      {/* Drop zone / upload area */}
      {!previewUrl && (
        <div
          className={`relative border-2 border-dashed rounded-2xl transition-all cursor-pointer
            ${isDragging ? "border-rose-400 bg-rose-50" : "border-stone-300 bg-stone-50 hover:border-rose-300 hover:bg-rose-50/50"}
            ${disabled ? "opacity-50 pointer-events-none" : ""}
          `}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
            disabled={disabled}
          />

          <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
            {isProcessing ? (
              <>
                <div className="w-12 h-12 border-3 border-rose-300 border-t-rose-600 rounded-full animate-spin mb-4" />
                <p className="text-stone-600 font-medium">Analyzing your face...</p>
                <p className="text-stone-400 text-sm mt-1">Running 478-point facial mapping</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
                  </svg>
                </div>
                <p className="text-stone-700 font-semibold text-lg">
                  {photoNumber === 1 ? "Upload your selfie" : `Upload photo ${photoNumber}`}
                </p>
                <p className="text-stone-400 text-sm mt-1">
                  JPG, PNG, or WebP · Drop here or click to browse
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Preview with landmark overlay */}
      {previewUrl && (
        <div className="relative rounded-2xl overflow-hidden bg-black">
          <img src={previewUrl} alt="Your photo with face mapping" className="w-full" />

          {/* Precision badge */}
          {precisionScore !== null && (
            <div className={`absolute top-3 right-3 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm
              ${precisionScore >= 78
                ? "bg-green-500/80 text-white"
                : precisionScore >= 55
                ? "bg-amber-500/80 text-white"
                : "bg-red-500/80 text-white"
              }`}>
              {precisionScore >= 78 ? "✓ High Precision" : precisionScore >= 55 ? "⚠ Medium Precision" : "✗ Low Precision"}
              {" "}{precisionScore}/100
            </div>
          )}

          {/* Retake button */}
          <button
            onClick={() => { setPreviewUrl(null); setPrecisionScore(null); }}
            className="absolute bottom-3 right-3 px-3 py-1.5 bg-black/60 hover:bg-black/80 text-white text-xs rounded-full backdrop-blur-sm transition-colors"
          >
            Retake
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}

// ─── Landmark overlay drawing ─────────────────────────────────────────────────

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

  // Color based on precision
  const color = precision.overallScore >= 78
    ? "rgba(134, 239, 172, 0.9)"   // green
    : precision.overallScore >= 55
    ? "rgba(253, 224, 71, 0.9)"    // yellow
    : "rgba(252, 165, 165, 0.9)";  // red

  ctx.lineWidth = 1;
  ctx.strokeStyle = color;

  // Draw face oval
  drawPolyline(ctx, LANDMARK_INDICES.faceOval.map(i => px(i)), true, color, 1.5);

  // Draw eyes
  drawPolyline(ctx, LANDMARK_INDICES.leftEyeUpper.map(i => px(i)), false, color, 1);
  drawPolyline(ctx, LANDMARK_INDICES.leftEyeLower.map(i => px(i)), false, color, 1);
  drawPolyline(ctx, LANDMARK_INDICES.rightEyeUpper.map(i => px(i)), false, color, 1);
  drawPolyline(ctx, LANDMARK_INDICES.rightEyeLower.map(i => px(i)), false, color, 1);

  // Draw lips
  drawPolyline(ctx, LANDMARK_INDICES.lipsOuter.map(i => px(i)), true, color, 1.2);
  drawPolyline(ctx, LANDMARK_INDICES.lipsInner.map(i => px(i)), true, "rgba(255,255,255,0.5)", 0.8);

  // Draw eyebrows
  drawPolyline(ctx, LANDMARK_INDICES.leftEyebrow.map(i => px(i)), false, color, 1);
  drawPolyline(ctx, LANDMARK_INDICES.rightEyebrow.map(i => px(i)), false, color, 1);

  // Nose
  drawPolyline(ctx, [
    px(LANDMARK_INDICES.noseBridgeTop[0]),
    px(LANDMARK_INDICES.noseBridgeMid[0]),
    px(LANDMARK_INDICES.noseTip[0]),
    px(LANDMARK_INDICES.noseLeftWing[0]),
    px(LANDMARK_INDICES.noseRightWing[0]),
    px(LANDMARK_INDICES.noseTip[0]),
  ], false, color, 1);

  // Key landmark dots
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data URI prefix
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
