"use client";

import React from "react";
import { Topbar } from "@/components/layout/topbar";
import { RunMonitor } from "@/components/admin/run-monitor";

export default function RunsPage() {
  return (
    <>
      <Topbar title="Admin › Run Monitor" />
      <main className="p-8">
        <RunMonitor />
      </main>
    </>
  );
}
