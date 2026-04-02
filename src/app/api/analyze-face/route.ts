import { NextRequest, NextResponse } from "next/server";
import {
  analyzeFace,
  type AnalyzeFaceRequest,
  type FaceAnalysisResult,
} from "@/lib/medusa/analyze-face";
import { attachProfileCookie, resolveProfileId } from "@/lib/persistence/profile-cookie";
import {
  ensureAnonymousProfile,
  persistAnalysisRun,
} from "@/lib/persistence/store";

export const runtime = "nodejs";

export type { AnalyzeFaceRequest, FaceAnalysisResult };

export async function POST(req: NextRequest) {
  try {
    const body: AnalyzeFaceRequest = await req.json();

    if (!body.photos || body.photos.length === 0) {
      return NextResponse.json({ error: "No photos provided" }, { status: 400 });
    }

    const { profileId, shouldSetCookie } = resolveProfileId(req);
    await ensureAnonymousProfile(profileId);

    const result = await analyzeFace(body.photos);
    const persistedRun = await persistAnalysisRun({
      profileId,
      photos: body.photos,
      result,
    });

    const response = NextResponse.json({
      ...result,
      analysisRunId: persistedRun?.id ?? null,
    } satisfies FaceAnalysisResult);

    if (shouldSetCookie) {
      attachProfileCookie(response, profileId);
    }

    return response;
  } catch (err) {
    console.error("[analyze-face]", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
