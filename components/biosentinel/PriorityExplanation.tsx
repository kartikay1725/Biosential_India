import React from "react";
import { GridYearRecord } from "@/types/biosentinel";
import { PriorityBadge, ReliabilityBadge, DiagnosticBadge } from "./StatusBadge";
import { EvidenceBar } from "./EvidenceBar";
import { AlertTriangle, ShieldAlert, Info } from "lucide-react";
import { formatSigma, formatPercentage } from "@/lib/formatting/formatters";

export function PriorityExplanation({ record }: { record: GridYearRecord }) {
  const isEffortDriven = record.signal_diagnostic === "effort_driven_signal" || record.effort_change_pct < -50;

  return (
    <div className="space-y-5">
      {/* Header status */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-neutral-900/80 rounded-2xl border border-white/[0.08] backdrop-blur-xl shadow-md">
        <div>
          <div className="text-[11px] text-neutral-400 uppercase tracking-wider font-medium">Screening Priority</div>
          <div className="text-2xl font-bold font-mono text-white mt-0.5">
            {record.priority_score.toFixed(1)} <span className="text-xs font-normal text-neutral-500">/ 100</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <PriorityBadge priority={record.priority_score} category={record.priority_category} />
          <ReliabilityBadge score={record.reliability_score} level={record.sampling_support_level} />
        </div>
      </div>

      {/* Effort Warning if applicable */}
      {isEffortDriven && (
        <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 backdrop-blur-xl text-xs space-y-1 shadow-md">
          <div className="flex items-center gap-2 font-semibold text-amber-300">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            Effort-Driven Signal Detected
          </div>
          <p className="text-neutral-300 leading-relaxed">
            Observation effort shifted by <span className="font-mono text-white font-medium">{formatPercentage(record.effort_change_pct)}</span>. 
            Apparent richness changes coincide with observation volume fluctuations rather than confirmed ecological population decline.
          </p>
        </div>
      )}

      {/* Evidence Breakdown */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Evidence Components ({record.evidence_score.toFixed(1)} / 100)
          </h4>
          <span className="text-[11px] text-neutral-500 font-mono">Weight: 100%</span>
        </div>
        <div className="space-y-3 p-4 bg-neutral-900/60 rounded-2xl border border-white/[0.08] backdrop-blur-xl shadow-md">
          <EvidenceBar
            label="Baseline Expectation Deviation"
            value={Math.abs(record.relative_deviation)}
            sublabel={`Observed ${record.species_richness} vs ${record.selected_expected_richness.toFixed(1)} expected (${formatPercentage(record.relative_deviation)})`}
            tone={record.relative_deviation < -20 ? "danger" : "warning"}
          />
          <EvidenceBar
            label="Effort-Adjusted GLM Residual"
            value={Math.min(Math.abs(record.standardized_residual) * 20, 100)}
            sublabel={`Conditional Poisson/NegBin deviance: ${formatSigma(record.standardized_residual)}`}
            tone={Math.abs(record.standardized_residual) > 2 ? "danger" : "warning"}
          />
          <EvidenceBar
            label="Taxonomic Turnover (Jaccard)"
            value={record.composition_change_score || (record.jaccard_dissimilarity ? record.jaccard_dissimilarity * 100 : 30)}
            sublabel={`Turnover score relative to historical community`}
            tone="info"
          />
          <EvidenceBar
            label="Multi-Year Persistence"
            value={record.persistence_count >= 2 ? 80 : record.persistence_count === 1 ? 40 : 10}
            sublabel={`${record.persistence_count} consecutive supported year(s) with anomaly signal`}
            tone={record.persistence_count >= 2 ? "danger" : "neutral"}
          />
          <EvidenceBar
            label="Spatial Consistency"
            value={record.spatial_consistency_score || (record.neighbour_anomaly_count ? record.neighbour_anomaly_count * 12.5 : 0)}
            sublabel={`${record.neighbour_anomaly_count || 0} adjacent grid cells exhibiting coincident anomaly`}
            tone="neutral"
          />
        </div>
      </div>

      {/* Reliability Breakdown */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Reliability Support ({record.reliability_score.toFixed(1)} / 100)
          </h4>
          <span className="text-[11px] text-neutral-500 font-mono">Penalty Factor</span>
        </div>
        <div className="grid grid-cols-2 gap-2.5 text-xs">
          <div className="p-3 bg-neutral-900/60 rounded-xl border border-white/[0.08] backdrop-blur-xl">
            <div className="text-neutral-400 text-[11px]">Historical Baseline</div>
            <div className="font-mono font-medium text-white mt-1">{record.baseline_years} years</div>
            <div className="text-[10px] text-neutral-500 mt-0.5">Min 3 required</div>
          </div>
          <div className="p-3 bg-neutral-900/60 rounded-xl border border-white/[0.08] backdrop-blur-xl">
            <div className="text-neutral-400 text-[11px]">Observation Support</div>
            <div className="font-mono font-medium text-white mt-1">{record.total_occurrences} records</div>
            <div className="text-[10px] text-neutral-500 mt-0.5 capitalize">{record.sampling_support_level} support</div>
          </div>
          <div className="p-3 bg-neutral-900/60 rounded-xl border border-white/[0.08] backdrop-blur-xl">
            <div className="text-neutral-400 text-[11px]">Temporal Coverage</div>
            <div className="font-mono font-medium text-white mt-1">{record.grid_temporal_coverage_pct?.toFixed(0) || 100}%</div>
            <div className="text-[10px] text-neutral-500 mt-0.5">Study window span</div>
          </div>
          <div className="p-3 bg-neutral-900/60 rounded-xl border border-white/[0.08] backdrop-blur-xl">
            <div className="text-neutral-400 text-[11px]">Method Agreement</div>
            <div className="font-mono font-medium text-white mt-1">{record.method_agreement_count} / 6</div>
            <div className="text-[10px] text-neutral-500 mt-0.5">Consensus models</div>
          </div>
        </div>
      </div>

      {/* Explanation text */}
      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Analytical Explanation</div>
        <p className="text-xs leading-relaxed text-neutral-300 bg-neutral-900/60 p-4 rounded-2xl border border-white/[0.08] backdrop-blur-xl shadow-md">
          {record.explanation}
        </p>
      </div>

      {/* Scientific caveat */}
      <div className="p-3.5 bg-neutral-900/40 rounded-2xl border border-white/[0.06] text-[11px] text-neutral-400 flex items-start gap-2.5 backdrop-blur-xl">
        <Info className="h-4 w-4 shrink-0 text-cyan-400 mt-0.5" />
        <div>
          <strong className="text-foreground/80">Screening Protocol Notice:</strong> This score represents an observation-derived prioritization index for field investigation. It does not establish ecological causation, habitat destruction, or biological population collapse.
        </div>
      </div>
    </div>
  );
}
