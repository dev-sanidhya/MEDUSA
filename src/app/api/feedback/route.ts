import { NextRequest, NextResponse } from "next/server";
import { attachProfileCookie, resolveProfileId } from "@/lib/persistence/profile-cookie";
import {
  ensureAnonymousProfile,
  recordFeedbackEvent,
} from "@/lib/persistence/store";
import type {
  FeedbackEventRecord,
  FeedbackEventType,
} from "@/lib/persistence/types";

export const runtime = "nodejs";

export interface FeedbackRequest {
  eventType: FeedbackEventType;
  analysisRunId?: string | null;
  tutorialRunId?: string | null;
  rating?: number | null;
  tags?: string[];
  feedbackText?: string | null;
  metadata?: Record<string, unknown>;
}

export interface FeedbackResponse {
  feedbackEventId: string | null;
}

export async function POST(req: NextRequest) {
  try {
    const body: FeedbackRequest = await req.json();

    if (!body.eventType) {
      return NextResponse.json({ error: "eventType is required" }, { status: 400 });
    }

    if (!body.analysisRunId && !body.tutorialRunId) {
      return NextResponse.json(
        { error: "analysisRunId or tutorialRunId is required" },
        { status: 400 }
      );
    }

    if (body.rating !== undefined && body.rating !== null) {
      const isValidRating = Number.isInteger(body.rating) && body.rating >= 1 && body.rating <= 5;

      if (!isValidRating) {
        return NextResponse.json({ error: "rating must be an integer between 1 and 5" }, { status: 400 });
      }
    }

    const { profileId, shouldSetCookie } = resolveProfileId(req);
    await ensureAnonymousProfile(profileId);

    const feedbackRecord: FeedbackEventRecord = {
      profileId,
      eventType: body.eventType,
      analysisRunId: body.analysisRunId ?? null,
      tutorialRunId: body.tutorialRunId ?? null,
      rating: body.rating ?? null,
      tags: body.tags ?? [],
      feedbackText: body.feedbackText ?? null,
      metadata: body.metadata ?? {},
    };

    const feedback = await recordFeedbackEvent(feedbackRecord);

    const response = NextResponse.json({
      feedbackEventId: feedback?.id ?? null,
    } satisfies FeedbackResponse);

    if (shouldSetCookie) {
      attachProfileCookie(response, profileId);
    }

    return response;
  } catch (err) {
    console.error("[feedback]", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
