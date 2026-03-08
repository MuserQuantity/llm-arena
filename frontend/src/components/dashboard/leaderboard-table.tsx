"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ModelIcon } from "@/components/layout/model-icon";
import { LeaderboardEntryResponse } from "@/lib/api";

function getScoreBgColor(score: number): string {
  if (score >= 80) return "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300";
  if (score >= 50) return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300";
  return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
}

interface LeaderboardTableProps {
  data: LeaderboardEntryResponse[];
}

export function LeaderboardTable({ data }: LeaderboardTableProps) {
  const router = useRouter();

  if (data.length === 0) {
    return <EmptyState />;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10">#</TableHead>
          <TableHead>Model</TableHead>
          <TableHead>Provider</TableHead>
          <TableHead>Avg Score</TableHead>
          <TableHead>Runs</TableHead>
          <TableHead>Top Score</TableHead>
          <TableHead>Last Updated</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((entry, idx) => (
          <TableRow
            key={entry.model_id}
            className="cursor-pointer"
            onClick={() => router.push(`/models/${entry.model_id}/eval`)}
          >
            <TableCell className="font-medium">{idx + 1}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <ModelIcon iconKey={entry.model_icon_key} size="md" />
                <span className="font-medium">{entry.model_name}</span>
              </div>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {entry.provider}
            </TableCell>
            <TableCell>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getScoreBgColor(
                  entry.avg_score
                )}`}
              >
                {entry.avg_score.toFixed(1)}
              </span>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {entry.total_runs}
            </TableCell>
            <TableCell>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getScoreBgColor(
                  entry.top_score
                )}`}
              >
                {entry.top_score.toFixed(1)}
              </span>
            </TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {entry.last_updated || "—"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <svg
        className="w-32 h-32 mb-6 text-muted-foreground/30"
        viewBox="0 0 128 128"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="20"
          y="30"
          width="88"
          height="68"
          rx="8"
          stroke="currentColor"
          strokeWidth="3"
        />
        <line
          x1="20"
          y1="50"
          x2="108"
          y2="50"
          stroke="currentColor"
          strokeWidth="2"
        />
        <line
          x1="50"
          y1="30"
          x2="50"
          y2="98"
          stroke="currentColor"
          strokeWidth="2"
        />
        <line
          x1="80"
          y1="30"
          x2="80"
          y2="98"
          stroke="currentColor"
          strokeWidth="2"
        />
        <circle cx="64" cy="74" r="12" stroke="currentColor" strokeWidth="2" />
        <line
          x1="60"
          y1="70"
          x2="68"
          y2="78"
          stroke="currentColor"
          strokeWidth="2"
        />
        <line
          x1="68"
          y1="70"
          x2="60"
          y2="78"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
      <h3 className="text-lg font-semibold mb-2">No evaluations yet</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Start by adding models and creating tasks to run evaluations.
      </p>
      <p className="text-xs text-muted-foreground">
        Admins: Add a model or create a task to get started
      </p>
    </div>
  );
}
