"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { ResultDetail } from "@/components/results/result-detail";
import { apiRuns, apiScores, RunResponse, ScoreResponse } from "@/lib/api";

export default function ResultPage() {
  const params = useParams();
  const runId = params.runId as string;
  const [run, setRun] = useState<RunResponse | null>(null);
  const [scores, setScores] = useState<ScoreResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [r, s] = await Promise.all([apiRuns.get(runId), apiScores.listForRun(runId)]);
      setRun(r); setScores(s);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [runId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <><Topbar title="Result" /><main className="p-8"><div className="text-center py-20 text-muted-foreground">Loading...</div></main></>;
  if (!run) return <><Topbar title="Result" /><main className="p-8"><div className="text-center py-20 text-muted-foreground">Run not found</div></main></>;

  return (
    <>
      <Topbar title={`Result: ${run.task_title || runId}`} />
      <main className="p-8">
        <ResultDetail run={run} scores={scores} onScoresUpdate={load} />
      </main>
    </>
  );
}
