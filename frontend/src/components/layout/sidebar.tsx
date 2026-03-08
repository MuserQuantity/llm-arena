"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Bot,
  ListChecks,
  Activity,
  Zap,
  LogOut,
  Settings,
  BarChart3,
  Layers,
  Gavel,
  ChevronDown,
  AlertTriangle,
  Check,
} from "lucide-react";
import { apiSettings, apiModels, ModelResponse, SettingResponse } from "@/lib/api";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navGroups: { title: string; items: NavItem[] }[] = [
  {
    title: "概览",
    items: [
      { href: "/", label: "排行榜", icon: LayoutDashboard },
      { href: "/dashboard/summary", label: "评测汇总", icon: BarChart3 },
    ],
  },
  {
    title: "管理",
    items: [
      { href: "/admin/models", label: "模型管理", icon: Bot },
      { href: "/admin/tasks", label: "任务管理", icon: ListChecks },
      { href: "/admin/runs", label: "运行监控", icon: Activity },
    ],
  },
  {
    title: "系统",
    items: [
      { href: "/admin/settings", label: "系统设置", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [judgeModelName, setJudgeModelName] = useState<string | null>(null);
  const [judgeModelId, setJudgeModelId] = useState<string>("");
  const [models, setModels] = useState<ModelResponse[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadJudgeInfo = useCallback(async () => {
    try {
      const [settingsList, modelsList] = await Promise.all([
        apiSettings.list(),
        apiModels.list(),
      ]);
      setModels(modelsList.filter((m) => m.status === "active"));
      const judgeSetting = settingsList.find((s: SettingResponse) => s.key === "judge_model_id");
      if (judgeSetting?.value) {
        setJudgeModelId(judgeSetting.value);
        const model = modelsList.find((m) => m.id === judgeSetting.value);
        setJudgeModelName(model?.name || null);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    loadJudgeInfo();
  }, [loadJudgeInfo]);

  const selectJudge = async (modelId: string) => {
    setSaving(true);
    try {
      await apiSettings.update({ judge_model_id: modelId });
      const model = models.find((m) => m.id === modelId);
      setJudgeModelId(modelId);
      setJudgeModelName(model?.name || null);
      setPickerOpen(false);
    } catch {
      /* ignore */
    } finally {
      setSaving(false);
    }
  };

  return (
    <aside className="w-60 shrink-0 border-r border-border bg-sidebar flex flex-col h-screen sticky top-0">
      <div className="px-5 pt-8 pb-2">
        <Link href="/" className="flex items-center gap-2 select-none">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white">
            <Zap className="w-5 h-5" />
          </span>
          <span className="text-xl font-extrabold tracking-tight">LLM Arena</span>
        </Link>
      </div>

      <nav className="flex flex-col gap-1 px-2 pt-4 flex-1 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.title} className="mb-2">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {group.title}
            </div>
            {group.items.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-foreground hover:bg-accent"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Judge Model Indicator */}
      <div className="px-3 py-3 border-t border-border">
        <button
          onClick={() => setPickerOpen(!pickerOpen)}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
            judgeModelName
              ? "bg-secondary hover:bg-accent"
              : "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 hover:bg-yellow-100 dark:hover:bg-yellow-900/30"
          }`}
        >
          <Gavel className={`w-4 h-4 shrink-0 ${judgeModelName ? "text-blue-600" : "text-yellow-600"}`} />
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Judge 模型
            </div>
            <div className={`text-xs font-semibold truncate ${judgeModelName ? "" : "text-yellow-600 dark:text-yellow-400"}`}>
              {judgeModelName || "未设置"}
            </div>
          </div>
          {!judgeModelName && <AlertTriangle className="w-3.5 h-3.5 text-yellow-500 shrink-0" />}
          <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground shrink-0 transition-transform ${pickerOpen ? "rotate-180" : ""}`} />
        </button>

        {pickerOpen && (
          <div className="mt-1 border border-border rounded-lg bg-popover shadow-lg max-h-48 overflow-y-auto">
            {models.length === 0 ? (
              <div className="px-3 py-2 text-xs text-muted-foreground">
                暂无可用模型，请先创建模型
              </div>
            ) : (
              models.map((m) => (
                <button
                  key={m.id}
                  onClick={() => selectJudge(m.id)}
                  disabled={saving}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-accent transition-colors"
                >
                  <span className="flex-1 truncate">{m.name}</span>
                  <span className="text-muted-foreground truncate text-[10px]">{m.provider}</span>
                  {m.id === judgeModelId && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* User info */}
      <div className="px-4 py-5 border-t border-border flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
          A
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium">Admin</div>
          <div className="text-xs text-muted-foreground">admin@llmarena.io</div>
        </div>
        <button
          onClick={() => {
            localStorage.removeItem("llm_arena_token");
            window.location.href = "/login";
          }}
          className="text-muted-foreground hover:text-foreground transition-colors"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
