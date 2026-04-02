import { NextRequest, NextResponse } from "next/server";
import {
  generateTutorial,
  type GenerateTutorialRequest,
} from "@/lib/medusa/generate-tutorial";
import { attachProfileCookie, resolveProfileId } from "@/lib/persistence/profile-cookie";
import {
  ensureAnonymousProfile,
  persistTutorialRun,
} from "@/lib/persistence/store";

export const runtime = "nodejs";

export type {
  GenerateTutorialRequest,
  GenerateTutorialResult,
  EditorialSubtype,
  LookId,
  TutorialStep,
  ZoneKey,
} from "@/lib/medusa/generate-tutorial";

export async function POST(req: NextRequest) {
  try {
    const body: GenerateTutorialRequest = await req.json();

    if (!body.faceAnalysis || !body.selectedLook) {
      return NextResponse.json({ error: "faceAnalysis and selectedLook are required" }, { status: 400 });
    }

    const { profileId, shouldSetCookie } = resolveProfileId(req);
    await ensureAnonymousProfile(profileId);

    const result = await generateTutorial(
      body.faceAnalysis,
      body.selectedLook,
      body.selectedEditorialSubtype
    );

    const persistedRun = await persistTutorialRun({
      profileId,
      analysisRunId: body.analysisRunId,
      faceAnalysis: body.faceAnalysis,
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
