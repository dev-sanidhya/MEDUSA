import type { NextRequest, NextResponse } from "next/server";

export const MEDUSA_PROFILE_COOKIE = "medusa_profile_id";

const PROFILE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function resolveProfileId(req: NextRequest) {
  const existingProfileId = req.cookies.get(MEDUSA_PROFILE_COOKIE)?.value?.trim();

  if (existingProfileId && UUID_PATTERN.test(existingProfileId)) {
    return {
      profileId: existingProfileId,
      shouldSetCookie: false,
    };
  }

  return {
    profileId: crypto.randomUUID(),
    shouldSetCookie: true,
  };
}

export function attachProfileCookie(response: NextResponse, profileId: string) {
  response.cookies.set({
    name: MEDUSA_PROFILE_COOKIE,
    value: profileId,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: PROFILE_COOKIE_MAX_AGE_SECONDS,
  });
}
