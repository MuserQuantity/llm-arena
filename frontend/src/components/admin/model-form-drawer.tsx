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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { ChevronDown, Check, AlertCircle } from "lucide-react";

const PROVIDERS = ["OpenAI", "Anthropic", "Google", "DeepSeek", "Mistral", "Meta", "Other"];

interface ModelFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ModelFormDrawer({ open, onOpenChange }: ModelFormDrawerProps) {
  const [name, setName] = useState("");
  const [provider, setProvider] = useState("");
  const [modelId, setModelId] = useState("");
  const [iconKey, setIconKey] = useState("");
  const [apiBase, setApiBase] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [capabilities, setCapabilities] = useState<string[]>(["code"]);
  const [defaultParams, setDefaultParams] = useState('{ "temperature": 0.7 }');
  const [fixedParams, setFixedParams] = useState('{ "max_tokens": 4096 }');
  const [adapterConfig, setAdapterConfig] = useState("{}");
  const [customHeaders, setCustomHeaders] = useState("{}");
  const [testStatus, setTestStatus] = useState<"idle" | "success" | "error">("idle");
  const [testLoading, setTestLoading] = useState(false);

  const [showCapabilities, setShowCapabilities] = useState(true);
  const [showDefaultParams, setShowDefaultParams] = useState(false);
  const [showFixedParams, setShowFixedParams] = useState(false);
  const [showAdapterConfig, setShowAdapterConfig] = useState(false);
  const [showCustomHeaders, setShowCustomHeaders] = useState(false);

  const handleTestConnection = () => {
    setTestLoading(true);
    setTimeout(() => {
      setTestLoading(false);
      setTestStatus(apiBase && apiKey ? "success" : "error");
    }, 1500);
  };

  const toggleCapability = (cap: string) => {
    setCapabilities((prev) =>
      prev.includes(cap) ? prev.filter((c) => c !== cap) : [...prev, cap]
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[640px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Add Model</SheetTitle>
        </SheetHeader>

        <div className="space-y-5 py-4">
          {/* Name + Provider */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">
                Name
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., GPT-4o"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">
                Provider
              </label>
              <Select value={provider} onValueChange={(v) => setProvider(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDERS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Model ID + Icon Key */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">
                Model ID
              </label>
              <Input
                value={modelId}
                onChange={(e) => setModelId(e.target.value)}
                placeholder="e.g., gpt-4o"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">
                Icon Key
              </label>
              <div className="flex items-center gap-2">
                <Input
                  value={iconKey}
                  onChange={(e) => setIconKey(e.target.value)}
                  placeholder="e.g., gpt-4o"
                />
                <ModelIcon iconKey={iconKey} size="md" />
              </div>
            </div>
          </div>

          {/* API Base + API Key */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">
                API Base
              </label>
              <Input
                value={apiBase}
                onChange={(e) => setApiBase(e.target.value)}
                placeholder="https://api.example.com/"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">
                API Key
              </label>
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="— — — — —"
              />
            </div>
          </div>

          {/* Collapsible: Capabilities */}
          <CollapsibleSection
            title="Capabilities"
            open={showCapabilities}
            onToggle={() => setShowCapabilities(!showCapabilities)}
          >
            <div className="flex gap-3 flex-wrap">
              {["code", "reasoning", "summarization", "frontend", "analysis"].map(
                (cap) => (
                  <label
                    key={cap}
                    className="flex items-center gap-2 text-sm font-medium cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      checked={capabilities.includes(cap)}
                      onChange={() => toggleCapability(cap)}
                      className="rounded"
                    />
                    {cap.charAt(0).toUpperCase() + cap.slice(1)}
                  </label>
                )
              )}
            </div>
          </CollapsibleSection>

          {/* Collapsible: Custom Headers */}
          <CollapsibleSection
            title="Custom Headers (JSON)"
            open={showCustomHeaders}
            onToggle={() => setShowCustomHeaders(!showCustomHeaders)}
          >
            <Textarea
              value={customHeaders}
              onChange={(e) => setCustomHeaders(e.target.value)}
              className="font-mono text-sm"
              rows={3}
            />
          </CollapsibleSection>

          {/* Collapsible: Default Params */}
          <CollapsibleSection
            title="Default Params (JSON)"
            open={showDefaultParams}
            onToggle={() => setShowDefaultParams(!showDefaultParams)}
          >
            <Textarea
              value={defaultParams}
              onChange={(e) => setDefaultParams(e.target.value)}
              className="font-mono text-sm"
              rows={3}
            />
          </CollapsibleSection>

          {/* Collapsible: Fixed Params */}
          <CollapsibleSection
            title="Fixed Params (JSON)"
            open={showFixedParams}
            onToggle={() => setShowFixedParams(!showFixedParams)}
          >
            <Textarea
              value={fixedParams}
              onChange={(e) => setFixedParams(e.target.value)}
              className="font-mono text-sm"
              rows={3}
            />
          </CollapsibleSection>

          {/* Collapsible: Adapter Config */}
          <CollapsibleSection
            title="Adapter Config (JSON)"
            open={showAdapterConfig}
            onToggle={() => setShowAdapterConfig(!showAdapterConfig)}
          >
            <Textarea
              value={adapterConfig}
              onChange={(e) => setAdapterConfig(e.target.value)}
              className="font-mono text-sm"
              rows={3}
            />
          </CollapsibleSection>

          {/* Test Connection + Save */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestConnection}
              disabled={testLoading}
            >
              {testLoading ? "Testing..." : "Test Connection"}
            </Button>
            {testStatus === "success" && (
              <span className="text-sm font-semibold text-green-600 flex items-center gap-1">
                <Check className="w-4 h-4" /> Connected
              </span>
            )}
            {testStatus === "error" && (
              <span className="text-sm font-semibold text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> Connection failed
              </span>
            )}
          </div>
        </div>

        <SheetFooter className="gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button>Save Model</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function CollapsibleSection({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer mb-2"
      >
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform ${
            open ? "" : "-rotate-90"
          }`}
        />
        {title}
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}
