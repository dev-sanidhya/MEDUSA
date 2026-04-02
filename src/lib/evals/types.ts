export type EvalWorkflow = "face_analysis" | "tutorial_generation";
export type EvalIssueSeverity = "info" | "warn" | "fail";
export type EvalIssuePhase = "automatic" | "review";
export type ExecutionStatus = "succeeded" | "failed";

export interface EvalIssue {
  code: string;
  severity: EvalIssueSeverity;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface AutomaticEvalResult {
  score: number;
  passed: boolean;
  issues: EvalIssue[];
}

export interface PromptVersionRecord {
  id: string;
  workflow: EvalWorkflow;
  model: string;
  schemaVersion: string;
  description: string;
}

export interface InferenceRunRecord {
  workflow: EvalWorkflow;
  executionStatus: ExecutionStatus;
  outputStatus?: string;
  parentRunId?: string;
  sessionKey?: string;
  selectedLook?: string;
  model: string;
  promptVersion: string;
  schemaVersion: string;
  requestSummary: unknown;
  responseSummary?: unknown;
  automaticEvaluation?: AutomaticEvalResult;
  metrics?: Record<string, unknown>;
  errorTag?: string;
  errorMessage?: string;
}

export interface RecordedInferenceRun {
  id: string;
}
