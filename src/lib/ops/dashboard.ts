import { getPostgresPool } from "@/lib/db/postgres";

export interface OpsMetricCard {
  label: string;
  value: string;
  detail: string;
}

export interface OpsActivityRow {
  id: string;
  profileId: string | null;
  label: string;
  detail: string;
  createdAt: string;
  tone?: "default" | "rose" | "amber";
}

export interface OpsIssueRow {
  code: string;
  severity: "info" | "warn" | "fail";
  count: number;
  workflows: string[];
}

export interface OpsDailyVolumeRow {
  day: string;
  analyses: number;
  tutorials: number;
  feedback: number;
  evals: number;
}

export interface OpsLookHealthRow {
  look: string;
  runCount: number;
  avgScore: number | null;
  failCount: number;
}

export interface OpsDashboardData {
  metricCards: OpsMetricCard[];
  recentPersistence: OpsActivityRow[];
  recentEvalRuns: OpsActivityRow[];
  topIssues: OpsIssueRow[];
  dailyVolume: OpsDailyVolumeRow[];
  lookHealth: OpsLookHealthRow[];
}

export type OpsAccessState =
  | { status: "ready" }
  | { status: "missing_database" }
  | { status: "missing_key" }
  | { status: "forbidden" };

export function resolveOpsAccess(key: string | null): OpsAccessState {
  const db = getPostgresPool();

  if (!db) {
    return { status: "missing_database" };
  }

  const expectedKey = process.env.MEDUSA_OPS_ACCESS_KEY?.trim();

  if (!expectedKey) {
    return { status: "missing_key" };
  }

  if (key !== expectedKey) {
    return { status: "forbidden" };
  }

  return { status: "ready" };
}

export async function getOpsDashboardData(): Promise<OpsDashboardData> {
  const db = getPostgresPool();

  if (!db) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const [
    overviewResult,
    recentPersistenceResult,
    recentEvalRunsResult,
    topIssuesResult,
    dailyVolumeResult,
    lookHealthResult,
  ] = await Promise.all([
    db.query<{
      profile_count: string;
      analysis_count: string;
      tutorial_count: string;
      feedback_count: string;
      eval_count: string;
      failing_eval_count: string;
      avg_eval_score: string | null;
      active_profiles_7d: string;
    }>(`
      SELECT
        (SELECT COUNT(*)::text FROM medusa_profiles) AS profile_count,
        (SELECT COUNT(*)::text FROM medusa_analysis_runs) AS analysis_count,
        (SELECT COUNT(*)::text FROM medusa_tutorial_runs) AS tutorial_count,
        (SELECT COUNT(*)::text FROM medusa_feedback_events) AS feedback_count,
        (SELECT COUNT(*)::text FROM medusa_inference_runs) AS eval_count,
        (SELECT COUNT(*)::text FROM medusa_inference_runs WHERE automatic_pass = false OR execution_status = 'failed') AS failing_eval_count,
        (SELECT ROUND(AVG(automatic_score))::text FROM medusa_inference_runs WHERE automatic_score IS NOT NULL) AS avg_eval_score,
        (
          SELECT COUNT(*)::text
          FROM medusa_profiles
          WHERE last_seen_at >= NOW() - INTERVAL '7 days'
        ) AS active_profiles_7d
    `),
    db.query<{
      id: string;
      profile_id: string | null;
      kind: string;
      detail: string;
      created_at: Date;
    }>(`
      SELECT *
      FROM (
        SELECT
          id,
          profile_id,
          'analysis'::text AS kind,
          CONCAT(status, ' • ', photo_count, ' photo', CASE WHEN photo_count = 1 THEN '' ELSE 's' END) AS detail,
          created_at
        FROM medusa_analysis_runs
        UNION ALL
        SELECT
          id,
          profile_id,
          'tutorial'::text AS kind,
          CONCAT(selected_look, COALESCE(' / ' || selected_editorial_subtype, '')) AS detail,
          created_at
        FROM medusa_tutorial_runs
        UNION ALL
        SELECT
          id,
          profile_id,
          CONCAT('feedback:', event_type) AS kind,
          CONCAT('rating ', COALESCE(rating::text, 'n/a')) AS detail,
          created_at
        FROM medusa_feedback_events
      ) activity
      ORDER BY created_at DESC
      LIMIT 18
    `),
    db.query<{
      id: string;
      workflow: string;
      execution_status: string;
      selected_look: string | null;
      automatic_score: number | null;
      automatic_pass: boolean | null;
      error_tag: string | null;
      created_at: Date;
    }>(`
      SELECT
        id,
        workflow,
        execution_status,
        selected_look,
        automatic_score,
        automatic_pass,
        error_tag,
        created_at
      FROM medusa_inference_runs
      ORDER BY created_at DESC
      LIMIT 18
    `),
    db.query<{
      code: string;
      severity: "info" | "warn" | "fail";
      count: string;
      workflows: string[];
    }>(`
      SELECT
        ii.code,
        ii.severity,
        COUNT(*)::text AS count,
        ARRAY_AGG(DISTINCT ir.workflow ORDER BY ir.workflow) AS workflows
      FROM medusa_inference_issues ii
      JOIN medusa_inference_runs ir
        ON ir.id = ii.run_id
      GROUP BY ii.code, ii.severity
      ORDER BY COUNT(*) DESC, ii.severity DESC
      LIMIT 12
    `),
    db.query<{
      day: string;
      analyses: string;
      tutorials: string;
      feedback: string;
      evals: string;
    }>(`
      WITH days AS (
        SELECT generate_series(
          date_trunc('day', NOW()) - INTERVAL '6 days',
          date_trunc('day', NOW()),
          INTERVAL '1 day'
        ) AS day
      )
      SELECT
        TO_CHAR(days.day, 'Mon DD') AS day,
        COALESCE(a.count, 0)::text AS analyses,
        COALESCE(t.count, 0)::text AS tutorials,
        COALESCE(f.count, 0)::text AS feedback,
        COALESCE(e.count, 0)::text AS evals
      FROM days
      LEFT JOIN (
        SELECT date_trunc('day', created_at) AS day, COUNT(*) AS count
        FROM medusa_analysis_runs
        GROUP BY 1
      ) a ON a.day = days.day
      LEFT JOIN (
        SELECT date_trunc('day', created_at) AS day, COUNT(*) AS count
        FROM medusa_tutorial_runs
        GROUP BY 1
      ) t ON t.day = days.day
      LEFT JOIN (
        SELECT date_trunc('day', created_at) AS day, COUNT(*) AS count
        FROM medusa_feedback_events
        GROUP BY 1
      ) f ON f.day = days.day
      LEFT JOIN (
        SELECT date_trunc('day', created_at) AS day, COUNT(*) AS count
        FROM medusa_inference_runs
        GROUP BY 1
      ) e ON e.day = days.day
      ORDER BY days.day ASC
    `),
    db.query<{
      look: string;
      run_count: string;
      avg_score: string | null;
      fail_count: string;
    }>(`
      SELECT
        COALESCE(selected_look, '(none)') AS look,
        COUNT(*)::text AS run_count,
        ROUND(AVG(automatic_score))::text AS avg_score,
        SUM(CASE WHEN automatic_pass = false OR execution_status = 'failed' THEN 1 ELSE 0 END)::text AS fail_count
      FROM medusa_inference_runs
      WHERE workflow = 'tutorial_generation'
      GROUP BY COALESCE(selected_look, '(none)')
      ORDER BY COUNT(*) DESC, COALESCE(selected_look, '(none)') ASC
      LIMIT 12
    `),
  ]);

  const overview = overviewResult.rows[0];

  return {
    metricCards: [
      {
        label: "Profiles",
        value: overview.profile_count,
        detail: `${overview.active_profiles_7d} active in the last 7 days`,
      },
      {
        label: "Analyses",
        value: overview.analysis_count,
        detail: "Saved face reads in product memory",
      },
      {
        label: "Tutorials",
        value: overview.tutorial_count,
        detail: "Generated routines linked to profiles",
      },
      {
        label: "Feedback",
        value: overview.feedback_count,
        detail: "Ratings and tags shaping preference memory",
      },
      {
        label: "Eval Runs",
        value: overview.eval_count,
        detail: `${overview.failing_eval_count} failed or hard-flagged`,
      },
      {
        label: "Avg Eval Score",
        value: overview.avg_eval_score ?? "n/a",
        detail: "Automatic quality score across stored runs",
      },
    ],
    recentPersistence: recentPersistenceResult.rows.map((row) => ({
      id: row.id,
      profileId: row.profile_id,
      label: prettifyActivityKind(row.kind),
      detail: row.detail,
      createdAt: row.created_at.toISOString(),
      tone: row.kind.startsWith("feedback") ? "amber" : row.kind === "tutorial" ? "rose" : "default",
    })),
    recentEvalRuns: recentEvalRunsResult.rows.map((row) => ({
      id: row.id,
      profileId: null,
      label: row.workflow === "face_analysis" ? "Face Analysis Eval" : "Tutorial Eval",
      detail: [
        row.execution_status,
        row.selected_look,
        row.automatic_score !== null ? `${row.automatic_score}/100` : null,
        row.automatic_pass === false ? "flagged" : null,
        row.error_tag,
      ]
        .filter(Boolean)
        .join(" • "),
      createdAt: row.created_at.toISOString(),
      tone: row.execution_status === "failed" || row.automatic_pass === false ? "amber" : "default",
    })),
    topIssues: topIssuesResult.rows.map((row) => ({
      code: row.code,
      severity: row.severity,
      count: Number(row.count),
      workflows: row.workflows,
    })),
    dailyVolume: dailyVolumeResult.rows.map((row) => ({
      day: row.day,
      analyses: Number(row.analyses),
      tutorials: Number(row.tutorials),
      feedback: Number(row.feedback),
      evals: Number(row.evals),
    })),
    lookHealth: lookHealthResult.rows.map((row) => ({
      look: row.look,
      runCount: Number(row.run_count),
      avgScore: row.avg_score === null ? null : Number(row.avg_score),
      failCount: Number(row.fail_count),
    })),
  };
}

function prettifyActivityKind(kind: string) {
  if (kind === "analysis") return "Analysis Run";
  if (kind === "tutorial") return "Tutorial Run";
  if (kind.startsWith("feedback:analysis_rating")) return "Analysis Feedback";
  if (kind.startsWith("feedback:tutorial_rating")) return "Tutorial Feedback";
  if (kind.startsWith("feedback:preference_signal")) return "Preference Signal";
  return kind;
}
