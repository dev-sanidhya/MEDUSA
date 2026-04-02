import type { FaceDetectionResult } from "@/lib/face-detector";

type PendingRequest = {
  resolve: (value: FaceDetectionResult | null) => void;
  reject: (reason?: unknown) => void;
};

type WorkerResultMessage = {
  id: number;
  type: "result";
  detection: FaceDetectionResult | null;
};

type WorkerErrorMessage = {
  id: number;
  type: "error";
  error: string;
};

type WorkerMessage = WorkerResultMessage | WorkerErrorMessage;

let workerInstance: Worker | null = null;
let nextRequestId = 1;
const pendingRequests = new Map<number, PendingRequest>();

function getWorker(): Worker {
  if (workerInstance) {
    return workerInstance;
  }

  workerInstance = new Worker(
    new URL("../workers/face-detection.worker.ts", import.meta.url),
    { type: "module" }
  );

  workerInstance.onmessage = (event: MessageEvent<WorkerMessage>) => {
    const message = event.data;
    const pending = pendingRequests.get(message.id);

    if (!pending) {
      return;
    }

    pendingRequests.delete(message.id);

    if (message.type === "result") {
      pending.resolve(message.detection);
      return;
    }

    pending.reject(new Error(message.error));
  };

  workerInstance.onerror = (event) => {
    for (const pending of pendingRequests.values()) {
      pending.reject(new Error(event.message || "Face detection worker crashed"));
    }
    pendingRequests.clear();
  };

  return workerInstance;
}

export function detectFaceLandmarksInWorker(file: File): Promise<FaceDetectionResult | null> {
  const worker = getWorker();
  const requestId = nextRequestId++;

  return new Promise<FaceDetectionResult | null>((resolve, reject) => {
    pendingRequests.set(requestId, { resolve, reject });
    worker.postMessage({
      id: requestId,
      type: "detect",
      file,
    });
  });
}
