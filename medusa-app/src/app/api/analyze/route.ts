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
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 3200,
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
              text: `You are MEDUSA — an expert AI makeup artist and beauty educator. Study this selfie carefully.

REQUESTED LOOK: ${brief}

YOUR TASK:
1. Analyse the person's face features from the image.
2. Write exactly 8 personalised makeup tutorial steps for the requested look.

FACE ANALYSIS — be specific, not generic:
• Skin undertone: warm / cool / neutral (check jaw, inner wrist area, any visible veins)
• Skin depth: fair / light / medium / tan / deep
• Face shape: oval / round / square / heart / diamond / oblong
• Eye shape: almond / round / hooded / monolid / downturned / upturned
• Standout feature: ONE specific feature (e.g. "high cheekbones", "deep-set eyes", "strong brow bone", "full lips")
• Summary: one warm, direct sentence describing what makes their face unique for this look

TUTORIAL STEPS — each step must:
• Reference the person's specific features (e.g. "your warm undertone", "your hooded lids", "your oval face")
• "description": 2–3 sentences of precise instruction referencing their features
• "visualGuide": 1–2 sentences describing the exact hand motion, brush stroke, or application technique (e.g. "Using a flat brush, press pigment from the inner lid outward in short tapping motions. Blend edges with a clean fluffy brush in horizontal windshield-wiper strokes.")
• "expectedOutcome": 1 sentence describing exactly what the face should look like after this step is complete (e.g. "Your skin appears evenly toned with no visible texture, creating a seamless canvas for colour.")
• "proTip": one sharp, specific pro tip referencing their features
• "duration": realistic time in minutes/seconds
• "products": 1–3 product types needed (no brand names, generic types only)
• "zone": which face area this step targets — must be exactly one of: "full" | "skin" | "eyes" | "lids" | "brows" | "cheeks" | "lips" | "jaw"

Respond ONLY with valid JSON — no markdown, no explanation:
{
  "faceAnalysis": {
    "undertone": "warm",
    "depth": "medium",
    "faceShape": "oval",
    "eyeShape": "almond",
    "standoutFeature": "defined cheekbones",
    "summary": "Your warm medium skin and defined cheekbones make this look effortlessly striking."
  },
  "steps": [
    {
      "id": 1,
      "title": "Skin Prep",
      "description": "Your skin description here with specific reference to their features.",
      "visualGuide": "Press serum into skin using both palms in gentle inward-then-outward pressing motions from the centre of the face.",
      "expectedOutcome": "Skin feels plumped and looks slightly dewy, with a healthy baseline glow before any product.",
      "proTip": "A specific tip for their face type.",
      "duration": "2 min",
      "products": ["Hydrating serum", "SPF moisturiser"],
      "zone": "full"
    }
  ]
}`,
            },
          ],
        },
      ],
    });

    const raw    = msg.content[0].type === 'text' ? msg.content[0].text : '';
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
