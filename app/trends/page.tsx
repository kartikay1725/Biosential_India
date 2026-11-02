"use client";

import React, { useState } from "react";
import { getTrendSummary, getCaseStudy } from "@/lib/api/data-service";
import { useSelectedYear } from "@/components/context/YearContext";
import { DualSlopeBarChart } from "@/components/charts/DualSlopeBarChart";
import { TrajectoryChart } from "@/components/charts/TrajectoryChart";
import { TrendingUp, AlertTriangle, Info, CheckCircle2, Calendar } from "lucide-react";
import { formatNumber, formatPercentage } from "@/lib/formatting/formatters";

export default function TrendsPage() {
  const { selectedYear } = useSelectedYear();
  const trendSummary = getTrendSummary();
  const [selectedCase, setSelectedCase] = useState<"E076N28AA" | "E078N09BC">("E076N28AA");
  const caseRecords = getCaseStudy(selectedCase);
  const selectedYearRecord = caseRecords.find((r) => r.year === selectedYear);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="space-y-2 pb-5 border-b border-white/[0.08]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-emerald-500/10 to-transparent border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Dual-Slope Temporal Trends &amp; Persistence
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  EFFORT-ADJUSTED
                </span>
              </div>
              <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
                Decoupling observer participation surges from true residual ecological signals across 12,913 monitored units.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Warning Alert: Scientific Principle */}
      <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 backdrop-blur-xl flex items-start gap-3.5 text-xs text-neutral-300 shadow-lg">
        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
        <div className="space-y-1.5">
          <div className="font-semibold text-white">Critical Scientific Terminology Mandate:</div>
          <p className="text-neutral-400 leading-relaxed">
            Never equate raw species richness increases with ecological recovery. In citizen science data, exponential increases in volunteer submissions routinely drive apparent richness growth. BioSentinel resolves this using the <strong className="text-neutral-200">dual-slope framework</strong>:
          </p>
          <div className="font-mono text-xs text-emerald-300 bg-neutral-900/80 px-2.5 py-1 rounded-xl border border-white/[0.08] inline-block">
            Raw Richness Slope (β_rich) + Observation Effort Slope (β_eff) → Effort-Adjusted Residual Slope (β_adj)
          </div>
        </div>
      </div>

      {/* Dual Slope Distribution Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 p-5 sm:p-6 bg-neutral-900/60 border border-white/[0.08] rounded-2xl backdrop-blur-xl space-y-4 shadow-xl">
          <div>
            <h3 className="text-sm font-semibold text-white">All-India Trend Classification Distribution</h3>
            <p className="text-xs text-neutral-400">Breakdown across all 12,913 Grid × Year units</p>
          </div>
          <DualSlopeBarChart data={trendSummary} />
        </div>

        <div className="lg:col-span-5 space-y-3">
          <h3 className="text-sm font-semibold text-white">Taxonomy Definitions &amp; Empirical Slopes</h3>
          <div className="space-y-2.5 text-xs">
            {trendSummary.map((t) => (
              <div key={t.category} className="p-4 rounded-2xl bg-neutral-900/60 border border-white/[0.08] backdrop-blur-xl space-y-2 hover:border-white/20 transition-all shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-semibold text-white capitalize">
                    {t.category.replace(/_/g, " ")}
                  </span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {t.count.toLocaleString()} ({t.percentage}%)
                  </span>
                </div>
                <div className="text-[11px] text-neutral-400 flex items-center justify-between pt-2 border-t border-white/[0.06]">
                  <span>Raw: {t.mean_raw_slope > 0 ? "+" : ""}{t.mean_raw_slope} sp/yr</span>
                  <span>Effort: {t.mean_effort_slope > 0 ? "+" : ""}{t.mean_effort_slope}</span>
                  <span className="text-white font-medium">Adj: {t.mean_adjusted_slope > 0 ? "+" : ""}{t.mean_adjusted_slope}σ/yr</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Case Study Trajectory Walkthrough */}
      <div className="p-5 sm:p-6 bg-neutral-900/60 border border-white/[0.08] rounded-2xl backdrop-blur-xl space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
          <div>
            <h3 className="text-sm font-semibold text-white">Multi-Year Trajectory Inspection</h3>
            <p className="text-xs text-neutral-400">Trace year-by-year interaction of richness, expectation, and effort</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedCase("E076N28AA")}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all border ${
                selectedCase === "E076N28AA"
                  ? "bg-rose-500/15 text-rose-300 border-rose-500/30 font-bold shadow-[0_0_15px_rgba(244,63,94,0.15)]"
                  : "bg-neutral-900/80 text-neutral-400 border-white/[0.08] hover:text-white"
              }`}
            >
              E076N28AA (Persistent Anomaly)
            </button>
            <button
              onClick={() => setSelectedCase("E078N09BC")}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all border ${
                selectedCase === "E078N09BC"
                  ? "bg-amber-500/15 text-amber-300 border-amber-500/30 font-bold shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                  : "bg-neutral-900/80 text-neutral-400 border-white/[0.08] hover:text-white"
              }`}
            >
              E078N09BC (Effort Collapse)
            </button>
          </div>
        </div>

        <TrajectoryChart records={caseRecords} />

        {/* Selected Year Annotation */}
        {selectedYearRecord && (
          <div className="p-4 bg-neutral-900/80 rounded-2xl border border-emerald-500/30 backdrop-blur-xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-lg">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-emerald-400" />
              <span className="font-semibold text-white">
                {selectedCase} in Selected Year {selectedYear}:
              </span>
              <span className="text-neutral-400 font-mono">
                Observed: <strong className="text-white">{selectedYearRecord.species_richness} sp</strong> • 
                Effort: <strong className="text-white">{selectedYearRecord.total_occurrences} records</strong> • 
                Deviation: <strong className={selectedYearRecord.relative_deviation < 0 ? "text-danger" : "text-success"}>{formatPercentage(selectedYearRecord.relative_deviation)}</strong>
              </span>
            </div>
            <div className="font-mono text-xs">
              Priority: <span className="text-emerald-400 font-bold">{selectedYearRecord.priority_score.toFixed(1)}</span>
            </div>
          </div>
        )}

        <div className="p-4 bg-neutral-900/60 rounded-2xl border border-white/[0.08] text-xs text-neutral-400 space-y-1">
          <div className="font-semibold text-white">
            {selectedCase === "E076N28AA" ? "E076N28AA Historical Trajectory:" : "E078N09BC Historical Trajectory:"}
          </div>
          <p className="text-[11px] leading-relaxed">
            {selectedCase === "E076N28AA"
              ? "Observed richness stays consistently below Poisson effort-adjusted expectation across monitoring years, generating a genuine multi-year persistent screening flag."
              : "In 2024, observed richness dropped sharply from 83 to 21. However, observation occurrences simultaneously collapsed by -90.03% (331 → 33 records). BioSentinel accurately suppresses this signal as effort-driven."}
          </p>
        </div>
      </div>
    </div>
  );
}

