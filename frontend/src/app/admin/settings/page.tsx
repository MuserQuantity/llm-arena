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
  const selectedModelName = models.find(m => m.id === judgeModelId)?.name || "Not set";

  if (loading) return <><Topbar title="Admin > Settings" /><main className="p-8"><div className="text-center py-20 text-muted-foreground">Loading settings...</div></main></>;

  return (
    <>
      <Topbar title="Admin > Settings" />
      <main className="p-8 max-w-3xl">
        <div className="flex items-center gap-3 mb-8">
          <Settings className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-extrabold">System Settings</h1>
        </div>

        <div className="space-y-8">
          {/* Judge Model */}
          <section className="border border-border rounded-xl p-6">
            <h2 className="text-lg font-bold mb-4">Judge Model</h2>
            <p className="text-sm text-muted-foreground mb-4">Select the default LLM model used as the judge for evaluating other models&apos; outputs. Individual tasks can override this setting.</p>
            <Select value={judgeModelId} onValueChange={v => setJudgeModelId(v ?? '')}>
              <SelectTrigger className="w-full max-w-md"><SelectValue placeholder="Select judge model" /></SelectTrigger>
              <SelectContent>
                {activeModels.map(m => <SelectItem key={m.id} value={m.id}>{m.name} ({m.provider})</SelectItem>)}
              </SelectContent>
            </Select>
            {judgeModelId && <p className="text-xs text-muted-foreground mt-2">Current: {selectedModelName}</p>}
          </section>

          {/* Scoring Rubric */}
          <section className="border border-border rounded-xl p-6">
            <h2 className="text-lg font-bold mb-4">Default Scoring Rubric</h2>
            <p className="text-sm text-muted-foreground mb-4">This rubric is used by the LLM judge when no task-specific rubric is provided.</p>
            <Textarea value={judgeRubric} onChange={e => setJudgeRubric(e.target.value)} rows={8} className="font-mono text-sm" />
          </section>

          {/* Score Scales */}
          <section className="border border-border rounded-xl p-6">
            <h2 className="text-lg font-bold mb-4">Score Scales</h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">LLM Judge Max Score</label>
                <Select value={scoreMax} onValueChange={v => setScoreMax(v ?? '10')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["5","10","20","100"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">Human Score Max</label>
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
            {saving ? "Saving..." : "Save Settings"}
          </Button>
          {saved && <span className="text-sm font-semibold text-green-600">Settings saved!</span>}
        </div>
      </main>
    </>
  );
}
