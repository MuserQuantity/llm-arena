"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { ModelIcon } from "@/components/layout/model-icon";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { apiDashboard, apiTasks, apiRuns, apiJudge, apiSettings, ModelEvalSummaryResponse, ModelTaskResultResponse, SettingResponse } from "@/lib/api";
import { Play, RefreshCw, Eye, BarChart3, Loader2 } from "lucide-react";
import Link from "next/link";

export default function ModelEvalPage() {
  const params = useParams();
  const modelId = params.modelId as string;
  const [data, setData] = useState<ModelEvalSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [executingTask, setExecutingTask] = useState<string | null>(null);
  const [judgingRun, setJudgingRun] = useState<string | null>(null);
  const [llmMax, setLlmMax] = useState(10);
  const [humanMax, setHumanMax] = useState(5);

  const load = useCallback(async () => {
    try {
      const d = await apiDashboard.modelEval(modelId);
      setData(d);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [modelId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    apiSettings.list().then((settings: SettingResponse[]) => {
      for (const s of settings) {
        if (s.key === "score_scale_max") setLlmMax(parseInt(s.value, 10) || 10);
        if (s.key === "human_score_scale_max") setHumanMax(parseInt(s.value, 10) || 5);
      }
    }).catch(() => {});
  }, []);

  const executeTask = async (taskId: string) => {
    setExecutingTask(taskId);
    try {
      // Create assignment if needed, then create a run only for this model
      try { await apiTasks.createAssignment(taskId, { model_id: modelId }); } catch { /* assignment may already exist */ }
      const result = await apiRuns.createForTask(taskId, modelId);
      if (result.run_ids.length > 0) {
        // Execute the run for this model
        await apiRuns.execute(result.run_ids[0]);
      }
      // Wait a moment then reload
      setTimeout(() => load(), 2000);
    } catch (e) { console.error(e); } finally { setExecutingTask(null); }
  };

  const judgeRun = async (runId: string) => {
    setJudgingRun(runId);
    try {
      await apiJudge.scoreRun(runId);
      await load();
    } catch (e) { console.error(e); } finally { setJudgingRun(null); }
  };

  if (loading) return <><Topbar title="Model Evaluation" /><main className="p-8"><div className="text-center py-20 text-muted-foreground">Loading evaluation data...</div></main></>;
  if (!data) return <><Topbar title="Model Evaluation" /><main className="p-8"><div className="text-center py-20 text-muted-foreground">Model not found</div></main></>;

  // Group tasks by dimension
  const grouped: Record<string, ModelTaskResultResponse[]> = {};
  for (const t of data.tasks) {
    if (!grouped[t.dimension_name]) grouped[t.dimension_name] = [];
    grouped[t.dimension_name].push(t);
  }

  return (
    <>
      <Topbar title={`Evaluation: ${data.model_name}`} />
      <main className="p-8">
        <div className="flex items-center gap-4 mb-6">
          <ModelIcon iconKey={data.model_icon_key} size="lg" />
          <div>
            <h1 className="text-2xl font-extrabold">{data.model_name}</h1>
            <p className="text-sm text-muted-foreground">{data.provider} &middot; Overall Average: {data.overall_avg !== null ? data.overall_avg.toFixed(2) : "N/A"}</p>
          </div>
        </div>

        {/* Dimension Averages */}
        {Object.keys(data.dimension_averages).length > 0 && (
          <div className="flex gap-3 flex-wrap mb-6">
            {Object.entries(data.dimension_averages).map(([dim, avg]) => (
              <div key={dim} className="border border-border rounded-lg px-4 py-2 text-center min-w-[120px]">
                <div className="text-xs font-semibold text-muted-foreground">{dim}</div>
                <div className="text-xl font-extrabold">{avg.toFixed(2)}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tasks grouped by dimension */}
        {Object.entries(grouped).map(([dimName, tasks]) => (
          <div key={dimName} className="mb-8">
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" /> {dimName}
            </h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>LLM Score (/{llmMax})</TableHead>
                  <TableHead>Human Score (/{humanMax})</TableHead>
                  <TableHead className="w-40">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map(task => (
                  <TableRow key={task.task_id}>
                    <TableCell className="font-medium">{task.task_title}</TableCell>
                    <TableCell>
                      {task.run_status ? (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          task.run_status === "done" ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" :
                          task.run_status === "running" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" :
                          task.run_status === "failed" ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" :
                          "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                        }`}>{task.run_status}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Not run</span>
                      )}
                    </TableCell>
                    <TableCell>{task.llm_score !== null ? <span className="font-bold">{task.llm_score.toFixed(1)}<span className="text-muted-foreground font-normal text-xs"> / {llmMax}</span></span> : <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell>{task.human_score !== null ? <span className="font-bold">{task.human_score.toFixed(1)}<span className="text-muted-foreground font-normal text-xs"> / {humanMax}</span></span> : <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => executeTask(task.task_id)} disabled={executingTask === task.task_id} title={task.run_id ? "Re-execute" : "Execute"}>
                          {executingTask === task.task_id ? <Loader2 className="w-4 h-4 animate-spin" /> : task.run_id ? <RefreshCw className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </Button>
                        {task.run_id && task.run_status === "done" && (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => judgeRun(task.run_id!)} disabled={judgingRun === task.run_id} title="Run LLM Judge">
                              {judgingRun === task.run_id ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
                            </Button>
                            <Link href={`/results/${task.run_id}`}>
                              <Button variant="ghost" size="sm" title="View Results"><Eye className="w-4 h-4" /></Button>
                            </Link>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ))}
      </main>
    </>
  );
}
