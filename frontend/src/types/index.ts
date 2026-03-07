export interface Model {
  id: string;
  name: string;
  provider: string;
  model_id: string;
  icon_key: string;
  api_base: string;
  api_key_encrypted?: string;
  custom_headers?: Record<string, string>;
  capabilities: string[];
  default_params?: Record<string, unknown>;
  fixed_params?: Record<string, unknown>;
  adapter_config?: Record<string, unknown>;
  status: "active" | "archived";
  created_at: string;
  updated_at: string;
}

export interface Dimension {
  id: string;
  name: string;
  slug: string;
  description?: string;
  output_type: string;
}

export interface Task {
  id: string;
  title: string;
  dimension_id: string;
  prompt: string;
  yaml_config?: string;
  eval_mode: "script" | "llm_judge" | "both";
  judge_model_id?: string;
  judge_rubric?: string;
  expected_output_type: "text" | "markdown" | "html" | "code" | "json";
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface TaskModelAssignment {
  id: string;
  task_id: string;
  model_id: string;
  override_params?: Record<string, unknown>;
}

export type RunStatus = "pending" | "running" | "done" | "failed";

export interface Run {
  id: string;
  task_assignment_id: string;
  task_id: string;
  task_title: string;
  model_id: string;
  model_name: string;
  model_icon: string;
  dimension_name: string;
  status: RunStatus;
  output?: string;
  output_type?: string;
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
  error_message?: string;
}

export interface Score {
  id: string;
  run_id: string;
  score_type: "llm_judge" | "manual";
  numeric_score?: number;
  pass_fail?: boolean;
  rationale?: string;
  notes?: string;
  scorer_model_id?: string;
  created_at: string;
}

export interface LeaderboardEntry {
  rank: number;
  model_id: string;
  model_name: string;
  model_icon: string;
  avg_score: number;
  run_count: number;
  top_score: number;
  last_updated: string;
  dimension_id?: string;
}
