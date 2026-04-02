import { NextRequest, NextResponse } from "next/server";
import {
  generateTutorial,
  type GenerateTutorialRequest,
  type GenerateTutorialResult,
} from "@/lib/medusa/generate-tutorial";

export const runtime = "nodejs";

export type {
  GenerateTutorialRequest,
  GenerateTutorialResult,
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

    const result = await generateTutorial(body.faceAnalysis, body.selectedLook);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[generate-tutorial]", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
