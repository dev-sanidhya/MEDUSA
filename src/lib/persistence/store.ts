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

function getPersistencePool() {
  const db = getPostgresPool();

  if (!db && !hasWarnedMissingDatabaseUrl) {
    hasWarnedMissingDatabaseUrl = true;
    console.warn("[persistence] DATABASE_URL is not set. Product persistence is disabled.");
  }

  return db;
}
