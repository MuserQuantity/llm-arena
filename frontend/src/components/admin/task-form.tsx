"use client";

import React, { useState } from "react";
import { ModelIcon } from "@/components/layout/model-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { dimensions, models } from "@/lib/mock-data";
import { Plus, X } from "lucide-react";

type EvalMode = "script" | "llm_judge" | "both";
type OutputType = "html" | "markdown" | "text" | "code" | "json";

interface ModelAssignment {
  model_id: string;
  model_name: string;
  model_icon: string;
  override_params: string;
}

export function TaskForm() {
  const [title, setTitle] = useState("");
  const [dimensionId, setDimensionId] = useState("");
  const [prompt, setPrompt] = useState("");
  const [outputType, setOutputType] = useState<OutputType>("html");
  const [evalMode, setEvalMode] = useState<EvalMode>("both");
  const [judgeModelId, setJudgeModelId] = useState("");
  const [rubric, setRubric] = useState("");
  const [scriptContent, setScriptContent] = useState("");
  const [assignments, setAssignments] = useState<ModelAssignment[]>([
    { model_id: "m1", model_name: "GPT-4o", model_icon: "gpt-4o", override_params: "" },
    { model_id: "m2", model_name: "Claude 3.5 Sonnet", model_icon: "claude", override_params: "" },
  ]);

  const outputTypes: OutputType[] = ["html", "markdown", "text", "code", "json"];
  const evalModes: { value: EvalMode; label: string }[] = [
    { value: "script", label: "Script Only" },
    { value: "llm_judge", label: "LLM Judge Only" },
    { value: "both", label: "Both" },
  ];

  const showJudge = evalMode === "llm_judge" || evalMode === "both";
  const showScript = evalMode === "script" || evalMode === "both";

  const addModel = () => {
    const availableModels = models.filter(
      (m) => !assignments.find((a) => a.model_id === m.id)
    );
    if (availableModels.length > 0) {
      const m = availableModels[0];
      setAssignments([
        ...assignments,
        {
          model_id: m.id,
          model_name: m.name,
          model_icon: m.icon_key,
          override_params: "",
        },
      ]);
    }
  };

  const removeModel = (modelId: string) => {
    setAssignments(assignments.filter((a) => a.model_id !== modelId));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        <div className="flex gap-8">
          {/* Main column */}
          <div className="flex-[3] min-w-[300px] space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">
                Title
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Generate landing page HTML"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">
                Dimension
              </label>
              <Select value={dimensionId} onValueChange={(v) => setDimensionId(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select dimension" />
                </SelectTrigger>
                <SelectContent>
                  {dimensions.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">
                Prompt
              </label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the prompt for the LLM to process."
                rows={6}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">
                Expected Output Type
              </label>
              <div className="flex gap-2 flex-wrap">
                {outputTypes.map((t) => (
                  <button
                    key={t}
                    onClick={() => setOutputType(t)}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                      outputType === t
                        ? "bg-blue-600 text-white"
                        : "bg-secondary text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Aside column */}
          <div className="flex-[2] min-w-[240px] space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">
                Eval Mode
              </label>
              <div className="flex gap-2 flex-wrap">
                {evalModes.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setEvalMode(m.value)}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                      evalMode === m.value
                        ? "bg-blue-600 text-white"
                        : "bg-secondary text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {showJudge && (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Judge Model
                  </label>
                  <Select value={judgeModelId} onValueChange={(v) => setJudgeModelId(v ?? "")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select judge model" />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Rubric
                  </label>
                  <Textarea
                    value={rubric}
                    onChange={(e) => setRubric(e.target.value)}
                    placeholder="e.g., Quality, adherence to prompt, style..."
                    rows={2}
                  />
                </div>
              </>
            )}

            {showScript && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">
                  Python Script
                </label>
                <div className="bg-secondary rounded-lg border border-border min-h-[120px] p-3">
                  <Textarea
                    value={scriptContent}
                    onChange={(e) => setScriptContent(e.target.value)}
                    placeholder={'def evaluate(output: str, context: dict) -> dict:\n    return {"score": 8.0, "reasons": ["..."]}'}
                    className="font-mono text-xs bg-transparent border-none p-0 resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    rows={5}
                  />
                </div>
              </div>
            )}

            {/* Model Assignments */}
            <div className="space-y-2">
              <label className="text-sm font-bold">Model Assignments</label>
              <table className="w-full text-sm">
                <tbody>
                  {assignments.map((a) => (
                    <tr key={a.model_id} className="border-b border-border last:border-b-0">
                      <td className="py-2 pr-2">
                        <div className="flex items-center gap-2">
                          <ModelIcon iconKey={a.model_icon} size="sm" />
                          <span className="font-medium">{a.model_name}</span>
                        </div>
                      </td>
                      <td className="py-2">
                        <Input
                          value={a.override_params}
                          onChange={(e) =>
                            setAssignments(
                              assignments.map((item) =>
                                item.model_id === a.model_id
                                  ? { ...item, override_params: e.target.value }
                                  : item
                              )
                            )
                          }
                          placeholder="{ ... }"
                          className="text-xs font-mono h-7"
                        />
                      </td>
                      <td className="py-2 pl-2 w-8">
                        <button
                          onClick={() => removeModel(a.model_id)}
                          className="text-muted-foreground hover:text-red-500 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button
                onClick={addModel}
                className="text-sm font-semibold text-blue-600 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Model
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Footer */}
      <div className="sticky bottom-0 bg-background border-t border-border flex justify-end gap-3 px-0 py-4 z-10">
        <Button variant="outline">Cancel</Button>
        <Button>Save Task</Button>
      </div>
    </div>
  );
}
