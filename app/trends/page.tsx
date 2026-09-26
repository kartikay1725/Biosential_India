"use client";

import React, { useState } from "react";
import { getTrendSummary, getCaseStudy } from "@/lib/api/data-service";
import { DualSlopeBarChart } from "@/components/charts/DualSlopeBarChart";
import { TrajectoryChart } from "@/components/charts/TrajectoryChart";
import { TrendingUp, AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import { formatNumber, formatPercentage } from "@/lib/formatting/formatters";

export default function TrendsPage() {
  const trendSummary = getTrendSummary();
  const [selectedCase, setSelectedCase] = useState<"E076N28AA" | "E078N09BC">("E076N28AA");
  const caseRecords = getCaseStudy(selectedCase);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="space-y-1.5 pb-4 border-b border-border">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-accent" />
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Dual-Slope Temporal Trends &amp; Persistence
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Decoupling observer participation surges from true residual ecological signals across 12,913 monitored units.
        </p>
      </div>

      {/* Warning Alert: Scientific Principle */}
      <div className="p-4 rounded-lg bg-surface-raised border border-border flex items-start gap-3 text-xs">
        <AlertTriangle className="h-4 w-4 shrink-0 text-warning mt-0.5" />
        <div className="space-y-1">
          <div className="font-semibold text-foreground">Critical Scientific Terminology Mandate:</div>
          <p className="text-muted-foreground leading-relaxed">
            Never equate raw species richness increases with ecological recovery. In citizen science data, exponential increases in volunteer submissions routinely drive apparent richness growth. BioSentinel resolves this using the <strong>dual-slope framework</strong>:
          </p>
          <div className="font-mono text-[11px] text-accent pt-1">
            Raw Richness Slope (β_rich) + Observation Effort Slope (β_eff) → Effort-Adjusted Residual Slope (β_adj)
          </div>
        </div>
      </div>

      {/* Dual Slope Distribution Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 p-4 bg-card border border-border rounded-lg space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">All-India Trend Classification Distribution</h3>
            <p className="text-xs text-muted-foreground">Breakdown across all 12,913 Grid × Year units</p>
          </div>
          <DualSlopeBarChart data={trendSummary} />
        </div>

        <div className="lg:col-span-5 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Taxonomy Definitions &amp; Empirical Slopes</h3>
          <div className="space-y-2 text-xs">
            {trendSummary.map((t) => (
              <div key={t.category} className="p-3 rounded-lg bg-surface border border-border space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-semibold text-foreground capitalize">
                    {t.category.replace(/_/g, " ")}
                  </span>
                  <span className="font-mono text-accent font-bold">
                    {t.count.toLocaleString()} ({t.percentage}%)
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground flex items-center justify-between pt-1 border-t border-border/60">
                  <span>Raw Slope: {t.mean_raw_slope > 0 ? "+" : ""}{t.mean_raw_slope} sp/yr</span>
                  <span>Effort Slope: {t.mean_effort_slope > 0 ? "+" : ""}{t.mean_effort_slope}</span>
                  <span className="text-foreground">Residual: {t.mean_adjusted_slope > 0 ? "+" : ""}{t.mean_adjusted_slope}σ/yr</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Case Study Trajectory Walkthrough */}
      <div className="p-5 bg-card border border-border rounded-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Multi-Year Trajectory Inspection</h3>
            <p className="text-xs text-muted-foreground">Trace year-by-year interaction of richness, expectation, and effort</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedCase("E076N28AA")}
              className={`px-3 py-1.5 rounded text-xs font-mono font-medium transition-colors border ${
                selectedCase === "E076N28AA"
                  ? "bg-danger/20 text-danger border-danger/40 font-bold"
                  : "bg-surface text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              E076N28AA (Persistent Anomaly)
            </button>
            <button
              onClick={() => setSelectedCase("E078N09BC")}
              className={`px-3 py-1.5 rounded text-xs font-mono font-medium transition-colors border ${
                selectedCase === "E078N09BC"
                  ? "bg-warning/20 text-warning border-warning/40 font-bold"
                  : "bg-surface text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              E078N09BC (Effort Collapse)
            </button>
          </div>
        </div>

        <TrajectoryChart records={caseRecords} />

        <div className="p-3.5 bg-surface rounded-lg border border-border text-xs text-muted-foreground space-y-1">
          <div className="font-semibold text-foreground">
            {selectedCase === "E076N28AA" ? "E076N28AA (2018 – 2024):" : "E078N09BC (2020 – 2024):"}
          </div>
          <p className="text-[11px] leading-relaxed">
            {selectedCase === "E076N28AA"
              ? "Observed richness stays consistently below Poisson effort-adjusted expectation for 2 consecutive years, generating a genuine multi-year persistent screening flag (Priority: 53.06)."
              : "In 2024, observed richness dropped sharply from 83 to 21. However, observation occurrences simultaneously collapsed by -90.03% (331 → 33 records). BioSentinel suppresses this signal as effort-driven."}
          </p>
        </div>
      </div>
    </div>
  );
}
