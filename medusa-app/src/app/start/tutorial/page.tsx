'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

/* ─── Static fallback tutorials ──────────────────────────────── */
const TUTORIALS: Record<string, {
  title: string; subtitle: string;
  steps: { title: string; detail: string; visualGuide: string; expectedOutcome: string; tip: string; duration: string; zone: string }[];
}> = {
  'no-makeup': {
    title: 'No-Makeup Makeup', subtitle: 'Your skin, but better.',
    steps: [
      { title: 'Skin Prep',          detail: 'Apply a lightweight hydrating serum all over the face. Press gently with your palms — don\'t rub. Let it sink in 60 seconds.',               visualGuide: 'Using both palms, press the serum into your face in gentle inward-outward motions from the nose bridge outward. No rubbing.',                             expectedOutcome: 'Skin looks plumped and slightly dewy — a healthy canvas before any base product.',         tip: 'Damp skin absorbs serum faster. Apply right after cleansing.',                          duration: '2 min',  zone: 'full'   },
      { title: 'SPF Moisturiser',    detail: 'Apply SPF30+ moisturiser all over face and down the neck. This is your actual canvas.',                                                       visualGuide: 'Dot 5 points (forehead, both cheeks, nose, chin), then smooth outward from centre using three fingers.',                                               expectedOutcome: 'Face looks matte-smooth with a fresh, cared-for finish. Neck matches.',                      tip: 'SPF is the single most impactful anti-ageing product — never skip it.',                 duration: '1 min',  zone: 'full'   },
      { title: 'Tinted Moisturiser', detail: 'Dot tinted moisturiser on forehead, nose, cheeks and chin. Blend outward with warm fingers.',                                                 visualGuide: 'Blend with fingertips using outward circular motions from the centre. Warm the product first by rubbing fingers together.',                             expectedOutcome: 'Skin has even, natural coverage — your real skin texture still shows through.',              tip: 'Fingers are warmer than tools = the most skin-like blend.',                             duration: '3 min',  zone: 'skin'   },
      { title: 'Concealer',          detail: 'Dab concealer under the eyes and over spots. Blend with a damp sponge using patting motions only.',                                           visualGuide: 'Pat, never drag. Press the sponge in small downward taps starting from the inner corner outward.',                                                      expectedOutcome: 'Under-eye area looks bright and rested, blemishes invisible against the base.',              tip: 'Pat, never drag — dragging lifts product off the skin.',                                duration: '2 min',  zone: 'eyes'   },
      { title: 'Cream Blush',        detail: 'Smile lightly. Apply sheer cream blush to the apples of the cheeks and blend upward toward temples.',                                         visualGuide: 'Use fingertips to press blush onto the apples, then sweep upward in a C-curve toward the temple. Keep it sheer.',                                       expectedOutcome: 'Cheeks have a natural, sun-kissed flush that looks like it came from the skin.',             tip: 'Cream on warm skin gives the most natural flush.',                                      duration: '2 min',  zone: 'cheeks' },
      { title: 'Brow Gel',           detail: 'Brush brows upward with clear or tinted brow gel. Fill any sparse areas with short hairlike strokes.',                                        visualGuide: 'Brush upward from the inner brow first, then follow the natural arch upward-and-outward in short strokes.',                                             expectedOutcome: 'Brows look groomed, fluffy and defined — framing the face without looking heavy.',           tip: 'Fluffy upward brows give a natural lift to the entire face.',                           duration: '2 min',  zone: 'brows'  },
      { title: 'Mascara',            detail: 'Apply one coat of mascara. Wiggle the wand at the root and pull upward to the tip.',                                                          visualGuide: 'Hold the wand horizontally, press at the root and wiggle gently while pulling upward in one smooth motion per lash group.',                              expectedOutcome: 'Lashes look lengthened and defined — eyes look open without looking "done."',                tip: 'One careful coat > three clumpy ones. Let it dry before a second.',                     duration: '1 min',  zone: 'lids'   },
      { title: 'Tinted Lip Balm',    detail: 'Apply a sheer tinted balm in a warm rose or nude. Press lips together to distribute.',                                                        visualGuide: 'Apply directly from the bullet with a light press. Then press lips together once to blend evenly.',                                                      expectedOutcome: 'Lips look hydrated, naturally flushed — slightly more "you" but effortless.',                tip: 'Match the balm to your natural lip colour, just amplified.',                            duration: '30 sec', zone: 'lips'   },
    ],
  },
  'smoky-eye': {
    title: 'Smoky Eye', subtitle: 'Dark. Magnetic. Yours.',
    steps: [
      { title: 'Eye Primer',          detail: 'Apply a thin layer of eye primer from lid to brow bone. Let dry 30 seconds.',                                                                visualGuide: 'Using a fingertip, tap primer across the entire lid and up to the brow bone in a sheer thin layer.',                                                    expectedOutcome: 'Lid has a smooth matte base — eyeshadow will stay put all night.',                          tip: 'Primer is the difference between 2-hour and 12-hour shadow.',                           duration: '1 min',  zone: 'lids'   },
      { title: 'Base Shadow',         detail: 'Pack a medium grey or brown shadow over the entire lid with a flat brush.',                                                                   visualGuide: 'Using a flat shader brush, press shadow in short tapping motions from the inner lid to the outer corner. Build depth with 2–3 passes.',                expectedOutcome: 'The entire lid is covered in a medium-depth shadow — the base for deeper blending.',        tip: 'The base layer sets the depth. Go darker than you think you need to.',                  duration: '2 min',  zone: 'lids'   },
      { title: 'Deep Outer V',        detail: 'Press a dark black-brown into the outer V corner pointing toward the temple.',                                                                visualGuide: 'Using a small pencil brush, press shadow into the outer corner in a V shape. Angle the outer point toward your temple, not downward.',                  expectedOutcome: 'A deep V shadow defines the outer corner, giving the eye a pulled-back sultry shape.',      tip: 'The V point should angle up and out — never straight down.',                            duration: '3 min',  zone: 'eyes'   },
      { title: 'Blend, Blend, Blend', detail: 'Use a fluffy blending brush in windshield-wiper motions until no harsh lines remain.',                                                       visualGuide: 'Use a large clean fluffy brush in rapid side-to-side windshield-wiper motions across the crease, moving in small circles at the edges.',               expectedOutcome: 'All shadow edges are seamlessly diffused — the eye looks like one deep, gradient wash of colour.', tip: 'Good smoky eyes are 80% blending. Never skip this step.',              duration: '4 min',  zone: 'eyes'   },
      { title: 'Lower Lash Shadow',   detail: 'Use a pencil brush to smudge dark shadow along the lower lash line, connecting to the outer V.',                                             visualGuide: 'Rest a thin pencil brush just under the lower lashes and drag it outward toward the outer corner in one smooth stroke. Smudge gently.',                expectedOutcome: 'Lower lash line is defined and smoky — the eye looks fully encircled and intense.',          tip: 'Don\'t overdo the inner corner lower lash — it closes the eye.',                        duration: '2 min',  zone: 'eyes'   },
      { title: 'Kohl Waterline',      detail: 'Line the waterline with black kohl and smudge immediately with a cotton bud.',                                                               visualGuide: 'Pull the lower lid gently down, draw the kohl in one smooth stroke. Immediately smudge with a cotton bud in side-to-side motions.',                    expectedOutcome: 'Waterline is dark and smudged — the look reaches maximum depth and intensity.',              tip: 'Smudging the kohl immediately turns "liner" into "smoky."',                             duration: '1 min',  zone: 'eyes'   },
      { title: 'Mascara × 2 Coats',   detail: 'Two coats of volumising mascara. Let the first dry before the second. Use a lash comb between coats.',                                      visualGuide: 'Wiggle the wand at the root then pull upward. After coat 1 dries, use a lash comb to separate, then apply coat 2 the same way.',                      expectedOutcome: 'Lashes are thick, separated and fanned — the perfect frame for a smoky eye.',               tip: 'A lash comb between coats is the single most underrated beauty tool.',                  duration: '3 min',  zone: 'lids'   },
      { title: 'Minimal Base + Lip',  detail: 'Apply a light coverage base only. Finish with a nude or dusty rose lip balm — nothing more.',                                               visualGuide: 'Warm a drop of skin tint between fingers and press onto the face. Finish lips with one swipe of tinted balm, no liner.',                              expectedOutcome: 'The face looks polished but effortless — all attention stays on the dramatic eyes.',         tip: 'Bold eye + bold lip = overdone. Restraint is the move.',                                duration: '2 min',  zone: 'skin'   },
    ],
  },
  'glass-skin': {
    title: 'Dewy Glass Skin', subtitle: 'Lit from within.',
    steps: [
      { title: 'Double Cleanse',      detail: 'Oil cleanser first to dissolve SPF and makeup, then foam cleanser. Pat dry — never rub.',                                                   visualGuide: 'Massage oil cleanser in circular motions for 60 seconds. Rinse. Follow with foam cleanser using upward-circular strokes for 30 seconds. Pat dry.',     expectedOutcome: 'Skin feels completely clean, not tight — the ideal blank canvas for hydration.',            tip: 'Glass skin is impossible without a genuinely clean base.',                              duration: '4 min',  zone: 'full'   },
      { title: 'Layered Essence',     detail: 'Pour a few drops onto both palms and press into skin. Repeat twice.',                                                                        visualGuide: 'Warm the essence between both palms, then press hands flat against your face and hold for 3 seconds. Repeat the pressing motion twice more.',           expectedOutcome: 'Skin looks visibly plumped and slightly translucent — the first sign of glass skin.',       tip: 'Layering thin hydration beats applying one thick layer.',                               duration: '2 min',  zone: 'full'   },
      { title: 'HA Serum (Damp)',      detail: 'Apply 2–3 drops of hyaluronic acid serum to slightly damp skin. Press in with fingertips.',                                                 visualGuide: 'Lightly mist skin first or apply immediately after essence while damp. Press serum in with flat palms — no rubbing.',                                  expectedOutcome: 'Skin looks plump and bouncy — pressing a finger leaves a momentary indentation then springs back.',  tip: 'HA needs moisture to work. Always apply on damp skin.',       duration: '1 min',  zone: 'full'   },
      { title: 'Gel Moisturiser',     detail: 'Apply a gel-cream moisturiser, focusing on any dry patches around the nose and cheeks.',                                                     visualGuide: 'Dot 5 points and blend outward with three-finger strokes. Use extra on dry patches with a gentle circular press.',                                      expectedOutcome: 'Skin has a smooth, cushioned feel — the base now has the perfect glow texture for product.',tip: 'Gel textures give the glass-skin effect without heaviness.',                           duration: '2 min',  zone: 'skin'   },
      { title: 'Skin Tint Mix',       detail: 'Mix one drop of skin tint with a small amount of your moisturiser on the back of the hand. Apply with fingers.',                            visualGuide: 'Mix on hand, then press onto the centre of the face and blend outward with warm fingertips. Skip the edges of the face completely.',                   expectedOutcome: 'Skin looks like a flawless version of itself — texture still visible, but evened out.',     tip: 'The goal is "your skin in HD" — not foundation coverage.',                             duration: '2 min',  zone: 'skin'   },
      { title: 'Liquid Highlight',    detail: 'Dot liquid highlighter on cheekbones, inner corners of eyes, brow bone and cupid\'s bow. Don\'t blend too much.',                           visualGuide: 'Using a fingertip, press a tiny dot on each point. Barely press — the warmth of your skin will blend it. Less blending = more intensity.',            expectedOutcome: 'High points of the face appear lit from within — a three-dimensional, dewy glow.',          tip: 'One precise dot per point beats smearing it everywhere.',                               duration: '2 min',  zone: 'cheeks' },
      { title: 'Jelly Blush',         detail: 'Apply sheer jelly blush to the cheeks and a touch on the nose bridge. Blend quickly — it sets fast.',                                       visualGuide: 'Tap blush onto the apples of the cheeks with fingertips and blend in circular motions upward in under 10 seconds. Tap once on the nose bridge.',      expectedOutcome: 'Cheeks have a flushed, "just came in from outside" glow — natural and youthful.',           tip: 'Nose bridge blush is the most underrated detail in K-beauty.',                          duration: '1 min',  zone: 'cheeks' },
      { title: 'Setting Mist',        detail: 'Hold spray 30 cm from the face, mist in a figure-8 pattern. Air-dry — do not rub or pat.',                                                 visualGuide: 'Hold the bottle at arm\'s length and move in a slow figure-8 pattern across the face. Keep eyes closed. Let air dry for 20 seconds.',                 expectedOutcome: 'All layers fuse into one seamless, skin-like finish — the glass-skin effect is complete.',  tip: 'Never pat after misting — it disrupts the surface.',                                    duration: '1 min',  zone: 'full'   },
    ],
  },
  'bold-lip': {
    title: 'Bold Lip', subtitle: 'One move. Everything.',
    steps: [
      { title: 'Minimal Base',        detail: 'Light skin tint only — no heavy foundation. The lip is the entire look.',                                                                    visualGuide: 'Warm a small amount of skin tint on the back of the hand, then press with fingertips outward from the centre. Leave skin texture visible.',            expectedOutcome: 'Face looks fresh and polished but natural — a neutral background for the lip.',             tip: 'Heavy base + bold lip = overdone. The edit is everything.',                             duration: '3 min',  zone: 'skin'   },
      { title: 'Lip Canvas Prep',     detail: 'Dab a tiny amount of concealer over the lip line and blur outward to create a blank, defined canvas.',                                      visualGuide: 'Using a flat concealer brush, press a thin layer of concealer directly onto and just outside the lip line. Blend outward, not inward.',               expectedOutcome: 'Lips have a clean, slightly defined edge — the perfect blank canvas for crisp colour.',     tip: 'This one step makes lipstick look 10× more editorial.',                                 duration: '1 min',  zone: 'lips'   },
      { title: 'Liner: Outline',      detail: 'Line the lips precisely with a liner matching your lipstick shade. Follow or very slightly overline the cupid\'s bow only.',                 visualGuide: 'Start at the cupid\'s bow peaks, draw outward to each corner. Then line the bottom in one smooth stroke per side. Short strokes at the bow.',         expectedOutcome: 'Lips have a crisp, defined outline that follows their natural shape.',                      tip: 'Matching liner always looks better than nude liner under a bold lip.',                  duration: '2 min',  zone: 'lips'   },
      { title: 'Liner: Fill',         detail: 'Fill the entire lip with the liner as a base. This makes the colour last 4+ hours.',                                                         visualGuide: 'Using short back-and-forth strokes, fill inward from the outline until the entire lip surface is covered.',                                              expectedOutcome: 'Entire lip is covered in a matte base colour — the foundation for long-lasting intensity.',tip: 'Liner as a base is the oldest and most effective pro trick.',                          duration: '1 min',  zone: 'lips'   },
      { title: 'First Coat',          detail: 'Apply lipstick directly from the bullet in one precise coat. Follow the shape exactly.',                                                     visualGuide: 'Apply from the centre of the upper lip outward in two strokes. Then the lower lip centre outward in two strokes. Do not stretch the lips.',            expectedOutcome: 'A rich first layer of colour sits on the lip with even saturation.',                        tip: 'Natural lip position gives the most accurate application.',                             duration: '1 min',  zone: 'lips'   },
      { title: 'Blot + Second Coat',  detail: 'Press a tissue between the lips once. Apply a second full coat directly on top.',                                                            visualGuide: 'Press lips against tissue without moving. Reapply the second coat identically to the first.',                                                           expectedOutcome: 'Colour is deeply saturated and transfer-proof — this is the "all-day" look.',               tip: 'Two thin layers outlast one thick layer by hours.',                                     duration: '2 min',  zone: 'lips'   },
      { title: 'Edge Clean-up',       detail: 'Dip a small flat concealer brush in concealer and trace the exact outer edge of the lips.',                                                 visualGuide: 'Hold a small flat brush like a pen. Trace just outside the liner with controlled single strokes — upper lip first, then lower.',                       expectedOutcome: 'The lip edge is razor-sharp and precise — this is the difference between "nice" and "editorial."', tip: 'This step separates amateur from professional results.', duration: '2 min',  zone: 'lips'   },
      { title: 'Eyes: Mascara Only',  detail: 'One coat of mascara. Nothing else on the eyes — the lip is the entire statement.',                                                           visualGuide: 'Single coat, wand at root, pull upward. Done.',                                                                                                        expectedOutcome: 'Eyes look awake and polished but invisible — all focus goes to the lip.',                   tip: 'Restraint is the hardest and most powerful beauty skill.',                              duration: '1 min',  zone: 'lids'   },
    ],
  },
  'editorial': {
    title: 'Editorial Look', subtitle: 'Runway-ready.',
    steps: [
      { title: 'Flawless Base',        detail: 'Apply primer, full-coverage foundation, and bake under the eyes with translucent loose powder.',                                           visualGuide: 'Apply foundation with a damp sponge in pressing motions. Then press loose powder under the eyes with a powder puff and leave it to "bake" for 5 minutes.',  expectedOutcome: 'Skin is porcelain-smooth with zero texture — a completely even surface ready for graphic work.',    tip: 'Editorial base is about sculpted perfection, not natural skin.', duration: '8 min',  zone: 'full'   },
      { title: 'Map Liner in Grey',    detail: 'Using a fine brush and grey eyeshadow, sketch the exact graphic liner shape before committing.',                                            visualGuide: 'Load a thin liner brush with grey shadow. Lightly sketch the shape — all angles, flicks, and extensions exactly as you want them. Mistakes wipe off.', expectedOutcome: 'A ghost-line of the design appears on the lid — a precise template for the final liner.',        tip: 'Never draw graphic liner freehand on the first attempt.',        duration: '3 min',  zone: 'eyes'   },
      { title: 'Execute in Gel Liner', detail: 'Go over your grey sketch with black gel or liquid liner, using short connected strokes.',                                                   visualGuide: 'Using a pointed liner brush, trace over the grey sketch with short overlapping strokes — never one long drag. Build up the density.',                  expectedOutcome: 'The graphic design is sharp, intense, and precise — exactly as sketched.',                  tip: 'Short strokes give control. One long stroke gives mistakes.',    duration: '5 min',  zone: 'eyes'   },
      { title: 'Bold Colour Shadow',   detail: 'Apply one bold colour (cobalt, orange, violet) across the lid and lower lash line. Keep blending minimal.',                               visualGuide: 'Pack colour with a flat shader brush using tapping motions. Apply a matching slick under the lower lash with a pencil brush. Do not over-blend.',      expectedOutcome: 'The lid shows a bold saturated block of colour — deliberate, graphic, and undiluted.',      tip: 'Intentionally unblended colour reads as "chosen," not sloppy.',  duration: '4 min',  zone: 'lids'   },
      { title: 'Contour + Sculpt',     detail: 'Apply cool-toned contour powder under cheekbones, temples and jawline.',                                                                   visualGuide: 'Using a small contour brush, apply in a C-shape from temple to under-cheek. Blend with a stippling motion inward. Repeat at the jaw.',                 expectedOutcome: 'Face structure is sharply defined — cheekbones, temples and jaw read clearly even under flat light.',  tip: 'Editorial contour is sharper than everyday — don\'t be timid.', duration: '4 min',  zone: 'jaw'    },
      { title: 'Statement Brows',      detail: 'Fill brows in fully with a flat angled brush and pomade. Square off the tails.',                                                            visualGuide: 'Using an angled brush, fill with upward strokes for the body, then finish tails with a sharp horizontal stroke at the end.',                           expectedOutcome: 'Brows are bold, structured and squared — they frame the graphic eye design perfectly.',     tip: 'Strong squared brows give editorial energy immediately.',        duration: '3 min',  zone: 'brows'  },
      { title: 'Lip Decision',         detail: 'Choose: bold monochromatic lip matching your eyeshadow — OR a completely bare lip. No in-between.',                                       visualGuide: 'For bold: apply two coats with precise liner. For bare: apply clear balm only. Commit fully — hesitation shows.',                                      expectedOutcome: 'The lip either anchors the look with equal intensity or disappears completely. Both are editorial.',  tip: 'In editorial beauty, the decision itself is the art.', duration: '2 min',  zone: 'lips'   },
      { title: 'Set Everything',       detail: 'Mist with setting spray. Dust T-zone with translucent powder if needed.',                                                                  visualGuide: 'Hold spray at arm\'s length and mist in a slow X pattern. Dust T-zone with a clean powder brush in light tapping motions.',                             expectedOutcome: 'The entire look is locked — graphic lines stay sharp and colours stay true under heat, lights and movement.',  tip: 'Editorial looks must survive a full shoot. Set hard.', duration: '1 min',  zone: 'full'   },
    ],
  },
};

/* ─── Types ───────────────────────────────────────────────────── */
interface FaceAnalysis {
  undertone: string; depth: string; faceShape: string;
  eyeShape: string; standoutFeature: string; summary: string;
}

interface DisplayStep {
  title: string; detail: string; visualGuide: string;
  expectedOutcome: string; tip: string; duration: string;
  products?: string[]; zone: string;
}

interface AIStep {
  id: number; title: string; description: string; visualGuide: string;
  expectedOutcome: string; proTip: string; duration: string;
  products: string[]; zone: string;
}

const LOAD_PHASES = [
  'Reading your features…',
  'Mapping bone structure…',
  'Detecting skin undertone…',
  'Writing your personalised guide…',
];

/* ─── Face Zone SVG ───────────────────────────────────────────── */
function FaceZoneSVG({ zone }: { zone: string }) {
  const on  = (z: string[]) => z.includes(zone);
  const ac  = (z: string[]) => on(z) ? 'var(--accent)'          : 'var(--line)';
  const fil = (z: string[]) => on(z) ? 'rgba(181,96,74,0.12)'   : 'transparent';
  const stk = (z: string[]) => on(z) ? 2                        : 1;

  return (
    <svg viewBox="0 0 160 200" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: '100%' }}>

      {/* Face outline */}
      <ellipse cx="80" cy="102" rx="56" ry="70"
        stroke={ac(['full','skin','eyes','lids','brows','cheeks','lips','jaw'])}
        strokeWidth="1.2"
        fill={on(['full','skin']) ? 'rgba(181,96,74,0.06)' : 'transparent'}
      />

      {/* Jaw / chin area */}
      <path d="M 40 148 Q 80 185 120 148"
        stroke={ac(['jaw'])} strokeWidth={stk(['jaw'])} strokeLinecap="round"
        fill="none"
      />

      {/* Left cheek */}
      <ellipse cx="44" cy="122" rx="16" ry="12"
        stroke={ac(['cheeks'])} strokeWidth={stk(['cheeks'])}
        strokeDasharray={on(['cheeks']) ? '0' : '3 3'}
        fill={fil(['cheeks'])}
      />
      {/* Right cheek */}
      <ellipse cx="116" cy="122" rx="16" ry="12"
        stroke={ac(['cheeks'])} strokeWidth={stk(['cheeks'])}
        strokeDasharray={on(['cheeks']) ? '0' : '3 3'}
        fill={fil(['cheeks'])}
      />

      {/* Left brow */}
      <path d="M 46 72 Q 62 64 76 68"
        stroke={ac(['brows'])} strokeWidth={on(['brows']) ? 2.5 : 1.5}
        strokeLinecap="round"
      />
      {/* Right brow */}
      <path d="M 84 68 Q 98 64 114 72"
        stroke={ac(['brows'])} strokeWidth={on(['brows']) ? 2.5 : 1.5}
        strokeLinecap="round"
      />

      {/* Left eye almond */}
      <path d="M 47 84 Q 60 76 73 84 Q 60 92 47 84 Z"
        stroke={ac(['eyes','lids'])} strokeWidth={stk(['eyes','lids'])}
        fill={fil(['eyes','lids'])}
      />
      {/* Left pupil */}
      <circle cx="60" cy="84" r="3.5"
        fill={on(['eyes','lids']) ? 'rgba(181,96,74,0.35)' : 'var(--line)'}
      />
      {/* Right eye almond */}
      <path d="M 87 84 Q 100 76 113 84 Q 100 92 87 84 Z"
        stroke={ac(['eyes','lids'])} strokeWidth={stk(['eyes','lids'])}
        fill={fil(['eyes','lids'])}
      />
      {/* Right pupil */}
      <circle cx="100" cy="84" r="3.5"
        fill={on(['eyes','lids']) ? 'rgba(181,96,74,0.35)' : 'var(--line)'}
      />

      {/* Nose bridge */}
      <path d="M 80 96 L 75 114 Q 80 118 85 114"
        stroke="var(--line)" strokeWidth="1" strokeLinecap="round"
      />

      {/* Upper lip */}
      <path d="M 63 138 Q 71 133 80 135 Q 89 133 97 138"
        stroke={ac(['lips'])} strokeWidth={stk(['lips'])} strokeLinecap="round"
      />
      {/* Lower lip */}
      <path d="M 63 138 Q 72 150 80 152 Q 88 150 97 138"
        stroke={ac(['lips'])} strokeWidth={stk(['lips'])}
        fill={fil(['lips'])}
      />
      {/* Cupid's bow dip */}
      <path d="M 72 138 Q 80 142 88 138"
        stroke={ac(['lips'])} strokeWidth={on(['lips']) ? 1 : 0.5}
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
export default function TutorialPage() {
  const router = useRouter();

  const [lookId,         setLookId]        = useState<string>('no-makeup');
  const [selfie,         setSelfie]         = useState<string | null>(null);
  const [activeStep,     setActiveStep]     = useState<number>(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [generating,     setGenerating]     = useState(true);
  const [faceAnalysis,   setFaceAnalysis]   = useState<FaceAnalysis | null>(null);
  const [aiSteps,        setAiSteps]        = useState<AIStep[] | null>(null);
  const [apiError,       setApiError]       = useState(false);
  const [loadPhase,      setLoadPhase]      = useState(0);

  /* Rotate load message */
  useEffect(() => {
    if (!generating) return;
    const t = setInterval(() => setLoadPhase(p => (p + 1) % LOAD_PHASES.length), 1800);
    return () => clearInterval(t);
  }, [generating]);

  /* Hydrate + call API */
  useEffect(() => {
    const s = sessionStorage.getItem('medusa_selfie');
    const l = sessionStorage.getItem('medusa_look') || 'no-makeup';
    if (!s) { router.push('/start'); return; }
    setSelfie(s);
    setLookId(l);

    fetch('/api/analyze', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ image: s, lookId: l }),
    })
      .then(r  => r.json())
      .then(data => {
        if (data.faceAnalysis && Array.isArray(data.steps) && data.steps.length > 0) {
          setFaceAnalysis(data.faceAnalysis);
          setAiSteps(data.steps);
        } else {
          setApiError(true);
        }
      })
      .catch(() => setApiError(true))
      .finally(() => setGenerating(false));
  }, [router]);

  const staticTutorial = TUTORIALS[lookId] ?? TUTORIALS['no-makeup'];

  const steps: DisplayStep[] = aiSteps
    ? aiSteps.map(s => ({
        title: s.title, detail: s.description, visualGuide: s.visualGuide,
        expectedOutcome: s.expectedOutcome, tip: s.proTip,
        duration: s.duration, products: s.products, zone: s.zone ?? 'full',
      }))
    : staticTutorial.steps;

  const tutorialTitle    = staticTutorial.title;
  const tutorialSubtitle = faceAnalysis?.summary ?? staticTutorial.subtitle;
  const totalSteps       = steps.length;
  const progress         = totalSteps > 0 ? completedSteps.size / totalSteps : 0;
  const allDone          = completedSteps.size === totalSteps && totalSteps > 0;

  const toggleStep = (i: number) => {
    setCompletedSteps(prev => {
      const n = new Set(prev);
      if (n.has(i)) n.delete(i); else n.add(i);
      return n;
    });
  };

  const markDoneAndAdvance = () => {
    toggleStep(activeStep);
    if (activeStep < totalSteps - 1) setActiveStep(activeStep + 1);
  };

  const step = steps[activeStep];

  /* ── Loading screen ─────────────────────────────────────────── */
  if (generating) {
    return (
      <div style={{
        background: 'var(--bg)', minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 32,
      }}>
        <div style={{ position: 'relative', width: 96, height: 96 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              position: 'absolute', inset: i * 11,
              borderRadius: '50%', border: '1.5px solid transparent',
              borderTopColor: `rgba(181,96,74,${0.82 - i * 0.24})`,
              animation: `spin ${1.1 + i * 0.42}s linear infinite${i % 2 ? ' reverse' : ''}`,
            }} />
          ))}
          {selfie && (
            <div style={{
              position: 'absolute', inset: 20, borderRadius: '50%', overflow: 'hidden',
              border: '1px solid var(--line)',
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selfie} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center' }}>
          <p className="serif" style={{ fontSize: 22, color: 'var(--text)', marginBottom: 8 }}>
            AI is reading your face
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-2)', minHeight: 20 }}>
            {LOAD_PHASES[loadPhase]}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {[0, 1, 2, 3].map(i => (
            <span key={i} className="pulse-dot" style={{
              width: 6, height: 6, borderRadius: '50%',
              background: 'var(--accent)', animationDelay: `${i * 0.22}s`,
            }} />
          ))}
        </div>
      </div>
    );
  }

  /* ── Tutorial UI ────────────────────────────────────────────── */
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Navbar />

      <main style={{ paddingTop: 'calc(var(--nav-h) + 40px)', paddingBottom: 80 }}>
        <div className="wrap" style={{ maxWidth: 1020 }}>

          {/* ── Header ──────────────────────────────────────── */}
          <div className="anim-fade-up" style={{ marginBottom: 32 }}>
            <span className="tag" style={{ marginBottom: 14, display: 'inline-flex' }}>Step 03 of 03 — Your Tutorial</span>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 260 }}>
                {apiError && (
                  <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6, letterSpacing: '0.07em' }}>
                    Curated steps — AI unavailable
                  </p>
                )}
                <h1 className="serif" style={{
                  fontSize: 'clamp(28px, 4.5vw, 50px)', lineHeight: 1.04,
                  letterSpacing: '-0.025em', color: 'var(--text)', marginBottom: 5,
                }}>
                  {tutorialTitle}
                </h1>
                <p className="serif-italic" style={{ fontSize: 15, color: 'var(--text-2)', marginBottom: 12 }}>
                  {tutorialSubtitle}
                </p>
                {faceAnalysis && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {[
                      faceAnalysis.undertone + ' undertone',
                      faceAnalysis.depth + ' skin',
                      faceAnalysis.faceShape + ' face',
                      faceAnalysis.eyeShape + ' eyes',
                      faceAnalysis.standoutFeature,
                    ].map((t, i) => (
                      <span key={i} className="tag tag-accent" style={{ fontSize: 10, padding: '3px 10px' }}>{t}</span>
                    ))}
                  </div>
                )}
              </div>
              {selfie && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 2 }}>{completedSteps.size} / {totalSteps} complete</p>
                    <p className="serif" style={{ fontSize: 20, color: 'var(--text)' }}>{Math.round(progress * 100)}%</p>
                  </div>
                  <div style={{ position: 'relative', width: 52, height: 52 }}>
                    <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(181,96,74,.25)' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={selfie} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <svg viewBox="0 0 52 52" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                      <circle cx="26" cy="26" r="24" fill="none" stroke="rgba(181,96,74,.1)" strokeWidth="2" />
                      <circle cx="26" cy="26" r="24" fill="none" stroke="var(--accent)" strokeWidth="2"
                        strokeDasharray={`${2 * Math.PI * 24}`}
                        strokeDashoffset={`${2 * Math.PI * 24 * (1 - progress)}`}
                        style={{ transition: 'stroke-dashoffset .5s ease' }}
                      />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ height: 2, background: 'var(--line)', borderRadius: 2, overflow: 'hidden', marginBottom: 28 }}>
            <div style={{
              height: '100%', width: `${progress * 100}%`,
              background: 'linear-gradient(90deg, var(--accent-lo), var(--accent-hi))',
              transition: 'width .5s ease',
            }} />
          </div>

          {/* ── Main layout ─────────────────────────────────── */}
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

            {/* ─ Left: step list ─ */}
            <div style={{ width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
              {steps.map((s, i) => {
                const isDone   = completedSteps.has(i);
                const isActive = activeStep === i;
                return (
                  <button
                    key={i}
                    onClick={() => setActiveStep(i)}
                    className={`step-btn${isActive ? ' active' : ''}${isDone ? ' done' : ''}`}
                  >
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isDone ? 'var(--accent)' : isActive ? 'rgba(181,96,74,.12)' : 'var(--bg-surface)',
                      border: `1px solid ${isDone ? 'var(--accent)' : isActive ? 'rgba(181,96,74,.4)' : 'var(--line)'}`,
                    }}>
                      {isDone ? (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <span className="serif" style={{ fontSize: 10, color: isActive ? 'var(--accent)' : 'var(--text-3)' }}>
                          {String(i + 1).padStart(2, '0')}
                        </span>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontSize: 12.5, fontWeight: isActive ? 500 : 400,
                        color: isDone ? 'var(--text-3)' : isActive ? 'var(--text)' : 'var(--text-2)',
                        textDecoration: isDone ? 'line-through' : 'none',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {s.title}
                      </p>
                      <p style={{ fontSize: 10.5, color: 'var(--text-3)' }}>{s.duration}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* ─ Right: step detail ─ */}
            <div style={{ flex: 1, minWidth: 0, position: 'sticky', top: 'calc(var(--nav-h) + 16px)' }}>
              <div style={{
                background: 'var(--bg-card)', border: '1px solid var(--line)',
                borderRadius: 24, overflow: 'hidden',
              }}>

                {/* Step header bar */}
                <div style={{
                  padding: '24px 32px 20px',
                  borderBottom: '1px solid var(--line-subtle)',
                  display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16,
                }}>
                  <div>
                    <p className="serif" style={{ fontSize: 10, color: 'var(--accent)', letterSpacing: '0.18em', marginBottom: 5 }}>
                      STEP {String(activeStep + 1).padStart(2, '0')} OF {String(totalSteps).padStart(2, '0')}
                    </p>
                    <h2 className="serif" style={{ fontSize: 'clamp(22px, 2.8vw, 30px)', color: 'var(--text)', lineHeight: 1.08 }}>
                      {step.title}
                    </h2>
                  </div>
                  <span style={{
                    fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap',
                    border: '1px solid var(--line)', padding: '4px 12px',
                    borderRadius: 100, flexShrink: 0, marginTop: 4,
                  }}>
                    {step.duration}
                  </span>
                </div>

                {/* Two-column content */}
                <div style={{ display: 'flex', gap: 0 }}>

                  {/* Face zone illustration */}
                  <div style={{
                    width: 140, flexShrink: 0,
                    borderRight: '1px solid var(--line-subtle)',
                    padding: '24px 20px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                    background: 'var(--bg-surface)',
                  }}>
                    <div style={{ width: 100, height: 126 }}>
                      <FaceZoneSVG zone={step.zone} />
                    </div>
                    <p style={{
                      fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase',
                      color: 'var(--accent)', fontWeight: 500, textAlign: 'center',
                    }}>
                      {step.zone === 'full' ? 'Full face' :
                       step.zone === 'skin' ? 'Base skin' :
                       step.zone === 'eyes' ? 'Eye area' :
                       step.zone === 'lids' ? 'Eyelids' :
                       step.zone === 'brows' ? 'Brows' :
                       step.zone === 'cheeks' ? 'Cheeks' :
                       step.zone === 'lips' ? 'Lips' :
                       step.zone === 'jaw' ? 'Jaw line' : step.zone}
                    </p>
                  </div>

                  {/* Detail content */}
                  <div style={{ flex: 1, padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>

                    {/* Main description */}
                    <p style={{ fontSize: 15, color: 'var(--text)', lineHeight: 1.78, fontWeight: 300 }}>
                      {step.detail}
                    </p>

                    {/* Visual guide */}
                    <div style={{
                      background: 'rgba(28,20,16,0.03)', border: '1px solid var(--line-subtle)',
                      borderRadius: 12, padding: '14px 18px',
                      display: 'flex', gap: 12,
                    }}>
                      <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z"/>
                          <path d="M12 8v4M12 16h.01"/>
                        </svg>
                      </span>
                      <div>
                        <p style={{ fontSize: 9, color: 'var(--text-3)', letterSpacing: '0.14em', marginBottom: 5, fontWeight: 600, textTransform: 'uppercase' }}>
                          How to apply
                        </p>
                        <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.65 }}>
                          {step.visualGuide}
                        </p>
                      </div>
                    </div>

                    {/* Expected outcome */}
                    <div style={{
                      background: 'rgba(181,96,74,0.05)', border: '1px solid rgba(181,96,74,0.18)',
                      borderRadius: 12, padding: '14px 18px',
                      display: 'flex', gap: 12,
                    }}>
                      <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      </span>
                      <div>
                        <p style={{ fontSize: 9, color: 'var(--accent)', letterSpacing: '0.14em', marginBottom: 5, fontWeight: 600, textTransform: 'uppercase' }}>
                          Expected result
                        </p>
                        <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.65 }}>
                          {step.expectedOutcome}
                        </p>
                      </div>
                    </div>

                    {/* Products */}
                    {step.products && step.products.length > 0 && (
                      <div>
                        <p style={{ fontSize: 9, color: 'var(--text-3)', letterSpacing: '0.12em', marginBottom: 7, fontWeight: 600, textTransform: 'uppercase' }}>
                          You&apos;ll need
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                          {step.products.map((p, j) => (
                            <span key={j} style={{
                              fontSize: 11.5, padding: '4px 12px', borderRadius: 100,
                              border: '1px solid var(--line)',
                              color: 'var(--text-2)', background: 'var(--bg-surface)',
                            }}>
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Pro tip */}
                    <div style={{
                      background: 'linear-gradient(135deg, rgba(181,96,74,0.06), rgba(181,96,74,0.03))',
                      border: '1px solid rgba(181,96,74,0.16)',
                      borderRadius: 12, padding: '14px 18px',
                      display: 'flex', gap: 12,
                    }}>
                      <span style={{ color: 'var(--accent)', fontSize: 13, flexShrink: 0, marginTop: 2 }}>✦</span>
                      <div>
                        <p style={{ fontSize: 9, color: 'var(--accent)', letterSpacing: '0.14em', marginBottom: 5, fontWeight: 600, textTransform: 'uppercase' }}>
                          Pro Tip
                        </p>
                        <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.65 }}>
                          {step.tip}
                        </p>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Controls bar */}
                <div style={{
                  padding: '18px 28px',
                  borderTop: '1px solid var(--line-subtle)',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <button
                    onClick={() => completedSteps.has(activeStep) ? toggleStep(activeStep) : markDoneAndAdvance()}
                    className="btn btn-accent"
                    style={{
                      flex: 1,
                      background: completedSteps.has(activeStep) ? 'var(--bg-surface)' : 'var(--accent)',
                      color:      completedSteps.has(activeStep) ? 'var(--text-2)'    : '#fff',
                      border:     completedSteps.has(activeStep) ? '1px solid var(--line)' : 'none',
                    }}
                  >
                    {completedSteps.has(activeStep) ? '↩ Undo' : activeStep === totalSteps - 1 ? '✓ Complete look' : '✓ Done — next step →'}
                  </button>

                  <button
                    onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
                    className="btn btn-ghost"
                    disabled={activeStep === 0}
                    style={{ padding: '13px 16px', opacity: activeStep === 0 ? 0.38 : 1 }}
                  >
                    ←
                  </button>
                  <button
                    onClick={() => setActiveStep(Math.min(totalSteps - 1, activeStep + 1))}
                    className="btn btn-ghost"
                    disabled={activeStep === totalSteps - 1}
                    style={{ padding: '13px 16px', opacity: activeStep === totalSteps - 1 ? 0.38 : 1 }}
                  >
                    →
                  </button>
                </div>

                {/* Completion */}
                {allDone && (
                  <div className="anim-fade-in" style={{
                    margin: '0 20px 20px',
                    background: 'rgba(181,96,74,0.07)',
                    border: '1px solid rgba(181,96,74,0.22)',
                    borderRadius: 16, padding: '28px',
                    textAlign: 'center',
                  }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: '50%',
                      background: 'var(--accent)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 14px',
                      boxShadow: '0 0 28px rgba(181,96,74,.28)',
                    }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <p className="serif" style={{ fontSize: 24, color: 'var(--text)', marginBottom: 4 }}>
                      Make them stop. ✦
                    </p>
                    <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 22 }}>
                      All {totalSteps} steps complete.
                    </p>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                      <button onClick={() => router.push('/start/look')} className="btn btn-ghost btn-sm">
                        Try another look
                      </button>
                      <button onClick={() => router.push('/start')} className="btn btn-dark btn-sm">
                        Start over →
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
