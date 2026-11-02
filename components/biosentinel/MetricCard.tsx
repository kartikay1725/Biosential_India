import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  subtextTone?: "success" | "warning" | "danger" | "muted" | "info";
  icon?: React.ReactNode;
  className?: string;
  mono?: boolean;
}

export function MetricCard({
  label,
  value,
  subtext,
  subtextTone = "muted",
  icon,
  className,
  mono = true,
}: MetricCardProps) {
  const toneClasses = {
    success: "text-success",
    warning: "text-warning",
    danger: "text-danger",
    info: "text-info",
    muted: "text-muted-foreground",
  };

  return (
    <div
      className={cn(
        "rounded-2xl bg-neutral-900/60 border border-white/[0.08] hover:border-white/20 backdrop-blur-xl p-4 sm:p-5 flex flex-col justify-between shadow-lg hover:shadow-emerald-950/20 transition-all duration-300 hover:scale-[1.01] group relative overflow-hidden",
        className
      )}
    >
      <div className="flex items-center justify-between text-neutral-400 mb-2">
        <span className="text-[11px] uppercase tracking-wider font-semibold text-neutral-400/90">{label}</span>
        {icon && (
          <div className="h-7 w-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-neutral-300 group-hover:text-emerald-400 group-hover:border-emerald-500/30 transition-colors">
            {icon}
          </div>
        )}
      </div>
      <div className={cn("text-2xl sm:text-3xl font-bold tracking-tight text-white", mono && "font-mono")}>
        {value}
      </div>
      {subtext && (
        <div className={cn("text-[11px] mt-2 flex items-center gap-1 font-medium", toneClasses[subtextTone])}>
          {subtext}
        </div>
      )}
    </div>
  );
}
