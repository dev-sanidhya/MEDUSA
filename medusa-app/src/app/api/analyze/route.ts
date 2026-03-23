import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/* ── Look-specific makeup briefs ── */
const LOOK_BRIEF: Record<string, string> = {
  'no-makeup':  'No-Makeup Makeup — skin-first finish. Tinted moisturiser or skin tint, light concealer, cream blush, fluffy brows, one mascara coat, tinted lip balm. Goal: "your skin but better."',
  'smoky-eye':  'Smoky Eye — dark, blended, moody. Eye primer, medium grey/brown base shadow, deep black-brown outer V, intensive blending, smudged kohl waterline, two mascara coats. Keep skin and lips minimal.',
  'glass-skin': 'Dewy Glass Skin — K-beauty luminous finish. Double cleanse, layered hydrating essence, HA serum on damp skin, gel moisturiser, skin tint mixed with moisturiser, liquid highlight on high points, jelly blush, setting mist.',
  'bold-lip':   'Bold Lip — one powerful colour statement. Minimal skin base, concealer lip prep, lip liner fill, bold lipstick × 2 coats, concealer edge clean-up. Eyes: mascara only.',
  'editorial':  'Editorial — graphic, artistic, runway. Full-coverage base baked under eyes, graphic liner sketched in grey then executed in gel, bold colour eyeshadow lid + lower lash, sharp contour, strong squared brows, monochromatic or bare lip.',
};

/* ── Strip markdown fences Claude sometimes adds ── */
function extractJSON(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const start = raw.indexOf('{');
  const end   = raw.lastIndexOf('}');
  if (start !== -1 && end !== -1) return raw.slice(start, end + 1);
  return raw.trim();
}

/* ── Detect image media type from data URL prefix ── */
function getMediaType(dataUrl: string): 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' {
  if (dataUrl.startsWith('data:image/png'))  return 'image/png';
  if (dataUrl.startsWith('data:image/webp')) return 'image/webp';
  if (dataUrl.startsWith('data:image/gif'))  return 'image/gif';
  return 'image/jpeg';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { image?: string; lookId?: string };
    const { image, lookId } = body;

    if (!image || !lookId) {
      return NextResponse.json({ error: 'image and lookId are required' }, { status: 400 });
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 500 });
    }

    const mediaType = getMediaType(image);
    const base64    = image.replace(/^data:image\/\w+;base64,/, '');
    const brief     = LOOK_BRIEF[lookId] ?? 'A beautiful personalised makeup look.';

    const msg = await client.messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 5000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type:   'image',
              source: { type: 'base64', media_type: mediaType, data: base64 },
            },
            {
              type: 'text',
              text: `You are MEDUSA — an expert AI makeup artist and precision computer vision specialist.

REQUESTED LOOK: ${brief}

Study this photo carefully and complete all three parts below. The accuracy of Part 1 is critical — the coordinates you return will be used to digitally apply makeup exactly onto this person's face on a canvas.

━━━ PART 1: FACE LANDMARK DETECTION ━━━
Look at where each facial feature ACTUALLY IS in this specific image.
Express ALL coordinates as decimal fractions of the full image:
• x / cx: 0.0 = LEFT edge → 1.0 = RIGHT edge
• y / cy: 0.0 = TOP edge  → 1.0 = BOTTOM edge
• rx = half-width as fraction of image width
• ry = half-height as fraction of image height

Detect and return the precise location of each feature as it appears in this photo:

faceBox   — bounding rectangle around the entire visible face (x=left, y=top, w=width, h=height)
leftEye   — centre of the LEFT iris/pupil (cx, cy) + approximate eye half-dimensions (rx, ry)
rightEye  — centre of the RIGHT iris/pupil (cx, cy) + approximate eye half-dimensions (rx, ry)
leftBrow  — midpoint of the LEFT eyebrow arch (cx, cy) + brow half-dimensions (rx, ry)
rightBrow — midpoint of the RIGHT eyebrow arch (cx, cy) + brow half-dimensions (rx, ry)
nose      — tip of the nose (cx, cy only)
upperLip  — centre of the upper lip / cupid's bow (cx, cy) + half-dimensions (rx, ry)
lowerLip  — centre of the lower lip (cx, cy) + half-dimensions (rx, ry)
leftCheek — apple of the left cheek (cx, cy) + approximate radius (rx, ry)
rightCheek— apple of the right cheek (cx, cy) + approximate radius (rx, ry)
jawLeft   — left jaw corner point (cx, cy)
jawRight  — right jaw corner point (cx, cy)
chin      — lowest visible point of the chin (cx, cy)

Return the values you actually observe. Do NOT use generic centre-face defaults.

━━━ PART 2: FACE ANALYSIS ━━━
Analyse this specific person's visible features:
• undertone: warm / cool / neutral
• depth: fair / light / medium / tan / deep
• faceShape: oval / round / square / heart / diamond / oblong
• eyeShape: almond / round / hooded / monolid / downturned / upturned
• standoutFeature: one specific distinctive feature (e.g. "high cheekbones", "full lips", "deep-set eyes")
• summary: one warm direct sentence about what makes this face exceptional for the requested look

━━━ PART 3: PERSONALISED TUTORIAL STEPS ━━━
Write exactly 8 steps for this specific person. Reference their actual observed features.
Each step must include:
• title: short step name
• description: 2–3 sentences of precise instruction referencing their specific features
• visualGuide: exact hand motion and brush technique (1–2 sentences)
• expectedOutcome: what the face looks like after this step (1 sentence)
• proTip: one sharp specific pro tip for this person's features
• duration: realistic time estimate
• products: 1–3 generic product types (no brand names)
• zone: exactly one of "full" | "skin" | "eyes" | "lids" | "brows" | "cheeks" | "lips" | "jaw"

Respond with ONLY valid JSON — no markdown fences, no commentary:
{
  "faceLandmarks": {
    "faceBox":     { "x": <number>, "y": <number>, "w": <number>, "h": <number> },
    "leftEye":     { "cx": <number>, "cy": <number>, "rx": <number>, "ry": <number> },
    "rightEye":    { "cx": <number>, "cy": <number>, "rx": <number>, "ry": <number> },
    "leftBrow":    { "cx": <number>, "cy": <number>, "rx": <number>, "ry": <number> },
    "rightBrow":   { "cx": <number>, "cy": <number>, "rx": <number>, "ry": <number> },
    "nose":        { "cx": <number>, "cy": <number> },
    "upperLip":    { "cx": <number>, "cy": <number>, "rx": <number>, "ry": <number> },
    "lowerLip":    { "cx": <number>, "cy": <number>, "rx": <number>, "ry": <number> },
    "leftCheek":   { "cx": <number>, "cy": <number>, "rx": <number>, "ry": <number> },
    "rightCheek":  { "cx": <number>, "cy": <number>, "rx": <number>, "ry": <number> },
    "jawLeft":     { "cx": <number>, "cy": <number> },
    "jawRight":    { "cx": <number>, "cy": <number> },
    "chin":        { "cx": <number>, "cy": <number> }
  },
  "faceAnalysis": {
    "undertone": <string>,
    "depth": <string>,
    "faceShape": <string>,
    "eyeShape": <string>,
    "standoutFeature": <string>,
    "summary": <string>
  },
  "steps": [
    {
      "id": 1,
      "title": <string>,
      "description": <string>,
      "visualGuide": <string>,
      "expectedOutcome": <string>,
      "proTip": <string>,
      "duration": <string>,
      "products": [<string>],
      "zone": <string>
    }
  ]
}`,
            },
          ],
        },
      ],
    });

    const raw = msg.content[0].type === 'text' ? msg.content[0].text : '';
    if (!raw) throw new Error('Empty response from Claude');

    const parsed = JSON.parse(extractJSON(raw));

    /* Basic validation */
    if (!parsed.faceAnalysis || !Array.isArray(parsed.steps) || parsed.steps.length === 0) {
      throw new Error('Malformed response from Claude');
    }

    return NextResponse.json(parsed);

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[/api/analyze]', message);
    return NextResponse.json({ error: 'Analysis failed', detail: message }, { status: 500 });
  }
}
