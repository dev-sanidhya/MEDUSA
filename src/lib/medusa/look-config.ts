export const LOOK_IDS = [
  "natural",
  "soft-glam",
  "evening",
  "bold-lip",
  "monochromatic",
  "editorial",
] as const;

export type LookId = (typeof LOOK_IDS)[number];

export const EDITORIAL_SUBTYPES = [
  "sharp",
  "glossy",
  "messy",
  "soft",
] as const;

export type EditorialSubtype = (typeof EDITORIAL_SUBTYPES)[number];

export const MONOCHROMATIC_VARIANTS = [
  "peach",
  "brown",
  "rose",
] as const;

export type MonochromaticVariant = (typeof MONOCHROMATIC_VARIANTS)[number];

export const LOOK_PRIMARY_AXES = [
  "restraint",
  "polish",
  "impact",
  "feature",
  "palette",
  "concept",
] as const;

export type LookPrimaryAxis = (typeof LOOK_PRIMARY_AXES)[number];

export const LOOK_INTENSITIES = ["soft", "balanced", "bold"] as const;

export type LookIntensity = (typeof LOOK_INTENSITIES)[number];

export const LOOK_ANCHOR_FEATURES = [
  "complexion",
  "eyes",
  "lips",
  "palette",
  "statement",
  "structure",
] as const;

export type LookAnchorFeature = (typeof LOOK_ANCHOR_FEATURES)[number];

export interface LookEngineContract {
  primaryAxis: LookPrimaryAxis;
  defaultIntensity: LookIntensity;
  anchorFeature: LookAnchorFeature;
  colorDiscipline: "free" | "guided" | "strict";
  complexionDirective: string;
  eyeDirective: string;
  lipDirective: string;
  contourDirective: string;
  finishDirective: string;
  statementDirective: string;
}

export interface LookDefinition {
  id: LookId;
  label: string;
  subtitle: string;
  tag: string;
  accent: string;
  promptDefinition: string;
  engine: LookEngineContract;
}

export interface EditorialSubtypeDefinition {
  id: EditorialSubtype;
  label: string;
  subtitle: string;
  body: string;
  accent: string;
  promptDefinition: string;
  engine: {
    contrastLevel: "soft" | "balanced" | "bold";
    edgeStyle: string;
    textureStyle: string;
    statementPlacement: string;
  };
}

export interface MonochromaticVariantDefinition {
  id: MonochromaticVariant;
  label: string;
  subtitle: string;
  body: string;
  accent: string;
  promptDefinition: string;
  engine: {
    paletteFocus: string;
    finishStyle: string;
    placementMood: string;
  };
}

export const LOOK_DEFINITIONS: Record<LookId, LookDefinition> = {
  natural: {
    id: "natural",
    label: "Natural",
    subtitle: "Enhance, don't cover",
    tag: "Minimal",
    accent: "rgba(244,63,94,0.18)",
    promptDefinition:
      "Natural / Everyday - 5-7 steps. Skin-first, barely-there. Tinted moisturizer or light coverage, groomed brows, sheer lid wash, tinted lip balm.",
    engine: {
      primaryAxis: "restraint",
      defaultIntensity: "soft",
      anchorFeature: "complexion",
      colorDiscipline: "guided",
      complexionDirective: "Keep the skin alive, sheer, and breathable. Coverage is corrective, not transformative.",
      eyeDirective: "Keep eyes quiet and awake-looking. Use one soft wash or almost nothing.",
      lipDirective: "Lips should read easy and low-effort, like balm, stain, or clear shine.",
      contourDirective: "Do not sculpt hard structure. At most, use soft warmth or blush lift.",
      finishDirective: "Fresh, skin-like, and light-reflective. Never heavy matte.",
      statementDirective: "Nothing should read like a statement feature. The whole effect should feel understated.",
    },
  },
  "soft-glam": {
    id: "soft-glam",
    label: "Soft Glam",
    subtitle: "Polished, not heavy",
    tag: "Polished",
    accent: "rgba(255,255,255,0.1)",
    promptDefinition:
      "Soft Glam - 8-10 steps. Polished without being heavy. Seamless base, warm neutral eyes with soft liner, blush, highlight on cheekbones, MLBB or nude satin lip.",
    engine: {
      primaryAxis: "polish",
      defaultIntensity: "balanced",
      anchorFeature: "eyes",
      colorDiscipline: "guided",
      complexionDirective: "Build a seamless, expensive-looking base with visible light in the center face.",
      eyeDirective: "Eyes should have shape and soft depth, but no harsh editorial edge.",
      lipDirective: "Lips support the polished finish with refined nude, rose, or MLBB tones.",
      contourDirective: "Structure should be present but soft, blended, and lifting rather than dramatic.",
      finishDirective: "Satin, refined, and dimensional. Everything should feel smoothed and intentional.",
      statementDirective: "The statement is overall polish, not one loud feature.",
    },
  },
  evening: {
    id: "evening",
    label: "Evening",
    subtitle: "Depth, shape, and contrast",
    tag: "Full Face",
    accent: "rgba(190,24,93,0.24)",
    promptDefinition:
      "Evening / Dramatic - 10-12 steps. Full face with impact. Foundation + concealer, sculpted contour, dimensional eyes (crease depth + liner + lashes), bold or rich lip.",
    engine: {
      primaryAxis: "impact",
      defaultIntensity: "bold",
      anchorFeature: "structure",
      colorDiscipline: "guided",
      complexionDirective: "Complexion should look perfected, long-wear, and built for contrast under lower light.",
      eyeDirective: "Eyes need clear architecture, stronger depth, liner definition, and visible drama.",
      lipDirective: "Lips should carry richness or boldness and feel deliberate, never incidental.",
      contourDirective: "Contour should sharpen structure and visibly lift the face.",
      finishDirective: "Long-wear, controlled, and camera-ready with stronger set and hold.",
      statementDirective: "Multiple zones can carry impact, but they must still feel coordinated and controlled.",
    },
  },
  "bold-lip": {
    id: "bold-lip",
    label: "Bold Lip",
    subtitle: "One statement feature",
    tag: "Focused",
    accent: "rgba(251,113,133,0.18)",
    promptDefinition:
      "Bold Lip - 7-9 steps. Lip is the hero. Light even skin, barely-there brows, zero eye makeup beyond mascara, everything framed around one saturated statement lip.",
    engine: {
      primaryAxis: "feature",
      defaultIntensity: "bold",
      anchorFeature: "lips",
      colorDiscipline: "guided",
      complexionDirective: "Skin should be even and clean but clearly secondary to the lip.",
      eyeDirective: "Eyes must step back. Avoid competing depth, liner, shimmer, or shape drama.",
      lipDirective: "The lip is the entire thesis. Prep, edge, saturation, and longevity should be explicit.",
      contourDirective: "Skip contour or keep structure extremely light so the lip stays dominant.",
      finishDirective: "Everything around the lip should be quiet enough to frame it cleanly.",
      statementDirective: "Only the lip should feel like a statement zone.",
    },
  },
  monochromatic: {
    id: "monochromatic",
    label: "Monochromatic",
    subtitle: "Tone-on-tone flush",
    tag: "Cohesive",
    accent: "rgba(255,255,255,0.08)",
    promptDefinition:
      "Monochromatic - 7-9 steps. One color family everywhere. Pick a tone (rose/peach/berry/terracotta), use it on eyes, cheeks, and lips at different intensities.",
    engine: {
      primaryAxis: "palette",
      defaultIntensity: "balanced",
      anchorFeature: "palette",
      colorDiscipline: "strict",
      complexionDirective: "Keep complexion clean enough to support the color story without competing with it.",
      eyeDirective: "Eyes should participate in the same palette family using the lightest and mid-tone intensities.",
      lipDirective: "Lips should carry the deepest intensity of the same family.",
      contourDirective: "Structure should stay quiet unless it clearly supports the palette story.",
      finishDirective: "The finish should feel cohesive across zones, not random or product-led.",
      statementDirective: "The statement is color harmony across the whole face, not one isolated feature.",
    },
  },
  editorial: {
    id: "editorial",
    label: "Editorial",
    subtitle: "Statement-led, tuned to you",
    tag: "Creative",
    accent: "rgba(109,40,217,0.16)",
    promptDefinition:
      "Editorial - 8-12 steps. Bold, directional, photogenic. The exact editorial direction can shift between sharp, glossy, messy, or soft depending on the personalized concept.",
    engine: {
      primaryAxis: "concept",
      defaultIntensity: "bold",
      anchorFeature: "statement",
      colorDiscipline: "free",
      complexionDirective: "Skin should look intentionally designed, not merely corrected.",
      eyeDirective: "Eyes can be graphic, bare, or exaggerated depending on the concept, but the concept must be obvious.",
      lipDirective: "Lips should either disappear into the concept or become the concept themselves.",
      contourDirective: "Structure should support the statement and never default to routine glam placement.",
      finishDirective: "Finish should feel deliberate, directional, and fashion-led.",
      statementDirective: "Choose one clear thesis and push it with control. The look should read as an idea, not generic glam.",
    },
  },
};

export const LOOK_PRESENTATIONS: LookDefinition[] = LOOK_IDS.map((id) => LOOK_DEFINITIONS[id]);

export const EDITORIAL_SUBTYPE_DEFINITIONS: Record<EditorialSubtype, EditorialSubtypeDefinition> = {
  sharp: {
    id: "sharp",
    label: "Sharp",
    subtitle: "Graphic and precise",
    body: "Clean lines, strong shape, crisp edges, and a high-fashion finish.",
    accent: "rgba(244,63,94,0.16)",
    promptDefinition:
      "Sharp Editorial - crisp structure, graphic edges, clean symmetry, strong shape control. Think precise liner, clean negative space, sculpted placement, and polished finish.",
    engine: {
      contrastLevel: "bold",
      edgeStyle: "Edges must read clean, cut, and intentional.",
      textureStyle: "Keep texture polished and controlled rather than dewy or messy.",
      statementPlacement: "Prioritize graphic placement, symmetry, and visible structure.",
    },
  },
  glossy: {
    id: "glossy",
    label: "Glossy",
    subtitle: "Wet-look shine",
    body: "Reflective lids or skin, fresh texture, and controlled shine that catches light.",
    accent: "rgba(96,165,250,0.16)",
    promptDefinition:
      "Glossy Editorial - wet-looking shine, reflective lids or skin, fresh base, controlled glow, and modern shine without looking greasy. Keep gloss intentional and placed with restraint.",
    engine: {
      contrastLevel: "balanced",
      edgeStyle: "Edges can stay softer if the shine placement remains deliberate.",
      textureStyle: "Texture is the hero. Reflective surfaces should feel strategic, not oily.",
      statementPlacement: "Prioritize glossy lids, skin planes, or reflective accents with controlled placement.",
    },
  },
  messy: {
    id: "messy",
    label: "Messy",
    subtitle: "Lived-in and smudged",
    body: "Deliberately blurred, grungy, and undone, but still designed with intent.",
    accent: "rgba(168,85,247,0.16)",
    promptDefinition:
      "Messy Editorial - intentionally undone, smudged, lived-in texture with attitude. Think blurred edges, slept-in eyes, imperfect diffusion, and cool contrast, but still deliberately designed.",
    engine: {
      contrastLevel: "bold",
      edgeStyle: "Edges should look blurred or smudged on purpose, never accidental.",
      textureStyle: "Texture can feel grungy, diffused, and lived-in, but still clearly designed.",
      statementPlacement: "Prioritize imperfect diffusion, smudged eyes, or broken-up placement with strong intent.",
    },
  },
  soft: {
    id: "soft",
    label: "Soft",
    subtitle: "Diffused and airy",
    body: "Washed color, blurred edges, and a gentler editorial look with less harsh contrast.",
    accent: "rgba(251,191,36,0.12)",
    promptDefinition:
      "Soft Editorial - diffused, airy, washed, and fashion-led rather than dramatic. Think hazy edges, blended tones, gentle glow, blurred lips, and softer transitions everywhere.",
    engine: {
      contrastLevel: "soft",
      edgeStyle: "Edges should be hazy, airy, and low-harshness.",
      textureStyle: "Texture should feel soft-focus and atmospheric rather than wet or sharp.",
      statementPlacement: "Prioritize subtle but unmistakable shape through diffusion, draping, or color haze.",
    },
  },
};

export const MONOCHROMATIC_VARIANT_DEFINITIONS: Record<
  MonochromaticVariant,
  MonochromaticVariantDefinition
> = {
  peach: {
    id: "peach",
    label: "Peach",
    subtitle: "Warm and easy",
    body: "Soft apricot, peach nude, and warm flush tones that keep the face bright and approachable.",
    accent: "rgba(251,146,60,0.14)",
    promptDefinition:
      "Peach Monochromatic - build the whole look from peach, apricot, soft coral, and warm nude tones. Keep the palette fresh, lifted, and easy to wear.",
    engine: {
      paletteFocus: "peach, apricot, coral-leaning nude, soft terracotta",
      finishStyle: "fresh satin or soft glow",
      placementMood: "light, flattering warmth that keeps the face open",
    },
  },
  brown: {
    id: "brown",
    label: "Brown",
    subtitle: "Sculpted and richer",
    body: "Cocoa, bronze, caramel, and espresso tones that create the most depth and structure.",
    accent: "rgba(120,78,53,0.18)",
    promptDefinition:
      "Brown Monochromatic - build the whole look from caramel, bronze, cocoa, mocha, and espresso tones. Keep it cohesive, rich, and softly sculpted rather than colorful.",
    engine: {
      paletteFocus: "caramel, bronze, cocoa, mocha, espresso",
      finishStyle: "satin to soft matte with dimension",
      placementMood: "more sculpted, grounded, and defined",
    },
  },
  rose: {
    id: "rose",
    label: "Rose",
    subtitle: "Balanced and refined",
    body: "Rose, mauve, and dusty pink tones that feel polished, soft, and naturally elegant.",
    accent: "rgba(244,114,182,0.14)",
    promptDefinition:
      "Rose Monochromatic - build the whole look from muted rose, mauve, dusty pink, and rosy nude tones. Keep the palette cohesive, refined, and softly romantic.",
    engine: {
      paletteFocus: "muted rose, mauve, dusty pink, rosy nude",
      finishStyle: "refined satin with soft-focus edges",
      placementMood: "polished, feminine, and balanced",
    },
  },
};

export function isLookId(value: string): value is LookId {
  return LOOK_IDS.includes(value as LookId);
}

export function isEditorialSubtype(value: string): value is EditorialSubtype {
  return EDITORIAL_SUBTYPES.includes(value as EditorialSubtype);
}

export function isMonochromaticVariant(value: string): value is MonochromaticVariant {
  return MONOCHROMATIC_VARIANTS.includes(value as MonochromaticVariant);
}
