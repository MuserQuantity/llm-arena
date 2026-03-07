"use client";

import React from "react";
import { Dimension } from "@/types";

interface DimensionPillsProps {
  dimensions: Dimension[];
  activeDimension: string | null;
  onSelect: (slug: string | null) => void;
}

export function DimensionPills({
  dimensions,
  activeDimension,
  onSelect,
}: DimensionPillsProps) {
  return (
    <div className="flex gap-2 my-2 mb-4 flex-wrap">
      <button
        onClick={() => onSelect(null)}
        className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
          activeDimension === null
            ? "bg-blue-600 text-white"
            : "bg-secondary text-muted-foreground hover:bg-accent"
        }`}
      >
        All
      </button>
      {dimensions.map((dim) => (
        <button
          key={dim.slug}
          onClick={() => onSelect(dim.slug)}
          className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
            activeDimension === dim.slug
              ? "bg-blue-600 text-white"
              : "bg-secondary text-muted-foreground hover:bg-accent"
          }`}
        >
          {dim.name}
        </button>
      ))}
    </div>
  );
}
