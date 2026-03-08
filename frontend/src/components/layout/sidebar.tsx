"use client";

import React from "react";
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
} from "lucide-react";

const navItems = [
  { href: "/", label: "Leaderboard", icon: LayoutDashboard },
  { href: "/dashboard/summary", label: "Summary", icon: BarChart3 },
  { href: "/admin/models", label: "Models", icon: Bot },
  { href: "/admin/tasks", label: "Tasks", icon: ListChecks },
  { href: "/admin/runs", label: "Runs", icon: Activity },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

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

      <nav className="flex flex-col gap-0.5 px-2 pt-4">
        {navItems.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive ? "bg-blue-600 text-white" : "text-foreground hover:bg-accent"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex-1" />

      <div className="px-4 py-5 border-t border-border flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold">A</div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium">Admin</div>
          <div className="text-xs text-muted-foreground">admin@llmarena.io</div>
        </div>
        <button
          onClick={() => { localStorage.removeItem("llm_arena_token"); window.location.href = "/login"; }}
          className="text-muted-foreground hover:text-foreground transition-colors"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
