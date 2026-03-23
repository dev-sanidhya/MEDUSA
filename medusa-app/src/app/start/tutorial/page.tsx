'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import MakeupPreview from '@/components/MakeupPreview';
import TechniqueAnimation from '@/components/TechniqueAnimation';
import type { FaceLandmarks } from '@/lib/makeup-canvas';

/* ═══ Types ═══════════════════════════════════════════════════════ */
interface FaceAnalysis {
  undertone: string; depth: string; faceShape: string;
  eyeShape: string; standoutFeature: string; summary: string;
}
interface Step {
  title: string; detail: string; visualGuide: string;
  expectedOutcome: string; tip: string; duration: string;
  products: string[]; zone: string;
}
interface AIStep {
  id: number; title: string; description: string; visualGuide: string;
  expectedOutcome: string; proTip: string; duration: string;
  products: string[]; zone: string;
}

/* ═══ Static fallback tutorials ══════════════════════════════════ */
const TUTORIALS: Record<string, { title: string; subtitle: string; steps: Step[] }> = {
  'no-makeup': {
    title: 'No-Makeup Makeup', subtitle: 'Your skin, but better.',
    steps: [
      { title: 'Skin Prep', detail: 'Apply a lightweight hydrating serum all over the face. Press gently with your palms — don\'t rub. Let it sink in 60 seconds.', visualGuide: 'Using both palms, press the serum into your face in gentle inward-outward motions from the nose bridge outward. No rubbing.', expectedOutcome: 'Skin looks plumped and slightly dewy — a healthy canvas before any base product.', tip: 'Damp skin absorbs serum faster. Apply right after cleansing.', duration: '2 min', products: ['Hydrating serum'], zone: 'full' },
      { title: 'SPF Moisturiser', detail: 'Apply SPF30+ moisturiser all over face and down the neck. This is your actual canvas.', visualGuide: 'Dot 5 points (forehead, both cheeks, nose, chin), then smooth outward from centre using three fingers.', expectedOutcome: 'Face looks matte-smooth with a fresh, cared-for finish. Neck matches.', tip: 'SPF is the single most impactful anti-ageing product — never skip it.', duration: '1 min', products: ['SPF moisturiser'], zone: 'skin' },
      { title: 'Tinted Moisturiser', detail: 'Dot tinted moisturiser on forehead, nose, cheeks and chin. Blend outward with warm fingers.', visualGuide: 'Blend with fingertips using outward circular motions from the centre. Warm the product first by rubbing fingers together.', expectedOutcome: 'Skin has even, natural coverage — your real skin texture still shows through.', tip: 'Fingers are warmer than tools = the most skin-like blend.', duration: '3 min', products: ['Tinted moisturiser'], zone: 'skin' },
      { title: 'Concealer', detail: 'Dab concealer under the eyes and over spots. Blend with a damp sponge using patting motions only.', visualGuide: 'Pat, never drag. Press the sponge in small downward taps starting from the inner corner outward.', expectedOutcome: 'Under-eye area looks bright and rested, blemishes invisible against the base.', tip: 'Pat, never drag — dragging lifts product off the skin.', duration: '2 min', products: ['Concealer', 'Damp sponge'], zone: 'eyes' },
      { title: 'Cream Blush', detail: 'Smile lightly. Apply sheer cream blush to the apples of the cheeks and blend upward toward temples.', visualGuide: 'Use fingertips to press blush onto the apples, then sweep upward in a C-curve toward the temple. Keep it sheer.', expectedOutcome: 'Cheeks have a natural, sun-kissed flush that looks like it came from the skin.', tip: 'Cream on warm skin gives the most natural flush.', duration: '2 min', products: ['Cream blush'], zone: 'cheeks' },
      { title: 'Brow Gel', detail: 'Brush brows upward with clear or tinted brow gel. Fill any sparse areas with short hairlike strokes.', visualGuide: 'Brush upward from the inner brow first, then follow the natural arch upward-and-outward in short strokes.', expectedOutcome: 'Brows look groomed, fluffy and defined — framing the face without looking heavy.', tip: 'Fluffy upward brows give a natural lift to the entire face.', duration: '2 min', products: ['Brow gel'], zone: 'brows' },
      { title: 'Mascara', detail: 'Apply one coat of mascara. Wiggle the wand at the root and pull upward to the tip.', visualGuide: 'Hold the wand horizontally, press at the root and wiggle gently while pulling upward in one smooth motion per lash group.', expectedOutcome: 'Lashes look lengthened and defined — eyes look open without looking "done."', tip: 'One careful coat > three clumpy ones. Let it dry before a second.', duration: '1 min', products: ['Mascara'], zone: 'lids' },
      { title: 'Tinted Lip Balm', detail: 'Apply a sheer tinted balm in a warm rose or nude. Press lips together to distribute.', visualGuide: 'Apply directly from the bullet with a light press. Then press lips together once to blend evenly.', expectedOutcome: 'Lips look hydrated, naturally flushed — slightly more "you" but effortless.', tip: 'Match the balm to your natural lip colour, just amplified.', duration: '30 sec', products: ['Tinted lip balm'], zone: 'lips' },
    ],
  },
  'smoky-eye': {
    title: 'Smoky Eye', subtitle: 'Dark. Magnetic. Yours.',
    steps: [
      { title: 'Eye Primer', detail: 'Apply a thin layer of eye primer from lid to brow bone. Let dry 30 seconds.', visualGuide: 'Using a fingertip, tap primer across the entire lid and up to the brow bone in a sheer thin layer.', expectedOutcome: 'Lid has a smooth matte base — eyeshadow will stay put all night.', tip: 'Primer is the difference between 2-hour and 12-hour shadow.', duration: '1 min', products: ['Eye primer'], zone: 'lids' },
      { title: 'Base Shadow', detail: 'Pack a medium grey or brown shadow over the entire lid with a flat brush.', visualGuide: 'Using a flat shader brush, press shadow in short tapping motions from the inner lid to the outer corner. Build depth with 2–3 passes.', expectedOutcome: 'The entire lid is covered in a medium-depth shadow — the base for deeper blending.', tip: 'The base layer sets the depth. Go darker than you think you need to.', duration: '2 min', products: ['Medium eyeshadow', 'Flat shader brush'], zone: 'lids' },
      { title: 'Deep Outer V', detail: 'Press a dark black-brown into the outer V corner pointing toward the temple.', visualGuide: 'Using a small pencil brush, press shadow into the outer corner in a V shape. Angle the outer point toward your temple, not downward.', expectedOutcome: 'A deep V shadow defines the outer corner, giving the eye a pulled-back sultry shape.', tip: 'The V point should angle up and out — never straight down.', duration: '3 min', products: ['Dark eyeshadow', 'Pencil brush'], zone: 'eyes' },
      { title: 'Blend', detail: 'Use a fluffy blending brush in windshield-wiper motions until no harsh lines remain.', visualGuide: 'Use a large clean fluffy brush in rapid side-to-side windshield-wiper motions across the crease.', expectedOutcome: 'All shadow edges are seamlessly diffused — the eye looks like one deep gradient wash.', tip: 'Good smoky eyes are 80% blending. Never skip this step.', duration: '4 min', products: ['Fluffy blending brush'], zone: 'eyes' },
      { title: 'Lower Lash Line', detail: 'Use a pencil brush to smudge dark shadow along the lower lash line, connecting to the outer V.', visualGuide: 'Rest a thin pencil brush just under the lower lashes and drag outward toward the outer corner in one smooth stroke.', expectedOutcome: 'Lower lash line is defined and smoky — the eye looks fully encircled and intense.', tip: 'Don\'t overdo the inner corner lower lash — it closes the eye.', duration: '2 min', products: ['Pencil brush', 'Dark shadow'], zone: 'eyes' },
      { title: 'Kohl Waterline', detail: 'Line the waterline with black kohl and smudge immediately with a cotton bud.', visualGuide: 'Pull the lower lid gently down, draw the kohl in one smooth stroke. Immediately smudge in side-to-side motions.', expectedOutcome: 'Waterline is dark and smudged — the look reaches maximum depth and intensity.', tip: 'Smudging the kohl immediately turns "liner" into "smoky."', duration: '1 min', products: ['Black kohl', 'Cotton bud'], zone: 'eyes' },
      { title: 'Mascara × 2', detail: 'Two coats of volumising mascara. Let the first dry before the second. Use a lash comb between coats.', visualGuide: 'Wiggle the wand at the root then pull upward. After coat 1 dries, use a lash comb to separate, then apply coat 2.', expectedOutcome: 'Lashes are thick, separated and fanned — the perfect frame for a smoky eye.', tip: 'A lash comb between coats is the single most underrated beauty tool.', duration: '3 min', products: ['Volumising mascara', 'Lash comb'], zone: 'lids' },
      { title: 'Skin & Lip', detail: 'Apply a light coverage base only. Finish with a nude or dusty rose lip balm — nothing more.', visualGuide: 'Warm a drop of skin tint between fingers and press onto the face. Finish lips with one swipe of tinted balm.', expectedOutcome: 'The face looks polished but effortless — all attention stays on the dramatic eyes.', tip: 'Bold eye + bold lip = overdone. Restraint is the move.', duration: '2 min', products: ['Skin tint', 'Nude lip balm'], zone: 'lips' },
    ],
  },
  'glass-skin': {
    title: 'Dewy Glass Skin', subtitle: 'Lit from within.',
    steps: [
      { title: 'Double Cleanse', detail: 'Oil cleanser first to dissolve SPF and makeup, then foam cleanser. Pat dry — never rub.', visualGuide: 'Massage oil cleanser in circular motions for 60 seconds. Rinse. Follow with foam cleanser for 30 seconds.', expectedOutcome: 'Skin feels completely clean, not tight — the ideal blank canvas for hydration.', tip: 'Glass skin is impossible without a genuinely clean base.', duration: '4 min', products: ['Oil cleanser', 'Foam cleanser'], zone: 'full' },
      { title: 'Layered Essence', detail: 'Pour a few drops onto both palms and press into skin. Repeat twice.', visualGuide: 'Warm the essence between both palms, then press hands flat against your face and hold for 3 seconds. Repeat twice more.', expectedOutcome: 'Skin looks visibly plumped and slightly translucent — the first sign of glass skin.', tip: 'Layering thin hydration beats applying one thick layer.', duration: '2 min', products: ['Hydrating essence'], zone: 'skin' },
      { title: 'HA Serum', detail: 'Apply 2–3 drops of hyaluronic acid serum to slightly damp skin. Press in with fingertips.', visualGuide: 'Lightly mist skin first or apply immediately after essence while damp. Press serum in with flat palms — no rubbing.', expectedOutcome: 'Skin looks plump and bouncy — pressing a finger leaves a momentary indentation then springs back.', tip: 'HA needs moisture to work. Always apply on damp skin.', duration: '1 min', products: ['Hyaluronic acid serum'], zone: 'full' },
      { title: 'Gel Moisturiser', detail: 'Apply a gel-cream moisturiser, focusing on any dry patches around the nose and cheeks.', visualGuide: 'Dot 5 points and blend outward with three-finger strokes. Use extra on dry patches with a gentle circular press.', expectedOutcome: 'Skin has a smooth, cushioned feel — the base now has the perfect glow texture.', tip: 'Gel textures give the glass-skin effect without heaviness.', duration: '2 min', products: ['Gel moisturiser'], zone: 'skin' },
      { title: 'Skin Tint Mix', detail: 'Mix one drop of skin tint with a small amount of your moisturiser on the back of the hand. Apply with fingers.', visualGuide: 'Mix on hand, then press onto the centre of the face and blend outward with warm fingertips. Skip the edges completely.', expectedOutcome: 'Skin looks like a flawless version of itself — texture still visible, but evened out.', tip: 'The goal is "your skin in HD" — not foundation coverage.', duration: '2 min', products: ['Skin tint'], zone: 'skin' },
      { title: 'Liquid Highlight', detail: 'Dot liquid highlighter on cheekbones, inner corners of eyes, brow bone and cupid\'s bow.', visualGuide: 'Using a fingertip, press a tiny dot on each point. Barely press — the warmth of your skin will blend it.', expectedOutcome: 'High points of the face appear lit from within — a three-dimensional, dewy glow.', tip: 'One precise dot per point beats smearing it everywhere.', duration: '2 min', products: ['Liquid highlighter'], zone: 'cheeks' },
      { title: 'Jelly Blush', detail: 'Apply sheer jelly blush to the cheeks and a touch on the nose bridge. Blend quickly.', visualGuide: 'Tap blush onto the apples of the cheeks with fingertips and blend upward in circular motions in under 10 seconds.', expectedOutcome: 'Cheeks have a flushed, "just came in from outside" glow — natural and youthful.', tip: 'Nose bridge blush is the most underrated detail in K-beauty.', duration: '1 min', products: ['Jelly blush'], zone: 'cheeks' },
      { title: 'Setting Mist', detail: 'Hold spray 30 cm from the face, mist in a figure-8 pattern. Air-dry — do not rub or pat.', visualGuide: 'Hold the bottle at arm\'s length and move in a slow figure-8 pattern. Keep eyes closed. Let air dry for 20 seconds.', expectedOutcome: 'All layers fuse into one seamless, skin-like finish — the glass-skin effect is complete.', tip: 'Never pat after misting — it disrupts the surface.', duration: '1 min', products: ['Setting spray'], zone: 'full' },
    ],
  },
  'bold-lip': {
    title: 'Bold Lip', subtitle: 'One move. Everything.',
    steps: [
      { title: 'Minimal Base', detail: 'Light skin tint only — no heavy foundation. The lip is the entire look.', visualGuide: 'Warm a small amount of skin tint on the back of the hand, then press with fingertips outward from the centre.', expectedOutcome: 'Face looks fresh and polished but natural — a neutral background for the lip.', tip: 'Heavy base + bold lip = overdone. The edit is everything.', duration: '3 min', products: ['Skin tint'], zone: 'skin' },
      { title: 'Lip Canvas Prep', detail: 'Dab a tiny amount of concealer over the lip line and blur outward to create a blank, defined canvas.', visualGuide: 'Using a flat concealer brush, press a thin layer of concealer directly onto and just outside the lip line.', expectedOutcome: 'Lips have a clean, slightly defined edge — the perfect blank canvas for crisp colour.', tip: 'This one step makes lipstick look 10× more editorial.', duration: '1 min', products: ['Concealer', 'Flat brush'], zone: 'lips' },
      { title: 'Liner: Outline', detail: 'Line the lips precisely with a liner matching your lipstick shade. Follow or very slightly overline the cupid\'s bow only.', visualGuide: 'Start at the cupid\'s bow peaks, draw outward to each corner. Then line the bottom in one smooth stroke per side.', expectedOutcome: 'Lips have a crisp, defined outline that follows their natural shape.', tip: 'Matching liner always looks better than nude liner under a bold lip.', duration: '2 min', products: ['Lip liner'], zone: 'lips' },
      { title: 'Liner: Fill', detail: 'Fill the entire lip with the liner as a base. This makes the colour last 4+ hours.', visualGuide: 'Using short back-and-forth strokes, fill inward from the outline until the entire lip surface is covered.', expectedOutcome: 'Entire lip is covered in a matte base colour — the foundation for long-lasting intensity.', tip: 'Liner as a base is the oldest and most effective pro trick.', duration: '1 min', products: ['Lip liner'], zone: 'lips' },
      { title: 'First Coat', detail: 'Apply lipstick directly from the bullet in one precise coat. Follow the shape exactly.', visualGuide: 'Apply from the centre of the upper lip outward in two strokes. Then the lower lip centre outward in two strokes.', expectedOutcome: 'A rich first layer of colour sits on the lip with even saturation.', tip: 'Natural lip position gives the most accurate application.', duration: '1 min', products: ['Lipstick'], zone: 'lips' },
      { title: 'Blot + Second Coat', detail: 'Press a tissue between the lips once. Apply a second full coat directly on top.', visualGuide: 'Press lips against tissue without moving. Reapply the second coat identically to the first.', expectedOutcome: 'Colour is deeply saturated and transfer-proof — this is the "all-day" look.', tip: 'Two thin layers outlast one thick layer by hours.', duration: '2 min', products: ['Tissue', 'Lipstick'], zone: 'lips' },
      { title: 'Edge Clean-up', detail: 'Dip a small flat concealer brush in concealer and trace the exact outer edge of the lips.', visualGuide: 'Hold a small flat brush like a pen. Trace just outside the liner with controlled single strokes — upper lip first, then lower.', expectedOutcome: 'The lip edge is razor-sharp and precise — this is the difference between "nice" and "editorial."', tip: 'This step separates amateur from professional results.', duration: '2 min', products: ['Concealer', 'Flat brush'], zone: 'lips' },
      { title: 'Eyes: Mascara Only', detail: 'One coat of mascara. Nothing else on the eyes — the lip is the entire statement.', visualGuide: 'Single coat, wand at root, pull upward. Done.', expectedOutcome: 'Eyes look awake and polished but invisible — all focus goes to the lip.', tip: 'Restraint is the hardest and most powerful beauty skill.', duration: '1 min', products: ['Mascara'], zone: 'lids' },
    ],
  },
  'editorial': {
    title: 'Editorial Look', subtitle: 'Runway-ready.',
    steps: [
      { title: 'Flawless Base', detail: 'Apply primer, full-coverage foundation, and bake under the eyes with translucent loose powder.', visualGuide: 'Apply foundation with a damp sponge in pressing motions. Then press loose powder under the eyes and leave to bake for 5 minutes.', expectedOutcome: 'Skin is porcelain-smooth with zero texture — a completely even surface ready for graphic work.', tip: 'Editorial base is about sculpted perfection, not natural skin.', duration: '8 min', products: ['Primer', 'Foundation', 'Loose powder'], zone: 'full' },
      { title: 'Sketch in Grey', detail: 'Using a fine brush and grey eyeshadow, sketch the exact graphic liner shape before committing.', visualGuide: 'Load a thin liner brush with grey shadow. Lightly sketch the shape — all angles, flicks, and extensions exactly as you want them.', expectedOutcome: 'A ghost-line of the design appears on the lid — a precise template for the final liner.', tip: 'Never draw graphic liner freehand on the first attempt.', duration: '3 min', products: ['Grey eyeshadow', 'Liner brush'], zone: 'eyes' },
      { title: 'Execute in Gel', detail: 'Go over your grey sketch with black gel or liquid liner, using short connected strokes.', visualGuide: 'Using a pointed liner brush, trace over the grey sketch with short overlapping strokes — never one long drag.', expectedOutcome: 'The graphic design is sharp, intense, and precise — exactly as sketched.', tip: 'Short strokes give control. One long stroke gives mistakes.', duration: '5 min', products: ['Gel liner', 'Pointed brush'], zone: 'lids' },
      { title: 'Bold Colour', detail: 'Apply one bold colour (cobalt, orange, violet) across the lid and lower lash line. Keep blending minimal.', visualGuide: 'Pack colour with a flat shader brush using tapping motions. Do not over-blend.', expectedOutcome: 'The lid shows a bold saturated block of colour — deliberate, graphic, and undiluted.', tip: 'Intentionally unblended colour reads as "chosen," not sloppy.', duration: '4 min', products: ['Bold eyeshadow', 'Shader brush'], zone: 'lids' },
      { title: 'Contour + Sculpt', detail: 'Apply cool-toned contour powder under cheekbones, temples and jawline.', visualGuide: 'Using a small contour brush, apply in a C-shape from temple to under-cheek. Blend with a stippling motion inward.', expectedOutcome: 'Face structure is sharply defined — cheekbones, temples and jaw read clearly even under flat light.', tip: 'Editorial contour is sharper than everyday — don\'t be timid.', duration: '4 min', products: ['Contour powder', 'Contour brush'], zone: 'jaw' },
      { title: 'Statement Brows', detail: 'Fill brows in fully with a flat angled brush and pomade. Square off the tails.', visualGuide: 'Using an angled brush, fill with upward strokes for the body, then finish tails with a sharp horizontal stroke.', expectedOutcome: 'Brows are bold, structured and squared — they frame the graphic eye design perfectly.', tip: 'Strong squared brows give editorial energy immediately.', duration: '3 min', products: ['Brow pomade', 'Angled brush'], zone: 'brows' },
      { title: 'Lip Decision', detail: 'Choose: bold monochromatic lip matching your eyeshadow — OR a completely bare lip. No in-between.', visualGuide: 'For bold: apply two coats with precise liner. For bare: apply clear balm only. Commit fully — hesitation shows.', expectedOutcome: 'The lip either anchors the look with equal intensity or disappears completely. Both are editorial.', tip: 'In editorial beauty, the decision itself is the art.', duration: '2 min', products: ['Lipstick or clear balm'], zone: 'lips' },
      { title: 'Set Everything', detail: 'Mist with setting spray. Dust T-zone with translucent powder if needed.', visualGuide: 'Hold spray at arm\'s length and mist in a slow X pattern. Dust T-zone with a clean powder brush in light tapping motions.', expectedOutcome: 'The entire look is locked — graphic lines stay sharp and colours stay true.', tip: 'Editorial looks must survive a full shoot. Set hard.', duration: '1 min', products: ['Setting spray', 'Translucent powder'], zone: 'full' },
    ],
  },
};

const LOAD_PHASES = [
  'Reading your face structure…',
  'Detecting skin undertone…',
  'Mapping bone proportions…',
  'Writing your personalised guide…',
];

const ZONE_LABELS: Record<string, string> = {
  full: 'Full Face', skin: 'Base Skin', eyes: 'Eye Area', lids: 'Eyelids',
  brows: 'Brows', cheeks: 'Cheeks', lips: 'Lips', jaw: 'Jaw & Contour',
};

/* ═══ Component ═══════════════════════════════════════════════════ */
export default function TutorialPage() {
  const router = useRouter();

  const [lookId,         setLookId]        = useState('no-makeup');
  const [selfie,         setSelfie]        = useState<string | null>(null);
  const [activeStep,     setActiveStep]    = useState(0);
  const [completedSteps, setCompletedSteps]= useState<Set<number>>(new Set());
  const [generating,     setGenerating]    = useState(true);
  const [faceAnalysis,   setFaceAnalysis]  = useState<FaceAnalysis | null>(null);
  const [faceLandmarks,  setFaceLandmarks] = useState<FaceLandmarks | null>(null);
  const [aiSteps,        setAiSteps]       = useState<Step[] | null>(null);
  const [apiError,       setApiError]      = useState(false);
  const [loadPhase,      setLoadPhase]     = useState(0);

  /* Rotate load messages */
  useEffect(() => {
    if (!generating) return;
    const t = setInterval(() => setLoadPhase(p => (p + 1) % LOAD_PHASES.length), 1900);
    return () => clearInterval(t);
  }, [generating]);

  /* Boot: read sessionStorage, call API */
  useEffect(() => {
    const s = sessionStorage.getItem('medusa_selfie');
    const l = sessionStorage.getItem('medusa_look') || 'no-makeup';
    if (!s) { router.push('/start'); return; }
    setSelfie(s);
    setLookId(l);

    fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: s, lookId: l }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.faceAnalysis && Array.isArray(data.steps) && data.steps.length > 0) {
          setFaceAnalysis(data.faceAnalysis);
          if (data.faceLandmarks) setFaceLandmarks(data.faceLandmarks as FaceLandmarks);
          setAiSteps((data.steps as AIStep[]).map(s => ({
            title: s.title, detail: s.description,
            visualGuide: s.visualGuide, expectedOutcome: s.expectedOutcome,
            tip: s.proTip, duration: s.duration,
            products: s.products ?? [], zone: s.zone ?? 'full',
          })));
        } else {
          setApiError(true);
        }
      })
      .catch(() => setApiError(true))
      .finally(() => setGenerating(false));
  }, [router]);

  const staticTutorial = TUTORIALS[lookId] ?? TUTORIALS['no-makeup'];
  const steps: Step[]  = aiSteps ?? staticTutorial.steps;
  const step           = steps[activeStep];
  const totalSteps     = steps.length;
  const progress       = totalSteps > 0 ? completedSteps.size / totalSteps : 0;
  const allDone        = completedSteps.size === totalSteps && totalSteps > 0;

  const tutorialTitle    = staticTutorial.title;
  const tutorialSubtitle = faceAnalysis?.summary ?? staticTutorial.subtitle;

  /* Zones accumulated up to (and including) the active step */
  const accumulatedZones = useMemo(
    () => steps.slice(0, activeStep + 1).map(s => s.zone),
    [steps, activeStep],
  );

  const markDone = () => {
    setCompletedSteps(prev => { const n = new Set(prev); n.add(activeStep); return n; });
    if (activeStep < totalSteps - 1) setActiveStep(activeStep + 1);
  };

  /* ── Loading ──────────────────────────────────────────────────── */
  if (generating) {
    return (
      <div style={{
        background: 'var(--bg)', minHeight: '100vh',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 36,
      }}>
        <Navbar />

        {/* Spinning rings + selfie thumbnail */}
        <div style={{ position: 'relative', width: 112, height: 112 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              position: 'absolute', inset: i * 12,
              borderRadius: '50%',
              border: '1.5px solid transparent',
              borderTopColor: `rgba(181,96,74,${0.85 - i * 0.25})`,
              animation: `spin ${1.1 + i * 0.45}s linear infinite${i % 2 ? ' reverse' : ''}`,
            }} />
          ))}
          {selfie && (
            <div style={{ position: 'absolute', inset: 24, borderRadius: '50%', overflow: 'hidden', border: '1px solid var(--line)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selfie} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center' }}>
          <p className="serif" style={{ fontSize: 24, color: 'var(--text)', marginBottom: 10 }}>
            AI is building your guide
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-2)', minHeight: 22 }}>
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

  /* ── Completion screen ───────────────────────────────────────── */
  if (allDone) {
    return (
      <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
        <Navbar />
        <main style={{ paddingTop: 'calc(var(--nav-h) + 64px)', paddingBottom: 80 }}>
          <div className="wrap" style={{ maxWidth: 620, textAlign: 'center' }}>
            <div className="anim-fade-up">
              {/* Crown icon */}
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'var(--accent)', margin: '0 auto 32px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 40px rgba(181,96,74,0.28)',
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>

              <span className="tag" style={{ marginBottom: 20, display: 'inline-flex' }}>Tutorial complete</span>
              <h1 className="serif" style={{ fontSize: 'clamp(40px, 6vw, 64px)', lineHeight: 0.95, letterSpacing: '-0.025em', marginBottom: 18 }}>
                You're ready.
              </h1>
              <p className="serif-italic" style={{ fontSize: 18, color: 'var(--text-2)', marginBottom: 40 }}>
                {tutorialTitle} — done beautifully.
              </p>

              {selfie && (
                <div style={{
                  width: 160, height: 160, borderRadius: '50%', margin: '0 auto 40px',
                  overflow: 'hidden', border: '3px solid var(--accent)',
                  boxShadow: '0 0 0 6px rgba(181,96,74,0.12)',
                }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selfie} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button onClick={() => router.push('/looks')} className="btn btn-dark btn-lg">
                  Explore more looks →
                </button>
                <button onClick={() => { setCompletedSteps(new Set()); setActiveStep(0); }} className="btn btn-ghost">
                  Restart tutorial
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  /* ── Tutorial UI ─────────────────────────────────────────────── */
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Navbar />

      <main style={{ paddingTop: 'calc(var(--nav-h) + 36px)', paddingBottom: 120 }}>
        <div className="wrap" style={{ maxWidth: 1160 }}>

          {/* ── Header ────────────────────────────────────────── */}
          <div className="anim-fade-up" style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 260 }}>
                <span className="tag" style={{ marginBottom: 12, display: 'inline-flex' }}>
                  Step 03 of 03 — Your Tutorial
                </span>
                {apiError && (
                  <p style={{ fontSize: 10.5, color: 'var(--text-3)', marginBottom: 4, letterSpacing: '0.07em' }}>
                    Curated guide — AI unavailable
                  </p>
                )}
                <h1 className="serif" style={{ fontSize: 'clamp(26px, 3.8vw, 46px)', lineHeight: 1.05, letterSpacing: '-0.025em', color: 'var(--text)', marginBottom: 5 }}>
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
                      <span key={i} className="tag tag-accent" style={{ fontSize: 9.5, padding: '3px 10px' }}>{t}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Progress ring */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 1, letterSpacing: '0.05em' }}>
                    {completedSteps.size} of {totalSteps} done
                  </p>
                  <p className="serif" style={{ fontSize: 22, color: 'var(--text)' }}>
                    {Math.round(progress * 100)}%
                  </p>
                </div>
                {selfie && (
                  <div style={{ position: 'relative', width: 56, height: 56 }}>
                    <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(181,96,74,.2)' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={selfie} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <svg viewBox="0 0 56 56" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                      <circle cx="28" cy="28" r="26" fill="none" stroke="rgba(181,96,74,.1)" strokeWidth="2" />
                      <circle cx="28" cy="28" r="26" fill="none" stroke="var(--accent)" strokeWidth="2"
                        strokeDasharray={`${2 * Math.PI * 26}`}
                        strokeDashoffset={`${2 * Math.PI * 26 * (1 - progress)}`}
                        style={{ transition: 'stroke-dashoffset .5s ease' }}
                      />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ height: 2, background: 'var(--line)', borderRadius: 2, overflow: 'hidden', marginTop: 16 }}>
              <div style={{
                height: '100%', width: `${progress * 100}%`,
                background: 'linear-gradient(90deg, var(--accent-lo), var(--accent-hi))',
                transition: 'width .5s ease',
              }} />
            </div>
          </div>

          {/* ── Step pill navigation ─────────────────────────── */}
          <div className="anim-fade-up-d1" style={{ display: 'flex', gap: 6, marginBottom: 28, flexWrap: 'wrap' }}>
            {steps.map((s, i) => {
              const isDone   = completedSteps.has(i);
              const isActive = activeStep === i;
              return (
                <button
                  key={i}
                  onClick={() => setActiveStep(i)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 7,
                    padding: '6px 14px', borderRadius: 100, cursor: 'pointer',
                    fontSize: 11, fontWeight: isActive ? 600 : 400,
                    letterSpacing: '0.03em',
                    background: isDone ? 'var(--accent)' : isActive ? 'var(--text)' : 'var(--bg-card)',
                    color: isDone || isActive ? '#fff' : 'var(--text-3)',
                    border: `1px solid ${isDone ? 'var(--accent)' : isActive ? 'var(--text)' : 'var(--line)'}`,
                    transition: 'all .18s',
                  }}
                >
                  {isDone ? (
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <span className="serif" style={{ fontSize: 10 }}>{String(i + 1).padStart(2, '0')}</span>
                  )}
                  <span style={{ maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.title}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ── Two-panel main layout ─────────────────────────── */}
          <div className="anim-fade-up-d2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>

            {/* ─ LEFT: Technique animation panel ─ */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--line)',
              borderRadius: 24,
              overflow: 'hidden',
            }}>
              {/* Panel header */}
              <div style={{
                padding: '20px 26px 16px',
                borderBottom: '1px solid var(--line-subtle)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <p style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 4, fontWeight: 500 }}>
                    How to apply
                  </p>
                  <h2 className="serif" style={{ fontSize: 'clamp(18px, 2.2vw, 26px)', color: 'var(--text)', lineHeight: 1.08 }}>
                    {step.title}
                  </h2>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <span style={{
                    fontSize: 10, color: 'var(--accent)', padding: '3px 11px',
                    borderRadius: 100, border: '1px solid rgba(181,96,74,.3)',
                    background: 'var(--accent-tint)', fontWeight: 500, letterSpacing: '0.05em',
                  }}>
                    {ZONE_LABELS[step.zone] ?? step.zone}
                  </span>
                  <span style={{
                    fontSize: 10, color: 'var(--text-3)', padding: '3px 11px',
                    borderRadius: 100, border: '1px solid var(--line)',
                  }}>
                    {step.duration}
                  </span>
                </div>
              </div>

              {/* Technique animation */}
              <div style={{ padding: '0 32px', background: 'var(--bg-surface)', position: 'relative' }}>
                <div style={{ maxWidth: 260, margin: '0 auto' }}>
                  <TechniqueAnimation zone={step.zone} label={ZONE_LABELS[step.zone]} />
                </div>
                {/* Zone label overlay */}
                <div style={{
                  position: 'absolute', bottom: 14, left: 14,
                  background: 'rgba(250,246,241,0.88)', backdropFilter: 'blur(6px)',
                  borderRadius: 8, padding: '5px 10px',
                  fontSize: 9.5, color: 'var(--text-2)', letterSpacing: '0.08em',
                  border: '1px solid var(--line)',
                }}>
                  ◐ Animated brush guide
                </div>
              </div>

              {/* Step detail */}
              <div style={{ padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.80, fontWeight: 300 }}>
                  {step.detail}
                </p>

                {/* Visual guide callout */}
                <div style={{
                  background: 'rgba(181,96,74,0.04)',
                  border: '1px solid rgba(181,96,74,0.15)',
                  borderRadius: 12, padding: '12px 16px',
                  display: 'flex', gap: 11, alignItems: 'flex-start',
                }}>
                  <svg style={{ flexShrink: 0, marginTop: 1 }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                  </svg>
                  <p style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.72 }}>
                    <strong style={{ color: 'var(--text)', display: 'block', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3 }}>
                      Hand motion
                    </strong>
                    {step.visualGuide}
                  </p>
                </div>

                {/* Pro tip */}
                <div style={{
                  background: 'var(--bg-surface)', borderRadius: 10, padding: '10px 14px',
                  display: 'flex', gap: 10, alignItems: 'flex-start',
                }}>
                  <span style={{ color: 'var(--accent)', flexShrink: 0, fontSize: 13 }}>✦</span>
                  <p style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.65 }}>
                    <strong style={{ color: 'var(--text-2)' }}>Pro tip: </strong>
                    {step.tip}
                  </p>
                </div>

                {/* Products */}
                {step.products && step.products.length > 0 && (
                  <div>
                    <p style={{ fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 7, fontWeight: 500 }}>
                      You'll need
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {step.products.map((p, pi) => (
                        <span key={pi} style={{
                          fontSize: 10.5, padding: '3px 10px', borderRadius: 100,
                          background: 'var(--bg-card)', border: '1px solid var(--line)',
                          color: 'var(--text-2)',
                        }}>
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ─ RIGHT: User photo with makeup overlay ─ */}
            <div style={{ position: 'sticky', top: 'calc(var(--nav-h) + 16px)' }}>

              {/* Makeup result card */}
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--line)',
                borderRadius: 24,
                overflow: 'hidden',
                marginBottom: 16,
              }}>
                <div style={{ padding: '20px 26px 0' }}>
                  {selfie && (
                    <MakeupPreview
                      selfie={selfie}
                      lookId={lookId}
                      zones={accumulatedZones}
                      landmarks={faceLandmarks}
                      stepIndex={activeStep}
                      totalSteps={totalSteps}
                    />
                  )}
                </div>

                {/* Expected outcome */}
                <div style={{ padding: '16px 26px 22px' }}>
                  <div style={{
                    background: 'var(--bg-surface)', borderRadius: 12, padding: '12px 16px',
                    display: 'flex', gap: 11, alignItems: 'flex-start',
                  }}>
                    <svg style={{ flexShrink: 0, marginTop: 1 }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="1.8" strokeLinecap="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                    <p style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.72 }}>
                      <strong style={{ color: 'var(--text)', display: 'block', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3 }}>
                        Expected outcome
                      </strong>
                      {step.expectedOutcome}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={markDone}
                  className="btn btn-accent"
                  style={{ flex: 1, justifyContent: 'center', gap: 10 }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {activeStep < totalSteps - 1 ? `Done — Step ${activeStep + 2}` : 'Finish tutorial'}
                </button>

                {activeStep > 0 && (
                  <button
                    onClick={() => setActiveStep(activeStep - 1)}
                    className="btn btn-ghost btn-sm"
                    style={{ flexShrink: 0 }}
                  >
                    ← Back
                  </button>
                )}
              </div>

              {/* Step counter */}
              <p style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'center', marginTop: 12 }}>
                Step {activeStep + 1} of {totalSteps}
                {completedSteps.has(activeStep) && (
                  <span style={{ color: 'var(--accent)', marginLeft: 6 }}>✓ completed</span>
                )}
              </p>
            </div>

          </div>{/* end grid */}

        </div>
      </main>
    </div>
  );
}
