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
} from "@/lib/medusa/generate-tutorial";
import type {
  FeedbackEventRecord,
  ProfileAnalysisHistoryItem,
  ProfileHistoryResult,
  ProfilePreferenceSummary,
  ProfileTutorialHistoryItem,
  RecordedFeedbackEvent,
} from "@/lib/persistence/types";

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
  const latestPhoto = boundedPhotos[boundedPhotos.length - 1];
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
        JSON.stringify(latestPhoto.geometryProfile),
        JSON.stringify(latestPhoto.precisionReport),
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
    const [analysesResult, tutorialsResult, feedbackResult] = await Promise.all([
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

    return {
      profileId,
      preferenceSummary: buildPreferenceSummary(tutorials, feedbackResult.rows),
      analyses,
      tutorials,
    };
  } catch (error) {
    console.error("[persistence] Failed to load profile history", error);
    return null;
  }
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
  }>
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

  const intensityPreference =
    softLookCount === 0 && boldLookCount === 0
      ? null
      : softLookCount > boldLookCount
        ? "soft"
        : boldLookCount > softLookCount
          ? "bold"
          : "balanced";

  const featureFocus =
    featureFocusCounts.eyes === featureFocusCounts.lips
      ? null
      : featureFocusCounts.eyes > featureFocusCounts.lips
        ? "eyes"
        : "lips";

  return {
    preferredLooks: orderedPreferredLooks,
    discouragedLooks: orderedDiscouragedLooks,
    recentLooks,
    intensityPreference,
    featureFocus,
    positiveTags: getTopTags(positiveTags),
    dislikedTags: getTopTags(dislikedTags),
  };
}

function getTopTags(tagCounts: Map<string, number>) {
  return [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => tag)
    .slice(0, 4);
}

const POSITIVE_PREFERENCE_TAGS = new Set([
  "accurate",
  "my_style",
  "love_this",
  "face_fit",
  "eye_focus",
  "lip_focus",
]);

const NEGATIVE_PREFERENCE_TAGS = new Set([
  "too_generic",
  "not_my_style",
  "too_bold",
  "too_soft",
  "tone_off",
]);

const SOFT_LOOKS = new Set(["natural", "soft-glam", "monochromatic"]);
const BOLD_LOOKS = new Set(["evening", "bold-lip", "editorial"]);
