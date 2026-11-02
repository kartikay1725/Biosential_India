"use client";

import React from "react";
import { EffortRichnessChart } from "@/components/charts/EffortRichnessChart";
import { BarChart2, AlertCircle, Info, ShieldCheck } from "lucide-react";
import { MetricCard } from "@/components/biosentinel/MetricCard";
import { useSelectedYear } from "@/components/context/YearContext";
import { getAnnualSummary } from "@/lib/api/data-service";
import { formatNumber } from "@/lib/formatting/formatters";

export default function ObservationEffortPage() {
  const { selectedYear } = useSelectedYear();
  const annual = getAnnualSummary(selectedYear);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="space-y-2 pb-5 border-b border-white/[0.08]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-cyan-500/10 to-transparent border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
              <BarChart2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Observation Effort &amp; Sampling Bias ({selectedYear})
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  SAMPLING CONDITIONING
                </span>
              </div>
              <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
                Treating citizen science occurrence volume as observation effort rather than biological population abundance.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Hero statement card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-cyan-500/5 border border-cyan-500/20 backdrop-blur-xl flex items-start gap-3.5 text-xs text-neutral-300 shadow-lg">
        <Info className="h-4 w-4 shrink-0 text-cyan-400 mt-0.5" />
        <div className="space-y-1.5">
          <div className="font-semibold text-white">Ecological Observation Principle:</div>
          <p className="text-neutral-400 leading-relaxed">
            &ldquo;More records can make more species observable. BioSentinel therefore treats occurrence volume as observation effort rather than direct abundance.&rdquo;
            Citizen science records reflect observer enthusiasm, app adoption, weather, and accessibility far more than true animal density.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          label={`${selectedYear} Evaluated Occurrences`}
          value={formatNumber(annual.total_occurrences)}
          subtext="Indian terrestrial records"
          mono={true}
        />
        <MetricCard
          label="Effort-Driven Units"
          value={formatNumber(annual.effort_driven_count)}
          subtext={`Flagged in ${selectedYear}`}
          subtextTone="warning"
          mono={true}
        />
        <MetricCard
          label="Mean Effort / Unit"
          value={formatNumber(Math.round(annual.mean_effort))}
          subtext="Occurrences per cell"
          mono={true}
        />
        <MetricCard
          label="Mean Observed Richness"
          value={`${annual.mean_richness.toFixed(1)} sp`}
          subtext={`Per cell in ${selectedYear}`}
          subtextTone="success"
          mono={true}
        />
      </div>

      {/* Richness vs Effort Scatter */}
      <div className="p-5 sm:p-6 bg-neutral-900/60 border border-white/[0.08] rounded-2xl backdrop-blur-xl space-y-4 shadow-xl">
        <div>
          <h3 className="text-sm font-semibold text-white">Species Richness vs Observation Effort</h3>
          <p className="text-xs text-neutral-400">
            Empirical non-linear scaling showing log-effort saturation in biological sampling
          </p>
        </div>
        <EffortRichnessChart />
      </div>

      {/* Effort Diagnostics Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="p-5 bg-neutral-900/60 border border-white/[0.08] rounded-2xl backdrop-blur-xl space-y-2.5 shadow-lg">
          <h4 className="font-semibold text-white flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-400" />
            Negative Effort Plunge (False Decline Risk)
          </h4>
          <p className="text-neutral-400 leading-relaxed">
            When occurrences decline by &gt;50% year-over-year, observed species counts naturally plunge. 
            BioSentinel flags these as <span className="font-mono text-amber-400 bg-neutral-900/80 px-1.5 py-0.5 rounded-lg border border-white/[0.08]">effort_driven_signal</span>, preventing false alarms of ecological catastrophe (e.g., E078N09BC).
          </p>
        </div>

        <div className="p-5 bg-neutral-900/60 border border-white/[0.08] rounded-2xl backdrop-blur-xl space-y-2.5 shadow-lg">
          <h4 className="font-semibold text-white flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            Positive Effort Surge (False Recovery Risk)
          </h4>
          <p className="text-neutral-400 leading-relaxed">
            When occurrences surge due to weekend birdathons or app campaigns, observed richness increases without any underlying population recovery.
            Poisson conditioning accounts for the surge by raising expected richness proportionally.
          </p>
        </div>
      </div>
    </div>
  );
}
