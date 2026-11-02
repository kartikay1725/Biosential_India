import React from "react";
import { AlertTriangle, CheckCircle, AlertOctagon, Info } from "lucide-react";

export function PriorityBadge({ priority, category }: { priority: number; category: string }) {
  const isHigh = priority >= 38.42 || category.toLowerCase().includes("high");
  const isMod = (priority >= 30.10 && priority < 38.42) || category.toLowerCase().includes("moderate");

  if (isHigh) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 font-mono font-bold text-[11px] shadow-sm shadow-rose-950/20">
        <AlertOctagon className="h-3 w-3 text-rose-400" />
        High ({priority.toFixed(1)})
      </span>
    );
  }

  if (isMod) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono font-semibold text-[11px] shadow-sm shadow-amber-950/20">
        <AlertTriangle className="h-3 w-3 text-amber-400" />
        Moderate ({priority.toFixed(1)})
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-[11px] shadow-sm shadow-emerald-950/20">
      <CheckCircle className="h-3 w-3 text-emerald-400" />
      Low ({priority.toFixed(1)})
    </span>
  );
}

export function ReliabilityBadge({ score, level }: { score: number; level?: string }) {
  if (score >= 70) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-[11px]">
        <CheckCircle className="h-3 w-3 text-emerald-400" />
        Adequate ({score.toFixed(1)})
      </span>
    );
  }
  if (score >= 50) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-[11px]">
        <AlertTriangle className="h-3 w-3 text-amber-400" />
        Moderate ({score.toFixed(1)})
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 font-mono text-[11px]">
      <AlertOctagon className="h-3 w-3 text-rose-400" />
      Limited ({score.toFixed(1)})
    </span>
  );
}

export function DiagnosticBadge({ diagnostic }: { diagnostic: string }) {
  if (diagnostic === "robust_multimethod_signal") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] font-semibold">
        <AlertOctagon className="h-3 w-3 text-rose-400" />
        Multi-Method Signal
      </span>
    );
  }
  if (diagnostic === "effort_driven_signal") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-semibold">
        <AlertTriangle className="h-3 w-3 text-amber-400" />
        Effort-Driven Signal
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/10 text-neutral-300 text-[11px]">
      <Info className="h-3 w-3 text-neutral-400" />
      Expected Pattern
    </span>
  );
}
