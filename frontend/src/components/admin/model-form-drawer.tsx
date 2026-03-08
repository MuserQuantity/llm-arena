"use client";

import React, { useState, useEffect } from "react";
import { ModelIcon } from "@/components/layout/model-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
} from "@/components/ui/sheet";
import { ChevronDown, Check, AlertCircle } from "lucide-react";
import { apiModels, ModelResponse } from "@/lib/api";

const PROVIDERS = ["OpenAI","Anthropic","Google","DeepSeek","Mistral","Meta","xAI","Alibaba","Moonshot","Other"];

interface ModelFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editModel?: ModelResponse | null;
}

export function ModelFormDrawer({ open, onOpenChange, editModel }: ModelFormDrawerProps) {
  const [name, setName] = useState("");
  const [provider, setProvider] = useState("");
  const [modelId, setModelId] = useState("");
  const [iconKey, setIconKey] = useState("");
  const [apiBase, setApiBase] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [capabilities, setCapabilities] = useState<string[]>(["code"]);
  const [defaultParams, setDefaultParams] = useState("{}");
  const [fixedParams, setFixedParams] = useState("{}");
  const [adapterConfig, setAdapterConfig] = useState("{}");
  const [customHeaders, setCustomHeaders] = useState("{}");
  const [status, setStatus] = useState("active");
  const [testStatus, setTestStatus] = useState<"idle"|"success"|"error">("idle");
  const [testLoading, setTestLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showCaps, setShowCaps] = useState(true);
  const [showDP, setShowDP] = useState(false);
  const [showFP, setShowFP] = useState(false);
  const [showAC, setShowAC] = useState(false);
  const [showCH, setShowCH] = useState(false);
  const isEdit = !!editModel;

  useEffect(() => {
    if (editModel) {
      setName(editModel.name); setProvider(editModel.provider);
      setModelId(editModel.model_id); setIconKey(editModel.icon_key);
      setApiBase(editModel.api_base); setApiKey("");
      setCapabilities(editModel.capabilities || ["code"]);
      setDefaultParams(editModel.default_params ? JSON.stringify(editModel.default_params, null, 2) : "{}");
      setFixedParams(editModel.fixed_params ? JSON.stringify(editModel.fixed_params, null, 2) : "{}");
      setAdapterConfig(editModel.adapter_config ? JSON.stringify(editModel.adapter_config, null, 2) : "{}");
      setCustomHeaders(editModel.custom_headers ? JSON.stringify(editModel.custom_headers, null, 2) : "{}");
      setStatus(editModel.status);
    } else {
      setName(""); setProvider(""); setModelId(""); setIconKey("");
      setApiBase(""); setApiKey(""); setCapabilities(["code"]);
      setDefaultParams("{}"); setFixedParams("{}");
      setAdapterConfig("{}"); setCustomHeaders("{}"); setStatus("active");
    }
    setTestStatus("idle"); setError("");
  }, [editModel, open]);

  const handleTest = async () => {
    if (!editModel) return;
    setTestLoading(true);
    try {
      const r = await apiModels.testConnection(editModel.id);
      setTestStatus(r.status === "success" ? "success" : "error");
    } catch { setTestStatus("error"); } finally { setTestLoading(false); }
  };

  const toggle = (cap: string) => setCapabilities(p => p.includes(cap) ? p.filter(c => c !== cap) : [...p, cap]);

  const pj = (s: string): Record<string, unknown> | null => {
    if (!s || s.trim() === "" || s.trim() === "{}") return s.trim() === "{}" ? {} : null;
    try { const v = JSON.parse(s); return typeof v === "object" && v !== null ? v : null; } catch { return undefined as never; }
  };

  const validateJson = (s: string, label: string): string | null => {
    if (!s || s.trim() === "" || s.trim() === "{}") return null;
    try { const v = JSON.parse(s); if (typeof v !== "object" || v === null) return `${label} must be a JSON object.`; return null; }
    catch { return `${label} contains invalid JSON.`; }
  };

  const handleSave = async () => {
    if (!name || !provider || !modelId) { setError("Name, Provider, and Model ID are required."); return; }
    const jsonFields: [string, string][] = [
      [defaultParams, "Default Params"], [fixedParams, "Fixed Params"],
      [adapterConfig, "Adapter Config"], [customHeaders, "Custom Headers"],
    ];
    for (const [val, label] of jsonFields) {
      const err = validateJson(val, label);
      if (err) { setError(err); return; }
    }
    setSaving(true); setError("");
    try {
      const payload = {
        name, provider, model_id: modelId, icon_key: iconKey,
        api_base: apiBase, ...(apiKey ? { api_key: apiKey } : {}),
        capabilities, status,
        default_params: pj(defaultParams), fixed_params: pj(fixedParams),
        adapter_config: pj(adapterConfig), custom_headers: pj(customHeaders),
      };
      if (isEdit && editModel) await apiModels.update(editModel.id, payload);
      else await apiModels.create(payload);
      onOpenChange(false);
    } catch (e) { setError(String(e)); } finally { setSaving(false); }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[640px] overflow-y-auto">
        <SheetHeader><SheetTitle>{isEdit ? "Edit Model" : "Add Model"}</SheetTitle></SheetHeader>
        <div className="space-y-5 py-4">
          {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-300">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">Name *</label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., GPT-4o" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">Provider *</label>
              <Select value={provider} onValueChange={v => setProvider(v ?? "")}><SelectTrigger><SelectValue placeholder="Select provider" /></SelectTrigger><SelectContent>{PROVIDERS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">Model ID *</label>
              <Input value={modelId} onChange={e => setModelId(e.target.value)} placeholder="e.g., gpt-4o" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">Icon Key</label>
              <div className="flex items-center gap-2"><Input value={iconKey} onChange={e => setIconKey(e.target.value)} placeholder="e.g., gpt-4o" /><ModelIcon iconKey={iconKey} size="md" /></div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">API Base</label>
              <Input value={apiBase} onChange={e => setApiBase(e.target.value)} placeholder="Leave blank to use global" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">{"API Key"}{isEdit ? " (leave blank to keep)" : ""}</label>
              <Input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder={isEdit ? "Unchanged" : "API Key"} />
            </div>
          </div>
          {isEdit && <div className="space-y-2"><label className="text-xs font-semibold text-muted-foreground">Status</label><Select value={status} onValueChange={v => setStatus(v ?? "active")}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="archived">Archived</SelectItem></SelectContent></Select></div>}
          <Coll title="Capabilities" open={showCaps} onToggle={() => setShowCaps(!showCaps)}>
            <div className="flex gap-3 flex-wrap">
              {["code","reasoning","summarization","frontend","analysis"].map(cap => (
                <label key={cap} className="flex items-center gap-2 text-sm font-medium cursor-pointer select-none">
                  <input type="checkbox" checked={capabilities.includes(cap)} onChange={() => toggle(cap)} className="rounded" />
                  {cap.charAt(0).toUpperCase() + cap.slice(1)}
                </label>
              ))}
            </div>
          </Coll>
          <Coll title="Custom Headers (JSON)" open={showCH} onToggle={() => setShowCH(!showCH)}><Textarea value={customHeaders} onChange={e => setCustomHeaders(e.target.value)} className="font-mono text-sm" rows={3} /></Coll>
          <Coll title="Default Params (JSON)" open={showDP} onToggle={() => setShowDP(!showDP)}><Textarea value={defaultParams} onChange={e => setDefaultParams(e.target.value)} className="font-mono text-sm" rows={3} /></Coll>
          <Coll title="Fixed Params (JSON)" open={showFP} onToggle={() => setShowFP(!showFP)}><Textarea value={fixedParams} onChange={e => setFixedParams(e.target.value)} className="font-mono text-sm" rows={3} /></Coll>
          <Coll title="Adapter Config (JSON)" open={showAC} onToggle={() => setShowAC(!showAC)}><Textarea value={adapterConfig} onChange={e => setAdapterConfig(e.target.value)} className="font-mono text-sm" rows={3} /></Coll>
          {isEdit && <div className="flex items-center gap-3 pt-2">
            <Button variant="outline" size="sm" onClick={handleTest} disabled={testLoading}>{testLoading ? "Testing..." : "Test Connection"}</Button>
            {testStatus === "success" && <span className="text-sm font-semibold text-green-600 flex items-center gap-1"><Check className="w-4 h-4" /> Connected</span>}
            {testStatus === "error" && <span className="text-sm font-semibold text-red-600 flex items-center gap-1"><AlertCircle className="w-4 h-4" /> Failed</span>}
          </div>}
        </div>
        <SheetFooter className="gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : isEdit ? "Update Model" : "Save Model"}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function Coll({ title, open, onToggle, children }: { title: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (<div>
    <button onClick={onToggle} className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer mb-2">
      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "" : "-rotate-90"}`} />{title}
    </button>
    {open && <div>{children}</div>}
  </div>);
}
