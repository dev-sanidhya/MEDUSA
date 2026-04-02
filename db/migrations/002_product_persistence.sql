CREATE TABLE IF NOT EXISTS medusa_profiles (
  id UUID PRIMARY KEY,
  user_id TEXT,
  profile_type TEXT NOT NULL DEFAULT 'anonymous'
    CHECK (profile_type IN ('anonymous', 'account')),
  preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  inferred_preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS medusa_profiles_user_id_idx
  ON medusa_profiles (user_id);

CREATE INDEX IF NOT EXISTS medusa_profiles_last_seen_at_idx
  ON medusa_profiles (last_seen_at DESC);

CREATE TABLE IF NOT EXISTS medusa_analysis_runs (
  id UUID PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES medusa_profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('needs_more_photos', 'analysis_complete')),
  photo_count SMALLINT NOT NULL CHECK (photo_count BETWEEN 1 AND 3),
  capture_attempts JSONB NOT NULL DEFAULT '[]'::jsonb,
  final_geometry_profile JSONB NOT NULL,
  final_precision_report JSONB NOT NULL,
  photo_request JSONB,
  face_analysis JSONB,
  model TEXT NOT NULL,
  prompt_version TEXT NOT NULL REFERENCES medusa_prompt_versions(id),
  schema_version TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS medusa_analysis_runs_profile_created_at_idx
  ON medusa_analysis_runs (profile_id, created_at DESC);

CREATE INDEX IF NOT EXISTS medusa_analysis_runs_status_idx
  ON medusa_analysis_runs (status);

CREATE TABLE IF NOT EXISTS medusa_tutorial_runs (
  id UUID PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES medusa_profiles(id) ON DELETE CASCADE,
  analysis_run_id UUID REFERENCES medusa_analysis_runs(id) ON DELETE SET NULL,
  selected_look TEXT NOT NULL
    CHECK (selected_look IN ('natural', 'soft-glam', 'evening', 'bold-lip', 'monochromatic', 'editorial')),
  selected_editorial_subtype TEXT
    CHECK (selected_editorial_subtype IN ('sharp', 'glossy', 'messy', 'soft')),
  input_face_analysis JSONB NOT NULL,
  tutorial JSONB NOT NULL,
  model TEXT NOT NULL,
  prompt_version TEXT NOT NULL REFERENCES medusa_prompt_versions(id),
  schema_version TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS medusa_tutorial_runs_profile_created_at_idx
  ON medusa_tutorial_runs (profile_id, created_at DESC);

CREATE INDEX IF NOT EXISTS medusa_tutorial_runs_analysis_run_id_idx
  ON medusa_tutorial_runs (analysis_run_id);

CREATE TABLE IF NOT EXISTS medusa_feedback_events (
  id UUID PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES medusa_profiles(id) ON DELETE CASCADE,
  analysis_run_id UUID REFERENCES medusa_analysis_runs(id) ON DELETE SET NULL,
  tutorial_run_id UUID REFERENCES medusa_tutorial_runs(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL
    CHECK (event_type IN ('analysis_rating', 'tutorial_rating', 'preference_signal')),
  rating SMALLINT CHECK (rating BETWEEN 1 AND 5),
  tags TEXT[] NOT NULL DEFAULT '{}'::text[],
  feedback_text TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS medusa_feedback_events_profile_created_at_idx
  ON medusa_feedback_events (profile_id, created_at DESC);

CREATE INDEX IF NOT EXISTS medusa_feedback_events_tutorial_run_id_idx
  ON medusa_feedback_events (tutorial_run_id);
