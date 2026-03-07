"use client";

import React, { useState } from "react";
import { ModelIcon } from "@/components/layout/model-icon";
import { Run, Score } from "@/types";
import { getStatusConfig, getScoreBgColor } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";

interface ComparisonViewProps {
  taskTitle: string;
  dimensionName: string;
  runs: Run[];
  scoresByRunId: Record<string, Score[]>;
}

export function ComparisonView({
  taskTitle,
  dimensionName,
  runs,
  scoresByRunId,
}: ComparisonViewProps) {
  const [showAll, setShowAll] = useState(false);
  const visibleRuns = showAll ? runs : runs.slice(0, 3);
  const hiddenCount = runs.length - 3;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4 mb-4">
        <div className="flex items-baseline gap-3">
          <h2 className="text-xl font-extrabold tracking-tight">
            {taskTitle}
          </h2>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
            {dimensionName}
          </span>
        </div>
        <Button variant="outline" size="sm">
          Run All
        </Button>
      </div>

      <div className="flex overflow-x-auto gap-0 rounded-xl border border-border bg-secondary min-h-[420px]">
        {visibleRuns.map((run, idx) => {
          const runScores = scoresByRunId[run.id] || [];
          const judgeScore = runScores.find(
            (s) => s.score_type === "llm_judge"
          );
          const manualScore = runScores.find(
            (s) => s.score_type === "manual"
          );
          const statusConfig = getStatusConfig(run.status);

          return (
            <div
              key={run.id}
              className={`min-w-[340px] max-w-[361px] flex-1 bg-background flex flex-col ${
                idx < visibleRuns.length - 1 ? "border-r border-border" : ""
              }`}
            >
              {/* Header */}
              <div className="sticky top-0 bg-background z-10 px-5 pt-4 pb-2 flex items-center gap-3 font-bold">
                <ModelIcon iconKey={run.model_icon} size="md" />
                <span>{run.model_name}</span>
                {run.status === "done" && judgeScore && (
                  <span
                    className={`ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${getScoreBgColor(
                      judgeScore.numeric_score ?? 0
                    )}`}
                  >
                    {judgeScore.numeric_score?.toFixed(1)}
                  </span>
                )}
                {run.status === "running" && (
                  <span
                    className={`ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${statusConfig.className}`}
                  >
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    Running...
                  </span>
                )}
              </div>

              {/* Output */}
              <div className="flex-1 px-4 py-2">
                {run.status === "done" && run.output ? (
                  run.output_type === "html" ? (
                    <iframe
                      srcDoc={run.output}
                      sandbox="allow-scripts"
                      className="w-full h-56 rounded-lg border border-border bg-white"
                      title={`${run.model_name} output`}
                    />
                  ) : (
                    <pre className="bg-secondary rounded-lg p-3 text-xs overflow-auto max-h-56 border border-border font-mono whitespace-pre-wrap">
                      {run.output}
                    </pre>
                  )
                ) : run.status === "running" ? (
                  <div className="bg-secondary rounded-lg h-56 flex items-center justify-center border border-border">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                      <span className="text-xs text-muted-foreground">
                        Running...
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-secondary rounded-lg h-56 flex items-center justify-center text-muted-foreground text-sm border border-border">
                    {run.status === "failed"
                      ? "Failed"
                      : "Pending"}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex flex-col gap-1 px-5 py-3 border-t border-border bg-secondary/50 min-h-[56px]">
                <div className="flex gap-3 text-xs">
                  <span className="text-muted-foreground">
                    Judge:{" "}
                    <span className="font-semibold text-foreground">
                      {judgeScore?.numeric_score?.toFixed(1) ?? "—"}
                    </span>
                  </span>
                  <span className="text-muted-foreground">
                    Manual:{" "}
                    <span className="font-semibold text-foreground">
                      {manualScore
                        ? `${manualScore.numeric_score}/5`
                        : "—"}
                    </span>
                  </span>
                </div>
                {(judgeScore?.rationale || manualScore?.rationale) && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    &ldquo;{judgeScore?.rationale || manualScore?.rationale}&rdquo;
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {hiddenCount > 0 && (
        <div className="flex items-center justify-between mt-3 text-sm">
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-blue-600 font-semibold hover:underline"
          >
            {showAll
              ? "Show Less"
              : `Show More (${hiddenCount} more)`}
          </button>
          <span className="text-muted-foreground">
            Showing {visibleRuns.length} of {runs.length} models
          </span>
        </div>
      )}
    </div>
  );
}
