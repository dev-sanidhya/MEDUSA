import { NextRequest, NextResponse } from "next/server";
import { attachProfileCookie, resolveProfileId } from "@/lib/persistence/profile-cookie";
import {
  ensureAnonymousProfile,
  getProfileHistory,
} from "@/lib/persistence/store";
import type { ProfileHistoryResult } from "@/lib/persistence/types";

export const runtime = "nodejs";

export type { ProfileHistoryResult };

export async function GET(req: NextRequest) {
  try {
    const { profileId, shouldSetCookie } = resolveProfileId(req);
    await ensureAnonymousProfile(profileId);

    const limitParam = req.nextUrl.searchParams.get("limit");
    const analysisRunId = req.nextUrl.searchParams.get("analysisRunId");
    const parsedLimit = limitParam ? Number.parseInt(limitParam, 10) : undefined;
    const history = await getProfileHistory(profileId, {
      limit: Number.isFinite(parsedLimit) ? parsedLimit : undefined,
      analysisRunId,
    });

    const response = NextResponse.json(
      history ?? {
        profileId,
        explicitPreferences: {
          completedOnboarding: false,
          skillLevel: null,
          intensityPreference: null,
          finishPreference: null,
          styleMood: null,
          definitionPreference: null,
          featureFocus: null,
          preferredLooks: [],
          dislikedLooks: [],
        },
        preferenceSummary: {
          preferredLooks: [],
          discouragedLooks: [],
          recentLooks: [],
          skillLevel: null,
          intensityPreference: null,
          finishPreference: null,
          styleMood: null,
          definitionPreference: null,
          featureFocus: null,
          positiveTags: [],
          dislikedTags: [],
        },
        recommendedLooks: [],
        analyses: [],
        tutorials: [],
      } satisfies ProfileHistoryResult
    );

    if (shouldSetCookie) {
      attachProfileCookie(response, profileId);
    }

    return response;
  } catch (err) {
    console.error("[profile-history]", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
