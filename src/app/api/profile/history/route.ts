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
    const parsedLimit = limitParam ? Number.parseInt(limitParam, 10) : undefined;
    const history = await getProfileHistory(profileId, {
      limit: Number.isFinite(parsedLimit) ? parsedLimit : undefined,
    });

    const response = NextResponse.json(
      history ?? {
        profileId,
        preferenceSummary: {
          preferredLooks: [],
          discouragedLooks: [],
          recentLooks: [],
          intensityPreference: null,
          featureFocus: null,
          positiveTags: [],
          dislikedTags: [],
        },
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
