"use client";

import React from "react";
import { ShieldCheck, AlertCircle, Info, Database, Layers } from "lucide-react";
import { MetricCard } from "@/components/biosentinel/MetricCard";

export default function DataQualityPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="space-y-1.5 pb-4 border-b border-border">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-success" />
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Data Quality &amp; Epistemic Boundaries
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Assessing sampling sufficiency, temporal continuity, and historical coverage before generating screening signals.
        </p>
      </div>

      {/* Hero statement */}
      <div className="p-4 rounded-lg bg-surface-raised border border-border flex items-start gap-3 text-xs">
        <Info className="h-4 w-4 shrink-0 text-info mt-0.5" />
        <div className="space-y-1">
          <div className="font-semibold text-foreground">Core Epistemic Guideline:</div>
          <p className="text-muted-foreground leading-relaxed">
            &ldquo;Low observation effort can make biodiversity appear lower simply because fewer observations were collected.&rdquo;
            BioSentinel decouples evidence from reliability to guarantee that poorly sampled regions do not generate false crisis signals.
          </p>
        </div>
      </div>

      {/* Quality KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard
          label="Strong Support Units"
          value="7,065"
          subtext="54.7% of monitored units"
          subtextTone="success"
          mono={true}
        />
        <MetricCard
          label="Adequate Support"
          value="4,117"
          subtext="31.9% of units"
          mono={true}
        />
        <MetricCard
          label="Limited Support"
          value="1,731"
          subtext="Penalized by reliability"
          subtextTone="warning"
          mono={true}
        />
        <MetricCard
          label="Mean Baseline Length"
          value="5.3 yrs"
          subtext="Historical prior window"
          mono={true}
        />
      </div>

      {/* Quality Breakdown Panels */}
      <div className="space-y-4">
        <div className="p-4 bg-card border border-border rounded-lg space-y-2">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Database className="h-4 w-4 text-accent" />
            Historical Baseline Eligibility Filter
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            To prevent statistical instability, a grid cell must have at least <strong>3 historical baseline years</strong> between 2018 and 2023 before any 2024 anomaly evaluation is performed. Units with fewer than 3 years are designated as <code className="font-mono text-foreground">insufficient_history</code> and suppressed from high-priority queues.
          </p>
        </div>

        <div className="p-4 bg-card border border-border rounded-lg space-y-2">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Layers className="h-4 w-4 text-warning" />
            Effort Discontinuity Monitoring
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Year-over-year observation effort shifts exceeding ±50% trigger an automatic caution flag.
            When occurrences plunge by &gt;50%, any drop in species richness is flagged as an <span className="font-mono text-warning">effort_driven_signal</span> rather than genuine ecological collapse.
          </p>
        </div>

        <div className="p-4 bg-card border border-border rounded-lg space-y-2">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-danger" />
            Reliability Score Formula &amp; Dampening
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The reliability score (0–100) integrates 35% historical baseline support, 25% temporal continuity across the 7-year monitoring window, 25% observation count sufficiency, and 15% underlying data completeness. Because <code className="font-mono text-foreground">Priority = Evidence × (Reliability / 100)</code>, high evidence in data-poor units is automatically attenuated.
          </p>
        </div>
      </div>
    </div>
  );
}
