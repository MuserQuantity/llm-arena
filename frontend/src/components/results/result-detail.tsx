"use client";

import React, { useState, useEffect } from "react";
import { ModelIcon } from "@/components/layout/model-icon";
import { apiScores, apiJudge, apiSettings, ScoreResponse, RunResponse, SettingResponse } from "@/lib/api";
import { Star, Edit3, Save, X, BarChart3, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

function getStatusConfig(status: string) {
  switch (status) {
    case "done": return { label: "已完成", className: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300", dotColor: "" };
    case "running": return { label: "运行中", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300", dotColor: "bg-blue-500" };
    case "failed": return { label: "失败", className: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300", dotColor: "" };
    default: return { label: status || "待运行", className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400", dotColor: "" };
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
  const [llmMax, setLlmMax] = useState(10);
  const [humanMax, setHumanMax] = useState(5);

  useEffect(() => {
    apiSettings.list().then((settings: SettingResponse[]) => {
      for (const s of settings) {
        if (s.key === "score_scale_max") setLlmMax(parseInt(s.value, 10) || 10);
        if (s.key === "human_score_scale_max") setHumanMax(parseInt(s.value, 10) || 5);
      }
    }).catch(() => {});
  }, []);

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
            {judging ? "评分中..." : "运行 LLM Judge 评分"}
          </Button>
        )}
        {judgeScore && <JudgeScoreCard score={judgeScore} maxScore={llmMax} />}
        <ManualScoreCard runId={run.id} score={manualScore} maxScore={humanMax} onSaved={onScoresUpdate} />

        {/* Score Composition */}
        {(judgeScore || manualScore) && (
          <ScoreComposition judgeScore={judgeScore} manualScore={manualScore} llmMax={llmMax} humanMax={humanMax} />
        )}
      </div>
    </div>
  );
}

function OutputRenderer({ output, outputType }: { output?: string; outputType?: string }) {
  const [showRaw, setShowRaw] = useState(false);
  if (!output) return <div className="bg-secondary rounded-xl h-64 flex items-center justify-center text-muted-foreground border border-border">暂无输出</div>;
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

function ScoreBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function JudgeScoreCard({ score, maxScore }: { score: ScoreResponse; maxScore: number }) {
  const pct = score.numeric_score != null ? Math.round((score.numeric_score / maxScore) * 100) : 0;
  return (
    <div className="border border-border rounded-xl p-4 border-l-4 border-l-blue-500">
      <div className="text-xs font-semibold text-muted-foreground mb-2 tracking-wide">LLM Judge 评分</div>
      <div className="flex items-end gap-2 mb-2">
        <span className="text-2xl font-extrabold">{score.numeric_score?.toFixed(1)}</span>
        <span className="text-sm font-normal text-muted-foreground mb-0.5">/ {maxScore}</span>
        <span className="ml-auto text-xs font-semibold text-blue-600">{pct}%</span>
      </div>
      <ScoreBar value={score.numeric_score ?? 0} max={maxScore} color="bg-blue-500" />
      {score.rationale && <p className="text-xs text-muted-foreground mt-3 whitespace-pre-line">&ldquo;{score.rationale}&rdquo;</p>}
    </div>
  );
}

function ManualScoreCard({ runId, score, maxScore, onSaved }: { runId: string; score?: ScoreResponse; maxScore: number; onSaved?: () => void }) {
  const [editing, setEditing] = useState(!score);
  const [stars, setStars] = useState(score?.numeric_score ?? 0);
  const [hoverStars, setHoverStars] = useState(0);
  const [notes, setNotes] = useState(score?.rationale ?? "");

  useEffect(() => {
    setStars(score?.numeric_score ?? 0);
    setNotes(score?.rationale ?? "");
  }, [score]);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const displayStars = hoverStars || stars;
  const useStars = maxScore <= 10;

  const handleSave = async () => {
    if (stars <= 0) return;
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

  const pct = stars > 0 ? Math.round((stars / maxScore) * 100) : 0;

  return (
    <div className="border border-border rounded-xl p-4 border-l-4 border-l-orange-500">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-muted-foreground tracking-wide">人工评分</span>
        <div className="flex items-center gap-2">
          {saved && <span className="text-xs font-semibold text-green-600">已保存</span>}
          {!editing && <button onClick={() => setEditing(true)} className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"><Edit3 className="w-3 h-3" /> 编辑</button>}
        </div>
      </div>
      {!editing ? (
        <div>
          <div className="flex items-end gap-2 mb-2">
            {useStars ? (
              <div className="flex items-center gap-0.5">
                {Array.from({ length: maxScore }, (_, i) => <Star key={i} className={`w-5 h-5 ${i < stars ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"}`} />)}
              </div>
            ) : (
              <span className="text-2xl font-extrabold">{stars > 0 ? stars.toFixed(1) : "\u2014"}</span>
            )}
            <span className="text-sm text-muted-foreground mb-0.5">{stars > 0 ? `${stars}/${maxScore}` : `\u2014/${maxScore}`}</span>
            {stars > 0 && <span className="ml-auto text-xs font-semibold text-orange-600">{pct}%</span>}
          </div>
          {stars > 0 && <ScoreBar value={stars} max={maxScore} color="bg-orange-500" />}
          {notes && <p className="text-xs text-muted-foreground mt-2">{notes}</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {useStars ? (
            <div className="flex gap-1">
              {Array.from({ length: maxScore }, (_, i) => (
                <button key={i} onMouseEnter={() => setHoverStars(i + 1)} onMouseLeave={() => setHoverStars(0)} onClick={() => setStars(i + 1)}>
                  <Star className={`w-6 h-6 transition-colors ${i < displayStars ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"}`} />
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">评分 (1 - {maxScore})</label>
              <Input
                type="number"
                min={1}
                max={maxScore}
                step={1}
                value={stars > 0 ? stars : ""}
                onChange={e => {
                  const v = parseFloat(e.target.value);
                  if (!isNaN(v) && v >= 0 && v <= maxScore) setStars(v);
                  else if (e.target.value === "") setStars(0);
                }}
                placeholder={`Enter score (1-${maxScore})`}
                className="h-10"
              />
            </div>
          )}
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="添加评分备注..." className="text-sm" rows={2} />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving || stars <= 0}><Save className="w-3 h-3 mr-1" /> {saving ? "保存中..." : "保存评分"}</Button>
            <Button size="sm" variant="outline" onClick={() => setEditing(false)}><X className="w-3 h-3 mr-1" /> 取消</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreComposition({ judgeScore, manualScore, llmMax, humanMax }: {
  judgeScore?: ScoreResponse;
  manualScore?: ScoreResponse;
  llmMax: number;
  humanMax: number;
}) {
  const llmVal = judgeScore?.numeric_score;
  const humanVal = manualScore?.numeric_score;
  const llmPct = llmVal != null ? (llmVal / llmMax) * 100 : null;
  const humanPct = humanVal != null ? (humanVal / humanMax) * 100 : null;

  const items: { label: string; score: number; max: number; pct: number; color: string }[] = [];
  if (llmVal != null) items.push({ label: "LLM Judge 评分", score: llmVal, max: llmMax, pct: llmPct!, color: "bg-blue-500" });
  if (humanVal != null) items.push({ label: "人工评分", score: humanVal, max: humanMax, pct: humanPct!, color: "bg-orange-500" });

  if (items.length === 0) return null;

  const avgPct = items.reduce((sum, i) => sum + i.pct, 0) / items.length;

  return (
    <div className="border border-border rounded-xl p-4">
      <div className="text-xs font-semibold text-muted-foreground mb-3 tracking-wide">评分构成</div>
      <div className="space-y-3">
        {items.map(item => (
          <div key={item.label}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-medium">{item.label}</span>
              <span className="text-muted-foreground">{item.score.toFixed(1)} / {item.max} ({Math.round(item.pct)}%)</span>
            </div>
            <ScoreBar value={item.score} max={item.max} color={item.color} />
          </div>
        ))}
      </div>
      {items.length > 1 && (
        <div className="mt-4 pt-3 border-t border-border">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold">归一化均分</span>
            <span className="font-bold text-foreground">{Math.round(avgPct)}%</span>
          </div>
          <ScoreBar value={avgPct} max={100} color="bg-green-500" />
        </div>
      )}
    </div>
  );
}
