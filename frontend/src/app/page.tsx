"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Topbar } from "@/components/layout/topbar";
import { DimensionPills } from "@/components/dashboard/dimension-pills";
import { LeaderboardTable } from "@/components/dashboard/leaderboard-table";
import { apiDashboard, apiDimensions, DimensionResponse, LeaderboardEntryResponse } from "@/lib/api";

export default function DashboardPage() {
  const [activeDimension, setActiveDimension] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<DimensionResponse[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntryResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [dims, lb] = await Promise.all([
        apiDimensions.list(),
        apiDashboard.leaderboard(activeDimension || undefined),
      ]);
      setDimensions(dims);
      setLeaderboard(lb);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [activeDimension]);

  useEffect(() => { load(); }, [load]);

  const dimPills = dimensions.map(d => ({ id: d.id, name: d.name, slug: d.slug }));

  return (
    <>
      <Topbar title="Leaderboard" />
      <main className="p-8">
        <h1 className="text-2xl font-extrabold mb-1">Leaderboard</h1>
        <DimensionPills
          dimensions={dimPills}
          activeDimension={activeDimension}
          onSelect={setActiveDimension}
        />
        {loading ? (
          <div className="text-center py-20 text-muted-foreground">Loading leaderboard...</div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg font-semibold mb-2">No scores yet</p>
            <p className="text-sm">Run evaluations to see the leaderboard.</p>
          </div>
        ) : (
          <LeaderboardTable data={leaderboard} />
        )}
      </main>
    </>
  );
}
