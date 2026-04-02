import { NextRequest, NextResponse } from "next/server";
import { attachProfileCookie, resolveProfileId } from "@/lib/persistence/profile-cookie";
import {
  ensureAnonymousProfile,
  updateProfilePreferences,
} from "@/lib/persistence/store";
import type { ProfileExplicitPreferences } from "@/lib/persistence/types";

export const runtime = "nodejs";

export interface UpdateProfilePreferencesRequest {
  completedOnboarding?: boolean;
  skillLevel?: ProfileExplicitPreferences["skillLevel"];
  intensityPreference?: ProfileExplicitPreferences["intensityPreference"];
  featureFocus?: ProfileExplicitPreferences["featureFocus"];
  preferredLooks?: string[];
  dislikedLooks?: string[];
}

export async function POST(req: NextRequest) {
  try {
    const body: UpdateProfilePreferencesRequest = await req.json();
    const { profileId, shouldSetCookie } = resolveProfileId(req);
    await ensureAnonymousProfile(profileId);

    const preferences = await updateProfilePreferences(profileId, {
      completedOnboarding: body.completedOnboarding ?? true,
      skillLevel: body.skillLevel ?? null,
      intensityPreference: body.intensityPreference ?? null,
      featureFocus: body.featureFocus ?? null,
      preferredLooks: body.preferredLooks ?? [],
      dislikedLooks: body.dislikedLooks ?? [],
    });

    const response = NextResponse.json({
      profileId,
      explicitPreferences: preferences,
    });

    if (shouldSetCookie) {
      attachProfileCookie(response, profileId);
    }

    return response;
  } catch (err) {
    console.error("[profile-preferences]", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
