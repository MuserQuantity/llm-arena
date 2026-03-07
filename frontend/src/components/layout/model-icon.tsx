"use client";

import React from "react";
import { ModelIcon as LobeModelIcon } from "@lobehub/icons";

interface ModelIconProps {
  iconKey: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const SIZE_MAP = {
  sm: 20,
  md: 24,
  lg: 32,
};

export function ModelIcon({ iconKey, className = "", size = "md" }: ModelIconProps) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-7 h-7",
    lg: "w-9 h-9",
  };

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-muted ${sizeClasses[size]} ${className}`}
    >
      <LobeModelIcon model={iconKey} size={SIZE_MAP[size]} type="color" />
    </span>
  );
}
