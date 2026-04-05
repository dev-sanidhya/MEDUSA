ALTER TABLE medusa_analysis_runs
  ADD COLUMN IF NOT EXISTS representative_photo_index SMALLINT,
  ADD COLUMN IF NOT EXISTS capture_media_types TEXT[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS geometry_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS tone_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS feature_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS read_confidence JSONB,
  ADD COLUMN IF NOT EXISTS beauty_highlights TEXT[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS makeup_priorities TEXT[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS avoid_techniques TEXT[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS storage_policy TEXT NOT NULL DEFAULT 'derived_only';

UPDATE medusa_analysis_runs
SET
  geometry_summary = CASE
    WHEN final_geometry_profile IS NULL THEN '{}'::jsonb
    ELSE jsonb_build_object(
      'faceShape', final_geometry_profile->>'faceShape',
      'eyes', COALESCE(final_geometry_profile->'eyes', '{}'::jsonb),
      'lips', COALESCE(final_geometry_profile->'lips', '{}'::jsonb),
      'brows', COALESCE(final_geometry_profile->'brows', '{}'::jsonb),
      'nose', COALESCE(final_geometry_profile->'nose', '{}'::jsonb),
      'cheekbones', COALESCE(final_geometry_profile->'cheekbones', '{}'::jsonb),
      'faceRatios', COALESCE(final_geometry_profile->'faceRatios', '{}'::jsonb)
    )
  END,
  tone_summary = CASE
    WHEN face_analysis IS NULL THEN '{}'::jsonb
    ELSE jsonb_build_object(
      'skinTone', face_analysis->>'skinTone',
      'skinToneOptions', COALESCE(face_analysis->'skinToneOptions', '[]'::jsonb),
      'skinUndertone', face_analysis->>'skinUndertone',
      'skinUndertoneOptions', COALESCE(face_analysis->'skinUndertoneOptions', '[]'::jsonb),
      'skinToneExplanation', face_analysis->>'skinToneExplanation',
      'skinToneWorkWith', face_analysis->>'skinToneWorkWith',
      'skinToneAvoid', face_analysis->>'skinToneAvoid'
    )
  END,
  feature_summary = CASE
    WHEN face_analysis IS NULL THEN '{}'::jsonb
    ELSE jsonb_build_object(
      'personalReading', face_analysis->>'personalReading',
      'faceShape', face_analysis->>'faceShape',
      'faceShapeExplanation', face_analysis->>'faceShapeExplanation',
      'faceShapeWorkWith', face_analysis->>'faceShapeWorkWith',
      'faceShapeAvoid', face_analysis->>'faceShapeAvoid',
      'eyes', COALESCE(face_analysis->'eyes', '{}'::jsonb),
      'lips', COALESCE(face_analysis->'lips', '{}'::jsonb),
      'nose', COALESCE(face_analysis->'nose', '{}'::jsonb),
      'brows', COALESCE(face_analysis->'brows', '{}'::jsonb),
      'cheekbones', COALESCE(face_analysis->'cheekbones', '{}'::jsonb)
    )
  END,
  read_confidence = COALESCE(face_analysis->'readConfidence', read_confidence),
  beauty_highlights = CASE
    WHEN face_analysis IS NULL THEN beauty_highlights
    ELSE ARRAY(SELECT jsonb_array_elements_text(COALESCE(face_analysis->'beautyHighlights', '[]'::jsonb)))
  END,
  makeup_priorities = CASE
    WHEN face_analysis IS NULL THEN makeup_priorities
    ELSE ARRAY(SELECT jsonb_array_elements_text(COALESCE(face_analysis->'makeupPriorities', '[]'::jsonb)))
  END,
  avoid_techniques = CASE
    WHEN face_analysis IS NULL THEN avoid_techniques
    ELSE ARRAY(SELECT jsonb_array_elements_text(COALESCE(face_analysis->'avoidTechniques', '[]'::jsonb)))
  END
WHERE
  geometry_summary = '{}'::jsonb
  OR tone_summary = '{}'::jsonb
  OR feature_summary = '{}'::jsonb
  OR read_confidence IS NULL
  OR array_length(beauty_highlights, 1) IS NULL
  OR array_length(makeup_priorities, 1) IS NULL
  OR array_length(avoid_techniques, 1) IS NULL;

ALTER TABLE medusa_tutorial_runs
  ADD COLUMN IF NOT EXISTS personalization_profile JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS tutorial_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS look_variant JSONB,
  ADD COLUMN IF NOT EXISTS storage_policy TEXT NOT NULL DEFAULT 'derived_only';

UPDATE medusa_tutorial_runs
SET
  tutorial_summary = jsonb_build_object(
    'lookName', tutorial->>'lookName',
    'lookDescription', tutorial->>'lookDescription',
    'lookIntent', COALESCE(tutorial->'lookIntent', '{}'::jsonb),
    'stepCount', COALESCE(jsonb_array_length(COALESCE(tutorial->'steps', '[]'::jsonb)), 0),
    'closingNote', tutorial->>'closingNote'
  ),
  look_variant = COALESCE(tutorial->'lookVariant', look_variant)
WHERE tutorial_summary = '{}'::jsonb OR look_variant IS NULL;
