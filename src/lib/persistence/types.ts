export type FeedbackEventType =
  | "analysis_rating"
  | "tutorial_rating"
  | "preference_signal";

export interface ProfilePreferenceSummary {
  preferredLooks: string[];
  discouragedLooks: string[];
  recentLooks: string[];
  skillLevel: "beginner" | "intermediate" | "advanced" | null;
  intensityPreference: "soft" | "balanced" | "bold" | null;
  featureFocus: "eyes" | "lips" | null;
  positiveTags: string[];
  dislikedTags: string[];
}

export interface ProfileExplicitPreferences {
  completedOnboarding: boolean;
  skillLevel: "beginner" | "intermediate" | "advanced" | null;
  intensityPreference: "soft" | "balanced" | "bold" | null;
  featureFocus: "eyes" | "lips" | null;
  preferredLooks: string[];
  dislikedLooks: string[];
}

export interface ProfileAnalysisHistoryItem {
  id: string;
  status: "needs_more_photos" | "analysis_complete";
  photoCount: number;
  createdAt: string;
  completedAt: string;
  analysisSummary: {
    personalReading: string | null;
    faceShape: string | null;
    skinTone: string | null;
    skinUndertone: string | null;
    beautyHighlights: string[];
    precisionLevel: string | null;
  } | null;
}

export interface ProfileTutorialHistoryItem {
  id: string;
  analysisRunId: string | null;
  selectedLook: string;
  selectedEditorialSubtype: string | null;
  createdAt: string;
  completedAt: string;
  tutorialSummary: {
    lookName: string | null;
    lookDescription: string | null;
    stepCount: number;
    closingNote: string | null;
  };
}

export interface ProfileHistoryResult {
  profileId: string;
  explicitPreferences: ProfileExplicitPreferences;
  preferenceSummary: ProfilePreferenceSummary;
  analyses: ProfileAnalysisHistoryItem[];
  tutorials: ProfileTutorialHistoryItem[];
}

export interface FeedbackEventRecord {
  profileId: string;
  eventType: FeedbackEventType;
  analysisRunId?: string | null;
  tutorialRunId?: string | null;
  rating?: number | null;
  tags?: string[];
  feedbackText?: string | null;
  metadata?: Record<string, unknown>;
}

export interface RecordedFeedbackEvent {
  id: string;
}
