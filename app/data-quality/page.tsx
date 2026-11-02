"use client";

import React from "react";
import { ShieldCheck, AlertCircle, Info, Database, Layers } from "lucide-react";
import { MetricCard } from "@/components/biosentinel/MetricCard";

export default function DataQualityPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="space-y-2 pb-5 border-b border-white/[0.08]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-emerald-500/10 to-transparent border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Data Quality &amp; Epistemic Boundaries
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  SAMPLING RIGOR
                </span>
              </div>
              <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
                Assessing sampling sufficiency, temporal continuity, and historical coverage before generating screening signals.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Hero statement */}
      <div className="p-4 sm:p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 backdrop-blur-xl flex items-start gap-3.5 text-xs text-neutral-300 shadow-lg">
        <Info className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
        <div className="space-y-1.5">
          <div className="font-semibold text-white">Core Epistemic Guideline:</div>
          <p className="text-neutral-400 leading-relaxed">
            &ldquo;Low observation effort can make biodiversity appear lower simply because fewer observations were collected.&rdquo;
            BioSentinel decouples evidence from reliability to guarantee that poorly sampled regions do not generate false crisis signals.
          </p>
        </div>
      </div>

      {/* Quality KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
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
        <div className="p-5 sm:p-6 bg-neutral-900/60 border border-white/[0.08] rounded-2xl backdrop-blur-xl space-y-2.5 shadow-xl hover:border-white/20 transition-all">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2.5">
            <Database className="h-4 w-4 text-emerald-400" />
            Historical Baseline Eligibility Filter
          </h3>
          <p className="text-xs text-neutral-300 leading-relaxed">
            To prevent statistical instability, a grid cell must have at least <strong className="text-white">3 historical baseline years</strong> between 2018 and 2023 before any anomaly evaluation is performed. Units with fewer than 3 years are designated as <code className="font-mono text-emerald-300 bg-neutral-900/80 px-2 py-0.5 rounded-lg border border-white/[0.08]">insufficient_history</code> and suppressed from high-priority queues.
          </p>
        </div>

        <div className="p-5 sm:p-6 bg-neutral-900/60 border border-white/[0.08] rounded-2xl backdrop-blur-xl space-y-2.5 shadow-xl hover:border-white/20 transition-all">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2.5">
            <Layers className="h-4 w-4 text-amber-400" />
            Effort Discontinuity Monitoring
          </h3>
          <p className="text-xs text-neutral-300 leading-relaxed">
            Year-over-year observation effort shifts exceeding ±50% trigger an automatic caution flag.
            When occurrences plunge by &gt;50%, any drop in species richness is flagged as an <span className="font-mono text-amber-400 bg-neutral-900/80 px-2 py-0.5 rounded-lg border border-white/[0.08]">effort_driven_signal</span> rather than genuine ecological collapse.
          </p>
        </div>

        <div className="p-5 sm:p-6 bg-neutral-900/60 border border-white/[0.08] rounded-2xl backdrop-blur-xl space-y-2.5 shadow-xl hover:border-white/20 transition-all">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 text-rose-400" />
            Reliability Score Formula &amp; Dampening
          </h3>
          <p className="text-xs text-neutral-300 leading-relaxed">
            The reliability score (0–100) integrates 35% historical baseline support, 25% temporal continuity across the 7-year monitoring window, 25% observation count sufficiency, and 15% underlying data completeness. Because <code className="font-mono text-rose-300 bg-neutral-900/80 px-2 py-0.5 rounded-lg border border-white/[0.08]">Priority = Evidence × (Reliability / 100)</code>, high evidence in data-poor units is automatically attenuated.
          </p>
        </div>
      </div>
    </div>
  );
}
