import { MEDUSA_CLAUDE_MODEL } from "@/lib/claude/models";
import { getPostgresPool } from "@/lib/db/postgres";
import {
  FACE_ANALYSIS_PROMPT_VERSION,
  FACE_ANALYSIS_SCHEMA_VERSION,
  TUTORIAL_PROMPT_VERSION,
  TUTORIAL_SCHEMA_VERSION,
} from "@/lib/evals/versioning";
import type {
  AnalyzeFacePhoto,
  FaceAnalysis,
  FaceAnalysisResult,
} from "@/lib/medusa/analyze-face";
import type {
  EditorialSubtype,
  GenerateTutorialResult,
  LookId,
  PersonalizationProfile,
} from "@/lib/medusa/generate-tutorial";
import type {
  FeedbackEventRecord,
  ProfileAnalysisHistoryItem,
  ProfileExplicitPreferences,
  ProfileHistoryResult,
  ProfilePreferenceSummary,
  ProfileTutorialHistoryItem,
  RecordedFeedbackEvent,
} from "@/lib/persistence/types";
import { mergeReports } from "@/lib/precision-scorer";

let hasWarnedMissingDatabaseUrl = false;

export async function ensureAnonymousProfile(profileId: string): Promise<void> {
  const db = getPersistencePool();

  if (!db) {
    return;
  }

  try {
    await db.query(
      `
        INSERT INTO medusa_profiles (
          id,
          profile_type,
          created_at,
          updated_at,
          last_seen_at
        )
        VALUES ($1::uuid, 'anonymous', NOW(), NOW(), NOW())
        ON CONFLICT (id) DO UPDATE
        SET updated_at = NOW(),
            last_seen_at = NOW()
      `,
      [profileId]
    );
  } catch (error) {
    console.error("[persistence] Failed to ensure anonymous profile", error);
  }
}

export async function persistAnalysisRun({
  profileId,
  photos,
  result,
}: {
  profileId: string;
  photos: AnalyzeFacePhoto[];
  result: FaceAnalysisResult;
}): Promise<{ id: string } | null> {
  const db = getPersistencePool();

  if (!db) {
    return null;
  }

  const boundedPhotos = photos.slice(0, 3);
  const representativePhoto = boundedPhotos.reduce((best, candidate) =>
    candidate.precisionReport.overallScore > best.precisionReport.overallScore ? candidate : best
  );
  const mergedPrecision = mergeReports(boundedPhotos.map((photo) => photo.precisionReport));
  const runId = crypto.randomUUID();

  try {
    await db.query(
      `
        INSERT INTO medusa_analysis_runs (
          id,
          profile_id,
          status,
          photo_count,
          capture_attempts,
          final_geometry_profile,
          final_precision_report,
          photo_request,
          face_analysis,
          model,
          prompt_version,
          schema_version,
          completed_at
        )
        VALUES (
          $1::uuid,
          $2::uuid,
          $3,
          $4,
          $5::jsonb,
          $6::jsonb,
          $7::jsonb,
          $8::jsonb,
          $9::jsonb,
          $10,
          $11,
          $12,
          NOW()
        )
      `,
      [
        runId,
        profileId,
        result.status,
        boundedPhotos.length,
        JSON.stringify(
          boundedPhotos.map((photo, index) => ({
            photoIndex: index + 1,
            mimeType: photo.mimeType,
            geometryProfile: photo.geometryProfile,
            precisionReport: photo.precisionReport,
          }))
        ),
        JSON.stringify(representativePhoto.geometryProfile),
        JSON.stringify(mergedPrecision),
        JSON.stringify(result.photoRequest ?? null),
        JSON.stringify(result.faceAnalysis ?? null),
        MEDUSA_CLAUDE_MODEL,
        FACE_ANALYSIS_PROMPT_VERSION,
        FACE_ANALYSIS_SCHEMA_VERSION,
      ]
    );
  } catch (error) {
    console.error("[persistence] Failed to persist analysis run", error);
    return null;
  }

  return { id: runId };
}

export async function persistTutorialRun({
  profileId,
  analysisRunId,
  faceAnalysis,
  selectedLook,
  selectedEditorialSubtype,
  tutorial,
}: {
  profileId: string;
  analysisRunId?: string | null;
  faceAnalysis: FaceAnalysis;
  selectedLook: LookId;
  selectedEditorialSubtype?: EditorialSubtype;
  tutorial: GenerateTutorialResult;
}): Promise<{ id: string } | null> {
  const db = getPersistencePool();

  if (!db) {
    return null;
  }

  const runId = crypto.randomUUID();

  try {
    await db.query(
      `
        INSERT INTO medusa_tutorial_runs (
          id,
          profile_id,
          analysis_run_id,
          selected_look,
          selected_editorial_subtype,
          input_face_analysis,
          tutorial,
          model,
          prompt_version,
          schema_version,
          completed_at
        )
        VALUES (
          $1::uuid,
          $2::uuid,
          $3::uuid,
          $4,
          $5,
          $6::jsonb,
          $7::jsonb,
          $8,
          $9,
          $10,
          NOW()
        )
      `,
      [
        runId,
        profileId,
        analysisRunId ?? null,
        selectedLook,
        selectedEditorialSubtype ?? null,
        JSON.stringify(faceAnalysis),
        JSON.stringify(tutorial),
        MEDUSA_CLAUDE_MODEL,
        TUTORIAL_PROMPT_VERSION,
        TUTORIAL_SCHEMA_VERSION,
      ]
    );
  } catch (error) {
    console.error("[persistence] Failed to persist tutorial run", error);
    return null;
  }

  return { id: runId };
}

export async function getAnalysisRunFaceAnalysis(
  profileId: string,
  analysisRunId: string
): Promise<FaceAnalysis | null> {
  const db = getPersistencePool();

  if (!db) {
    return null;
  }

  try {
    const result = await db.query<{ face_analysis: FaceAnalysis | null }>(
      `
        SELECT face_analysis
        FROM medusa_analysis_runs
        WHERE id = $1::uuid
          AND profile_id = $2::uuid
          AND status = 'analysis_complete'
        LIMIT 1
      `,
      [analysisRunId, profileId]
    );

    return result.rows[0]?.face_analysis ?? null;
  } catch (error) {
    console.error("[persistence] Failed to load analysis run face analysis", error);
    return null;
  }
}

export async function getProfileHistory(
  profileId: string,
  { limit = 6 }: { limit?: number } = {}
): Promise<ProfileHistoryResult | null> {
  const db = getPersistencePool();

  if (!db) {
    return null;
  }

  const boundedLimit = Math.max(1, Math.min(limit, 20));

  try {
    const [profileResult, analysesResult, tutorialsResult, feedbackResult] = await Promise.all([
      db.query<{
        preferences: Record<string, unknown> | null;
      }>(
        `
          SELECT preferences
          FROM medusa_profiles
          WHERE id = $1::uuid
        `,
        [profileId]
      ),
      db.query<{
        id: string;
        status: "needs_more_photos" | "analysis_complete";
        photo_count: number;
        created_at: Date;
        completed_at: Date;
        face_analysis: {
          personalReading?: string;
          faceShape?: string;
          skinTone?: string;
          skinUndertone?: string;
          beautyHighlights?: string[];
          precisionLevel?: string;
        } | null;
      }>(
        `
          SELECT
            id,
            status,
            photo_count,
            created_at,
            completed_at,
            face_analysis
          FROM medusa_analysis_runs
          WHERE profile_id = $1::uuid
          ORDER BY created_at DESC
          LIMIT $2
        `,
        [profileId, boundedLimit]
      ),
      db.query<{
        id: string;
        analysis_run_id: string | null;
        selected_look: string;
        selected_editorial_subtype: string | null;
        created_at: Date;
        completed_at: Date;
        tutorial: {
          lookName?: string;
          lookDescription?: string;
          steps?: unknown[];
          closingNote?: string;
        };
      }>(
        `
          SELECT
            id,
            analysis_run_id,
            selected_look,
            selected_editorial_subtype,
            created_at,
            completed_at,
            tutorial
          FROM medusa_tutorial_runs
          WHERE profile_id = $1::uuid
          ORDER BY created_at DESC
          LIMIT $2
        `,
        [profileId, boundedLimit]
      ),
      db.query<{
        rating: number | null;
        tags: string[];
        selected_look: string | null;
        created_at: Date;
      }>(
        `
          SELECT
            fe.rating,
            fe.tags,
            tr.selected_look,
            fe.created_at
          FROM medusa_feedback_events fe
          LEFT JOIN medusa_tutorial_runs tr
            ON tr.id = fe.tutorial_run_id
          WHERE fe.profile_id = $1::uuid
          ORDER BY fe.created_at DESC
          LIMIT 50
        `,
        [profileId]
      ),
    ]);

    const analyses: ProfileAnalysisHistoryItem[] = analysesResult.rows.map((row) => ({
      id: row.id,
      status: row.status,
      photoCount: row.photo_count,
      createdAt: row.created_at.toISOString(),
      completedAt: row.completed_at.toISOString(),
      analysisSummary: row.face_analysis
        ? {
            personalReading: row.face_analysis.personalReading ?? null,
            faceShape: row.face_analysis.faceShape ?? null,
            skinTone: row.face_analysis.skinTone ?? null,
            skinUndertone: row.face_analysis.skinUndertone ?? null,
            beautyHighlights: row.face_analysis.beautyHighlights ?? [],
            precisionLevel: row.face_analysis.precisionLevel ?? null,
          }
        : null,
    }));

    const tutorials: ProfileTutorialHistoryItem[] = tutorialsResult.rows.map((row) => ({
      id: row.id,
      analysisRunId: row.analysis_run_id,
      selectedLook: row.selected_look,
      selectedEditorialSubtype: row.selected_editorial_subtype,
      createdAt: row.created_at.toISOString(),
      completedAt: row.completed_at.toISOString(),
      tutorialSummary: {
        lookName: row.tutorial.lookName ?? null,
        lookDescription: row.tutorial.lookDescription ?? null,
        stepCount: Array.isArray(row.tutorial.steps) ? row.tutorial.steps.length : 0,
        closingNote: row.tutorial.closingNote ?? null,
      },
    }));

    const explicitPreferences = normalizeExplicitPreferences(
      profileResult.rows[0]?.preferences ?? null
    );

    return {
      profileId,
      explicitPreferences,
      preferenceSummary: buildPreferenceSummary(
        tutorials,
        feedbackResult.rows,
        explicitPreferences
      ),
      analyses,
      tutorials,
    };
  } catch (error) {
    console.error("[persistence] Failed to load profile history", error);
    return null;
  }
}

export async function getPersonalizationProfile(
  profileId: string
): Promise<PersonalizationProfile | null> {
  const history = await getProfileHistory(profileId, { limit: 6 });

  if (!history) {
    return null;
  }

  return buildPersonalizationProfile(history.preferenceSummary);
}

export async function recordFeedbackEvent(
  record: FeedbackEventRecord
): Promise<RecordedFeedbackEvent | null> {
  const db = getPersistencePool();

  if (!db) {
    return null;
  }

  const eventId = crypto.randomUUID();

  try {
    await db.query(
      `
        INSERT INTO medusa_feedback_events (
          id,
          profile_id,
          analysis_run_id,
          tutorial_run_id,
          event_type,
          rating,
          tags,
          feedback_text,
          metadata,
          created_at
        )
        VALUES (
          $1::uuid,
          $2::uuid,
          $3::uuid,
          $4::uuid,
          $5,
          $6,
          $7::text[],
          $8,
          $9::jsonb,
          NOW()
        )
      `,
      [
        eventId,
        record.profileId,
        record.analysisRunId ?? null,
        record.tutorialRunId ?? null,
        record.eventType,
        record.rating ?? null,
        record.tags ?? [],
        record.feedbackText ?? null,
        JSON.stringify(record.metadata ?? {}),
      ]
    );
  } catch (error) {
    console.error("[persistence] Failed to record feedback event", error);
    return null;
  }

  return { id: eventId };
}

export async function updateProfilePreferences(
  profileId: string,
  preferences: Partial<ProfileExplicitPreferences>
): Promise<ProfileExplicitPreferences | null> {
  const db = getPersistencePool();

  if (!db) {
    return null;
  }

  const normalized = normalizeExplicitPreferences(preferences);

  try {
    const result = await db.query<{
      preferences: Record<string, unknown>;
    }>(
      `
        UPDATE medusa_profiles
        SET preferences = $2::jsonb,
            updated_at = NOW(),
            last_seen_at = NOW()
        WHERE id = $1::uuid
        RETURNING preferences
      `,
      [profileId, JSON.stringify(normalized)]
    );

    return normalizeExplicitPreferences(result.rows[0]?.preferences ?? normalized);
  } catch (error) {
    console.error("[persistence] Failed to update profile preferences", error);
    return null;
  }
}

function getPersistencePool() {
  const db = getPostgresPool();

  if (!db && !hasWarnedMissingDatabaseUrl) {
    hasWarnedMissingDatabaseUrl = true;
    console.warn("[persistence] DATABASE_URL is not set. Product persistence is disabled.");
  }

  return db;
}

function buildPreferenceSummary(
  tutorials: ProfileTutorialHistoryItem[],
  feedbackRows: Array<{
    rating: number | null;
    tags: string[];
    selected_look: string | null;
    created_at: Date;
  }>,
  explicitPreferences: ProfileExplicitPreferences
): ProfilePreferenceSummary {
  const preferredLooks = new Map<string, number>();
  const discouragedLooks = new Map<string, number>();
  const recentLooks = [...new Set(tutorials.map((tutorial) => tutorial.selectedLook))].slice(0, 3);
  const positiveTags = new Map<string, number>();
  const dislikedTags = new Map<string, number>();
  const featureFocusCounts = { eyes: 0, lips: 0 };

  for (const row of feedbackRows) {
    const look = row.selected_look;
    const tags = row.tags ?? [];
    const positiveCount = tags.filter((tag) => POSITIVE_PREFERENCE_TAGS.has(tag)).length;
    const negativeCount = tags.filter((tag) => NEGATIVE_PREFERENCE_TAGS.has(tag)).length;

    for (const tag of tags) {
      if (POSITIVE_PREFERENCE_TAGS.has(tag)) {
        positiveTags.set(tag, (positiveTags.get(tag) ?? 0) + 1);
      }

      if (NEGATIVE_PREFERENCE_TAGS.has(tag)) {
        dislikedTags.set(tag, (dislikedTags.get(tag) ?? 0) + 1);
      }

      if (tag === "eye_focus") {
        featureFocusCounts.eyes += 1;
      }

      if (tag === "lip_focus") {
        featureFocusCounts.lips += 1;
      }
    }

    if (!look) {
      continue;
    }

    const weightedScore = (row.rating ?? 0) + positiveCount - negativeCount;

    if ((row.rating ?? 0) >= 4 || positiveCount > negativeCount) {
      preferredLooks.set(look, (preferredLooks.get(look) ?? 0) + Math.max(weightedScore, 1));
    }

    if ((row.rating ?? 0) <= 2 || negativeCount > positiveCount) {
      discouragedLooks.set(look, (discouragedLooks.get(look) ?? 0) + Math.max(negativeCount, 1));
    }
  }

  for (const look of explicitPreferences.preferredLooks) {
    preferredLooks.set(look, (preferredLooks.get(look) ?? 0) + 6);
  }

  for (const look of explicitPreferences.dislikedLooks) {
    discouragedLooks.set(look, (discouragedLooks.get(look) ?? 0) + 6);
  }

  if (preferredLooks.size === 0) {
    for (const tutorial of tutorials.slice(0, 2)) {
      preferredLooks.set(tutorial.selectedLook, (preferredLooks.get(tutorial.selectedLook) ?? 0) + 1);
    }
  }

  const orderedPreferredLooks = [...preferredLooks.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([look]) => look)
    .slice(0, 3);

  const orderedDiscouragedLooks = [...discouragedLooks.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([look]) => look)
    .filter((look) => !preferredLooks.has(look))
    .slice(0, 3);

  const softLookCount = orderedPreferredLooks.filter((look) => SOFT_LOOKS.has(look)).length;
  const boldLookCount = orderedPreferredLooks.filter((look) => BOLD_LOOKS.has(look)).length;

  const inferredIntensityPreference =
    softLookCount === 0 && boldLookCount === 0
      ? null
      : softLookCount > boldLookCount
        ? "soft"
        : boldLookCount > softLookCount
          ? "bold"
          : "balanced";

  const inferredFeatureFocus =
    featureFocusCounts.eyes === featureFocusCounts.lips
      ? null
      : featureFocusCounts.eyes > featureFocusCounts.lips
        ? "eyes"
        : "lips";
  const inferredFinishPreference = inferFinishPreference(
    explicitPreferences,
    positiveTags,
    dislikedTags
  );
  const inferredStyleMood = inferStyleMood(explicitPreferences, positiveTags, dislikedTags);
  const inferredDefinitionPreference = inferDefinitionPreference(
    explicitPreferences,
    positiveTags,
    dislikedTags
  );

  return {
    preferredLooks: orderedPreferredLooks,
    discouragedLooks: orderedDiscouragedLooks,
    recentLooks,
    skillLevel: explicitPreferences.skillLevel,
    intensityPreference:
      explicitPreferences.intensityPreference ?? inferredIntensityPreference,
    finishPreference: inferredFinishPreference,
    styleMood: inferredStyleMood,
    definitionPreference: inferredDefinitionPreference,
    featureFocus: explicitPreferences.featureFocus ?? inferredFeatureFocus,
    positiveTags: getTopTags(positiveTags),
    dislikedTags: getTopTags(dislikedTags),
  };
}

function buildPersonalizationProfile(
  summary: ProfilePreferenceSummary
): PersonalizationProfile {
  return {
    preferredLooks: summary.preferredLooks.filter(isLookId),
    discouragedLooks: summary.discouragedLooks.filter(isLookId),
    recentLooks: summary.recentLooks.filter(isLookId),
    skillLevel: summary.skillLevel,
    intensityPreference: summary.intensityPreference,
    finishPreference: summary.finishPreference,
    styleMood: summary.styleMood,
    definitionPreference: summary.definitionPreference,
    featureFocus: summary.featureFocus,
    positiveTags: summary.positiveTags,
    dislikedTags: summary.dislikedTags,
  };
}

function normalizeExplicitPreferences(
  raw: Record<string, unknown> | Partial<ProfileExplicitPreferences> | null
): ProfileExplicitPreferences {
  return {
    completedOnboarding: raw?.completedOnboarding === true,
    skillLevel: isSkillLevel(raw?.skillLevel) ? raw.skillLevel : null,
    intensityPreference: isIntensityPreference(raw?.intensityPreference)
      ? raw.intensityPreference
      : null,
    finishPreference: isFinishPreference(raw?.finishPreference)
      ? raw.finishPreference
      : null,
    styleMood: isStyleMood(raw?.styleMood) ? raw.styleMood : null,
    definitionPreference: isDefinitionPreference(raw?.definitionPreference)
      ? raw.definitionPreference
      : null,
    featureFocus: isFeatureFocus(raw?.featureFocus) ? raw.featureFocus : null,
    preferredLooks: Array.isArray(raw?.preferredLooks)
      ? raw.preferredLooks.filter((value): value is string => typeof value === "string")
      : [],
    dislikedLooks: Array.isArray(raw?.dislikedLooks)
      ? raw.dislikedLooks.filter((value): value is string => typeof value === "string")
      : [],
  };
}

function getTopTags(tagCounts: Map<string, number>) {
  return [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => tag)
    .slice(0, 4);
}

function inferFinishPreference(
  explicitPreferences: ProfileExplicitPreferences,
  positiveTags: Map<string, number>,
  dislikedTags: Map<string, number>
): ProfilePreferenceSummary["finishPreference"] {
  if (explicitPreferences.finishPreference) {
    return explicitPreferences.finishPreference;
  }

  const glowScore = (positiveTags.get("fresh_glow") ?? 0) + (dislikedTags.get("too_matte") ?? 0);
  const matteScore = dislikedTags.get("too_glossy") ?? 0;

  if (glowScore === 0 && matteScore === 0) {
    return null;
  }

  if (glowScore > matteScore) {
    return "glowy";
  }

  if (matteScore > glowScore) {
    return "matte";
  }

  return "balanced";
}

function inferStyleMood(
  explicitPreferences: ProfileExplicitPreferences,
  positiveTags: Map<string, number>,
  dislikedTags: Map<string, number>
): ProfilePreferenceSummary["styleMood"] {
  if (explicitPreferences.styleMood) {
    return explicitPreferences.styleMood;
  }

  const classicScore = (positiveTags.get("clean_luxury") ?? 0) + (dislikedTags.get("too_experimental") ?? 0);
  const softScore = (positiveTags.get("soft_blend") ?? 0) + (dislikedTags.get("too_sharp") ?? 0);
  const graphicScore = (positiveTags.get("graphic_lines") ?? 0) + (positiveTags.get("sharp_definition") ?? 0);
  const experimentalScore = dislikedTags.get("too_plain") ?? 0;

  const candidates = [
    ["classic", classicScore],
    ["soft", softScore],
    ["graphic", graphicScore],
    ["experimental", experimentalScore],
  ] as const;
  const winner = [...candidates].sort((a, b) => b[1] - a[1])[0];

  return winner[1] > 0 ? winner[0] : null;
}

function inferDefinitionPreference(
  explicitPreferences: ProfileExplicitPreferences,
  positiveTags: Map<string, number>,
  dislikedTags: Map<string, number>
): ProfilePreferenceSummary["definitionPreference"] {
  if (explicitPreferences.definitionPreference) {
    return explicitPreferences.definitionPreference;
  }

  const sharpScore = (positiveTags.get("sharp_definition") ?? 0) + (positiveTags.get("graphic_lines") ?? 0);
  const diffusedScore = (positiveTags.get("soft_blend") ?? 0) + (dislikedTags.get("too_sharp") ?? 0);

  if (sharpScore === 0 && diffusedScore === 0) {
    return null;
  }

  if (sharpScore > diffusedScore) {
    return "sharp";
  }

  if (diffusedScore > sharpScore) {
    return "diffused";
  }

  return "balanced";
}

const POSITIVE_PREFERENCE_TAGS = new Set([
  "accurate",
  "felt_like_me",
  "tone_right",
  "love_this",
  "face_fit",
  "clean_luxury",
  "fresh_glow",
  "soft_blend",
  "sharp_definition",
  "graphic_lines",
  "eye_focus",
  "lip_focus",
]);

const NEGATIVE_PREFERENCE_TAGS = new Set([
  "too_generic",
  "not_my_style",
  "too_bold",
  "too_soft",
  "tone_off",
  "missed_feature",
  "too_glossy",
  "too_matte",
  "too_sharp",
  "too_plain",
  "too_experimental",
]);

const SOFT_LOOKS = new Set(["natural", "soft-glam", "monochromatic"]);
const BOLD_LOOKS = new Set(["evening", "bold-lip", "editorial"]);

function isLookId(value: string): value is LookId {
  return [
    "natural",
    "soft-glam",
    "evening",
    "bold-lip",
    "monochromatic",
    "editorial",
  ].includes(value);
}

function isSkillLevel(value: unknown): value is ProfileExplicitPreferences["skillLevel"] {
  return value === "beginner" || value === "intermediate" || value === "advanced";
}

function isIntensityPreference(
  value: unknown
): value is ProfileExplicitPreferences["intensityPreference"] {
  return value === "soft" || value === "balanced" || value === "bold";
}

function isFinishPreference(
  value: unknown
): value is ProfileExplicitPreferences["finishPreference"] {
  return value === "glowy" || value === "balanced" || value === "matte";
}

function isStyleMood(
  value: unknown
): value is ProfileExplicitPreferences["styleMood"] {
  return value === "classic" || value === "soft" || value === "graphic" || value === "experimental";
}

function isDefinitionPreference(
  value: unknown
): value is ProfileExplicitPreferences["definitionPreference"] {
  return value === "diffused" || value === "balanced" || value === "sharp";
}

function isFeatureFocus(
  value: unknown
): value is ProfileExplicitPreferences["featureFocus"] {
  return value === "eyes" || value === "lips";
}
