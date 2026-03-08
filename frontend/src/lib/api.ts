const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("llm_arena_token");
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const authHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    authHeaders["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...authHeaders, ...options?.headers },
  });
  if (res.status === 401) {
    // Token expired or invalid — clear and redirect to login
    if (typeof window !== "undefined") {
      localStorage.removeItem("llm_arena_token");
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    const errorBody = await res.text().catch(() => "");
    throw new Error(`API error ${res.status}: ${errorBody}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ── Auth ──
export const apiAuth = {
  login: async (username: string, password: string): Promise<{ access_token: string; token_type: string }> => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ username, password }),
    });
    if (!res.ok) {
      const errorBody = await res.text().catch(() => "");
      throw new Error(`Login failed: ${errorBody}`);
    }
    return res.json();
  },
  me: () => apiFetch<{ username: string }>("/api/auth/me"),
};

// ── Models ──
export const apiModels = {
  list: () => apiFetch<ModelResponse[]>("/api/models"),
  get: (id: string) => apiFetch<ModelResponse>(`/api/models/${id}`),
  create: (data: ModelCreatePayload) =>
    apiFetch<ModelResponse>("/api/models", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<ModelCreatePayload>) =>
    apiFetch<ModelResponse>(`/api/models/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch<void>(`/api/models/${id}`, { method: "DELETE" }),
  testConnection: (id: string) =>
    apiFetch<{ status: string; message: string }>(`/api/models/${id}/test-connection`, { method: "POST" }),
  testConnectionInline: (data: { api_base?: string; api_key?: string; model_id?: string; custom_headers?: Record<string, string>; existing_model_db_id?: string }) =>
    apiFetch<{ status: string; message: string }>("/api/models/test-connection-inline", { method: "POST", body: JSON.stringify(data) }),
};

// ── Dimensions ──
export const apiDimensions = {
  list: () => apiFetch<DimensionResponse[]>("/api/dimensions"),
  create: (data: { name: string; slug: string; description?: string }) =>
    apiFetch<DimensionResponse>("/api/dimensions", { method: "POST", body: JSON.stringify(data) }),
};

// ── Tasks ──
export const apiTasks = {
  list: (dimensionId?: string) =>
    apiFetch<TaskResponse[]>(`/api/tasks${dimensionId ? `?dimension_id=${dimensionId}` : ""}`),
  get: (id: string) => apiFetch<TaskResponse>(`/api/tasks/${id}`),
  create: (data: TaskCreatePayload) =>
    apiFetch<TaskResponse>("/api/tasks", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<TaskCreatePayload>) =>
    apiFetch<TaskResponse>(`/api/tasks/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch<void>(`/api/tasks/${id}`, { method: "DELETE" }),
  createAssignment: (taskId: string, data: { model_id: string; override_params?: Record<string, unknown> }) =>
    apiFetch<AssignmentResponse>(`/api/tasks/${taskId}/assignments`, { method: "POST", body: JSON.stringify(data) }),
  listAssignments: (taskId: string) => apiFetch<AssignmentResponse[]>(`/api/tasks/${taskId}/assignments`),
};

// ── Runs ──
export const apiRuns = {
  list: (params?: { task_id?: string; model_id?: string; status?: string; limit?: number; offset?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.task_id) searchParams.set("task_id", params.task_id);
    if (params?.model_id) searchParams.set("model_id", params.model_id);
    if (params?.status) searchParams.set("status", params.status);
    if (params?.limit) searchParams.set("limit", String(params.limit));
    if (params?.offset) searchParams.set("offset", String(params.offset));
    const qs = searchParams.toString();
    return apiFetch<RunResponse[]>(`/api/runs${qs ? `?${qs}` : ""}`);
  },
  get: (id: string) => apiFetch<RunResponse>(`/api/runs/${id}`),
  createForTask: (taskId: string, modelId?: string) => {
    const params = new URLSearchParams({ task_id: taskId });
    if (modelId) params.set("model_id", modelId);
    return apiFetch<{ created: number; run_ids: string[] }>(`/api/runs?${params.toString()}`, { method: "POST" });
  },
  retry: (id: string) => apiFetch<RunResponse>(`/api/runs/${id}/retry`, { method: "POST" }),
  execute: (id: string) => apiFetch<{ status: string; run_id: string; duration_ms?: number | null; error?: string | null }>(`/api/runs/${id}/execute`, { method: "POST" }),
};

// ── Scores ──
export const apiScores = {
  listForRun: (runId: string) => apiFetch<ScoreResponse[]>(`/api/runs/${runId}/scores`),
  create: (runId: string, data: ScoreCreatePayload) =>
    apiFetch<ScoreResponse>(`/api/runs/${runId}/scores`, { method: "POST", body: JSON.stringify(data) }),
  update: (scoreId: string, data: Partial<ScoreCreatePayload>) =>
    apiFetch<ScoreResponse>(`/api/scores/${scoreId}`, { method: "PATCH", body: JSON.stringify(data) }),
};

// ── Dashboard ──
export const apiDashboard = {
  leaderboard: (dimensionId?: string) =>
    apiFetch<LeaderboardEntryResponse[]>(
      `/api/dashboard/leaderboard${dimensionId ? `?dimension_id=${dimensionId}` : ""}`
    ),
  modelSummary: (modelId: string) => apiFetch<ModelSummaryResponse>(`/api/dashboard/model-summary/${modelId}`),
  modelEval: (modelId: string) => apiFetch<ModelEvalSummaryResponse>(`/api/dashboard/model-eval/${modelId}`),
  summary: () => apiFetch<SummaryResponse>("/api/dashboard/summary"),
};

// ── Settings ──
export const apiSettings = {
  list: () => apiFetch<SettingResponse[]>("/api/settings"),
  get: (key: string) => apiFetch<{ key: string; value: string; description: string }>(`/api/settings/${key}`),
  update: (settings: Record<string, string>) =>
    apiFetch<{ updated: string[] }>("/api/settings", { method: "PUT", body: JSON.stringify({ settings }) }),
};

// ── Judge ──
export const apiJudge = {
  scoreRun: (runId: string) =>
    apiFetch<ScoreResponse>(`/api/judge/score/${runId}`, { method: "POST" }),
};

// ── Response Types ──
export interface ModelResponse {
  id: string;
  name: string;
  provider: string;
  model_id: string;
  icon_key: string;
  api_base: string;
  custom_headers: Record<string, string> | null;
  capabilities: string[] | null;
  default_params: Record<string, unknown> | null;
  fixed_params: Record<string, unknown> | null;
  adapter_config: Record<string, unknown> | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ModelCreatePayload {
  name: string;
  provider: string;
  model_id: string;
  icon_key?: string;
  api_base?: string;
  api_key?: string;
  custom_headers?: Record<string, string>;
  capabilities?: string[];
  default_params?: Record<string, unknown>;
  fixed_params?: Record<string, unknown>;
  adapter_config?: Record<string, unknown>;
  status?: string;
}

export interface DimensionResponse {
  id: string;
  name: string;
  slug: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface TaskResponse {
  id: string;
  title: string;
  dimension_id: string;
  prompt: string;
  yaml_config: string;
  eval_mode: string;
  judge_model_id: string | null;
  judge_rubric: string;
  expected_output_type: string;
  created_at: string;
  updated_at: string;
}

export interface TaskCreatePayload {
  title: string;
  dimension_id: string;
  prompt?: string;
  yaml_config?: string;
  eval_mode?: string;
  judge_model_id?: string;
  judge_rubric?: string;
  expected_output_type?: string;
}

export interface AssignmentResponse {
  id: string;
  task_id: string;
  model_id: string;
  override_params: Record<string, unknown> | null;
  created_at: string;
}

export interface RunResponse {
  id: string;
  task_assignment_id: string;
  status: string;
  output: string;
  output_type: string;
  started_at: string | null;
  completed_at: string | null;
  duration_ms: number | null;
  error_message: string;
  created_at: string;
  updated_at: string;
  task_id: string | null;
  task_title: string | null;
  model_id: string | null;
  model_name: string | null;
  model_icon_key: string | null;
  dimension_name: string | null;
}

export interface ScoreResponse {
  id: string;
  run_id: string;
  score_type: string;
  numeric_score: number | null;
  pass_fail: string | null;
  rationale: string;
  notes: string;
  scorer_model_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScoreCreatePayload {
  score_type: string;
  numeric_score?: number;
  pass_fail?: string;
  rationale?: string;
  notes?: string;
  scorer_model_id?: string;
}

export interface LeaderboardEntryResponse {
  model_id: string;
  model_name: string;
  model_icon_key: string;
  provider: string;
  avg_score: number;
  total_runs: number;
  top_score: number;
  last_updated: string | null;
}

export interface ModelSummaryResponse {
  model_id: string;
  model_name: string;
  provider: string;
  total_runs: number;
  completed_runs: number;
  failed_runs: number;
  avg_score: number | null;
}

export interface SettingResponse {
  id: string;
  key: string;
  value: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface ModelTaskResultResponse {
  task_id: string;
  task_title: string;
  dimension_id: string;
  dimension_name: string;
  run_id: string | null;
  run_status: string | null;
  llm_score: number | null;
  human_score: number | null;
  llm_rationale: string | null;
  human_notes: string | null;
}

export interface ModelEvalSummaryResponse {
  model_id: string;
  model_name: string;
  model_icon_key: string;
  provider: string;
  tasks: ModelTaskResultResponse[];
  dimension_averages: Record<string, number>;
  overall_avg: number | null;
}

export interface SummaryDimension {
  id: string;
  name: string;
  slug: string;
}

export interface SummaryModelEntry {
  model_id: string;
  model_name: string;
  model_icon_key: string;
  provider: string;
  dimensions: Record<string, number>;
  overall_avg: number | null;
}

export interface SummaryResponse {
  dimensions: SummaryDimension[];
  models: SummaryModelEntry[];
}
