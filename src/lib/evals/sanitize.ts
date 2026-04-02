import type {
  AnalyzeFacePhoto,
  FaceAnalysis,
  FaceAnalysisResult,
} from "@/lib/medusa/analyze-face";
import type {
  EditorialSubtype,
  GenerateTutorialResult,
  LookId,
} from "@/lib/medusa/generate-tutorial";

export function summarizeAnalyzeFaceInput(photos: AnalyzeFacePhoto[]) {
  return {
    photoCount: photos.length,
    photos: photos.map((photo, index) => ({
      photoIndex: index + 1,
      mimeType: photo.mimeType,
      geometryProfile: photo.geometryProfile,
      precisionReport: photo.precisionReport,
    })),
  };
}

export function summarizeAnalyzeFaceOutput(result: FaceAnalysisResult) {
  return result;
}

export function summarizeTutorialInput(
  faceAnalysis: FaceAnalysis,
  selectedLook: LookId,
  selectedEditorialSubtype?: EditorialSubtype
) {
  return {
    selectedLook,
    selectedEditorialSubtype: selectedEditorialSubtype ?? null,
    faceAnalysis,
  };
}

export function summarizeTutorialOutput(result: GenerateTutorialResult) {
  return result;
}
