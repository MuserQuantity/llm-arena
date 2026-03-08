"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Topbar } from "@/components/layout/topbar";
import { ModelIcon } from "@/components/layout/model-icon";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  apiDashboard, apiTasks, apiRuns, apiJudge, apiSettings, apiModels,
  ModelEvalSummaryResponse, ModelTaskResultResponse, SettingResponse, ModelResponse,
} from "@/lib/api";
import {
  Play, RefreshCw, Eye, BarChart3, Loader2, Gavel,
  AlertTriangle, CheckCircle2, Clock, XCircle, Zap, ArrowLeft, Info,
} from "lucide-react";
import Link from "next/link";

export default function ModelEvalPage() {
  const params = useParams();
  const modelId = params.modelId as string;
  const [data, setData] = useState<ModelEvalSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [executingTask, setExecutingTask] = useState<string | null>(null);
  const [judgingRun, setJudgingRun] = useState<string | null>(null);
  const [batchExecuting, setBatchExecuting] = useState(false);
  const [batchJudging, setBatchJudging] = useState(false);
  const [llmMax, setLlmMax] = useState(10);
  const [humanMax, setHumanMax] = useState(5);
  const [judgeModelName, setJudgeModelName] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const d = await apiDashboard.modelEval(modelId);
      setData(d);
    } catch (e) {
      console.error(e);
      const msg = e instanceof Error ? e.message : String(e);
      setLoadError(msg);
      toast.error("加载评测数据失败", { description: msg });
    } finally { setLoading(false); }
  }, [modelId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [settings, models] = await Promise.all([
          apiSettings.list(),
          apiModels.list(),
        ]);
        let judgeId = "";
        for (const s of settings) {
          if (s.key === "score_scale_max") setLlmMax(parseInt(s.value, 10) || 10);
          if (s.key === "human_score_scale_max") setHumanMax(parseInt(s.value, 10) || 5);
          if (s.key === "judge_model_id") judgeId = s.value;
        }
        if (judgeId) {
          const jm = models.find((m: ModelResponse) => m.id === judgeId);
          setJudgeModelName(jm?.name || null);
        }
      } catch { /* ignore */ }
    };
    loadSettings();
  }, []);

  const executeTask = async (taskId: string) => {
    const taskTitle = data?.tasks.find(t => t.task_id === taskId)?.task_title || taskId;
    setExecutingTask(taskId);
    const toastId = toast.loading(`正在执行: ${taskTitle}`, { description: "发送 Prompt 到模型中..." });
    try {
      try { await apiTasks.createAssignment(taskId, { model_id: modelId }); } catch { /* may exist */ }
      const result = await apiRuns.createForTask(taskId, modelId);
      if (result.run_ids.length > 0) {
        toast.loading(`正在执行: ${taskTitle}`, { id: toastId, description: "等待模型响应..." });
        const execResult = await apiRuns.execute(result.run_ids[0]);
        if (execResult.error) {
          toast.error(`执行失败: ${taskTitle}`, { id: toastId, description: execResult.error });
        } else {
          const dur = execResult.duration_ms ? `${(execResult.duration_ms / 1000).toFixed(1)}s` : "";
          toast.success(`执行完成: ${taskTitle}`, { id: toastId, description: dur ? `耗时 ${dur}` : undefined });
        }
      }
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(`执行出错: ${taskTitle}`, { id: toastId, description: msg });
      console.error(e);
    } finally { setExecutingTask(null); }
  };

  const judgeRun = async (runId: string) => {
    setJudgingRun(runId);
    const toastId = toast.loading("正在评分...", { description: "调用 Judge 模型中..." });
    try {
      const score = await apiJudge.scoreRun(runId);
      toast.success("评分完成", {
        id: toastId,
        description: score.numeric_score !== null ? `得分: ${score.numeric_score}` : "评分已保存",
      });
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error("评分失败", { id: toastId, description: msg });
      console.error(e);
    } finally { setJudgingRun(null); }
  };

  const executeAllUnrun = async () => {
    if (!data) return;
    setBatchExecuting(true);
    const unrunTasksList = data.tasks.filter(t => !t.run_status);
    const total = unrunTasksList.length;
    let done = 0;
    let failed = 0;
    const toastId = toast.loading(`批量执行中 (0/${total})...`);
    for (const task of unrunTasksList) {
      try {
        try { await apiTasks.createAssignment(task.task_id, { model_id: modelId }); } catch { /* may exist */ }
        const result = await apiRuns.createForTask(task.task_id, modelId);
        if (result.run_ids.length > 0) {
          await apiRuns.execute(result.run_ids[0]);
        }
        done++;
        toast.loading(`批量执行中 (${done}/${total})...`, { id: toastId, description: `当前: ${task.task_title}` });
      } catch (e) {
        failed++;
        console.error(e);
      }
    }
    await load();
    setBatchExecuting(false);
    if (failed === 0) {
      toast.success(`批量执行完成`, { id: toastId, description: `${done} 个任务全部完成` });
    } else {
      toast.warning(`批量执行完成`, { id: toastId, description: `${done} 个成功, ${failed} 个失败` });
    }
  };

  const judgeAllUnjudged = async () => {
    if (!data) return;
    setBatchJudging(true);
    const unjudged = data.tasks.filter(t => t.run_status === "done" && t.run_id && t.llm_score === null);
    const total = unjudged.length;
    let done = 0;
    let failed = 0;
    const toastId = toast.loading(`批量评分中 (0/${total})...`);
    for (const task of unjudged) {
      try {
        toast.loading(`批量评分中 (${done}/${total})...`, { id: toastId, description: `当前: ${task.task_title}` });
        await apiJudge.scoreRun(task.run_id!);
        done++;
      } catch (e) {
        failed++;
        console.error(e);
      }
    }
    await load();
    setBatchJudging(false);
    if (failed === 0) {
      toast.success(`批量评分完成`, { id: toastId, description: `${done} 个任务全部评分完成` });
    } else {
      toast.warning(`批量评分完成`, { id: toastId, description: `${done} 个成功, ${failed} 个失败` });
    }
  };

  if (loading) return <><Topbar title="模型评测" /><main className="p-8"><div className="text-center py-20 text-muted-foreground">加载评测数据中...</div></main></>;
  if (!data) return (
    <>
      <Topbar title="模型评测" />
      <main className="p-8">
        <Link href="/admin/models" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> 返回模型列表
        </Link>
        <div className="text-center py-16">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-lg font-semibold mb-2">{loadError ? "加载评测数据失败" : "模型未找到"}</p>
          {loadError && (
            <p className="text-sm text-muted-foreground mb-1 max-w-lg mx-auto break-all">
              {loadError.length > 200 ? loadError.slice(0, 200) + "…" : loadError}
            </p>
          )}
          <p className="text-sm text-muted-foreground mb-6">
            {loadError ? "后端服务可能存在异常，请检查日志后重试" : "请确认模型 ID 正确"}
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button onClick={() => { setLoading(true); load(); }}>
              <RefreshCw className="w-4 h-4 mr-1.5" /> 重试
            </Button>
            <Link href="/admin/models">
              <Button variant="outline">返回模型列表</Button>
            </Link>
          </div>
        </div>
      </main>
    </>
  );

  const totalTasks = data.tasks.length;
  const doneTasks = data.tasks.filter(t => t.run_status === "done").length;
  const scoredTasks = data.tasks.filter(t => t.llm_score !== null || t.human_score !== null).length;
  const unrunTasks = data.tasks.filter(t => !t.run_status).length;
  const unjudgedTasks = data.tasks.filter(t => t.run_status === "done" && t.run_id && t.llm_score === null).length;

  const grouped: Record<string, ModelTaskResultResponse[]> = {};
  for (const t of data.tasks) {
    if (!grouped[t.dimension_name]) grouped[t.dimension_name] = [];
    grouped[t.dimension_name].push(t);
  }

  return (
    <>
      <Topbar title={`评测: ${data.model_name}`} />
      <main className="p-8">
        {/* Back button */}
        <Link href="/admin/models" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> 返回模型列表
        </Link>

        {/* Model header */}
        <div className="flex items-center gap-4 mb-6">
          <ModelIcon iconKey={data.model_icon_key} size="lg" />
          <div className="flex-1">
            <h1 className="text-2xl font-extrabold">{data.model_name}</h1>
            <p className="text-sm text-muted-foreground">
              {data.provider} &middot; 总体均分: {data.overall_avg !== null ? data.overall_avg.toFixed(2) + "%" : "暂无"}
            </p>
          </div>
        </div>

        {/* Usage guide */}
        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            <div className="text-sm text-blue-800 dark:text-blue-300">
              <strong>使用说明：</strong>下表列出了所有评测任务。点击 <Play className="w-3 h-3 inline" /> 执行任务（将 Prompt 发送给该模型），
              任务完成后点击 <Gavel className="w-3 h-3 inline" /> 触发 LLM Judge 自动评分，
              点击 <Eye className="w-3 h-3 inline" /> 查看结果详情和人工评分。也可使用上方的批量操作按钮一键处理。
            </div>
          </div>
        </div>

        {/* Judge model indicator */}
        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg mb-6 text-sm ${
          judgeModelName
            ? "bg-secondary border border-border"
            : "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700"
        }`}>
          <Gavel className={`w-4 h-4 ${judgeModelName ? "text-blue-600" : "text-yellow-600"}`} />
          <span className="font-medium">Judge 模型：</span>
          {judgeModelName ? (
            <span className="font-semibold">{judgeModelName}</span>
          ) : (
            <>
              <span className="text-yellow-600 dark:text-yellow-400 font-semibold">未设置</span>
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              <Link href="/admin/settings" className="text-blue-600 hover:underline ml-1">去设置</Link>
            </>
          )}
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="border border-border rounded-lg px-4 py-3 text-center">
            <div className="text-xs font-semibold text-muted-foreground mb-1">总任务数</div>
            <div className="text-2xl font-extrabold">{totalTasks}</div>
          </div>
          <div className="border border-border rounded-lg px-4 py-3 text-center">
            <div className="text-xs font-semibold text-muted-foreground mb-1">已执行</div>
            <div className="text-2xl font-extrabold text-green-600">{doneTasks}<span className="text-sm text-muted-foreground font-normal">/{totalTasks}</span></div>
          </div>
          <div className="border border-border rounded-lg px-4 py-3 text-center">
            <div className="text-xs font-semibold text-muted-foreground mb-1">已评分</div>
            <div className="text-2xl font-extrabold text-blue-600">{scoredTasks}<span className="text-sm text-muted-foreground font-normal">/{totalTasks}</span></div>
          </div>
          <div className="border border-border rounded-lg px-4 py-3 text-center">
            <div className="text-xs font-semibold text-muted-foreground mb-1">总体均分</div>
            <div className="text-2xl font-extrabold">{data.overall_avg !== null ? data.overall_avg.toFixed(1) + "%" : "—"}</div>
          </div>
        </div>

        {/* Dimension averages */}
        {Object.keys(data.dimension_averages).length > 0 && (
          <div className="flex gap-3 flex-wrap mb-6">
            {Object.entries(data.dimension_averages).map(([dim, avg]) => (
              <div key={dim} className="border border-border rounded-lg px-4 py-2 text-center min-w-[120px]">
                <div className="text-xs font-semibold text-muted-foreground">{dim}</div>
                <div className="text-xl font-extrabold">{avg.toFixed(1)}%</div>
              </div>
            ))}
          </div>
        )}

        {/* Batch actions */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={executeAllUnrun}
            disabled={batchExecuting || unrunTasks === 0}
          >
            {batchExecuting ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Zap className="w-4 h-4 mr-1.5" />}
            {batchExecuting ? "批量执行中..." : `执行所有未运行 (${unrunTasks})`}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={judgeAllUnjudged}
            disabled={batchJudging || unjudgedTasks === 0 || !judgeModelName}
          >
            {batchJudging ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Gavel className="w-4 h-4 mr-1.5" />}
            {batchJudging ? "批量评分中..." : `自动评分所有未评 (${unjudgedTasks})`}
          </Button>
          <Button variant="ghost" size="sm" onClick={load}>
            <RefreshCw className="w-4 h-4 mr-1.5" /> 刷新
          </Button>
        </div>

        {/* Tasks grouped by dimension */}
        {totalTasks === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg font-semibold mb-2">暂无评测任务</p>
            <p className="text-sm mb-4">请先在"任务管理"中创建评测任务</p>
            <Link href="/admin/tasks">
              <Button variant="outline">前往创建任务</Button>
            </Link>
          </div>
        ) : (
          Object.entries(grouped).map(([dimName, tasks]) => (
            <div key={dimName} className="mb-8">
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" /> {dimName}
              </h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>任务</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>LLM 评分 (/{llmMax})</TableHead>
                    <TableHead>人工评分 (/{humanMax})</TableHead>
                    <TableHead className="w-52">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map(task => (
                    <TableRow key={task.task_id}>
                      <TableCell className="font-medium">{task.task_title}</TableCell>
                      <TableCell>
                        {task.run_status ? (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                            task.run_status === "done" ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" :
                            task.run_status === "running" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" :
                            task.run_status === "failed" ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" :
                            "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                          }`}>
                            {task.run_status === "done" && <CheckCircle2 className="w-3 h-3" />}
                            {task.run_status === "running" && <Clock className="w-3 h-3" />}
                            {task.run_status === "failed" && <XCircle className="w-3 h-3" />}
                            {task.run_status === "done" ? "已完成" :
                             task.run_status === "running" ? "运行中" :
                             task.run_status === "failed" ? "失败" : task.run_status}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">未运行</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {task.llm_score !== null ? (
                          <span className="font-bold">{task.llm_score.toFixed(1)}<span className="text-muted-foreground font-normal text-xs"> / {llmMax}</span></span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {task.human_score !== null ? (
                          <span className="font-bold">{task.human_score.toFixed(1)}<span className="text-muted-foreground font-normal text-xs"> / {humanMax}</span></span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => executeTask(task.task_id)}
                            disabled={executingTask === task.task_id}
                            title={task.run_id ? "重新执行" : "执行任务"}
                            className="gap-1 text-xs"
                          >
                            {executingTask === task.task_id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : task.run_id ? (
                              <RefreshCw className="w-3.5 h-3.5" />
                            ) : (
                              <Play className="w-3.5 h-3.5" />
                            )}
                            {task.run_id ? "重跑" : "执行"}
                          </Button>
                          {task.run_id && task.run_status === "done" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => judgeRun(task.run_id!)}
                                disabled={judgingRun === task.run_id}
                                title="LLM Judge 评分"
                                className="gap-1 text-xs"
                              >
                                {judgingRun === task.run_id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Gavel className="w-3.5 h-3.5" />
                                )}
                                评分
                              </Button>
                              <Link href={`/results/${task.run_id}`}>
                                <Button variant="ghost" size="sm" title="查看结果详情" className="gap-1 text-xs">
                                  <Eye className="w-3.5 h-3.5" /> 详情
                                </Button>
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
          ))
        )}
      </main>
    </>
  );
}
