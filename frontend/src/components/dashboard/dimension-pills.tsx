"use client";

import React from "react";

interface DimensionPill {
  id: string;
  name: string;
  slug: string;
}

interface DimensionPillsProps {
  dimensions: DimensionPill[];
  activeDimension: string | null;
  onSelect: (id: string | null) => void;
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
          onClick={() => onSelect(dim.id)}
          className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
            activeDimension === dim.id
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
