"use client";

import React from "react";
import { useParams } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { ResultDetail } from "@/components/results/result-detail";
import { getRunById, getScoresForRun } from "@/lib/mock-data";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ResultDetailPage() {
  const params = useParams();
  const runId = params.runId as string;
  const run = getRunById(runId);
  const scores = run ? getScoresForRun(run.id) : [];

  if (!run) {
    return (
      <>
        <Topbar title="Result Detail" />
        <main className="p-8">
          <div className="text-center py-20">
            <h2 className="text-lg font-semibold mb-2">Run not found</h2>
            <p className="text-sm text-muted-foreground mb-4">
              The run you are looking for does not exist.
            </p>
            <Link href="/" className="text-blue-600 hover:underline text-sm font-semibold">
              Back to Leaderboard
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Topbar title={`${run.dimension_name} › ${run.task_title} › ${run.model_name} ${run.status === "done" ? "Done" : ""}`} />
      <main className="p-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Leaderboard
        </Link>
        <ResultDetail run={run} scores={scores} />
      </main>
    </>
  );
}
