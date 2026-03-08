"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { ResultDetail } from "@/components/results/result-detail";
import { apiRuns, apiScores, RunResponse, ScoreResponse } from "@/lib/api";
import { ArrowLeft } from "lucide-react";

export default function ResultPage() {
  const params = useParams();
  const router = useRouter();
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

  if (loading) return <><Topbar title="评测结果" /><main className="p-8"><div className="text-center py-20 text-muted-foreground">加载中...</div></main></>;
  if (!run) return <><Topbar title="评测结果" /><main className="p-8"><div className="text-center py-20 text-muted-foreground">运行记录未找到</div></main></>;

  return (
    <>
      <Topbar title={`结果: ${run.task_title || runId}`} />
      <main className="p-8">
        <button
          onClick={() => {
            if (run.model_id) {
              router.push(`/models/${run.model_id}/eval`);
            } else {
              router.back();
            }
          }}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> 返回模型评测页
        </button>
        <ResultDetail run={run} scores={scores} onScoresUpdate={load} />
      </main>
    </>
  );
}
