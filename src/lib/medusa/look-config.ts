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

export interface LookPresentation {
  id: LookId;
  label: string;
  subtitle: string;
  tag: string;
  accent: string;
  promptDefinition: string;
}

export interface EditorialSubtypePresentation {
  id: EditorialSubtype;
  label: string;
  subtitle: string;
  body: string;
  accent: string;
  promptDefinition: string;
}

export const LOOK_PRESENTATIONS: LookPresentation[] = [
  {
    id: "natural",
    label: "Natural",
    subtitle: "Enhance, don't cover",
    tag: "Minimal",
    accent: "rgba(244,63,94,0.18)",
    promptDefinition:
      "Natural / Everyday - 5-7 steps. Skin-first, barely-there. Tinted moisturizer or light coverage, groomed brows, sheer lid wash, tinted lip balm.",
  },
  {
    id: "soft-glam",
    label: "Soft Glam",
    subtitle: "Polished, not heavy",
    tag: "Polished",
    accent: "rgba(255,255,255,0.1)",
    promptDefinition:
      "Soft Glam - 8-10 steps. Polished without being heavy. Seamless base, warm neutral eyes with soft liner, blush, highlight on cheekbones, MLBB or nude satin lip.",
  },
  {
    id: "evening",
    label: "Evening",
    subtitle: "Depth, shape, and contrast",
    tag: "Full Face",
    accent: "rgba(190,24,93,0.24)",
    promptDefinition:
      "Evening / Dramatic - 10-12 steps. Full face with impact. Foundation + concealer, sculpted contour, dimensional eyes (crease depth + liner + lashes), bold or rich lip.",
  },
  {
    id: "bold-lip",
    label: "Bold Lip",
    subtitle: "One statement feature",
    tag: "Focused",
    accent: "rgba(251,113,133,0.18)",
    promptDefinition:
      "Bold Lip - 7-9 steps. Lip is the hero. Light even skin, barely-there brows, zero eye makeup beyond mascara, everything framed around one saturated statement lip.",
  },
  {
    id: "monochromatic",
    label: "Monochromatic",
    subtitle: "Tone-on-tone flush",
    tag: "Cohesive",
    accent: "rgba(255,255,255,0.08)",
    promptDefinition:
      "Monochromatic - 7-9 steps. One color family everywhere. Pick a tone (rose/peach/berry/terracotta), use it on eyes, cheeks, and lips at different intensities.",
  },
  {
    id: "editorial",
    label: "Editorial",
    subtitle: "Statement-led, then choose a direction",
    tag: "Creative",
    accent: "rgba(109,40,217,0.16)",
    promptDefinition:
      "Editorial - 8-12 steps. Bold, directional, photogenic. Can include graphic liner, cut crease, unusual color placement, or a statement fashion-forward element.",
  },
];

export const LOOK_DEFINITIONS = Object.fromEntries(
  LOOK_PRESENTATIONS.map((look) => [look.id, look.promptDefinition])
) as Record<LookId, string>;

export const EDITORIAL_SUBTYPE_PRESENTATIONS: EditorialSubtypePresentation[] = [
  {
    id: "sharp",
    label: "Sharp",
    subtitle: "Graphic and precise",
    body: "Clean lines, strong shape, crisp edges, and a high-fashion finish.",
    accent: "rgba(244,63,94,0.16)",
    promptDefinition:
      "Sharp Editorial - crisp structure, graphic edges, clean symmetry, strong shape control. Think precise liner, clean negative space, sculpted placement, and polished finish.",
  },
  {
    id: "glossy",
    label: "Glossy",
    subtitle: "Wet-look shine",
    body: "Reflective lids or skin, fresh texture, and controlled shine that catches light.",
    accent: "rgba(96,165,250,0.16)",
    promptDefinition:
      "Glossy Editorial - wet-looking shine, reflective lids or skin, fresh base, controlled glow, and modern shine without looking greasy. Keep gloss intentional and placed with restraint.",
  },
  {
    id: "messy",
    label: "Messy",
    subtitle: "Lived-in and smudged",
    body: "Deliberately blurred, grungy, and undone, but still designed with intent.",
    accent: "rgba(168,85,247,0.16)",
    promptDefinition:
      "Messy Editorial - intentionally undone, smudged, lived-in texture with attitude. Think blurred edges, slept-in eyes, imperfect diffusion, and cool contrast, but still deliberately designed.",
  },
  {
    id: "soft",
    label: "Soft",
    subtitle: "Diffused and airy",
    body: "Washed color, blurred edges, and a gentler editorial look with less harsh contrast.",
    accent: "rgba(251,191,36,0.12)",
    promptDefinition:
      "Soft Editorial - diffused, airy, washed, and fashion-led rather than dramatic. Think hazy edges, blended tones, gentle glow, blurred lips, and softer transitions everywhere.",
  },
];

export const EDITORIAL_SUBTYPE_DEFINITIONS = Object.fromEntries(
  EDITORIAL_SUBTYPE_PRESENTATIONS.map((subtype) => [subtype.id, subtype.promptDefinition])
) as Record<EditorialSubtype, string>;

export function isLookId(value: string): value is LookId {
  return LOOK_IDS.includes(value as LookId);
}

export function isEditorialSubtype(value: string): value is EditorialSubtype {
  return EDITORIAL_SUBTYPES.includes(value as EditorialSubtype);
}
