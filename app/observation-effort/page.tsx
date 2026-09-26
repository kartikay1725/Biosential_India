"use client";

import React from "react";
import { EffortRichnessChart } from "@/components/charts/EffortRichnessChart";
import { BarChart2, AlertCircle, Info, ShieldCheck } from "lucide-react";
import { MetricCard } from "@/components/biosentinel/MetricCard";

export default function ObservationEffortPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="space-y-1.5 pb-4 border-b border-border">
        <div className="flex items-center gap-2">
          <BarChart2 className="h-5 w-5 text-accent" />
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Observation Effort &amp; Sampling Bias
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Treating citizen science occurrence volume as observation effort rather than biological population abundance.
        </p>
      </div>

      {/* Hero statement card */}
      <div className="p-4 rounded-lg bg-surface-raised border border-border flex items-start gap-3 text-xs">
        <Info className="h-4 w-4 shrink-0 text-accent mt-0.5" />
        <div className="space-y-1">
          <div className="font-semibold text-foreground">Ecological Observation Principle:</div>
          <p className="text-muted-foreground leading-relaxed">
            &ldquo;More records can make more species observable. BioSentinel therefore treats occurrence volume as observation effort rather than direct abundance.&rdquo;
            Citizen science records reflect observer enthusiasm, app adoption, weather, and accessibility far more than true animal density.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard
          label="Total Occurrences"
          value="3,664,155"
          subtext="Indian terrestrial records"
          mono={true}
        />
        <MetricCard
          label="Effort-Driven Units"
          value="5,396"
          subtext="41.8% of all unit trends"
          subtextTone="warning"
          mono={true}
        />
        <MetricCard
          label="Median Effort"
          value="84"
          subtext="Occurrences per cell-year"
          mono={true}
        />
        <MetricCard
          label="Sampling Support"
          value="86.6%"
          subtext="Adequate or Strong units"
          subtextTone="success"
          mono={true}
        />
      </div>

      {/* Richness vs Effort Scatter */}
      <div className="p-5 bg-card border border-border rounded-lg space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Species Richness vs Observation Effort</h3>
          <p className="text-xs text-muted-foreground">
            Empirical non-linear scaling showing log-effort saturation in biological sampling
          </p>
        </div>
        <EffortRichnessChart />
      </div>

      {/* Effort Diagnostics Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="p-4 bg-card border border-border rounded-lg space-y-2">
          <h4 className="font-semibold text-foreground flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4 text-warning" />
            Negative Effort Plunge (False Decline Risk)
          </h4>
          <p className="text-muted-foreground leading-relaxed">
            When occurrences decline by &gt;50% year-over-year, observed species counts naturally plunge. 
            BioSentinel flags these as <span className="font-mono text-warning">effort_driven_signal</span>, preventing false alarms of ecological catastrophe (e.g., E078N09BC).
          </p>
        </div>

        <div className="p-4 bg-card border border-border rounded-lg space-y-2">
          <h4 className="font-semibold text-foreground flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-success" />
            Positive Effort Surge (False Recovery Risk)
          </h4>
          <p className="text-muted-foreground leading-relaxed">
            When occurrences surge due to weekend birdathons or app campaigns, observed richness increases without any underlying population recovery.
            Poisson conditioning accounts for the surge by raising expected richness proportionally.
          </p>
        </div>
      </div>
    </div>
  );
}
