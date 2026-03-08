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
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
} from "@/components/ui/sheet";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { apiTasks, apiDimensions, TaskResponse, DimensionResponse, TaskCreatePayload } from "@/lib/api";
import { Plus, Pencil, Trash2, Filter } from "lucide-react";

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

  const fetch = useCallback(async () => {
    try {
      const [t, d] = await Promise.all([apiTasks.list(), apiDimensions.list()]);
      setTasks(t); setDimensions(d);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const filtered = filterDim === "all" ? tasks : tasks.filter(t => t.dimension_id === filterDim);

  const handleDelete = async () => {
    if (!deleteTask) return;
    setDeleting(true);
    try { await apiTasks.delete(deleteTask.id); setDeleteTask(null); fetch(); }
    catch (e) { console.error(e); } finally { setDeleting(false); }
  };

  const dimName = (id: string) => dimensions.find(d => d.id === id)?.name || "—";

  return (
    <>
      <Topbar title="Admin > Tasks" />
      <main className="p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-extrabold">Task Registry</h1>
          <Button onClick={() => { setEditTask(null); setDrawerOpen(true); }}><Plus className="w-4 h-4 mr-1.5" /> Add Task</Button>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={filterDim} onValueChange={v => setFilterDim(v ?? "all")}>
            <SelectTrigger className="w-48"><SelectValue placeholder="All Dimensions" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dimensions</SelectItem>
              {dimensions.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="text-center py-20 text-muted-foreground">Loading tasks...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg font-semibold mb-2">No tasks found</p>
            <p className="text-sm">Click &quot;Add Task&quot; to create a new evaluation task.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Dimension</TableHead>
                <TableHead>Eval Mode</TableHead>
                <TableHead>Output Type</TableHead>
                <TableHead className="w-28">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(task => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">{task.title}</TableCell>
                  <TableCell><span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">{dimName(task.dimension_id)}</span></TableCell>
                  <TableCell className="text-muted-foreground capitalize">{task.eval_mode?.replace("_", " ") || "—"}</TableCell>
                  <TableCell className="text-muted-foreground uppercase text-xs">{task.expected_output_type || "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => { setEditTask(task); setDrawerOpen(true); }}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteTask(task)} className="text-red-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <TaskDrawer open={drawerOpen} onOpenChange={o => { setDrawerOpen(o); if (!o) { setEditTask(null); fetch(); } }} editTask={editTask} dimensions={dimensions} />

        <Dialog open={!!deleteTask} onOpenChange={o => { if (!o) setDeleteTask(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Task</DialogTitle>
              <DialogDescription>Are you sure you want to delete &quot;{deleteTask?.title}&quot;? This cannot be undone.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteTask(null)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleting}>{deleting ? "Deleting..." : "Delete"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </>
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
  const [rubric, setRubric] = useState("");
  const [scriptContent, setScriptContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isEdit = !!editTask;

  useEffect(() => {
    if (editTask) {
      setTitle(editTask.title); setDimensionId(editTask.dimension_id);
      setPrompt(editTask.prompt); setOutputType(editTask.expected_output_type || "text");
      setEvalMode((editTask.eval_mode as EvalMode) || "llm_judge");
      setRubric(editTask.judge_rubric || ""); setScriptContent(editTask.yaml_config || "");
    } else {
      setTitle(""); setDimensionId(""); setPrompt(""); setOutputType("text");
      setEvalMode("llm_judge"); setRubric(""); setScriptContent("");
    }
    setError("");
  }, [editTask, open]);

  const handleSave = async () => {
    if (!title || !dimensionId || !prompt) { setError("Title, Dimension, and Prompt are required."); return; }
    setSaving(true); setError("");
    try {
      const payload: TaskCreatePayload = {
        title, dimension_id: dimensionId, prompt,
        expected_output_type: outputType, eval_mode: evalMode,
        judge_rubric: rubric, yaml_config: scriptContent,
      };
      if (isEdit && editTask) await apiTasks.update(editTask.id, payload);
      else await apiTasks.create(payload);
      onOpenChange(false);
    } catch (e) { setError(String(e)); } finally { setSaving(false); }
  };

  const showJudge = evalMode === "llm_judge" || evalMode === "both";
  const showScript = evalMode === "script_only" || evalMode === "both";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[640px] overflow-y-auto">
        <SheetHeader><SheetTitle>{isEdit ? "Edit Task" : "Add Task"}</SheetTitle></SheetHeader>
        <div className="space-y-5 py-4">
          {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-300">{error}</div>}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">Title *</label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Generate landing page HTML" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">Dimension *</label>
            <Select value={dimensionId} onValueChange={v => setDimensionId(v ?? "")}><SelectTrigger><SelectValue placeholder="Select dimension" /></SelectTrigger><SelectContent>{dimensions.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">Prompt *</label>
            <Textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Describe the prompt for the LLM to process." rows={5} />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">Expected Output Type</label>
            <div className="flex gap-2 flex-wrap">
              {["text","html","markdown","code","json"].map(t => (
                <button key={t} onClick={() => setOutputType(t)} className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${outputType === t ? "bg-blue-600 text-white" : "bg-secondary text-muted-foreground hover:bg-accent"}`}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">Eval Mode</label>
            <div className="flex gap-2 flex-wrap">
              {([["script_only","Script Only"],["llm_judge","LLM Judge"],["both","Both"]] as const).map(([v,l]) => (
                <button key={v} onClick={() => setEvalMode(v)} className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${evalMode === v ? "bg-blue-600 text-white" : "bg-secondary text-muted-foreground hover:bg-accent"}`}>{l}</button>
              ))}
            </div>
          </div>
          {showJudge && <div className="space-y-2"><label className="text-xs font-semibold text-muted-foreground">Rubric</label><Textarea value={rubric} onChange={e => setRubric(e.target.value)} placeholder="e.g., Quality, adherence to prompt, style..." rows={3} /></div>}
          {showScript && <div className="space-y-2"><label className="text-xs font-semibold text-muted-foreground">YAML Config / Script</label><Textarea value={scriptContent} onChange={e => setScriptContent(e.target.value)} placeholder={'# Evaluation script or YAML config'} className="font-mono text-xs" rows={5} /></div>}
        </div>
        <SheetFooter className="gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : isEdit ? "Update Task" : "Save Task"}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
