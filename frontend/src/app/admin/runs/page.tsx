"use client";

import React from "react";
import { Topbar } from "@/components/layout/topbar";
import { RunMonitor } from "@/components/admin/run-monitor";

export default function RunsPage() {
  return (
    <>
      <Topbar title="运行监控" />
      <main className="p-8">
        <RunMonitor />
      </main>
    </>
  );
}
