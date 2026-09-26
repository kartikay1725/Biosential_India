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
    <Card className={cn("bg-card border-border hover:border-border/80 transition-colors", className)}>
      <CardContent className="p-4 flex flex-col justify-between h-full">
        <div className="flex items-center justify-between text-muted-foreground mb-1.5">
          <span className="text-xs uppercase tracking-wider font-medium">{label}</span>
          {icon && <span className="text-muted-foreground/70">{icon}</span>}
        </div>
        <div className={cn("text-2xl font-semibold tracking-tight text-foreground", mono && "font-mono")}>
          {value}
        </div>
        {subtext && (
          <div className={cn("text-xs mt-1.5 flex items-center gap-1", toneClasses[subtextTone])}>
            {subtext}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
