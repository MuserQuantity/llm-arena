"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ModelIcon } from "@/components/layout/model-icon";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { apiRuns, RunResponse } from "@/lib/api";
import { RefreshCw } from "lucide-react";

function getStatusConfig(status: string) {
  switch (status) {
    case "done":
      return { label: "Done", className: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" };
    case "running":
      return { label: "Running", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" };
    case "pending":
      return { label: "Pending", className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" };
    case "failed":
      return { label: "Failed", className: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" };
    default:
      return { label: status, className: "bg-gray-100 text-gray-600" };
  }
}

function formatDuration(ms?: number | null): string {
  if (!ms) return "—";
  return `${(ms / 1000).toFixed(1)}s`;
}

const PAGE_SIZE = 10;

export function RunMonitor() {
  const [allRuns, setAllRuns] = useState<RunResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [taskFilter, setTaskFilter] = useState("all");
  const [modelFilter, setModelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchRuns = useCallback(async () => {
    try {
      const data = await apiRuns.list({ limit: 200 });
      setAllRuns(data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchRuns(); }, [fetchRuns]);

  const hasActiveRuns = allRuns.some(
    (r) => r.status === "pending" || r.status === "running"
  );

  // Auto-refresh for active runs
  useEffect(() => {
    if (!autoRefresh || !hasActiveRuns) return;
    const interval = setInterval(() => {
      fetchRuns();
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, hasActiveRuns, fetchRuns]);

  const filteredRuns = allRuns.filter((r) => {
    if (taskFilter !== "all" && r.task_title !== taskFilter) return false;
    if (modelFilter !== "all" && r.model_name !== modelFilter) return false;
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    return true;
  });

  const totalPages = Math.ceil(filteredRuns.length / PAGE_SIZE);
  const paginatedRuns = filteredRuns.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const uniqueTasks = Array.from(new Set(allRuns.map((r) => r.task_title).filter(Boolean))) as string[];
  const uniqueModels = Array.from(new Set(allRuns.map((r) => r.model_name).filter(Boolean))) as string[];

  if (loading) {
    return <div className="text-center py-20 text-muted-foreground">Loading runs...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-5">
        <h2 className="text-xl font-extrabold">Run Monitor</h2>
        <Button variant="outline" size="sm" onClick={fetchRuns}>
          <RefreshCw className="w-3 h-3 mr-1" /> Refresh
        </Button>
        {hasActiveRuns && (
          <>
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-secondary text-green-600 dark:text-green-400 border border-border">
              Auto-refresh ON
            </span>
          </>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <Select value={taskFilter} onValueChange={(v) => setTaskFilter(v ?? "all")}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All Tasks" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tasks</SelectItem>
            {uniqueTasks.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={modelFilter} onValueChange={(v) => setModelFilter(v ?? "all")}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All Models" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Models</SelectItem>
            {uniqueModels.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="running">Running</SelectItem>
            <SelectItem value="done">Done</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-52">Task</TableHead>
            <TableHead className="w-44">Model</TableHead>
            <TableHead className="w-24">Status</TableHead>
            <TableHead className="w-28">Started At</TableHead>
            <TableHead className="w-20">Duration</TableHead>
            <TableHead className="w-24">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedRuns.map((run) => {
            const statusConfig = getStatusConfig(run.status);
            const startTime = run.started_at ? new Date(run.started_at) : null;
            const timeStr = startTime
              ? `${startTime.getHours().toString().padStart(2, "0")}:${startTime.getMinutes().toString().padStart(2, "0")}`
              : "—";

            return (
              <TableRow key={run.id}>
                <TableCell className="font-medium">{run.task_title}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <ModelIcon iconKey={run.model_icon_key || ""} size="sm" />
                    <span>{run.model_name || "—"}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusConfig.className}`}
                  >
                    {run.status === "running" && (
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    )}
                    {statusConfig.label}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {timeStr}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatDuration(run.duration_ms)}
                </TableCell>
                <TableCell>
                  {run.status === "failed" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs h-7"
                      onClick={async () => { try { await apiRuns.retry(run.id); fetchRuns(); } catch (e) { console.error(e); } }}
                    >
                      Retry
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
        <span>
          {filteredRuns.length === 0 ? "No runs found" : `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filteredRuns.length)} of ${filteredRuns.length} runs`}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
