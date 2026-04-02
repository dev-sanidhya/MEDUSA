import { NextRequest, NextResponse } from "next/server";
import {
  generateTutorial,
  type GenerateTutorialRequest,
} from "@/lib/medusa/generate-tutorial";
import { attachProfileCookie, resolveProfileId } from "@/lib/persistence/profile-cookie";
import {
  ensureAnonymousProfile,
  getAnalysisRunFaceAnalysis,
  getPersonalizationProfile,
  persistTutorialRun,
} from "@/lib/persistence/store";
import type { FaceAnalysis } from "@/lib/medusa/analyze-face";

export const runtime = "nodejs";

export type {
  GenerateTutorialRequest,
  GenerateTutorialResult,
  EditorialSubtype,
  LookId,
  PersonalizationProfile,
  TutorialStep,
  ZoneKey,
} from "@/lib/medusa/generate-tutorial";

export async function POST(req: NextRequest) {
  try {
    const body: GenerateTutorialRequest = await req.json();

    if (!body.selectedLook) {
      return NextResponse.json({ error: "selectedLook is required" }, { status: 400 });
    }

    const { profileId, shouldSetCookie } = resolveProfileId(req);
    await ensureAnonymousProfile(profileId);

    let resolvedFaceAnalysis: FaceAnalysis | null = null;

    if (body.analysisRunId) {
      resolvedFaceAnalysis = await getAnalysisRunFaceAnalysis(profileId, body.analysisRunId);

      if (!resolvedFaceAnalysis) {
        return NextResponse.json(
          { error: "analysisRunId was not found for this profile or is not complete" },
          { status: 404 }
        );
      }
    }

    if (!resolvedFaceAnalysis && body.faceAnalysis) {
      resolvedFaceAnalysis = body.faceAnalysis;
    }

    if (!resolvedFaceAnalysis) {
      return NextResponse.json(
        { error: "faceAnalysis or analysisRunId is required" },
        { status: 400 }
      );
    }

    if (body.faceAnalysis && body.analysisRunId) {
      resolvedFaceAnalysis = applyFaceAnalysisOverrides(resolvedFaceAnalysis, body.faceAnalysis);
    }

    const preferenceProfile = await getPersonalizationProfile(profileId);
    const result = await generateTutorial(
      resolvedFaceAnalysis,
      body.selectedLook,
      body.selectedEditorialSubtype,
      preferenceProfile
    );

    const persistedRun = await persistTutorialRun({
      profileId,
      analysisRunId: body.analysisRunId,
      faceAnalysis: resolvedFaceAnalysis,
      selectedLook: body.selectedLook,
      selectedEditorialSubtype: body.selectedEditorialSubtype,
      tutorial: result,
    });

    const response = NextResponse.json({
      ...result,
      tutorialRunId: persistedRun?.id ?? null,
    });

    if (shouldSetCookie) {
      attachProfileCookie(response, profileId);
    }

    return response;
  } catch (err) {
    console.error("[generate-tutorial]", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function applyFaceAnalysisOverrides(
  persisted: FaceAnalysis,
  incoming: FaceAnalysis
): FaceAnalysis {
  const skinTone = persisted.skinToneOptions.includes(incoming.skinTone)
    ? incoming.skinTone
    : persisted.skinTone;
  const skinUndertone = persisted.skinUndertoneOptions.includes(incoming.skinUndertone)
    ? incoming.skinUndertone
    : persisted.skinUndertone;

  return {
    ...persisted,
    skinTone,
    skinUndertone,
  };
}
