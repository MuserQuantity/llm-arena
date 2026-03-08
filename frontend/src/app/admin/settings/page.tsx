"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { apiSettings, apiModels, ModelResponse, SettingResponse } from "@/lib/api";
import { Save, Settings } from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingResponse[]>([]);
  const [models, setModels] = useState<ModelResponse[]>([]);
  const [judgeModelId, setJudgeModelId] = useState("");
  const [judgeRubric, setJudgeRubric] = useState("");
  const [scoreMax, setScoreMax] = useState("10");
  const [humanScoreMax, setHumanScoreMax] = useState("5");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    try {
      const [s, m] = await Promise.all([apiSettings.list(), apiModels.list()]);
      setSettings(s); setModels(m);
      for (const setting of s) {
        if (setting.key === "judge_model_id") setJudgeModelId(setting.value);
        if (setting.key === "judge_rubric") setJudgeRubric(setting.value);
        if (setting.key === "score_scale_max") setScoreMax(setting.value);
        if (setting.key === "human_score_scale_max") setHumanScoreMax(setting.value);
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    setSaving(true); setSaved(false);
    try {
      await apiSettings.update({
        judge_model_id: judgeModelId,
        judge_rubric: judgeRubric,
        score_scale_max: scoreMax,
        human_score_scale_max: humanScoreMax,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) { console.error(e); } finally { setSaving(false); }
  };

  const activeModels = models.filter(m => m.status === "active");
  const selectedModel = models.find(m => m.id === judgeModelId);
  const selectedModelName = selectedModel?.name || "未设置";

  if (loading) return <><Topbar title="系统设置" /><main className="p-8"><div className="text-center py-20 text-muted-foreground">加载设置中...</div></main></>;

  return (
    <>
      <Topbar title="系统设置" />
      <main className="p-8 max-w-3xl">
        <div className="flex items-center gap-3 mb-8">
          <Settings className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-extrabold">系统设置</h1>
        </div>

        <div className="space-y-8">
          {/* Judge Model */}
          <section className="border border-border rounded-xl p-6">
            <h2 className="text-lg font-bold mb-4">Judge 模型</h2>
            <p className="text-sm text-muted-foreground mb-4">选择默认的 LLM Judge 模型，用于自动评估其他模型的输出。各任务可单独覆盖此设置。建议选择能力最强的模型作为 Judge。</p>
            <Select value={judgeModelId} onValueChange={v => setJudgeModelId(v ?? '')}>
              <SelectTrigger className="w-full max-w-md">
                {selectedModel ? (
                  <span className="flex flex-1 text-left truncate">{selectedModel.name} ({selectedModel.provider})</span>
                ) : (
                  <span className="flex flex-1 text-left truncate text-muted-foreground">选择 Judge 模型</span>
                )}
              </SelectTrigger>
              <SelectContent>
                {activeModels.map(m => <SelectItem key={m.id} value={m.id}>{m.name} ({m.provider})</SelectItem>)}
              </SelectContent>
            </Select>
            {judgeModelId && <p className="text-xs text-muted-foreground mt-2">当前选择: {selectedModelName}</p>}
          </section>

          {/* Scoring Rubric */}
          <section className="border border-border rounded-xl p-6">
            <h2 className="text-lg font-bold mb-4">默认评分标准（Rubric）</h2>
            <p className="text-sm text-muted-foreground mb-4">当任务未单独设置评分标准时，LLM Judge 将使用此默认 Rubric。好的 Rubric 能显著提升评分的质量和一致性。</p>
            <Textarea value={judgeRubric} onChange={e => setJudgeRubric(e.target.value)} rows={8} className="font-mono text-sm" placeholder="例如：请从以下维度评分：&#10;1. 正确性（输出是否准确完成了任务要求）&#10;2. 完整性（是否覆盖了所有要求的内容）&#10;3. 质量（代码风格、文字表达等整体质量）" />
          </section>

          {/* Score Scales */}
          <section className="border border-border rounded-xl p-6">
            <h2 className="text-lg font-bold mb-4">评分量程</h2>
            <p className="text-sm text-muted-foreground mb-4">设置 LLM Judge 和人工评分的最大分值。汇总页面会将不同量程的评分归一化到百分制进行比较。</p>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">LLM Judge 最高分</label>
                <Select value={scoreMax} onValueChange={v => setScoreMax(v ?? '10')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["5","10","20","100"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">人工评分最高分</label>
                <Select value={humanScoreMax} onValueChange={v => setHumanScoreMax(v ?? '5')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["5","10","20","100"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </section>
        </div>

        <div className="flex items-center gap-4 mt-8">
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-1.5" />
            {saving ? "保存中..." : "保存设置"}
          </Button>
          {saved && <span className="text-sm font-semibold text-green-600">设置已保存！</span>}
        </div>
      </main>
    </>
  );
}
