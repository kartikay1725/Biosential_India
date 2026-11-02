"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  getSystemSummary,
  getAnnualSummary,
  getMapPoints,
  getTop100Units,
  getTrendSummary,
  getGridRecord,
} from "@/lib/api/data-service";
import { useSelectedYear } from "@/components/context/YearContext";
import { MetricCard } from "@/components/biosentinel/MetricCard";
import { PriorityBadge, ReliabilityBadge, DiagnosticBadge } from "@/components/biosentinel/StatusBadge";
import { MapView } from "@/components/maps/MapView";
import { DualSlopeBarChart } from "@/components/charts/DualSlopeBarChart";
import { EffortRichnessChart } from "@/components/charts/EffortRichnessChart";
import { GridDetailSheet } from "@/components/biosentinel/GridDetailSheet";
import { formatNumber, formatPercentage, formatCoordinates } from "@/lib/formatting/formatters";
import { GridYearRecord } from "@/types/biosentinel";
import {
  Layers,
  Database,
  Grid,
  AlertTriangle,
  Flame,
  Sparkles,
  ArrowRight,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function DashboardPage() {
  const { selectedYear } = useSelectedYear();
  const summary = getSystemSummary(selectedYear);
  const annual = getAnnualSummary(selectedYear);
  const mapPoints = getMapPoints(selectedYear);
  const top100 = getTop100Units(selectedYear);
  const trendSummary = getTrendSummary();

  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const [detailRecord, setDetailRecord] = useState<GridYearRecord | null>(null);

  const handleSelectCell = (cellCode: string) => {
    setSelectedCell(cellCode);
    const rec = getGridRecord(cellCode, selectedYear);
    if (rec) setDetailRecord(rec);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              BioSentinel India
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {selectedYear} ACTIVE
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Observation-aware biodiversity intelligence &amp; screening for terrestrial India
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/map?year=${selectedYear}`}>
            <Button variant="outline" size="sm" className="text-xs gap-2 h-9 rounded-xl border-white/[0.1] bg-neutral-900/80 hover:bg-white/[0.06] text-white">
              Open Interactive Map
              <ArrowRight className="h-3.5 w-3.5 text-emerald-400" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Row 1: Primary KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <MetricCard
          label="Grid × Year Units"
          value={formatNumber(summary.dataset_dimensions.total_grid_year_units)}
          subtext="2018 – 2024 monitoring"
          icon={<Database className="h-4 w-4" />}
        />
        <MetricCard
          label="Terrestrial Cells"
          value={formatNumber(summary.dataset_dimensions.unique_grid_cells)}
          subtext="0.25° EQDGC grid"
          icon={<Grid className="h-4 w-4" />}
        />
        <MetricCard
          label={`${selectedYear} Screened Units`}
          value={formatNumber(annual.screened_units)}
          subtext="Baseline eligible units"
          icon={<Layers className="h-4 w-4 text-accent" />}
        />
        <MetricCard
          label={`High Priority (${selectedYear})`}
          value={annual.high_screening_priority}
          subtext="≥ 95th percentile"
          subtextTone="danger"
          icon={<Flame className="h-4 w-4 text-danger" />}
        />
        <MetricCard
          label="Persistent Candidates"
          value={annual.persistent_high_priority}
          subtext="≥ 2 consecutive years"
          subtextTone="warning"
          icon={<AlertTriangle className="h-4 w-4 text-warning" />}
        />
      </div>

      {/* Row 2: Locked BioCLIP Intelligence Band */}
      <div className="bg-neutral-900/60 border border-white/[0.08] backdrop-blur-xl p-4 sm:p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-white flex items-center gap-2">
              <span>BioCLIP Species Identification Layer</span>
              <span className="font-mono text-[10px] bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30 text-emerald-300">LOCKED BENCHMARK</span>
            </div>
            <div className="text-[11px] text-neutral-400 mt-0.5">ViT-B/16 partial fine-tuning across 1,106 Indian species</div>
          </div>
        </div>

        <div className="flex items-center gap-6 font-mono text-xs">
          <div>
            <span className="text-neutral-500 mr-1.5 text-[11px]">Top-1:</span>
            <span className="font-bold text-white">78.94%</span>
          </div>
          <div>
            <span className="text-neutral-500 mr-1.5 text-[11px]">Top-5:</span>
            <span className="font-bold text-white">92.87%</span>
          </div>
          <div>
            <span className="text-neutral-500 mr-1.5 text-[11px]">Macro F1:</span>
            <span className="font-bold text-white">78.27%</span>
          </div>
          <div>
            <span className="text-neutral-500 mr-1.5 text-[11px]">Poisson MAE:</span>
            <span className="font-bold text-info">31.72</span>
          </div>
        </div>
      </div>

      {/* Row 3: Map + Summary Findings Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: India Screening Overview Map (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">
                India Screening Overview ({selectedYear})
              </h2>
              <p className="text-xs text-neutral-400">
                Spatial distribution of {formatNumber(annual.screened_units)} screened grid cells
              </p>
            </div>
            <span className="text-[11px] text-neutral-400 font-mono">Click a point for evidence</span>
          </div>
          <div className="rounded-2xl overflow-hidden border border-white/[0.08] shadow-xl">
            <MapView
              points={mapPoints}
              selectedCell={selectedCell}
              onSelectCell={handleSelectCell}
              height="h-[480px]"
            />
          </div>
        </div>

        {/* Right: Featured Case Studies & Recent Findings (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Featured Analytical Case Studies</h2>
            <span className="text-xs text-neutral-500">Audited Monitoring Units</span>
          </div>

          {/* Hero Case Study 1: E076N28AA */}
          <div
            onClick={() => handleSelectCell("E076N28AA")}
            className="p-5 bg-neutral-900/60 border border-white/[0.08] hover:border-rose-500/40 rounded-2xl backdrop-blur-xl cursor-pointer transition-all space-y-3 shadow-lg hover:shadow-rose-950/20 group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-xl bg-neutral-900/80 border border-white/[0.08] text-white">
                  E076N28AA
                </span>
                <span className="text-xs text-neutral-400">Haryana, India</span>
              </div>
              <PriorityBadge priority={53.06} category="high screening priority" />
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              <strong className="text-white">Multi-Signal Anomaly:</strong> 67 species observed vs 89.1 expected (-24.8% deviation, -2.14σ residual). Supported by 354 occurrences and 2-year temporal persistence.
            </p>
            <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-2 border-t border-white/[0.06]">
              <span>Evidence: 73.12 • Reliability: 72.57</span>
              <span className="text-rose-400 font-medium group-hover:translate-x-0.5 transition-transform">Inspect Dossier →</span>
            </div>
          </div>

          {/* Hero Case Study 2: E078N09BC (False-Positive Demonstration) */}
          <div
            onClick={() => handleSelectCell("E078N09BC")}
            className="p-5 bg-neutral-900/60 border border-white/[0.08] hover:border-amber-500/40 rounded-2xl backdrop-blur-xl cursor-pointer transition-all space-y-3 shadow-lg hover:shadow-amber-950/20 group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-xl bg-neutral-900/80 border border-white/[0.08] text-white">
                  E078N09BC
                </span>
                <span className="text-xs text-neutral-400">Tamil Nadu, India</span>
              </div>
              <DiagnosticBadge diagnostic="effort_driven_signal" />
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              <strong className="text-white">Sampling Artifact Warning:</strong> Apparent drop from 83 to 21 species. 
              BioSentinel accurately suppresses this false alarm due to a severe <span className="font-mono text-amber-400 bg-neutral-900/80 px-1.5 py-0.5 rounded-lg border border-white/[0.08]">-90.0% effort collapse</span> (331 → 33 records).
            </p>
            <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-2 border-t border-white/[0.06]">
              <span>Diagnostic: effort_driven_signal</span>
              <span className="text-amber-400 font-medium group-hover:translate-x-0.5 transition-transform">Inspect Warning →</span>
            </div>
          </div>

          {/* Analytical principles note */}
          <div className="p-4 bg-neutral-900/40 rounded-2xl border border-white/[0.06] text-xs text-neutral-400 space-y-1.5 backdrop-blur-xl">
            <div className="flex items-center gap-1.5 font-semibold text-neutral-300 text-xs">
              <Info className="h-4 w-4 text-cyan-400" />
              Scientific Screening Mandate
            </div>
            <p className="text-[11px] leading-relaxed text-neutral-400">
              BioSentinel prioritizes grid units based on conditional departure from historical expectations. High scores flag locations for ecological investigation, not proof of extinction.
            </p>
          </div>
        </div>
      </div>

      {/* Row 4: Two Key Scientific Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dual-Slope Classification */}
        <div className="p-5 sm:p-6 bg-neutral-900/60 border border-white/[0.08] rounded-2xl backdrop-blur-xl space-y-4 shadow-xl">
          <div>
            <h3 className="text-sm font-semibold text-white">Dual-Slope Temporal Trend Resolution</h3>
            <p className="text-xs text-neutral-400">
              61.1% of apparent raw richness growth is resolved as effort-driven growth rather than ecological recovery
            </p>
          </div>
          <DualSlopeBarChart data={trendSummary} />
        </div>

        {/* Observation Effort vs Richness */}
        <div className="p-5 sm:p-6 bg-neutral-900/60 border border-white/[0.08] rounded-2xl backdrop-blur-xl space-y-4 shadow-xl">
          <div>
            <h3 className="text-sm font-semibold text-white">Observation Effort vs Species Richness</h3>
            <p className="text-xs text-neutral-400">
              Logarithmic scaling ensures volunteer submission surges do not distort biological baselines
            </p>
          </div>
          <EffortRichnessChart />
        </div>
      </div>

      {/* Row 5: Top Priority Locations Table */}
      <div className="p-5 sm:p-6 bg-neutral-900/60 border border-white/[0.08] rounded-2xl backdrop-blur-xl space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-white">
              {selectedYear} High Screening Priority Units (Top 100)
            </h3>
            <p className="text-xs text-neutral-400">Ranked by decoupled priority score = Evidence × (Reliability / 100)</p>
          </div>
          <Link href={`/priority?year=${selectedYear}`}>
            <Button variant="outline" size="sm" className="h-8 text-xs rounded-xl border-white/[0.1] bg-neutral-900/80 hover:bg-white/[0.06] text-white">
              View All {annual.high_screening_priority} Units
            </Button>
          </Link>
        </div>

        <div className="border border-white/[0.08] rounded-2xl overflow-hidden max-h-96 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Grid ID</TableHead>
                <TableHead>Centroid</TableHead>
                <TableHead className="text-right">Observed</TableHead>
                <TableHead className="text-right">Expected</TableHead>
                <TableHead className="text-right">Effort</TableHead>
                <TableHead className="text-right">Deviation</TableHead>
                <TableHead className="text-center">Persistence</TableHead>
                <TableHead className="text-center">Agreement</TableHead>
                <TableHead className="text-right">Reliability</TableHead>
                <TableHead className="text-right">Priority</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {top100.map((r) => (
                <TableRow
                  key={r.eqdcellcode}
                  className="cursor-pointer hover:bg-surface-hover/70"
                  onClick={() => handleSelectCell(r.eqdcellcode)}
                >
                  <TableCell className="font-mono font-medium text-xs text-foreground">
                    {r.eqdcellcode}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono">
                    {formatCoordinates(r.latitude, r.longitude)}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-right text-foreground font-semibold">
                    {r.species_richness}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-right text-muted-foreground">
                    {Number(r.selected_expected_richness || r.negative_binomial_expected_richness).toFixed(1)}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-right text-muted-foreground">
                    {formatNumber(r.total_occurrences)}
                  </TableCell>
                  <TableCell
                    className={`text-xs font-mono text-right ${
                      r.relative_deviation < 0 ? "text-danger font-semibold" : "text-success font-semibold"
                    }`}
                  >
                    {formatPercentage(r.relative_deviation)}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-center text-foreground">
                    {r.persistence_count > 0 ? `${r.persistence_count} yr` : "—"}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-center text-foreground">
                    {r.method_agreement_count}/4
                  </TableCell>
                  <TableCell className="text-xs font-mono text-right">
                    <ReliabilityBadge score={r.reliability_score} />
                  </TableCell>
                  <TableCell className="text-xs font-mono text-right">
                    <PriorityBadge priority={r.priority_score} category={r.priority_category} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Global Detail Drawer */}
      <GridDetailSheet
        record={detailRecord}
        isOpen={!!detailRecord}
        onClose={() => {
          setSelectedCell(null);
          setDetailRecord(null);
        }}
      />
    </div>
  );
}
