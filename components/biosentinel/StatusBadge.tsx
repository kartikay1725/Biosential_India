import React from "react";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, AlertOctagon, Info } from "lucide-react";

export function PriorityBadge({ priority, category }: { priority: number; category: string }) {
  const isHigh = priority >= 38.42 || category.toLowerCase().includes("high");
  const isMod = (priority >= 30.10 && priority < 38.42) || category.toLowerCase().includes("moderate");

  if (isHigh) {
    return (
      <Badge variant="danger" className="gap-1 font-mono font-medium text-xs">
        <AlertOctagon className="h-3 w-3" />
        High Priority ({priority.toFixed(1)})
      </Badge>
    );
  }

  if (isMod) {
    return (
      <Badge variant="warning" className="gap-1 font-mono font-medium text-xs">
        <AlertTriangle className="h-3 w-3" />
        Moderate ({priority.toFixed(1)})
      </Badge>
    );
  }

  return (
    <Badge variant="muted" className="gap-1 font-mono text-xs">
      <CheckCircle className="h-3 w-3 text-success" />
      Low ({priority.toFixed(1)})
    </Badge>
  );
}

export function ReliabilityBadge({ score, level }: { score: number; level?: string }) {
  if (score >= 70) {
    return (
      <Badge variant="success" className="gap-1 font-mono text-xs">
        <CheckCircle className="h-3 w-3" />
        Adequate ({score.toFixed(1)})
      </Badge>
    );
  }
  if (score >= 50) {
    return (
      <Badge variant="warning" className="gap-1 font-mono text-xs">
        <AlertTriangle className="h-3 w-3" />
        Moderate ({score.toFixed(1)})
      </Badge>
    );
  }
  return (
    <Badge variant="danger" className="gap-1 font-mono text-xs">
      <AlertOctagon className="h-3 w-3" />
      Limited ({score.toFixed(1)})
    </Badge>
  );
}

export function DiagnosticBadge({ diagnostic }: { diagnostic: string }) {
  if (diagnostic === "robust_multimethod_signal") {
    return (
      <Badge variant="danger" className="gap-1 text-xs">
        <AlertOctagon className="h-3 w-3" />
        Multi-Method Signal
      </Badge>
    );
  }
  if (diagnostic === "effort_driven_signal") {
    return (
      <Badge variant="warning" className="gap-1 text-xs">
        <AlertTriangle className="h-3 w-3" />
        Effort-Driven Signal
      </Badge>
    );
  }
  return (
    <Badge variant="muted" className="gap-1 text-xs">
      <Info className="h-3 w-3" />
      Expected Pattern
    </Badge>
  );
}
