"use client";

import React, { useState } from "react";
import { ModelIcon } from "@/components/layout/model-icon";
import { apiScores, apiJudge, ScoreResponse, RunResponse } from "@/lib/api";
import { Star, Edit3, Save, X, BarChart3, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

function getStatusConfig(status: string) {
  switch (status) {
    case "done": return { label: "Completed", className: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300", dotColor: "" };
    case "running": return { label: "Running", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300", dotColor: "bg-blue-500" };
    case "failed": return { label: "Failed", className: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300", dotColor: "" };
    default: return { label: status || "Pending", className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400", dotColor: "" };
  }
}

interface ResultDetailProps {
  run: RunResponse;
  scores: ScoreResponse[];
  onScoresUpdate?: () => void;
}

export function ResultDetail({ run, scores, onScoresUpdate }: ResultDetailProps) {
  const statusConfig = getStatusConfig(run.status);
  const judgeScore = scores.find(s => s.score_type === "llm_judge");
  const manualScore = scores.find(s => s.score_type === "manual");
  const [judging, setJudging] = useState(false);

  const handleJudge = async () => {
    setJudging(true);
    try { await apiJudge.scoreRun(run.id); onScoresUpdate?.(); }
    catch (e) { console.error(e); } finally { setJudging(false); }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1 lg:w-3/5 min-w-0">
        <div className="flex items-center gap-3 mb-4">
          <ModelIcon iconKey={run.model_icon_key || ""} size="lg" />
          <div>
            <h2 className="text-lg font-bold">{run.model_name || "Model"}</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{run.dimension_name || ""}</span>
              {run.task_title && <><span>&middot;</span><span>{run.task_title}</span></>}
            </div>
          </div>
          <span className={`ml-auto inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusConfig.className}`}>
            {run.status === "running" && <span className={`w-2 h-2 rounded-full ${statusConfig.dotColor} animate-pulse`} />}
            {statusConfig.label}
          </span>
        </div>
        <OutputRenderer output={run.output} outputType={run.output_type} />
      </div>

      <div className="lg:w-2/5 min-w-0 flex flex-col gap-4">
        {run.status === "done" && !judgeScore && (
          <Button onClick={handleJudge} disabled={judging} className="w-full">
            {judging ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <BarChart3 className="w-4 h-4 mr-2" />}
            {judging ? "Judging..." : "Run LLM Judge"}
          </Button>
        )}
        {judgeScore && <JudgeScoreCard score={judgeScore} />}
        <ManualScoreCard runId={run.id} score={manualScore} onSaved={onScoresUpdate} />
      </div>
    </div>
  );
}

function OutputRenderer({ output, outputType }: { output?: string; outputType?: string }) {
  const [showRaw, setShowRaw] = useState(false);
  if (!output) return <div className="bg-secondary rounded-xl h-64 flex items-center justify-center text-muted-foreground border border-border">No output available</div>;
  if (outputType === "html" && !showRaw) {
    return (<div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-semibold">Output</span>
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">HTML</span>
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300">Sandboxed Preview</span>
      </div>
      <iframe srcDoc={output} sandbox="" className="w-full min-h-96 rounded-lg border border-border bg-white" title="Sandboxed Preview" />
      <button onClick={() => setShowRaw(true)} className="mt-3 px-4 py-1.5 rounded-md text-sm font-semibold bg-secondary text-muted-foreground border border-border hover:bg-accent transition-colors">View Raw</button>
    </div>);
  }
  return (<div>
    <div className="flex items-center gap-2 mb-2">
      <span className="text-sm font-semibold">Output</span>
      {outputType && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 uppercase">{outputType}</span>}
    </div>
    <pre className="bg-secondary rounded-lg p-4 text-sm overflow-auto max-h-96 border border-border font-mono whitespace-pre-wrap">{output}</pre>
    {outputType === "html" && <button onClick={() => setShowRaw(false)} className="mt-3 px-4 py-1.5 rounded-md text-sm font-semibold bg-secondary text-muted-foreground border border-border hover:bg-accent transition-colors">Show Preview</button>}
  </div>);
}

function JudgeScoreCard({ score }: { score: ScoreResponse }) {
  return (
    <div className="border border-border rounded-xl p-4 border-l-4 border-l-blue-500">
      <div className="text-xs font-semibold text-muted-foreground mb-2 tracking-wide">LLM Judge Score</div>
      <div className="text-2xl font-extrabold mb-1">
        {score.numeric_score?.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">/ 10</span>
      </div>
      {score.rationale && <p className="text-xs text-muted-foreground mt-1 whitespace-pre-line">&ldquo;{score.rationale}&rdquo;</p>}
    </div>
  );
}

function ManualScoreCard({ runId, score, onSaved }: { runId: string; score?: ScoreResponse; onSaved?: () => void }) {
  const [editing, setEditing] = useState(false);
  const [stars, setStars] = useState(score?.numeric_score ?? 0);
  const [hoverStars, setHoverStars] = useState(0);
  const [notes, setNotes] = useState(score?.rationale ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const displayStars = hoverStars || stars;

  const handleSave = async () => {
    setSaving(true);
    try {
      if (score) {
        await apiScores.update(score.id, { numeric_score: stars, rationale: notes, notes });
      } else {
        await apiScores.create(runId, { score_type: "manual", numeric_score: stars, rationale: notes, notes });
      }
      setEditing(false); setSaved(true);
      setTimeout(() => setSaved(false), 2200);
      onSaved?.();
    } catch (e) { console.error(e); } finally { setSaving(false); }
  };

  return (
    <div className="border border-border rounded-xl p-4 border-l-4 border-l-orange-500">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-muted-foreground tracking-wide">Manual Score</span>
        <div className="flex items-center gap-2">
          {saved && <span className="text-xs font-semibold text-green-600">Saved</span>}
          {!editing && <button onClick={() => setEditing(true)} className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"><Edit3 className="w-3 h-3" /> Edit</button>}
        </div>
      </div>
      {!editing ? (
        <div>
          <div className="text-2xl font-extrabold mb-1">
            {Array.from({ length: 5 }, (_, i) => <Star key={i} className={`w-5 h-5 inline ${i < stars ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"}`} />)}
            <span className="ml-2 text-lg">{stars}/5</span>
          </div>
          {notes && <p className="text-xs text-muted-foreground mt-1">{notes}</p>}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-1">
            {Array.from({ length: 5 }, (_, i) => (
              <button key={i} onMouseEnter={() => setHoverStars(i + 1)} onMouseLeave={() => setHoverStars(0)} onClick={() => setStars(i + 1)}>
                <Star className={`w-6 h-6 transition-colors ${i < displayStars ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"}`} />
              </button>
            ))}
          </div>
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add notes..." className="text-sm" rows={2} />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving}><Save className="w-3 h-3 mr-1" /> {saving ? "Saving..." : "Save Score"}</Button>
            <Button size="sm" variant="outline" onClick={() => setEditing(false)}><X className="w-3 h-3 mr-1" /> Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
}
