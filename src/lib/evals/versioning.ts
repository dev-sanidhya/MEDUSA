import { MEDUSA_CLAUDE_MODEL } from "@/lib/claude/models";
import type { PromptVersionRecord } from "@/lib/evals/types";

export const FACE_ANALYSIS_SCHEMA_VERSION = "face-analysis.v1";
export const TUTORIAL_SCHEMA_VERSION = "tutorial.v1";

export const FACE_ANALYSIS_PROMPT_VERSION = "2026-04-03.face-analysis.v1";
export const TUTORIAL_PROMPT_VERSION = "2026-04-03.tutorial.v1";

export const VALIDATOR_VERSION = "2026-04-03.evals.v1";

export const PROMPT_VERSION_REGISTRY: PromptVersionRecord[] = [
  {
    id: FACE_ANALYSIS_PROMPT_VERSION,
    workflow: "face_analysis",
    model: MEDUSA_CLAUDE_MODEL,
    schemaVersion: FACE_ANALYSIS_SCHEMA_VERSION,
    description: "Face analysis prompt with geometry-guided structured output and photo retry handling.",
  },
  {
    id: TUTORIAL_PROMPT_VERSION,
    workflow: "tutorial_generation",
    model: MEDUSA_CLAUDE_MODEL,
    schemaVersion: TUTORIAL_SCHEMA_VERSION,
    description: "Tutorial generation prompt with look DNA, mandatory artistry steps, and repair pass support.",
  },
];
