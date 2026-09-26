import React from "react";
import { cn } from "@/lib/utils";

interface FactorBarProps {
  label: string;
  value: number; // 0 - 100
  sublabel?: string;
  tone?: "danger" | "warning" | "success" | "info" | "neutral";
}

export function EvidenceBar({ label, value, sublabel, tone = "neutral" }: FactorBarProps) {
  const clamped = Math.min(Math.max(value, 0), 100);

  const fillColors = {
    danger: "bg-danger",
    warning: "bg-warning",
    success: "bg-success",
    info: "bg-info",
    neutral: "bg-muted-foreground/60",
  };

  return (
    <div className="space-y-1 text-xs">
      <div className="flex justify-between items-center text-muted-foreground">
        <span className="font-medium text-foreground/90">{label}</span>
        <span className="font-mono">{clamped.toFixed(1)}%</span>
      </div>
      <div className="h-1.5 w-full bg-surface-raised rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-300", fillColors[tone])}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {sublabel && <div className="text-[11px] text-muted-foreground">{sublabel}</div>}
    </div>
  );
}
