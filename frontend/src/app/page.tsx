"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Topbar } from "@/components/layout/topbar";
import { DimensionPills } from "@/components/dashboard/dimension-pills";
import { LeaderboardTable } from "@/components/dashboard/leaderboard-table";
import { apiDashboard, apiDimensions, DimensionResponse, LeaderboardEntryResponse } from "@/lib/api";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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
      <Topbar title="排行榜" />
      <main className="p-8">
        <h1 className="text-2xl font-extrabold mb-1">排行榜</h1>
        <p className="text-sm text-muted-foreground mb-3">模型按归一化平均评分排名，可按维度筛选</p>
        <DimensionPills
          dimensions={dimPills}
          activeDimension={activeDimension}
          onSelect={setActiveDimension}
        />
        {loading ? (
          <div className="text-center py-20 text-muted-foreground">加载排行榜中...</div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg font-semibold mb-2">暂无评分数据</p>
            <p className="text-sm mb-4">对模型执行评测后，排行榜将自动生成</p>
            <Link href="/admin/models">
              <Button variant="outline" size="sm">前往模型管理开始评测</Button>
            </Link>
          </div>
        ) : (
          <LeaderboardTable data={leaderboard} />
        )}
      </main>
    </>
  );
}
