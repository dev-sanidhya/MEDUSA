'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

const TUTORIALS: Record<string, { title: string; subtitle: string; steps: { title: string; detail: string; tip: string; duration: string }[] }> = {
  'no-makeup': {
    title: 'No-Makeup Makeup',
    subtitle: 'Your skin, but better.',
    steps: [
      { title: 'Skin Prep', detail: 'Apply a lightweight hydrating serum. Press gently — don\'t rub. Let it sink in for 60 seconds.', tip: 'Damp skin absorbs product faster.', duration: '2 min' },
      { title: 'SPF Moisturizer', detail: 'Apply SPF30+ moisturizer all over. Blend down your neck. This is your canvas.', tip: 'Never skip SPF — it\'s the no. 1 anti-aging product.', duration: '1 min' },
      { title: 'Tinted Moisturizer', detail: 'Dot tinted moisturizer on forehead, nose, cheeks and chin. Blend outward with fingers for a skin-like finish.', tip: 'Fingers are warmer = more natural blend.', duration: '3 min' },
      { title: 'Concealer', detail: 'Dab concealer under eyes and over any spots. Blend with a damp sponge using patting motions.', tip: 'Pat, never drag — it lifts product off.', duration: '2 min' },
      { title: 'Cream Blush', detail: 'Smile. Apply a sheer peach or rose cream blush to the apples, blend upward toward temples.', tip: 'Cream blush on warm skin = the most natural flush.', duration: '2 min' },
      { title: 'Brow Gel', detail: 'Brush brows upward with a clear gel. Fill any sparse spots with short strokes matching your hair color.', tip: 'Fluffy brows frame everything — don\'t skip this.', duration: '2 min' },
      { title: 'Mascara', detail: 'One coat, lower lashes optional. Wiggle the wand at the root and pull through to tips.', tip: 'One careful coat > three clumpy ones.', duration: '1 min' },
      { title: 'Tinted Lip Balm', detail: 'Apply a sheer tinted balm in a warm rose or nude. Press lips together to distribute.', tip: 'Match to your natural lip color — slightly amplified.', duration: '30 sec' },
    ],
  },
  'smoky-eye': {
    title: 'Smoky Eye',
    subtitle: 'Dark. Magnetic. Yours.',
    steps: [
      { title: 'Eye Primer', detail: 'Apply a thin layer of eye primer from lid to brow bone. Let dry 30 seconds.', tip: 'Primer makes the difference between 2-hour and 12-hour shadow.', duration: '1 min' },
      { title: 'Base Shadow', detail: 'Apply a medium grey or brown to the entire lid using a flat brush. Pack it on — be bold.', tip: 'The base layer sets the depth. Go darker than you think.', duration: '2 min' },
      { title: 'Deep Outer V', detail: 'Take a dark black-brown or true black and press into the outer corner in a V shape.', tip: 'The V should point toward your temple, not down.', duration: '3 min' },
      { title: 'Blend, Blend, Blend', detail: 'Use a fluffy blending brush in windshield-wiper motions. No harsh lines should remain. This step alone takes 3 minutes.', tip: 'Good smoky eyes are 80% blending.', duration: '4 min' },
      { title: 'Lower Lash Line', detail: 'Use a pencil brush to smudge the dark shadow along the lower lash line. Connect to the outer V.', tip: 'Don\'t over-do the inner corner lower lash — it closes the eye.', duration: '2 min' },
      { title: 'Kohl / Pencil Liner', detail: 'Line the waterline with a black kohl pencil. Smudge immediately with a cotton bud for a lived-in look.', tip: 'Smudging kohl = instant sultry upgrade.', duration: '1 min' },
      { title: 'Mascara × 2', detail: 'Two coats of volumizing mascara. Let the first dry before the second. Use a lash comb between coats.', tip: 'A lash comb is the most underrated tool you own.', duration: '3 min' },
      { title: 'Keep Skin Simple', detail: 'Light coverage base only. A bold lip OR smoky eye — not both. Nude/dusty rose lip balm is ideal.', tip: 'Let the eyes be the story.', duration: '2 min' },
    ],
  },
  'glass-skin': {
    title: 'Dewy Glass Skin',
    subtitle: 'Lit from within.',
    steps: [
      { title: 'Double Cleanse', detail: 'Oil cleanser first (removes SPF/makeup), then foam cleanser. Pat dry — never rub.', tip: 'Glass skin starts with a truly clean base.', duration: '4 min' },
      { title: 'Essence', detail: 'Pour a few drops onto your palm, press into skin with both hands. Repeat twice. The skin should look "plumped."', tip: 'Layering thin hydration beats one thick layer.', duration: '2 min' },
      { title: 'Serum', detail: 'Apply 2–3 drops of hyaluronic acid serum on damp skin. Press in gently.', tip: 'Hyaluronic acid needs moisture to work — apply on slightly damp skin.', duration: '1 min' },
      { title: 'Light Moisturizer', detail: 'Apply a gel-cream moisturizer. Focus on dry patches around nose and cheeks.', tip: 'Gel textures = glass skin effect without heaviness.', duration: '2 min' },
      { title: 'Skin Tint', detail: 'Mix a drop of skin tint with your moisturizer. Apply with fingers. No heavy coverage — let your skin show.', tip: 'The goal is "your skin but in HD," not foundation.', duration: '2 min' },
      { title: 'Liquid Highlighter', detail: 'Dot liquid highlighter on cheekbones, inner corners, brow bone, cupid\'s bow. Don\'t blend too much.', tip: 'Less is more — one dab in the right spot beats five dabs everywhere.', duration: '2 min' },
      { title: 'Jelly Blush', detail: 'Apply a sheer jelly blush to cheeks and bridge of nose. Blend quickly — it sets fast.', tip: 'Nose blush reads as "just came from outside" in the best way.', duration: '1 min' },
      { title: 'Setting Mist', detail: 'Hold spray 30cm away, spritz in a figure-8 pattern. Do NOT rub or pat. Let air-dry.', tip: 'The mist fuses everything into a single skin-like layer.', duration: '1 min' },
    ],
  },
  'bold-lip': {
    title: 'Bold Lip',
    subtitle: 'One move. Everything.',
    steps: [
      { title: 'Skin Prep', detail: 'Keep base minimal — light foundation or skin tint only. The lip must own the room.', tip: 'Heavy base + bold lip = overdone. Trust the edit.', duration: '3 min' },
      { title: 'Concealer Lip Prep', detail: 'Dab a tiny amount of concealer over the lip line and blur outward. This gives you a blank, defined canvas.', tip: 'This trick makes the lipstick look 10× more editorial.', duration: '1 min' },
      { title: 'Lip Liner', detail: 'Line your lips with a liner matching your lipstick shade. Follow your natural line or slightly overline the cupid\'s bow only.', tip: 'Matching liner is always better than nude liner with bold lips.', duration: '2 min' },
      { title: 'Fill with Liner', detail: 'Fill the entire lip with the liner. This makes the final colour last 4+ hours.', tip: 'Liner as a base is the oldest pro trick.', duration: '1 min' },
      { title: 'Apply Lipstick', detail: 'Apply your lipstick directly from the bullet for the first coat. Follow the natural lip shape precisely.', tip: 'Don\'t stretch your mouth — apply naturally.', duration: '1 min' },
      { title: 'Blot + Second Coat', detail: 'Blot once with a tissue. Apply a second coat. This layering makes the colour ultra-saturated and long-lasting.', tip: 'Two thin layers outlast one thick layer every time.', duration: '2 min' },
      { title: 'Clean the Edges', detail: 'Dip a flat concealer brush in concealer and trace the edges of your lips. This sharpens everything.', tip: 'This is what separates "nice" from "editorial."', duration: '2 min' },
      { title: 'Keep Eyes Minimal', detail: 'Mascara only. No eyeshadow. The lip is the statement — let it speak alone.', tip: 'Restraint is the hardest — and most powerful — beauty skill.', duration: '1 min' },
    ],
  },
  'editorial': {
    title: 'Editorial Look',
    subtitle: 'Runway-ready.',
    steps: [
      { title: 'Skin Prep', detail: 'Flawless base is non-negotiable for editorial. Apply primer, full coverage foundation, and bake under eyes with loose powder.', tip: 'Editorial skin = sculpted and smooth. Invest time here.', duration: '8 min' },
      { title: 'Graphic Liner — Map First', detail: 'Use a fine brush to sketch your liner design in grey eyeshadow first. Mistakes erase easily. Plan your angles.', tip: 'Never draw graphic liner freehand on the first attempt.', duration: '3 min' },
      { title: 'Graphic Liner — Execute', detail: 'Go over your sketch with black gel or liquid liner. Use short, connected strokes rather than one continuous line.', tip: 'Short strokes = control. Long strokes = mistakes.', duration: '5 min' },
      { title: 'Color Eyeshadow', detail: 'Apply one bold color (cobalt, burnt orange, violet) to the lid and lower lash line. Keep blending minimal — patches of color are intentional.', tip: 'Bold color looks best when slightly unblended — it reads as "chosen," not "mistake."', duration: '4 min' },
      { title: 'Contour + Sculpt', detail: 'Apply cool-toned contour under cheekbones, temples, and jawline. Blend hard. This reads under lights and camera.', tip: 'Editorial contour is sharper than everyday contour.', duration: '4 min' },
      { title: 'Bold Brows', detail: 'Fill brows in fully and square off the tails. Brush upward for that editorial "statement brow." Laminated brows = bonus points.', tip: 'Strong brows frame graphic liner perfectly.', duration: '3 min' },
      { title: 'Lip Treatment', detail: 'Either a bold monochromatic lip (matching your eyeshadow) OR a clean bare lip. No in-between.', tip: 'In editorial, the decision IS the look.', duration: '2 min' },
      { title: 'Setting Spray', detail: 'Set everything with a light misting of setting spray. Editorial looks must survive heat, movement, and camera flashes.', tip: 'Finish with a light dusting of translucent powder on the T-zone.', duration: '1 min' },
    ],
  },
};

export default function TutorialPage() {
  const router = useRouter();
  const [lookId, setLookId] = useState<string>('no-makeup');
  const [selfie, setSelfie] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [generating, setGenerating] = useState(true);

  useEffect(() => {
    const s = sessionStorage.getItem('medusa_selfie');
    const l = sessionStorage.getItem('medusa_look') || 'no-makeup';
    if (!s) router.push('/upload');
    setSelfie(s);
    setLookId(l);

    // Simulate AI generation
    const t = setTimeout(() => setGenerating(false), 2000);
    return () => clearTimeout(t);
  }, [router]);

  const tutorial = TUTORIALS[lookId] || TUTORIALS['no-makeup'];
  const totalSteps = tutorial.steps.length;
  const progress = completedSteps.size / totalSteps;

  const toggleStep = (i: number) => {
    setCompletedSteps(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  if (generating) {
    return (
      <div
        className="flex flex-col items-center justify-center"
        style={{ background: 'var(--bg)', minHeight: '100vh' }}
      >
        <div className="flex flex-col items-center gap-8">
          {/* Abstract loading animation */}
          <div className="relative w-24 h-24">
            {/* Rotating rings */}
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="absolute inset-0 rounded-full border"
                style={{
                  borderColor: 'transparent',
                  borderTopColor: `rgba(196, 30, 30, ${0.8 - i * 0.2})`,
                  animation: `spin ${1 + i * 0.4}s linear infinite ${i % 2 ? 'reverse' : ''}`,
                  transform: `scale(${1 - i * 0.18})`,
                }}
              />
            ))}
            {selfie && (
              <div
                className="absolute inset-3 rounded-full overflow-hidden"
                style={{ border: '1px solid var(--line)' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selfie} alt="" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <div className="flex flex-col items-center gap-2 text-center">
            <p className="serif" style={{ fontSize: '20px', color: 'var(--text)' }}>
              Building your tutorial
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-2)' }}>
              Analysing face structure · Calibrating steps · Writing your guide
            </p>
          </div>

          {/* Dotted progress */}
          <div className="flex gap-2">
            {[0, 1, 2, 3].map(i => (
              <div
                key={i}
                className="rounded-full pulse-dot"
                style={{
                  width: '6px',
                  height: '6px',
                  background: 'var(--accent)',
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </div>
        </div>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Navbar />

      <main className="flex flex-col px-6 pt-28 pb-20 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-10 anim-fade-up">
          <span className="tag" style={{ alignSelf: 'flex-start' }}>Step 03 — Your Tutorial</span>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1
                className="serif"
                style={{
                  fontSize: 'clamp(32px, 5vw, 52px)',
                  color: 'var(--text)',
                  letterSpacing: '-0.02em',
                  lineHeight: '1.05',
                  marginBottom: '6px',
                }}
              >
                {tutorial.title}
              </h1>
              <p className="serif-italic" style={{ fontSize: '18px', color: 'var(--text-2)' }}>
                {tutorial.subtitle}
              </p>
            </div>

            {/* Selfie + stats */}
            {selfie && (
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p style={{ fontSize: '12px', color: 'var(--text-2)', marginBottom: '2px' }}>
                    {completedSteps.size}/{totalSteps} steps done
                  </p>
                  <p style={{ fontSize: '20px', color: 'var(--text)' }}>
                    {Math.round(progress * 100)}%
                  </p>
                </div>
                <div
                  className="relative w-14 h-14 rounded-full overflow-hidden"
                  style={{ border: '2px solid rgba(181,96,74,0.4)' }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selfie} alt="" className="w-full h-full object-cover" />
                  {/* Progress ring */}
                  <svg
                    className="absolute inset-0"
                    viewBox="0 0 56 56"
                    style={{ transform: 'rotate(-90deg)' }}
                  >
                    <circle cx="28" cy="28" r="26" fill="none" stroke="rgba(181,96,74,0.15)" strokeWidth="2" />
                    <circle
                      cx="28" cy="28" r="26" fill="none"
                      stroke="var(--accent)" strokeWidth="2"
                      strokeDasharray={`${2 * Math.PI * 26}`}
                      strokeDashoffset={`${2 * Math.PI * 26 * (1 - progress)}`}
                      style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                    />
                  </svg>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div
          className="w-full rounded-full mb-10 overflow-hidden"
          style={{ height: '2px', background: 'var(--line)' }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${progress * 100}%`,
              background: 'linear-gradient(90deg, var(--accent-lo), var(--accent-hi))',
              transition: 'width 0.5s ease',
            }}
          />
        </div>

        {/* Two-column: step list + active step detail */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5 lg:gap-6">
          {/* Step list */}
          <div className="lg:col-span-2 flex flex-col gap-2">
            {tutorial.steps.map((step, i) => {
              const isDone = completedSteps.has(i);
              const isActive = activeStep === i;
              return (
                <button
                  key={i}
                  onClick={() => { setActiveStep(i); }}
                  className="text-left flex items-center gap-4 p-4 rounded-xl border transition-all duration-200"
                  style={{
                    background: isActive ? 'var(--bg-surface)' : 'var(--bg-card)',
                    borderColor: isActive
                      ? 'rgba(181,96,74,0.5)'
                      : isDone
                      ? 'rgba(181,96,74,0.2)'
                      : 'var(--line)',
                  }}
                >
                  {/* Step number / check */}
                  <div
                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                    style={{
                      background: isDone ? 'var(--accent)' : isActive ? 'rgba(181,96,74,0.15)' : 'var(--bg-surface)',
                      border: `1px solid ${isDone ? 'var(--accent)' : isActive ? 'rgba(181,96,74,0.4)' : 'var(--line)'}`,
                    }}
                  >
                    {isDone ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <span
                        className="serif"
                        style={{ fontSize: '11px', color: isActive ? 'var(--accent-hi)' : 'var(--text-2)' }}
                      >
                        {String(i + 1).padStart(2, '0')}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      style={{
                        fontSize: '14px',
                        color: isActive ? 'var(--text)' : isDone ? 'var(--text-2)' : 'var(--text-2)',
                        fontWeight: isActive ? 500 : 400,
                        textDecoration: isDone ? 'line-through' : 'none',
                      }}
                    >
                      {step.title}
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--text-3)' }}>{step.duration}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active step detail card */}
          <div className="lg:col-span-3">
            <div
              className="step-card active shimmer-card p-8 flex flex-col gap-6 sticky top-24"
            >
              {/* Step header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p
                    className="serif"
                    style={{ fontSize: '12px', color: 'var(--accent)', letterSpacing: '0.15em', marginBottom: '6px' }}
                  >
                    {String(activeStep + 1).padStart(2, '0')} / {String(totalSteps).padStart(2, '0')}
                  </p>
                  <h2
                    className="serif"
                    style={{ fontSize: '28px', color: 'var(--text)', lineHeight: '1.1' }}
                  >
                    {tutorial.steps[activeStep].title}
                  </h2>
                </div>
                <span
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-3)',
                    border: '1px solid var(--line)',
                    padding: '4px 10px',
                    borderRadius: '100px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {tutorial.steps[activeStep].duration}
                </span>
              </div>

              <div className="line-gradient" />

              {/* Main detail */}
              <p style={{ fontSize: '16px', color: 'var(--text)', lineHeight: '1.8', fontWeight: 300 }}>
                {tutorial.steps[activeStep].detail}
              </p>

              {/* Pro tip */}
              <div
                className="flex gap-3 rounded-xl p-4"
                style={{ background: 'rgba(181,96,74,0.06)', border: '1px solid rgba(181,96,74,0.15)' }}
              >
                <span style={{ fontSize: '14px', color: 'var(--accent)', flexShrink: 0 }}>✦</span>
                <div>
                  <p style={{ fontSize: '11px', color: 'var(--accent)', letterSpacing: '0.12em', marginBottom: '4px', fontWeight: 500 }}>
                    PRO TIP
                  </p>
                  <p style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: '1.6' }}>
                    {tutorial.steps[activeStep].tip}
                  </p>
                </div>
              </div>

              {/* Step controls */}
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => toggleStep(activeStep)}
                  className="btn-primary flex-1"
                  style={{
                    background: completedSteps.has(activeStep) ? 'var(--bg-surface)' : 'var(--accent)',
                    color: completedSteps.has(activeStep) ? 'var(--text-2)' : 'var(--text)',
                    border: completedSteps.has(activeStep) ? '1px solid var(--line)' : 'none',
                    justifyContent: 'center',
                  }}
                >
                  {completedSteps.has(activeStep) ? '↩ Undo step' : '✓ Done — next step'}
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
                    className="btn-ghost"
                    style={{ padding: '12px 16px' }}
                    disabled={activeStep === 0}
                  >
                    ←
                  </button>
                  <button
                    onClick={() => {
                      toggleStep(activeStep);
                      setActiveStep(Math.min(totalSteps - 1, activeStep + 1));
                    }}
                    className="btn-ghost"
                    style={{ padding: '12px 16px' }}
                    disabled={activeStep === totalSteps - 1}
                  >
                    →
                  </button>
                </div>
              </div>

              {/* Completion */}
              {completedSteps.size === totalSteps && (
                <div
                  className="rounded-xl p-5 text-center anim-fade-in"
                  style={{
                    background: 'rgba(181,96,74,0.08)',
                    border: '1px solid rgba(181,96,74,0.25)',
                  }}
                >
                  <p className="serif" style={{ fontSize: '20px', color: 'var(--text)', marginBottom: '4px' }}>
                    You're done. 🔥
                  </p>
                  <p style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '14px' }}>
                    Make them stop.
                  </p>
                  <div className="flex gap-3 justify-center flex-wrap">
                    <button
                      onClick={() => router.push('/look')}
                      className="btn-ghost"
                      style={{ fontSize: '13px', padding: '10px 18px' }}
                    >
                      Try another look
                    </button>
                    <button
                      onClick={() => router.push('/upload')}
                      className="btn-primary"
                      style={{ fontSize: '13px', padding: '10px 18px' }}
                    >
                      Start over →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
