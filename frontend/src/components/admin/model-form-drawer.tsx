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
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { ChevronDown, Check, AlertCircle } from "lucide-react";
import { apiModels, ModelResponse } from "@/lib/api";

const PROVIDERS = ["OpenAI", "Anthropic", "Google", "DeepSeek", "Mistral", "Meta", "xAI", "Alibaba", "Moonshot", "Other"];
const CAPABILITIES = ["code", "reasoning", "summarization", "frontend", "analysis"];

interface ModelFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editModel?: ModelResponse | null;
}

function FieldHelp({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{children}</p>;
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
  const [testStatus, setTestStatus] = useState<"idle" | "success" | "error">("idle");
  const [testMessage, setTestMessage] = useState("");
  const [testLoading, setTestLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isEdit = !!editModel;

  useEffect(() => {
    if (editModel) {
      setName(editModel.name);
      setProvider(editModel.provider);
      setModelId(editModel.model_id);
      setIconKey(editModel.icon_key);
      setApiBase(editModel.api_base);
      setApiKey("");
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
    setTestStatus("idle"); setTestMessage(""); setError("");
  }, [editModel, open]);

  const handleTest = async () => {
    setTestLoading(true); setTestStatus("idle"); setTestMessage("");
    try {
      let ch: Record<string, string> | undefined;
      try { const parsed = JSON.parse(customHeaders); if (typeof parsed === "object" && parsed !== null) ch = parsed; } catch { /* ignore */ }

      const r = await apiModels.testConnectionInline({
        api_base: apiBase,
        api_key: apiKey || undefined,
        model_id: modelId,
        custom_headers: ch,
        existing_model_db_id: editModel?.id,
      });
      setTestStatus(r.status === "success" ? "success" : "error");
      setTestMessage(r.message || "");
    } catch { setTestStatus("error"); setTestMessage("请求失败"); } finally { setTestLoading(false); }
  };

  const toggle = (cap: string) =>
    setCapabilities(p => p.includes(cap) ? p.filter(c => c !== cap) : [...p, cap]);

  const pj = (s: string): Record<string, unknown> | undefined => {
    if (!s || s.trim() === "" || s.trim() === "{}") return s.trim() === "{}" ? {} : undefined;
    try { const v = JSON.parse(s); return typeof v === "object" && v !== null ? v : undefined; } catch { return undefined; }
  };

  const validateJson = (s: string, label: string): string | null => {
    if (!s || s.trim() === "" || s.trim() === "{}") return null;
    try { const v = JSON.parse(s); if (typeof v !== "object" || v === null) return `${label} 必须是 JSON 对象`; return null; }
    catch { return `${label} 包含无效的 JSON`; }
  };

  const handleSave = async () => {
    if (!name || !provider || !modelId) { setError("请填写必填字段：名称、供应商和 Model ID"); return; }
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
        adapter_config: pj(adapterConfig),
        custom_headers: pj(customHeaders) as Record<string, string> | undefined,
      };
      if (isEdit && editModel) await apiModels.update(editModel.id, payload);
      else await apiModels.create(payload);
      onOpenChange(false);
    } catch (e) { setError(String(e)); } finally { setSaving(false); }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[680px] overflow-y-auto p-0">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-background border-b px-6 py-4">
          <SheetHeader>
            <SheetTitle className="text-lg font-bold">{isEdit ? "编辑模型" : "添加模型"}</SheetTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isEdit ? "修改模型配置。API Key 留空则保持原值不变。" : "注册一个新的 LLM 模型，配置 API 连接信息。"}
            </p>
          </SheetHeader>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">基本信息</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">模型名称 <span className="text-red-500">*</span></label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="例如 GPT-5" className="h-10" />
                <FieldHelp>模型的显示名称</FieldHelp>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">供应商 <span className="text-red-500">*</span></label>
                <Select value={provider} onValueChange={v => setProvider(v ?? "")}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="选择供应商" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVIDERS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FieldHelp>模型的 API 供应商</FieldHelp>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Model ID <span className="text-red-500">*</span></label>
                <Input value={modelId} onChange={e => setModelId(e.target.value)} placeholder="例如 openai/gpt-5" className="h-10" />
                <FieldHelp>调用 API 时使用的模型标识符</FieldHelp>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">图标 Key</label>
                <div className="flex items-center gap-2">
                  <Input value={iconKey} onChange={e => setIconKey(e.target.value)} placeholder="例如 gpt-4o" className="h-10 flex-1" />
                  <div className="shrink-0">
                    <ModelIcon iconKey={iconKey} size="md" />
                  </div>
                </div>
                <FieldHelp>用于显示模型图标，来自 @lobehub/icons</FieldHelp>
              </div>
            </div>
          </div>

          <hr className="border-border" />

          {/* API Config */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">API 连接配置</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">API Base URL</label>
                <Input value={apiBase} onChange={e => setApiBase(e.target.value)} placeholder="留空则使用全局默认" className="h-10" />
                <FieldHelp>OpenAI 兼容的 API 基础地址。留空将使用 .env 中配置的全局 LLM_API_BASE_URL</FieldHelp>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">API Key{isEdit ? "（留空保持不变）" : ""}</label>
                <Input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder={isEdit ? "留空保持原值" : "输入 API Key"} className="h-10" />
                <FieldHelp>模型专属的 API Key。留空将使用全局默认 Key</FieldHelp>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={handleTest} disabled={testLoading}>
                {testLoading ? "测试中..." : "测试连接"}
              </Button>
              {testStatus === "success" && (
                <span className="text-sm font-semibold text-green-600 flex items-center gap-1">
                  <Check className="w-4 h-4" /> 连接成功
                </span>
              )}
              {testStatus === "error" && (
                <span className="text-sm font-semibold text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> {testMessage || "连接失败"}
                </span>
              )}
            </div>
          </div>

          <hr className="border-border" />

          {/* Status & Capabilities */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">状态与能力标签</h3>

            {isEdit && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium">状态</label>
                <Select value={status} onValueChange={v => setStatus(v ?? "active")}>
                  <SelectTrigger className="w-48 h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">活跃</SelectItem>
                    <SelectItem value="archived">已归档</SelectItem>
                  </SelectContent>
                </Select>
                <FieldHelp>归档后模型不会出现在评测选择列表中</FieldHelp>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium">能力标签</label>
              <div className="flex gap-2 flex-wrap">
                {CAPABILITIES.map(cap => (
                  <button
                    key={cap}
                    onClick={() => toggle(cap)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${
                      capabilities.includes(cap)
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-background text-muted-foreground border-border hover:border-blue-300 hover:text-blue-600"
                    }`}
                  >
                    {cap.charAt(0).toUpperCase() + cap.slice(1)}
                  </button>
                ))}
              </div>
              <FieldHelp>标记模型擅长的能力类型，用于分类展示（不影响评测逻辑）</FieldHelp>
            </div>
          </div>

          <hr className="border-border" />

          {/* Advanced Config */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">高级配置（可选）</h3>
            <p className="text-xs text-muted-foreground">以下为 JSON 格式的高级参数，一般无需修改。点击展开编辑。</p>

            <CollapsibleJson title="Custom Headers" value={customHeaders} onChange={setCustomHeaders} help="附加的自定义请求头，如鉴权 Header 等" />
            <CollapsibleJson title="Default Params" value={defaultParams} onChange={setDefaultParams} help="调用模型时的默认参数（如 temperature, max_tokens 等）" />
            <CollapsibleJson title="Fixed Params" value={fixedParams} onChange={setFixedParams} help="固定参数，不可被任务级配置覆盖" />
            <CollapsibleJson title="Adapter Config" value={adapterConfig} onChange={setAdapterConfig} help="适配器配置，用于非标准 API 的适配" />
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 bg-background border-t px-6 py-4 flex items-center justify-end gap-3">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>取消</Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "保存中..." : isEdit ? "更新模型" : "创建模型"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function CollapsibleJson({ title, value, onChange, help }: {
  title: string; value: string; onChange: (v: string) => void; help: string;
}) {
  const [open, setOpen] = useState(false);
  const hasContent = value.trim() !== "" && value.trim() !== "{}";

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-left hover:bg-accent transition-colors"
      >
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${open ? "" : "-rotate-90"}`} />
        <span>{title}</span>
        {hasContent && <span className="ml-auto text-[10px] font-semibold text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 px-1.5 py-0.5 rounded">已配置</span>}
      </button>
      {open && (
        <div className="px-4 pb-3 space-y-1.5">
          <Textarea value={value} onChange={e => onChange(e.target.value)} className="font-mono text-xs resize-y min-h-[60px]" rows={3} />
          <p className="text-xs text-muted-foreground">{help}</p>
        </div>
      )}
    </div>
  );
}
