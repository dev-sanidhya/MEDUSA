CREATE TABLE IF NOT EXISTS medusa_prompt_versions (
  id TEXT PRIMARY KEY,
  workflow TEXT NOT NULL CHECK (workflow IN ('face_analysis', 'tutorial_generation')),
  model TEXT NOT NULL,
  schema_version TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS medusa_inference_runs (
  id UUID PRIMARY KEY,
  workflow TEXT NOT NULL CHECK (workflow IN ('face_analysis', 'tutorial_generation')),
  execution_status TEXT NOT NULL CHECK (execution_status IN ('succeeded', 'failed')),
  output_status TEXT,
  parent_run_id UUID REFERENCES medusa_inference_runs(id) ON DELETE SET NULL,
  session_key TEXT,
  selected_look TEXT,
  model TEXT NOT NULL,
  prompt_version TEXT NOT NULL REFERENCES medusa_prompt_versions(id),
  schema_version TEXT NOT NULL,
  request_summary JSONB NOT NULL,
  response_summary JSONB,
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  automatic_score INTEGER,
  automatic_pass BOOLEAN,
  error_tag TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS medusa_inference_runs_workflow_created_at_idx
  ON medusa_inference_runs (workflow, created_at DESC);

CREATE INDEX IF NOT EXISTS medusa_inference_runs_prompt_version_idx
  ON medusa_inference_runs (prompt_version);

CREATE INDEX IF NOT EXISTS medusa_inference_runs_parent_run_id_idx
  ON medusa_inference_runs (parent_run_id);

CREATE INDEX IF NOT EXISTS medusa_inference_runs_selected_look_idx
  ON medusa_inference_runs (selected_look);

CREATE TABLE IF NOT EXISTS medusa_inference_issues (
  id BIGSERIAL PRIMARY KEY,
  run_id UUID NOT NULL REFERENCES medusa_inference_runs(id) ON DELETE CASCADE,
  phase TEXT NOT NULL CHECK (phase IN ('automatic', 'review')),
  code TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warn', 'fail')),
  message TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS medusa_inference_issues_run_id_idx
  ON medusa_inference_issues (run_id);

CREATE INDEX IF NOT EXISTS medusa_inference_issues_phase_severity_idx
  ON medusa_inference_issues (phase, severity);

CREATE TABLE IF NOT EXISTS medusa_inference_reviews (
  id UUID PRIMARY KEY,
  run_id UUID NOT NULL REFERENCES medusa_inference_runs(id) ON DELETE CASCADE,
  reviewer TEXT,
  overall_score SMALLINT CHECK (overall_score BETWEEN 0 AND 100),
  specificity_score SMALLINT CHECK (specificity_score BETWEEN 0 AND 100),
  look_fidelity_score SMALLINT CHECK (look_fidelity_score BETWEEN 0 AND 100),
  usefulness_score SMALLINT CHECK (usefulness_score BETWEEN 0 AND 100),
  clarity_score SMALLINT CHECK (clarity_score BETWEEN 0 AND 100),
  approved BOOLEAN,
  tags TEXT[] NOT NULL DEFAULT '{}'::text[],
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS medusa_inference_reviews_run_id_idx
  ON medusa_inference_reviews (run_id);
