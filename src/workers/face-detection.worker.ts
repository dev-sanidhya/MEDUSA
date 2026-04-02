import { detectFaceLandmarks, type FaceDetectionResult } from "@/lib/face-detector";

type DetectRequestMessage = {
  id: number;
  type: "detect";
  file: File;
};

type DetectResponseMessage =
  | {
      id: number;
      type: "result";
      detection: FaceDetectionResult | null;
    }
  | {
      id: number;
      type: "error";
      error: string;
    };

self.onmessage = async (event: MessageEvent<DetectRequestMessage>) => {
  const { id, type, file } = event.data;

  if (type !== "detect") {
    return;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const detection = await detectFaceLandmarks(bitmap);
    bitmap.close();

    const message: DetectResponseMessage = {
      id,
      type: "result",
      detection,
    };
    self.postMessage(message);
  } catch (error) {
    const message: DetectResponseMessage = {
      id,
      type: "error",
      error: error instanceof Error ? error.message : "Face detection failed",
    };
    self.postMessage(message);
  }
};

export {};
