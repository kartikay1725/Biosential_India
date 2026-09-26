"use client";

import React, { useState } from "react";
import { BookOpen, CheckCircle2, ChevronRight, ChevronDown, Layers, Database, ArrowRight } from "lucide-react";

interface Stage {
  num: number;
  title: string;
  input: string;
  method: string;
  output: string;
  whyItMatters: string;
}

export default function MethodologyPage() {
  const [expandedStage, setExpandedStage] = useState<number | null>(1);

  const stages: Stage[] = [
    {
      num: 1,
      title: "Data Sources & Ingestion",
      input: "Raw GBIF & iNaturalist occurrence records (terrestrial India)",
      method: "Ingestion of 3.66M occurrences (2018–2024); removal of marine coordinates, fossils, and invalid taxa",
      output: "Standardized occurrence dataset with canonical coordinates and timestamps",
      whyItMatters: "Eliminates geographical duplicates and invalid coordinate references before spatial aggregation.",
    },
    {
      num: 2,
      title: "Equal-Area Grid Standardization",
      input: "Continuous lat/lon point occurrences",
      method: "Equal-Area Cylindrical Projection (EQDGC) at 0.25° resolution (~25km × 25km)",
      output: "2,773 unique terrestrial grid cells across India",
      whyItMatters: "Prevents high-latitude grid area distortion and creates standardized spatial analytical units.",
    },
    {
      num: 3,
      title: "Observation-Effort Analysis",
      input: "Annual occurrences per grid cell",
      method: "Log-transformation ln(1 + occurrences), effort ratios, and year-over-year percentage shifts",
      output: "Quantified observation effort metrics (log_effort, effort_change_pct)",
      whyItMatters: "Treats occurrence counts as sampling intensity rather than direct animal abundance.",
    },
    {
      num: 4,
      title: "Historical Baseline Modeling",
      input: "Historical training years (2018–2023) with ≥3 observation years",
      method: "Dual GLM regression: Poisson GLM (conditional mean) + Negative Binomial (overdispersion)",
      output: "Effort-conditioned expected species richness for each cell-year",
      whyItMatters: "Poisson achieves lowest walk-forward point forecasting error (MAE = 31.72), while NegBin calibrates variance.",
    },
    {
      num: 5,
      title: "Effort-Adjusted Anomaly Detection",
      input: "Observed richness vs model expectations",
      method: "Poisson deviance residuals, NegBin prediction intervals, baseline IQR scaling, and Isolation Forest",
      output: "Multi-detector anomaly consensus flags and standardized residuals",
      whyItMatters: "Combines parametric deviance and non-parametric bounds, preventing reliance on any single detector.",
    },
    {
      num: 6,
      title: "Dual-Slope Temporal Persistence",
      input: "Consecutive historical residual directions",
      method: "Dual-slope categorization (β_rich vs β_eff vs β_adj) tracking multi-year persistent runs",
      output: "Trend taxonomy (e.g. effort_driven_richness_growth, effort_adjusted_decrease)",
      whyItMatters: "Resolves 61.1% of apparent raw richness growth into observer surges, filtering ephemeral noise.",
    },
    {
      num: 7,
      title: "Spatial Neighborhood Consistency",
      input: "Centroids of 0.25° cells in Moore neighborhood",
      method: "Fast spatial querying using cKDTree with radius r = 0.38° (8 adjacent neighbors)",
      output: "Coincident neighborhood anomaly proportion and cluster flags",
      whyItMatters: "Genuine ecological shifts frequently exhibit spatial spillover across adjacent landscape units.",
    },
    {
      num: 8,
      title: "Decoupled Evidence & Reliability Scoring",
      input: "Anomaly deviations, turnover, persistence, baseline length, and sampling support",
      method: "Priority Score = Evidence × (Reliability / 100)",
      output: "Final prioritization score (0–100) and screening category",
      whyItMatters: "Ensures data-limited units are downweighted, preventing false alarms in under-surveyed areas.",
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="space-y-1.5 pb-4 border-b border-border">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-accent" />
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Analytical Pipeline Methodology
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Step-by-step mathematical and architectural stages converting raw occurrences into explainable screening signals.
        </p>
      </div>

      {/* Visual Pipeline Flow */}
      <div className="p-4 bg-card border border-border rounded-xl space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          End-to-End Pipeline Traceability
        </h3>
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          {stages.map((s, idx) => (
            <React.Fragment key={s.num}>
              <button
                onClick={() => setExpandedStage(s.num)}
                className={`px-2.5 py-1 rounded transition-colors border ${
                  expandedStage === s.num
                    ? "bg-accent/20 text-accent border-accent/40 font-bold"
                    : "bg-surface text-muted-foreground border-border hover:text-foreground"
                }`}
              >
                Stage {s.num}: {s.title.split(" ")[0]}
              </button>
              {idx < stages.length - 1 && <span className="text-muted-foreground/50">→</span>}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Interactive Stage Accordion */}
      <div className="space-y-3">
        {stages.map((s) => {
          const isOpen = expandedStage === s.num;
          return (
            <div
              key={s.num}
              className="border border-border rounded-lg bg-card overflow-hidden transition-colors"
            >
              <button
                onClick={() => setExpandedStage(isOpen ? null : s.num)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-surface-raised transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="h-6 w-6 rounded bg-surface border border-border font-mono text-xs font-bold text-accent flex items-center justify-center shrink-0">
                    {s.num}
                  </span>
                  <span className="font-semibold text-sm text-foreground">{s.title}</span>
                </div>
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </button>

              {isOpen && (
                <div className="p-4 pt-0 border-t border-border bg-surface/40 space-y-3 text-xs animate-in fade-in-50 duration-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3">
                    <div className="p-3 rounded bg-surface border border-border space-y-1">
                      <span className="text-[11px] font-bold text-muted-foreground uppercase">Inputs:</span>
                      <p className="text-foreground/90">{s.input}</p>
                    </div>
                    <div className="p-3 rounded bg-surface border border-border space-y-1">
                      <span className="text-[11px] font-bold text-muted-foreground uppercase">Outputs:</span>
                      <p className="text-foreground/90 font-mono text-[11px]">{s.output}</p>
                    </div>
                  </div>

                  <div className="p-3 rounded bg-surface border border-border space-y-1">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase">Mathematical Method:</span>
                    <p className="text-foreground/90 leading-relaxed">{s.method}</p>
                  </div>

                  <div className="p-3 rounded bg-surface-raised border border-accent/20 space-y-1">
                    <span className="text-[11px] font-bold text-accent uppercase">Why It Matters for Screening:</span>
                    <p className="text-foreground leading-relaxed">{s.whyItMatters}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
