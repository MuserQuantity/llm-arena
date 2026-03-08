"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Topbar } from "@/components/layout/topbar";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ModelIcon } from "@/components/layout/model-icon";
import { apiDashboard, SummaryResponse } from "@/lib/api";
import Link from "next/link";
import { Eye, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

function scoreBg(score: number | null | undefined): string {
  if (score == null) return "";
  if (score >= 80) return "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300";
  if (score >= 60) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300";
  if (score >= 40) return "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300";
  return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300";
}

export default function SummaryPage() {
  const [data, setData] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try { setData(await apiDashboard.summary()); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <><Topbar title="Summary" /><main className="p-8"><div className="text-center py-20 text-muted-foreground">Loading summary...</div></main></>;
  if (!data) return <><Topbar title="Summary" /><main className="p-8"><div className="text-center py-20 text-muted-foreground">No data available</div></main></>;

  return (
    <>
      <Topbar title="Summary Dashboard" />
      <main className="p-8">
        <div className="flex items-center gap-3 mb-6">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-extrabold">Evaluation Summary</h1>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-background z-10">Model</TableHead>
                {data.dimensions.map(dim => (
                  <TableHead key={dim.id} className="text-center">{dim.name}</TableHead>
                ))}
                <TableHead className="text-center">Overall</TableHead>
                <TableHead className="w-20">View</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.models.map(model => (
                <TableRow key={model.model_id}>
                  <TableCell className="sticky left-0 bg-background z-10">
                    <div className="flex items-center gap-2">
                      <ModelIcon iconKey={model.model_icon_key} size="sm" />
                      <div>
                        <span className="font-medium">{model.model_name}</span>
                        <span className="text-xs text-muted-foreground ml-2">{model.provider}</span>
                      </div>
                    </div>
                  </TableCell>
                  {data.dimensions.map(dim => {
                    const score = model.dimensions[dim.name];
                    return (
                      <TableCell key={dim.id} className="text-center">
                        {score != null ? (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-sm font-bold ${scoreBg(score)}`}>
                            {score.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    );
                  })}
                  <TableCell className="text-center">
                    {model.overall_avg != null ? (
                      <span className={`inline-flex items-center px-3 py-0.5 rounded text-sm font-extrabold ${scoreBg(model.overall_avg)}`}>
                        {model.overall_avg.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Link href={`/models/${model.model_id}/eval`}>
                      <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {data.models.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg font-semibold mb-2">No evaluation data yet</p>
            <p className="text-sm">Run evaluations on models to see the summary.</p>
          </div>
        )}
      </main>
    </>
  );
}
