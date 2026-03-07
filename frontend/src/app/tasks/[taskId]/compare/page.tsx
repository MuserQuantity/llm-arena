"use client";

import React from "react";
import { Topbar } from "@/components/layout/topbar";
import { ComparisonView } from "@/components/compare/comparison-view";
import { runs, scores } from "@/lib/mock-data";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ComparisonPage() {
  // Get runs for the "Frontend Gen" task (t1) as demo
  const taskRuns = runs.filter((r) => r.task_id === "t1");

  const scoresByRunId: Record<string, typeof scores> = {};
  for (const run of taskRuns) {
    scoresByRunId[run.id] = scores.filter((s) => s.run_id === run.id);
  }

  return (
    <>
      <Topbar title="Comparison View" />
      <main className="p-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Leaderboard
        </Link>
        <ComparisonView
          taskTitle="Frontend Generation Task"
          dimensionName="Frontend Gen"
          runs={taskRuns}
          scoresByRunId={scoresByRunId}
        />
      </main>
    </>
  );
}
