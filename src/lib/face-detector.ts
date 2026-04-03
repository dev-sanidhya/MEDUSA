/**
 * face-detector.ts
 * Client-side MediaPipe Face Landmarker wrapper.
 * Extracts 478 landmarks with visibility scores from a photo.
 * Runs entirely in the browser — no server, no cost.
 */

import {
  FaceLandmarker,
  FilesetResolver,
  type FaceLandmarkerResult,
  type NormalizedLandmark,
} from "@mediapipe/tasks-vision";

export type { NormalizedLandmark };

export interface RawLandmark {
  x: number;        // normalized 0–1 (multiply by image width for pixels)
  y: number;        // normalized 0–1 (multiply by image height for pixels)
  z: number;        // depth (relative, smaller = closer to camera)
  visibility?: number; // 0–1 confidence that landmark is visible
}

export interface FaceDetectionResult {
  landmarks: RawLandmark[];            // 478 landmarks
  blendShapes: Record<string, number>; // 52 blend shape scores (expression data)
  facialTransformationMatrix: number[] | null; // 4x4 pose matrix — gives us yaw/pitch/roll
  faceCount: number;
  imageWidth: number;
  imageHeight: number;
}

let landmarker: FaceLandmarker | null = null;
let isInitializing = false;
const MEDIAPIPE_TASKS_VISION_VERSION = "0.10.34";
const SUPPRESSED_TFLITE_LOGS = [
  "Created TensorFlow Lite XNNPACK delegate for CPU.",
];

function isSuppressedTfliteLog(value: unknown): boolean {
  return typeof value === "string" &&
    SUPPRESSED_TFLITE_LOGS.some((message) => value.includes(message));
}

async function withSuppressedTfliteLogs<T>(run: () => Promise<T> | T): Promise<T> {
  const originalConsoleError = console.error;

  console.error = (...args: unknown[]) => {
    if (args.some(isSuppressedTfliteLog)) {
      return;
    }

    originalConsoleError(...args);
  };

  try {
    return await run();
  } finally {
    console.error = originalConsoleError;
  }
}

/**
 * Lazily initializes MediaPipe Face Landmarker.
 * Uses CDN-hosted WASM so no bundler config needed.
 */
async function getLandmarker(): Promise<FaceLandmarker> {
  if (landmarker) return landmarker;
  if (isInitializing) {
    // Wait for ongoing initialization
    await new Promise<void>((resolve) => {
      const check = setInterval(() => {
        if (!isInitializing) { clearInterval(check); resolve(); }
      }, 100);
    });
    return landmarker!;
  }

  isInitializing = true;
  try {
    landmarker = await withSuppressedTfliteLogs(async () => {
      const vision = await FilesetResolver.forVisionTasks(
        `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_TASKS_VISION_VERSION}/wasm`
      );

      return FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          delegate: "CPU",
        },
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: true,
        runningMode: "IMAGE",
        numFaces: 2,
      });
    });
  } finally {
    isInitializing = false;
  }

  return landmarker!;
}

/**
 * Main entry point. Takes an HTMLImageElement or ImageBitmap,
 * runs Face Landmarker, returns structured result.
 */
export async function detectFaceLandmarks(
  imageEl: HTMLImageElement | ImageBitmap
): Promise<FaceDetectionResult | null> {
  const lm = await getLandmarker();
  const result: FaceLandmarkerResult = await withSuppressedTfliteLogs(() =>
    lm.detect(imageEl)
  );

  if (!result.faceLandmarks || result.faceLandmarks.length === 0) {
    return null; // No face detected
  }

  const rawLandmarks = result.faceLandmarks[0] as RawLandmark[];

  // Extract blend shapes into a flat map
  const blendShapes: Record<string, number> = {};
  if (result.faceBlendshapes && result.faceBlendshapes.length > 0) {
    for (const cat of result.faceBlendshapes[0].categories) {
      blendShapes[cat.categoryName] = cat.score;
    }
  }

  // Facial transformation matrix (4x4 flat array)
  const matrix =
    result.facialTransformationMatrixes &&
    result.facialTransformationMatrixes.length > 0
      ? Array.from(result.facialTransformationMatrixes[0].data)
      : null;

  const isDomImage =
    typeof HTMLImageElement !== "undefined" &&
    imageEl instanceof HTMLImageElement;

  const width = isDomImage ? imageEl.naturalWidth : imageEl.width;
  const height = isDomImage ? imageEl.naturalHeight : imageEl.height;

  return {
    landmarks: rawLandmarks,
    blendShapes,
    facialTransformationMatrix: matrix,
    faceCount: result.faceLandmarks.length,
    imageWidth: width,
    imageHeight: height,
  };
}

/**
 * Extracts Euler angles (degrees) from the 4x4 transformation matrix.
 * yaw   = left/right head rotation (0 = straight)
 * pitch = up/down head tilt (0 = straight)
 * roll  = head tilt left/right (0 = straight)
 */
export function extractHeadPose(matrix: number[]): {
  yaw: number;
  pitch: number;
  roll: number;
} {
  // Column-major 4x4 matrix from MediaPipe
  const m = matrix;
  const pitch = Math.atan2(-m[6], Math.sqrt(m[2] * m[2] + m[10] * m[10]));
  const yaw = Math.atan2(m[2], m[10]);
  const roll = Math.atan2(m[4], m[5]);

  return {
    yaw: (yaw * 180) / Math.PI,
    pitch: (pitch * 180) / Math.PI,
    roll: (roll * 180) / Math.PI,
  };
}

/**
 * Loads an image file (File object) into an HTMLImageElement.
 */
export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Key MediaPipe Face Landmarker landmark indices for each facial feature.
 * Reference: https://developers.google.com/mediapipe/solutions/vision/face_landmarker
 */
export const LANDMARK_INDICES = {
  // Face oval / silhouette
  faceOval: [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109],

  // Lips outer
  lipsOuter: [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 375, 321, 405, 314, 17, 84, 181, 91, 146],
  // Lips inner
  lipsInner: [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95],

  // Left eye (from user's perspective)
  leftEyeUpper: [246, 161, 160, 159, 158, 157, 173],
  leftEyeLower: [33, 7, 163, 144, 145, 153, 154, 155, 133],
  leftEyeInnerCorner: [133],
  leftEyeOuterCorner: [33],
  leftIris: [468, 469, 470, 471, 472],

  // Right eye
  rightEyeUpper: [466, 388, 387, 386, 385, 384, 398],
  rightEyeLower: [263, 249, 390, 373, 374, 380, 381, 382, 362],
  rightEyeInnerCorner: [362],
  rightEyeOuterCorner: [263],
  rightIris: [473, 474, 475, 476, 477],

  // Eyebrows
  leftEyebrow: [276, 283, 282, 295, 285, 300, 293, 334, 296, 336],
  rightEyebrow: [46, 53, 52, 65, 55, 70, 63, 105, 66, 107],

  // Nose
  noseTip: [1],
  noseBottom: [2],
  noseLeftWing: [219],
  noseRightWing: [439],
  noseBridgeTop: [6],
  noseBridgeMid: [197],

  // Key face structure points
  leftCheekbone: [116],
  rightCheekbone: [345],
  leftJaw: [172],
  rightJaw: [397],
  chinBottom: [152],
  foreheadTop: [10],
  leftTemple: [234],
  rightTemple: [454],
} as const;
