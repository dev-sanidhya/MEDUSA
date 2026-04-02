import type { Pool } from "pg";
import { getPostgresPool } from "@/lib/db/postgres";
import type {
  InferenceRunRecord,
  PromptVersionRecord,
  RecordedInferenceRun,
} from "@/lib/evals/types";
import { PROMPT_VERSION_REGISTRY } from "@/lib/evals/versioning";

let hasWarnedMissingDatabaseUrl = false;
let hasEnsuredPromptVersions = false;

export async function recordInferenceRun(record: InferenceRunRecord): Promise<RecordedInferenceRun | null> {
  const db = getPool();

  if (!db) {
    if (!hasWarnedMissingDatabaseUrl) {
      hasWarnedMissingDatabaseUrl = true;
      console.warn("[evals] DATABASE_URL is not set. Eval persistence is disabled.");
    }

    return null;
  }

  const runId = crypto.randomUUID();
  const now = new Date();

  await ensurePromptVersions(db, PROMPT_VERSION_REGISTRY);

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      `
        INSERT INTO medusa_inference_runs (
          id,
          workflow,
          execution_status,
          output_status,
          parent_run_id,
          session_key,
          selected_look,
          model,
          prompt_version,
          schema_version,
          request_summary,
          response_summary,
          metrics,
          automatic_score,
          automatic_pass,
          error_tag,
          error_message,
          completed_at
        )
        VALUES (
          $1::uuid,
          $2,
          $3,
          $4,
          $5::uuid,
          $6,
          $7,
          $8,
          $9,
          $10,
          $11::jsonb,
          $12::jsonb,
          $13::jsonb,
          $14,
          $15,
          $16,
          $17,
          $18::timestamptz
        )
      `,
      [
        runId,
        record.workflow,
        record.executionStatus,
        record.outputStatus ?? null,
        record.parentRunId ?? null,
        record.sessionKey ?? null,
        record.selectedLook ?? null,
        record.model,
        record.promptVersion,
        record.schemaVersion,
        JSON.stringify(record.requestSummary ?? {}),
        JSON.stringify(record.responseSummary ?? null),
        JSON.stringify(record.metrics ?? {}),
        record.automaticEvaluation?.score ?? null,
        record.automaticEvaluation?.passed ?? null,
        record.errorTag ?? null,
        record.errorMessage ?? null,
        now,
      ]
    );

    for (const issue of record.automaticEvaluation?.issues ?? []) {
      await client.query(
        `
          INSERT INTO medusa_inference_issues (
            run_id,
            phase,
            code,
            severity,
            message,
            metadata
          )
          VALUES ($1::uuid, 'automatic', $2, $3, $4, $5::jsonb)
        `,
        [
          runId,
          issue.code,
          issue.severity,
          issue.message,
          JSON.stringify(issue.metadata ?? {}),
        ]
      );
    }

    await client.query("COMMIT");
    return { id: runId };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

function getPool(): Pool | null {
  return getPostgresPool();
}

async function ensurePromptVersions(db: Pool, versions: PromptVersionRecord[]) {
  if (hasEnsuredPromptVersions) {
    return;
  }

  for (const version of versions) {
    await db.query(
      `
        INSERT INTO medusa_prompt_versions (id, workflow, model, schema_version, description)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO UPDATE
        SET model = EXCLUDED.model,
            schema_version = EXCLUDED.schema_version,
            description = EXCLUDED.description
      `,
      [version.id, version.workflow, version.model, version.schemaVersion, version.description]
    );
  }

  hasEnsuredPromptVersions = true;
}
