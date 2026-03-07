import { LeaderboardEntry, Run, Score, Dimension, Model, Task } from "@/types";

export const dimensions: Dimension[] = [
  { id: "d1", name: "Frontend Gen", slug: "frontend_generation", output_type: "html", description: "Frontend code generation quality" },
  { id: "d2", name: "Reasoning", slug: "reasoning", output_type: "text", description: "Logical reasoning ability" },
  { id: "d3", name: "Code Quality", slug: "code_quality", output_type: "code", description: "Code quality and best practices" },
  { id: "d4", name: "Summarization", slug: "summarization", output_type: "text", description: "Text summarization quality" },
];

export const models: Model[] = [
  { id: "m1", name: "GPT-4o", provider: "OpenAI", model_id: "gpt-4o", icon_key: "gpt-4o", api_base: "https://api.openai.com/v1", capabilities: ["code", "reasoning", "summarization"], status: "active", created_at: "2024-01-15T10:00:00Z", updated_at: "2024-01-15T10:00:00Z" },
  { id: "m2", name: "Claude 3.5 Sonnet", provider: "Anthropic", model_id: "claude-3-5-sonnet", icon_key: "claude", api_base: "https://api.anthropic.com/v1", capabilities: ["code", "reasoning"], status: "active", created_at: "2024-01-15T10:00:00Z", updated_at: "2024-01-15T10:00:00Z" },
  { id: "m3", name: "Gemini 1.5 Pro", provider: "Google", model_id: "gemini-1.5-pro", icon_key: "gemini", api_base: "https://generativelanguage.googleapis.com/v1", capabilities: ["code", "reasoning", "summarization"], status: "active", created_at: "2024-01-15T10:00:00Z", updated_at: "2024-01-15T10:00:00Z" },
  { id: "m4", name: "DeepSeek V3", provider: "DeepSeek", model_id: "deepseek-v3", icon_key: "deepseek", api_base: "https://api.deepseek.com/v1", capabilities: ["code"], status: "active", created_at: "2024-01-15T10:00:00Z", updated_at: "2024-01-15T10:00:00Z" },
  { id: "m5", name: "Llama 3.1 70B", provider: "Meta", model_id: "llama-3.1-70b", icon_key: "llama", api_base: "https://api.together.xyz/v1", capabilities: ["code", "reasoning"], status: "active", created_at: "2024-01-15T10:00:00Z", updated_at: "2024-01-15T10:00:00Z" },
  { id: "m6", name: "Mistral Large", provider: "Mistral", model_id: "mistral-large", icon_key: "mistral", api_base: "https://api.mistral.ai/v1", capabilities: ["code"], status: "active", created_at: "2024-01-15T10:00:00Z", updated_at: "2024-01-15T10:00:00Z" },
];

export const tasks: Task[] = [
  { id: "t1", title: "Frontend Gen", dimension_id: "d1", prompt: "用 React 写一个可折叠侧边栏组件", eval_mode: "both", expected_output_type: "html", created_at: "2024-01-16T08:00:00Z", updated_at: "2024-01-16T08:00:00Z" },
  { id: "t2", title: "Code Quality", dimension_id: "d3", prompt: "Write a clean, well-documented TypeScript utility library for date formatting", eval_mode: "llm_judge", expected_output_type: "code", created_at: "2024-01-16T09:00:00Z", updated_at: "2024-01-16T09:00:00Z" },
  { id: "t3", title: "Summarization", dimension_id: "d4", prompt: "Summarize the following research paper...", eval_mode: "llm_judge", expected_output_type: "text", created_at: "2024-01-16T10:00:00Z", updated_at: "2024-01-16T10:00:00Z" },
];

export const leaderboardData: LeaderboardEntry[] = [
  { rank: 1, model_id: "m1", model_name: "GPT-4o", model_icon: "gpt-4o", avg_score: 9.3, run_count: 112, top_score: 9.9, last_updated: "3m ago", dimension_id: "d1" },
  { rank: 2, model_id: "m2", model_name: "Claude 3.5 Sonnet", model_icon: "claude", avg_score: 8.7, run_count: 94, top_score: 9.2, last_updated: "8m ago", dimension_id: "d2" },
  { rank: 3, model_id: "m3", model_name: "Gemini 1.5 Pro", model_icon: "gemini", avg_score: 6.1, run_count: 77, top_score: 8.5, last_updated: "14m ago", dimension_id: "d1" },
  { rank: 4, model_id: "m4", model_name: "DeepSeek V3", model_icon: "deepseek", avg_score: 6.4, run_count: 85, top_score: 6.8, last_updated: "24m ago", dimension_id: "d3" },
  { rank: 5, model_id: "m5", model_name: "Llama 3.1 70B", model_icon: "llama", avg_score: 4.7, run_count: 62, top_score: 6.1, last_updated: "35m ago", dimension_id: "d2" },
  { rank: 6, model_id: "m6", model_name: "Mistral Large", model_icon: "mistral", avg_score: 4.1, run_count: 44, top_score: 5.0, last_updated: "2h ago", dimension_id: "d4" },
];

export const runs: Run[] = [
  { id: "r1", task_assignment_id: "ta1", task_id: "t1", task_title: "Frontend Gen", model_id: "m1", model_name: "GPT-4o", model_icon: "gpt-4o", dimension_name: "Frontend Generation", status: "done", output: "<html><body><h1>Collapsible Sidebar</h1><div style='display:flex;min-height:100vh;'><aside style='width:250px;background:#1a1a2e;color:white;padding:20px;transition:width 0.3s;'><h2>Menu</h2><ul style='list-style:none;padding:0;'><li style='padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.1);'>Dashboard</li><li style='padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.1);'>Analytics</li><li style='padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.1);'>Settings</li></ul></aside><main style='flex:1;padding:20px;background:#f5f5f5;'><h1>Main Content</h1><p>This is a collapsible sidebar demo.</p></main></div></body></html>", output_type: "html", started_at: "2024-01-16T17:41:00Z", completed_at: "2024-01-16T17:41:21Z", duration_ms: 21300 },
  { id: "r2", task_assignment_id: "ta2", task_id: "t1", task_title: "Frontend Gen", model_id: "m3", model_name: "Gemini 1.5 Pro", model_icon: "gemini", dimension_name: "Frontend Generation", status: "running", started_at: "2024-01-16T17:41:00Z" },
  { id: "r3", task_assignment_id: "ta3", task_id: "t2", task_title: "Code Quality", model_id: "m5", model_name: "Llama 3.1 70B", model_icon: "llama", dimension_name: "Code Quality", status: "pending", started_at: "2024-01-16T17:39:00Z" },
  { id: "r4", task_assignment_id: "ta4", task_id: "t1", task_title: "Frontend Gen", model_id: "m6", model_name: "Mistral Large", model_icon: "mistral", dimension_name: "Frontend Generation", status: "failed", error_message: "API timeout after 30s", started_at: "2024-01-16T17:31:00Z", completed_at: "2024-01-16T17:31:14Z", duration_ms: 14700 },
  { id: "r5", task_assignment_id: "ta5", task_id: "t3", task_title: "Summarization", model_id: "m2", model_name: "Claude 3.5 Sonnet", model_icon: "claude", dimension_name: "Summarization", status: "done", output: "The research paper presents a novel approach to...", output_type: "text", started_at: "2024-01-16T16:56:00Z", completed_at: "2024-01-16T16:56:09Z", duration_ms: 9200 },
  { id: "r6", task_assignment_id: "ta6", task_id: "t1", task_title: "Frontend Gen", model_id: "m2", model_name: "Claude 3.5 Sonnet", model_icon: "claude", dimension_name: "Frontend Generation", status: "done", output: "<html><body><div style='display:flex;'><nav style='width:240px;background:#2d3748;color:white;min-height:100vh;padding:16px;'><h3>Sidebar</h3><ul><li>Home</li><li>About</li><li>Contact</li></ul></nav><main style='flex:1;padding:24px;'><h1>Content Area</h1></main></div></body></html>", output_type: "html", started_at: "2024-01-16T17:20:00Z", completed_at: "2024-01-16T17:20:18Z", duration_ms: 18000 },
  { id: "r7", task_assignment_id: "ta7", task_id: "t1", task_title: "Frontend Gen", model_id: "m4", model_name: "DeepSeek V3", model_icon: "deepseek", dimension_name: "Frontend Generation", status: "done", output: "<html><body><div style='display:flex;'><aside style='width:200px;background:#334155;color:#e2e8f0;padding:20px;'><h3>Navigation</h3><a href='#'>Link 1</a><br/><a href='#'>Link 2</a></aside><div style='flex:1;padding:30px;'><h2>Main</h2><p>Content here</p></div></div></body></html>", output_type: "html", started_at: "2024-01-16T17:25:00Z", completed_at: "2024-01-16T17:25:22Z", duration_ms: 22000 },
];

export const scores: Score[] = [
  { id: "s1", run_id: "r1", score_type: "llm_judge", numeric_score: 8.5, rationale: "Great code structure. Responsive layout, minor CSS issue.", scorer_model_id: "m1", created_at: "2024-01-16T17:42:00Z" },
  { id: "s2", run_id: "r1", score_type: "manual", numeric_score: 4, rationale: "Clear output, but missed mobile case.", notes: "Needs responsive breakpoints", created_at: "2024-01-16T17:45:00Z" },
  { id: "s3", run_id: "r5", score_type: "llm_judge", numeric_score: 7.8, rationale: "Solid answers, some minor formatting.", scorer_model_id: "m1", created_at: "2024-01-16T16:57:00Z" },
  { id: "s4", run_id: "r5", score_type: "manual", numeric_score: 4, rationale: "Good summary, captured key points.", created_at: "2024-01-16T17:00:00Z" },
  { id: "s5", run_id: "r6", score_type: "llm_judge", numeric_score: 7.8, rationale: "Solid answers, some minor formatting.", scorer_model_id: "m1", created_at: "2024-01-16T17:21:00Z" },
  { id: "s6", run_id: "r6", score_type: "manual", numeric_score: 4, rationale: "Good structure but basic styling.", created_at: "2024-01-16T17:22:00Z" },
  { id: "s7", run_id: "r7", score_type: "llm_judge", numeric_score: 6.4, rationale: "Functional but verbose output.", scorer_model_id: "m1", created_at: "2024-01-16T17:26:00Z" },
  { id: "s8", run_id: "r7", score_type: "manual", numeric_score: 3, rationale: "Works but lacks polish.", created_at: "2024-01-16T17:27:00Z" },
];

export function getScoreColor(score: number): string {
  if (score >= 8) return "text-green-600 dark:text-green-400";
  if (score >= 5) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
}

export function getScoreBgColor(score: number): string {
  if (score >= 8) return "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300";
  if (score >= 5) return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300";
  return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
}

export function getStatusConfig(status: string) {
  switch (status) {
    case "done":
      return { label: "Done", className: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300", dotColor: "bg-green-500" };
    case "running":
      return { label: "Running", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300", dotColor: "bg-blue-500" };
    case "pending":
      return { label: "Pending", className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400", dotColor: "bg-gray-400" };
    case "failed":
      return { label: "Failed", className: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300", dotColor: "bg-red-500" };
    default:
      return { label: status, className: "bg-gray-100 text-gray-600", dotColor: "bg-gray-400" };
  }
}

export function getScoresForRun(runId: string): Score[] {
  return scores.filter((s) => s.run_id === runId);
}

export function getRunById(runId: string): Run | undefined {
  return runs.find((r) => r.id === runId);
}

export function formatDuration(ms?: number): string {
  if (!ms) return "—";
  return `${(ms / 1000).toFixed(1)}s`;
}
