import { NextRequest, NextResponse } from "next/server";
import {
  analyzeFace,
  type AnalyzeFaceRequest,
  type FaceAnalysisResult,
} from "@/lib/medusa/analyze-face";

export const runtime = "nodejs";

export type { AnalyzeFaceRequest, FaceAnalysisResult };

export async function POST(req: NextRequest) {
  try {
    const body: AnalyzeFaceRequest = await req.json();

    if (!body.photos || body.photos.length === 0) {
      return NextResponse.json({ error: "No photos provided" }, { status: 400 });
    }

    const result = await analyzeFace(body.photos);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[analyze-face]", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
