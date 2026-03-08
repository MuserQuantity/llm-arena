"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Topbar } from "@/components/layout/topbar";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { apiTasks, apiDimensions, apiModels, TaskResponse, DimensionResponse, TaskCreatePayload, ModelResponse } from "@/lib/api";
import { Plus, Pencil, Trash2, Filter, HelpCircle } from "lucide-react";

type EvalMode = "script_only" | "llm_judge" | "both";

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskResponse[]>([]);
  const [dimensions, setDimensions] = useState<DimensionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editTask, setEditTask] = useState<TaskResponse | null>(null);
  const [deleteTask, setDeleteTask] = useState<TaskResponse | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [filterDim, setFilterDim] = useState<string>("all");

  const fetchData = useCallback(async () => {
    try {
      const [t, d] = await Promise.all([apiTasks.list(), apiDimensions.list()]);
      setTasks(t); setDimensions(d);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = filterDim === "all" ? tasks : tasks.filter(t => t.dimension_id === filterDim);

  const handleDelete = async () => {
    if (!deleteTask) return;
    setDeleting(true);
    try { await apiTasks.delete(deleteTask.id); setDeleteTask(null); fetchData(); }
    catch (e) { console.error(e); } finally { setDeleting(false); }
  };

  const dimName = (id: string) => dimensions.find(d => d.id === id)?.name || "—";

  const evalModeLabel: Record<string, string> = {
    llm_judge: "LLM Judge",
    script_only: "脚本评分",
    both: "混合模式",
  };

  return (
    <>
      <Topbar title="任务管理" />
      <main className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold">任务管理</h1>
            <p className="text-sm text-muted-foreground mt-1">创建和管理评测任务。每个任务定义一个发送给 LLM 的 Prompt 及其评分标准</p>
          </div>
          <Button onClick={() => { setEditTask(null); setDrawerOpen(true); }}><Plus className="w-4 h-4 mr-1.5" /> 新建任务</Button>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={filterDim} onValueChange={v => setFilterDim(v ?? "all")}>
            <SelectTrigger className="w-48"><SelectValue placeholder="全部维度" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部维度</SelectItem>
              {dimensions.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="text-center py-20 text-muted-foreground">加载任务列表中...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg font-semibold mb-2">暂无任务</p>
            <p className="text-sm">点击"新建任务"创建第一个评测任务</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>任务名称</TableHead>
                <TableHead>维度</TableHead>
                <TableHead>评分模式</TableHead>
                <TableHead>输出类型</TableHead>
                <TableHead className="w-28">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(task => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">{task.title}</TableCell>
                  <TableCell><span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">{dimName(task.dimension_id)}</span></TableCell>
                  <TableCell className="text-muted-foreground">{evalModeLabel[task.eval_mode] || task.eval_mode || "—"}</TableCell>
                  <TableCell className="text-muted-foreground uppercase text-xs">{task.expected_output_type || "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => { setEditTask(task); setDrawerOpen(true); }} title="编辑"><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteTask(task)} className="text-red-500 hover:text-red-600" title="删除"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <TaskDrawer open={drawerOpen} onOpenChange={o => { setDrawerOpen(o); if (!o) { setEditTask(null); fetchData(); } }} editTask={editTask} dimensions={dimensions} />

        <Dialog open={!!deleteTask} onOpenChange={o => { if (!o) setDeleteTask(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>删除任务</DialogTitle>
              <DialogDescription>确定要删除 &quot;{deleteTask?.title}&quot; 吗？此操作无法撤销。</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteTask(null)}>取消</Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleting}>{deleting ? "删除中..." : "确认删除"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </>
  );
}

function FieldHelp({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{children}</p>
  );
}

function TaskDrawer({ open, onOpenChange, editTask, dimensions }: {
  open: boolean; onOpenChange: (o: boolean) => void; editTask: TaskResponse | null; dimensions: DimensionResponse[];
}) {
  const [title, setTitle] = useState("");
  const [dimensionId, setDimensionId] = useState("");
  const [prompt, setPrompt] = useState("");
  const [outputType, setOutputType] = useState("text");
  const [evalMode, setEvalMode] = useState<EvalMode>("llm_judge");
  const [judgeModelId, setJudgeModelId] = useState<string>("");
  const [rubric, setRubric] = useState("");
  const [scriptContent, setScriptContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [models, setModels] = useState<ModelResponse[]>([]);
  const isEdit = !!editTask;

  useEffect(() => {
    apiModels.list().then(m => setModels(m.filter(x => x.status === "active"))).catch(() => {});
  }, [open]);

  useEffect(() => {
    if (editTask) {
      setTitle(editTask.title); setDimensionId(editTask.dimension_id);
      setPrompt(editTask.prompt); setOutputType(editTask.expected_output_type || "text");
      setEvalMode((editTask.eval_mode as EvalMode) || "llm_judge");
      setJudgeModelId(editTask.judge_model_id || "");
      setRubric(editTask.judge_rubric || ""); setScriptContent(editTask.yaml_config || "");
    } else {
      setTitle(""); setDimensionId(""); setPrompt(""); setOutputType("text");
      setEvalMode("llm_judge"); setJudgeModelId(""); setRubric(""); setScriptContent("");
    }
    setError("");
  }, [editTask, open]);

  const handleSave = async () => {
    if (!title || !dimensionId || !prompt) { setError("请填写必填字段：名称、维度和 Prompt"); return; }
    setSaving(true); setError("");
    try {
      const payload: TaskCreatePayload = {
        title, dimension_id: dimensionId, prompt,
        expected_output_type: outputType, eval_mode: evalMode,
        judge_model_id: judgeModelId || null,
        judge_rubric: rubric, yaml_config: scriptContent,
      };
      if (isEdit && editTask) await apiTasks.update(editTask.id, payload);
      else await apiTasks.create(payload);
      onOpenChange(false);
    } catch (e) { setError(String(e)); } finally { setSaving(false); }
  };

  const showJudge = evalMode === "llm_judge" || evalMode === "both";
  const showScript = evalMode === "script_only" || evalMode === "both";

  const dimName = (id: string) => dimensions.find(d => d.id === id)?.name;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[680px] overflow-y-auto p-0">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b px-6 py-4">
          <SheetHeader>
            <SheetTitle className="text-lg font-bold">{isEdit ? "编辑任务" : "新建任务"}</SheetTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isEdit ? "修改任务配置。" : "配置一个新的评测任务，定义 Prompt 和评分标准。"}
            </p>
          </SheetHeader>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-300 flex items-start gap-2">
              <span className="shrink-0 mt-0.5">!</span>
              <span>{error}</span>
            </div>
          )}

          {/* Basic Info Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">基本信息</h3>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">任务名称 <span className="text-red-500">*</span></label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="例如：生成 Landing Page HTML" className="h-10" />
              <FieldHelp>任务的显示名称，建议简洁描述评测内容，如"Python 排序算法实现"</FieldHelp>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">评测维度 <span className="text-red-500">*</span></label>
              <Select value={dimensionId} onValueChange={v => setDimensionId(v ?? "")}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="选择评测维度">
                    {dimensionId ? dimName(dimensionId) || "选择评测维度" : "选择评测维度"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {dimensions.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-muted-foreground">暂无维度，请先在<a href="/admin/dimensions" className="text-blue-600 underline">维度管理</a>中创建</div>
                  ) : (
                    dimensions.map(d => (
                      <SelectItem key={d.id} value={d.id}>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                          {d.name}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FieldHelp>该任务属于哪个评测维度（如"代码能力"、"推理能力"、"创意写作"）。维度用于在汇总结果中分类展示评分。需先在系统中创建维度。</FieldHelp>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Prompt <span className="text-red-500">*</span></label>
              <Textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="请输入发送给被评测 LLM 的完整指令..." rows={5} className="resize-y min-h-[100px]" />
              <FieldHelp>这是发送给被评测 LLM 模型的完整指令。模型会根据此 Prompt 生成输出，然后输出将被 Judge 模型评分。请尽量清晰、具体地描述任务要求。</FieldHelp>
            </div>
          </div>

          <hr className="border-border" />

          {/* Evaluation Config Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">评分配置</h3>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">预期输出格式</label>
              <div className="flex gap-1.5 flex-wrap">
                {(["text", "html", "markdown", "code", "json"] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setOutputType(t)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${
                      outputType === t
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-background text-muted-foreground border-border hover:border-blue-300 hover:text-blue-600"
                    }`}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
              <FieldHelp>LLM 输出的预期格式。选择 HTML 时，结果页会提供沙盒预览；选择 Code 或 JSON 会以代码格式展示。此设置仅影响结果展示方式，不影响评分。</FieldHelp>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">评分模式</label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  ["llm_judge", "LLM Judge", "使用 Judge 模型自动评分（推荐）"],
                  ["script_only", "脚本评分", "使用自定义脚本评分（暂未实现）"],
                  ["both", "混合模式", "同时使用 Judge 和脚本"],
                ] as const).map(([v, l, desc]) => (
                  <button
                    key={v}
                    onClick={() => setEvalMode(v as EvalMode)}
                    className={`flex flex-col items-center gap-0.5 px-3 py-2.5 rounded-lg border text-center transition-all ${
                      evalMode === v
                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700 shadow-sm"
                        : "bg-background text-muted-foreground border-border hover:border-blue-200"
                    }`}
                  >
                    <span className="text-xs font-semibold">{l}</span>
                    <span className="text-[10px] opacity-70 leading-tight">{desc}</span>
                  </button>
                ))}
              </div>
              <FieldHelp>
                <strong>LLM Judge（推荐）</strong>：使用一个 Judge 模型（在侧边栏或设置中配置）自动对被评测模型的输出打分。
                <strong> 脚本评分</strong>：使用自定义评分脚本（当前版本暂未实现脚本执行引擎）。
                <strong> 混合模式</strong>：同时使用两种方式。
              </FieldHelp>
            </div>
          </div>

          {/* Conditional sections */}
          {(showJudge || showScript) && <hr className="border-border" />}

          {showJudge && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Judge 模型</label>
              <Select value={judgeModelId || "__global__"} onValueChange={v => setJudgeModelId(v === "__global__" ? "" : v)}>
                <SelectTrigger className="h-10">
                  {judgeModelId ? (
                    <span className="flex flex-1 text-left truncate">
                      {models.find(m => m.id === judgeModelId)?.name || judgeModelId} ({models.find(m => m.id === judgeModelId)?.provider || ""})
                    </span>
                  ) : (
                    <span className="flex flex-1 text-left truncate">使用全局设置</span>
                  )}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__global__">使用全局设置（系统设置中配置的 Judge）</SelectItem>
                  {models.map(m => <SelectItem key={m.id} value={m.id}>{m.name} ({m.provider})</SelectItem>)}
                </SelectContent>
              </Select>
              <FieldHelp>为此任务选择专用的 Judge 模型。选择"使用全局设置"则会使用系统设置中配置的默认 Judge 模型。</FieldHelp>
            </div>
          )}
          {showJudge && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Judge 评分标准（Rubric）</label>
              <Textarea value={rubric} onChange={e => setRubric(e.target.value)} placeholder="例如：请从代码正确性、可读性、效率三个方面评分..." rows={4} className="resize-y min-h-[80px]" />
              <FieldHelp>告诉 Judge 模型"按什么标准打分"。例如：代码正确性、可读性、边界处理、效率等。如果不填，将使用系统设置中的全局默认 Rubric。好的 Rubric 能显著提升评分质量和一致性。</FieldHelp>
            </div>
          )}
          {showScript && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">YAML 配置 / 脚本</label>
              <Textarea value={scriptContent} onChange={e => setScriptContent(e.target.value)} placeholder="# 评分脚本或 YAML 配置" className="font-mono text-xs resize-y min-h-[80px]" rows={4} />
              <FieldHelp>用于脚本评分模式的配置文件。当前版本主要使用 LLM Judge 模式进行评分，此字段预留给未来的自定义脚本评测扩展。</FieldHelp>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-background border-t px-6 py-4 flex items-center justify-end gap-3">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>取消</Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "保存中..." : isEdit ? "更新任务" : "创建任务"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
