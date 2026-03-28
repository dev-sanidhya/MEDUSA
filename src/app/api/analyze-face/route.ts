/**
 * /api/analyze-face
 * Claude agent endpoint — uses @anthropic-ai/claude-agent-sdk
 * which runs via your Claude Code Pro subscription (no separate API key needed).
 *
 * Auth: set CLAUDE_CODE_OAUTH_TOKEN in .env.local
 * Get it by running: claude setup-token
 */

import { query } from "@anthropic-ai/claude-agent-sdk";
import type { SDKUserMessage } from "@anthropic-ai/claude-agent-sdk";
import { NextRequest, NextResponse } from "next/server";
import type { FaceProfile } from "@/lib/geometry-calculator";
import type { PrecisionReport } from "@/lib/precision-scorer";

// ─── Request / Response types ─────────────────────────────────────────────────

export interface AnalyzeFaceRequest {
  photos: {
    base64: string;
    mimeType: "image/jpeg" | "image/png" | "image/webp";
    geometryProfile: FaceProfile;
    precisionReport: PrecisionReport;
  }[];
}

export interface FaceAnalysisResult {
  status: "needs_more_photos" | "analysis_complete";

  photoRequest?: {
    message: string;
    specificInstruction: string;
    photoNumber: number;
  };

  faceAnalysis?: {
    personalReading: string;
    faceShape: string;
    faceShapeExplanation: string;
    skinTone: string;
    skinUndertone: string;
    skinToneExplanation: string;
    eyes: {
      shape: string;
      set: string;
      specificCharacteristics: string;
      makeupImplication: string;
    };
    lips: {
      description: string;
      specificCharacteristics: string;
      makeupImplication: string;
    };
    nose: {
      description: string;
      makeupImplication: string;
    };
    brows: {
      naturalShape: string;
      asymmetry: string;
      makeupImplication: string;
    };
    cheekbones: {
      description: string;
      makeupImplication: string;
    };
    beautyHighlights: string[];
    makeupPriorities: string[];
    avoidTechniques: string[];
    precisionLevel: "high" | "medium";
    precisionNote: string;
  };
}

// ─── JSON schema for structured output ───────────────────────────────────────
// The Agent SDK uses this to guarantee valid JSON back from Claude.

const FACE_ANALYSIS_SCHEMA = {
  type: "object",
  required: ["status"],
  properties: {
    status: { type: "string", enum: ["needs_more_photos", "analysis_complete"] },

    photoRequest: {
      type: "object",
      properties: {
        message: { type: "string" },
        specificInstruction: { type: "string" },
        photoNumber: { type: "number" },
      },
      required: ["message", "specificInstruction", "photoNumber"],
    },

    faceAnalysis: {
      type: "object",
      properties: {
        personalReading: { type: "string" },
        faceShape: { type: "string" },
        faceShapeExplanation: { type: "string" },
        skinTone: { type: "string" },
        skinUndertone: { type: "string" },
        skinToneExplanation: { type: "string" },
        eyes: {
          type: "object",
          properties: {
            shape: { type: "string" },
            set: { type: "string" },
            specificCharacteristics: { type: "string" },
            makeupImplication: { type: "string" },
          },
          required: ["shape", "set", "specificCharacteristics", "makeupImplication"],
        },
        lips: {
          type: "object",
          properties: {
            description: { type: "string" },
            specificCharacteristics: { type: "string" },
            makeupImplication: { type: "string" },
          },
          required: ["description", "specificCharacteristics", "makeupImplication"],
        },
        nose: {
          type: "object",
          properties: {
            description: { type: "string" },
            makeupImplication: { type: "string" },
          },
          required: ["description", "makeupImplication"],
        },
        brows: {
          type: "object",
          properties: {
            naturalShape: { type: "string" },
            asymmetry: { type: "string" },
            makeupImplication: { type: "string" },
          },
          required: ["naturalShape", "asymmetry", "makeupImplication"],
        },
        cheekbones: {
          type: "object",
          properties: {
            description: { type: "string" },
            makeupImplication: { type: "string" },
          },
          required: ["description", "makeupImplication"],
        },
        beautyHighlights: { type: "array", items: { type: "string" } },
        makeupPriorities: { type: "array", items: { type: "string" } },
        avoidTechniques: { type: "array", items: { type: "string" } },
        precisionLevel: { type: "string", enum: ["high", "medium"] },
        precisionNote: { type: "string" },
      },
      required: [
        "personalReading", "faceShape", "faceShapeExplanation",
        "skinTone", "skinUndertone", "skinToneExplanation",
        "eyes", "lips", "nose", "brows", "cheekbones",
        "beautyHighlights", "makeupPriorities", "avoidTechniques",
        "precisionLevel", "precisionNote",
      ],
    },
  },
};

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are MEDUSA's core face analysis agent — a highly trained professional makeup artist and beauty consultant with deep expertise in facial geometry, color theory, and personalized makeup technique.

## Your Role
You analyze human faces with the precision of a professional. You receive photographs of the user's face plus precise geometric measurements extracted by MediaPipe (478 landmark points), including face shape ratios, eye measurements, lip measurements, nose dimensions, brow data, and cheekbone geometry.

## Artistry Standard
Your taste level is high. You think like an artist who understands both polished complexion architecture and bold creative placement.
- Read the face in terms of structure, light, balance, contrast, and where the eye naturally lands first.
- Separate enhancement from correction. Not everything should be "fixed." Some features should be intentionally spotlighted.
- Think about what would read best in real life AND in photos.

## Precision First — Always

Before giving any analysis, assess whether you have enough information.

Ask for another photo (status: "needs_more_photos") if:
- The geometric data shows face angle > 15° off center (yaw, pitch, or roll)
- Key facial zones scored below 75/100 in visibility
- The face is too small in the frame
- Features are clearly obscured in the photo (hair, glasses, shadows)
- You cannot confidently determine face shape, eye shape, or lip shape

Proceed (status: "analysis_complete") if:
- Head pose is frontal (all angles < 15°)
- All major zones clearly visible (eyes, lips, nose, jaw, cheeks)
- Face fills a reasonable portion of the frame
- You can confidently classify face shape, eye shape, lip shape
- You can read skin tone from the photograph

Maximum 3 photo requests total. After 3 photos, always proceed with status: "analysis_complete".

## When Asking for Another Photo
Be warm and personal. Always:
- Acknowledge what you CAN see (don't make the user feel bad)
- Explain exactly what you need and WHY it matters for their analysis
- Give a clear, specific instruction
- Be encouraging

## When Giving the Full Analysis
Speak directly to this specific person. Use "you" and "your" throughout. Every sentence must be something that could ONLY be said about this specific face — never generic.

Your analysis must cover:
- Their exact face shape with makeup implications
- Eye shape, set type, specific characteristics, and what this means for eyeshadow/liner placement
- Lip structure — upper vs lower volume, cupid bow, corner direction
- Natural brow shape and any asymmetry
- Skin tone AND undertone read directly from the photo
- 3 specific beautiful features to enhance
- The visual hierarchy of their face: which features should lead first, which should stay softer, and where makeup placement will create the most impact
- 3 makeupPriorities that are ranked and strategic, not generic. These should read like a pro plan: for example "lift the outer eye", "keep center face bright", "build mouth shape with liner rather than overfilling the whole lip."
- What makeup techniques to AVOID — this is critical. For each item in avoidTechniques, format it as: "[Technique] — because [specific geometric measurement/ratio from their data] means this will [specific visual distortion it causes on their face]". Be honest and precise. Example: "Heavy lower lash-line liner — your eye tilt of +3° gives you a naturally upturned eye; liner on the waterline pulls the visual weight downward and kills that lift, making your eyes look smaller and drooping."

## Tone
Warm, direct, and plain-spoken. Talk like a friend who happens to be a makeup artist — not a textbook. Short sentences. No jargon. If you can say it simply, say it simply.`;

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body: AnalyzeFaceRequest = await req.json();

    if (!body.photos || body.photos.length === 0) {
      return NextResponse.json({ error: "No photos provided" }, { status: 400 });
    }

    const photos = body.photos.slice(0, 3);
    const latestPhoto = photos[photos.length - 1];
    const photoCount = photos.length;

    // Build the user message content with all photos + geometry data
    type ContentBlock =
      | { type: "text"; text: string }
      | { type: "image"; source: { type: "base64"; media_type: string; data: string } };

    const content: ContentBlock[] = [];

    for (let i = 0; i < photos.length; i++) {
      content.push({ type: "text", text: `## Photo ${i + 1} of ${photos.length}` });
      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: photos[i].mimeType,
          data: photos[i].base64,
        },
      });
    }

    content.push({
      type: "text",
      text: buildGeometryPrompt(
        latestPhoto.geometryProfile,
        latestPhoto.precisionReport,
        photoCount
      ),
    });

    const sessionId = crypto.randomUUID();

    // Async generator that yields the user message
    async function* makeMessages(): AsyncIterable<SDKUserMessage> {
      yield {
        type: "user",
        session_id: sessionId,
        parent_tool_use_id: null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        message: { role: "user", content } as any,
      };
    }

    // Run the Claude Agent SDK query
    let result: FaceAnalysisResult | null = null;

    for await (const msg of query({
      prompt: makeMessages(),
      options: {
        model: "claude-sonnet-4-6",
        maxTurns: 5,
        systemPrompt: SYSTEM_PROMPT,
        tools: [],                          // no tools — pure JSON response only
        outputFormat: {
          type: "json_schema",
          schema: FACE_ANALYSIS_SCHEMA,
        },
        permissionMode: "bypassPermissions",
        allowDangerouslySkipPermissions: true,
      },
    })) {
      if (msg.type === "result") {
        if (msg.subtype === "success" && msg.structured_output) {
          result = msg.structured_output as FaceAnalysisResult;
        } else if (msg.subtype === "success" && !msg.structured_output) {
          console.error("[analyze-face] Success but no structured output. Result text:", msg.result);
          return NextResponse.json({ error: "Agent returned no structured output" }, { status: 500 });
        } else {
          // msg.errors contains the actual error strings
          const errors = (msg as unknown as { errors?: string[] }).errors ?? [];
          console.error("[analyze-face] Agent error — subtype:", msg.subtype, "| errors:", errors);
          return NextResponse.json(
            { error: errors[0] ?? "Agent returned an error", subtype: msg.subtype },
            { status: 500 }
          );
        }
      }
    }

    if (!result) {
      return NextResponse.json(
        { error: "Agent produced no output" },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[analyze-face]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── Geometry prompt builder ──────────────────────────────────────────────────

function buildGeometryPrompt(
  profile: FaceProfile,
  precision: PrecisionReport,
  photoCount: number
): string {
  const p = profile;
  const pr = precision;

  return `
## MediaPipe Geometric Analysis (${photoCount} photo${photoCount > 1 ? "s" : ""} analyzed)

### Precision Report
- Overall score: ${pr.overallScore}/100
- Can proceed: ${pr.canProceed}
- Head pose: yaw=${pr.headPose.yaw.toFixed(1)}°, pitch=${pr.headPose.pitch.toFixed(1)}°, roll=${pr.headPose.roll.toFixed(1)}°
- Is frontal: ${pr.headPose.isFrontal}
- Zone scores: eyes=${pr.zones.eyes.score}, lips=${pr.zones.lips.score}, nose=${pr.zones.nose.score}, jaw=${pr.zones.jaw.score}
- Face framing: size ratio=${pr.faceFraming.faceSizeRatio.toFixed(3)}, too small=${pr.faceFraming.isTooSmall}
- Detected issues: ${pr.issues.length > 0 ? pr.issues.join(", ") : "none"}
- Photos so far: ${photoCount}/3 max

### Face Structure
- Shape (calculated): ${p.faceShape}
- Width-to-height: ${p.faceRatios.widthToHeight.toFixed(3)}
- Forehead/cheekbone ratio: ${p.faceRatios.foreheadWidth.toFixed(3)}
- Jaw-to-forehead: ${p.faceRatios.jawToForehead.toFixed(3)}
- Jaw angle: ${p.faceRatios.jawAngleDeg.toFixed(1)}°
- Face thirds: forehead=${(p.faceRatios.thirdRatios[0]*100).toFixed(1)}%, midface=${(p.faceRatios.thirdRatios[1]*100).toFixed(1)}%, lower=${(p.faceRatios.thirdRatios[2]*100).toFixed(1)}%

### Eyes
- Set type: ${p.eyes.setType} (ratio: ${p.eyes.interEyeRatio.toFixed(3)})
- Shape: ${p.eyes.shape}
- Lid visibility: ${p.eyes.lidVisibilityRatio.toFixed(3)}
- Tilt: ${p.eyes.tiltDeg.toFixed(2)}° (positive=upturned)
- Asymmetry: ${p.eyes.asymmetryMm.toFixed(3)}
- EAR left/right: ${p.eyes.leftEyeAspectRatio.toFixed(3)} / ${p.eyes.rightEyeAspectRatio.toFixed(3)}

### Lips
- Fullness: ${p.lips.fullness}
- Upper/lower ratio: ${p.lips.upperToLowerRatio.toFixed(3)}
- Width/face ratio: ${p.lips.widthToFaceRatio.toFixed(3)}
- Symmetry: ${p.lips.symmetry.toFixed(3)}
- Cupid bow depth: ${p.lips.cupidBowDepth.toFixed(3)}
- Corner tilt: ${p.lips.cornerTilt.toFixed(3)}

### Nose
- Width/face: ${p.nose.widthToFaceRatio.toFixed(3)}
- Length/face: ${p.nose.lengthToFaceRatio.toFixed(3)}
- Bridge width: ${p.nose.bridgeWidth.toFixed(3)}

### Brows
- Arch height: ${p.brows.archHeightRatio.toFixed(3)}
- Asymmetry: ${p.brows.asymmetryDeg.toFixed(1)}°
- Spacing ratio: ${p.brows.spacingRatio.toFixed(3)}
- Peak position L/R: ${p.brows.leftArchPeakPosition.toFixed(2)} / ${p.brows.rightArchPeakPosition.toFixed(2)}

### Cheekbones
- Prominence: ${p.cheekbones.prominence}
- Width ratio: ${p.cheekbones.widthRatio.toFixed(3)}

Based on the photos AND geometric measurements above, return your analysis as structured JSON matching the output schema.
`.trim();
}
