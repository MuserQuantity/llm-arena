"use client";

import React, { useState } from "react";
import { Topbar } from "@/components/layout/topbar";
import { DimensionPills } from "@/components/dashboard/dimension-pills";
import { LeaderboardTable } from "@/components/dashboard/leaderboard-table";
import { dimensions, leaderboardData } from "@/lib/mock-data";

export default function DashboardPage() {
  const [activeDimension, setActiveDimension] = useState<string | null>(null);

  // Filter leaderboard data based on active dimension
  const filteredData = activeDimension
    ? leaderboardData
    : leaderboardData;

  return (
    <>
      <Topbar title="Leaderboard" />
      <main className="p-8">
        <h1 className="text-2xl font-extrabold mb-1">Leaderboard</h1>
        <DimensionPills
          dimensions={dimensions}
          activeDimension={activeDimension}
          onSelect={setActiveDimension}
        />
        <LeaderboardTable data={filteredData} />
      </main>
    </>
  );
}
