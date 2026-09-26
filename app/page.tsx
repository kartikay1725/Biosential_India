"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  getSystemSummary,
  getMapPoints,
  getTop100Units,
  getTrendSummary,
  getGridRecord,
} from "@/lib/api/data-service";
import { MetricCard } from "@/components/biosentinel/MetricCard";
import { PriorityBadge, ReliabilityBadge, DiagnosticBadge } from "@/components/biosentinel/StatusBadge";
import { MapView } from "@/components/maps/MapView";
import { DualSlopeBarChart } from "@/components/charts/DualSlopeBarChart";
import { EffortRichnessChart } from "@/components/charts/EffortRichnessChart";
import { GridDetailSheet } from "@/components/biosentinel/GridDetailSheet";
import { formatNumber, formatPriority, formatPercentage, formatCoordinates } from "@/lib/formatting/formatters";
import { GridYearRecord } from "@/types/biosentinel";
import {
  Layers,
  Database,
  Grid,
  AlertTriangle,
  Flame,
  Sparkles,
  ArrowRight,
  TrendingDown,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function DashboardPage() {
  const summary = getSystemSummary();
  const mapPoints = getMapPoints();
  const top100 = getTop100Units();
  const trendSummary = getTrendSummary();

  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const [detailRecord, setDetailRecord] = useState<GridYearRecord | null>(null);

  const handleSelectCell = (cellCode: string) => {
    setSelectedCell(cellCode);
    const rec = getGridRecord(cellCode);
    if (rec) setDetailRecord(rec);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            BioSentinel India
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Observation-aware biodiversity intelligence &amp; screening for terrestrial India
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/map">
            <Button variant="outline" size="sm" className="text-xs gap-1.5 h-8">
              Open Interactive Map
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Row 1: Primary KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
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
          label="2024 Screened Units"
          value={formatNumber(summary.dataset_dimensions.screened_units_2024)}
          subtext="Baseline eligible units"
          icon={<Layers className="h-4 w-4" />}
        />
        <MetricCard
          label="High Priority (2024)"
          value={summary.dataset_dimensions.high_screening_priority_2024}
          subtext="≥ 95th percentile"
          subtextTone="danger"
          icon={<Flame className="h-4 w-4 text-danger" />}
        />
        <MetricCard
          label="Persistent Candidates"
          value={summary.dataset_dimensions.persistent_high_priority_2024}
          subtext="≥ 2 consecutive years"
          subtextTone="warning"
          icon={<AlertTriangle className="h-4 w-4 text-warning" />}
        />
      </div>

      {/* Row 2: Locked BioCLIP Intelligence Band */}
      <div className="bg-surface-raised border border-border p-3.5 rounded-lg flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded bg-accent/20 border border-accent/40 flex items-center justify-center text-accent">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-foreground flex items-center gap-2">
              <span>BioCLIP Species Identification Layer</span>
              <span className="font-mono text-[10px] bg-surface px-1.5 py-0.5 rounded border border-border text-success">LOCKED BENCHMARK</span>
            </div>
            <div className="text-[11px] text-muted-foreground">ViT-B/16 partial fine-tuning across 1,106 Indian species</div>
          </div>
        </div>

        <div className="flex items-center gap-6 font-mono text-xs">
          <div>
            <span className="text-muted-foreground mr-1.5 text-[11px]">Top-1:</span>
            <span className="font-bold text-foreground">78.94%</span>
          </div>
          <div>
            <span className="text-muted-foreground mr-1.5 text-[11px]">Top-5:</span>
            <span className="font-bold text-foreground">92.87%</span>
          </div>
          <div>
            <span className="text-muted-foreground mr-1.5 text-[11px]">Macro F1:</span>
            <span className="font-bold text-foreground">78.27%</span>
          </div>
          <div>
            <span className="text-muted-foreground mr-1.5 text-[11px]">Poisson MAE:</span>
            <span className="font-bold text-info">31.72</span>
          </div>
        </div>
      </div>

      {/* Row 3: Map + Summary Findings Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: India Screening Overview Map (7 cols) */}
        <div className="lg:col-span-7 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">India Screening Overview (2024)</h2>
              <p className="text-xs text-muted-foreground">Spatial distribution of 2,630 screened grid cells</p>
            </div>
            <span className="text-[11px] text-muted-foreground font-mono">Click a point for evidence</span>
          </div>
          <MapView
            points={mapPoints}
            selectedCell={selectedCell}
            onSelectCell={handleSelectCell}
            height="h-[480px]"
          />
        </div>

        {/* Right: Featured Case Studies & Recent Findings (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Featured Analytical Case Studies</h2>
            <span className="text-xs text-muted-foreground">Audited 2024 Units</span>
          </div>

          {/* Hero Case Study 1: E076N28AA */}
          <div
            onClick={() => handleSelectCell("E076N28AA")}
            className="p-4 bg-card border border-border hover:border-danger/60 rounded-lg cursor-pointer transition-all space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-surface border border-border text-foreground">
                  E076N28AA
                </span>
                <span className="text-[11px] text-muted-foreground">Haryana, India</span>
              </div>
              <PriorityBadge priority={53.06} category="high screening priority" />
            </div>
            <p className="text-xs text-foreground/90 leading-relaxed">
              <strong>Multi-Signal Anomaly:</strong> 67 species observed vs 89.1 expected (-24.8% deviation, -2.14σ residual). Supported by 354 occurrences and 2-year temporal persistence.
            </p>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border">
              <span>Evidence: 73.12 • Reliability: 72.57</span>
              <span className="text-accent font-medium">Inspect Dossier →</span>
            </div>
          </div>

          {/* Hero Case Study 2: E078N09BC (False-Positive Demonstration) */}
          <div
            onClick={() => handleSelectCell("E078N09BC")}
            className="p-4 bg-card border border-border hover:border-warning/60 rounded-lg cursor-pointer transition-all space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-surface border border-border text-foreground">
                  E078N09BC
                </span>
                <span className="text-[11px] text-muted-foreground">Tamil Nadu, India</span>
              </div>
              <DiagnosticBadge diagnostic="effort_driven_signal" />
            </div>
            <p className="text-xs text-foreground/90 leading-relaxed">
              <strong>Sampling Artifact Warning:</strong> Apparent drop from 83 to 21 species. 
              BioSentinel accurately suppresses this false alarm due to a severe <span className="font-mono text-warning">-90.0% effort collapse</span> (331 → 33 records).
            </p>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border">
              <span>Diagnostic: effort_driven_signal</span>
              <span className="text-accent font-medium">Inspect Warning →</span>
            </div>
          </div>

          {/* Analytical principles note */}
          <div className="p-3 bg-surface rounded-lg border border-border text-xs text-muted-foreground space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-foreground text-[11px]">
              <Info className="h-3.5 w-3.5 text-info" />
              Scientific Screening Mandate
            </div>
            <p className="text-[11px] leading-relaxed">
              BioSentinel prioritizes grid units based on conditional departure from historical expectations. High scores flag locations for ecological investigation, not proof of extinction.
            </p>
          </div>
        </div>
      </div>

      {/* Row 4: Two Key Scientific Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dual-Slope Classification */}
        <div className="p-4 bg-card border border-border rounded-lg space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Dual-Slope Temporal Trend Resolution</h3>
            <p className="text-xs text-muted-foreground">
              61.1% of apparent raw richness growth is resolved as effort-driven growth rather than ecological recovery
            </p>
          </div>
          <DualSlopeBarChart data={trendSummary} />
        </div>

        {/* Observation Effort vs Richness */}
        <div className="p-4 bg-card border border-border rounded-lg space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Observation Effort vs Species Richness</h3>
            <p className="text-xs text-muted-foreground">
              Logarithmic scaling ensures volunteer submission surges do not distort biological baselines
            </p>
          </div>
          <EffortRichnessChart />
        </div>
      </div>

      {/* Row 5: Top Priority Locations Table */}
      <div className="p-4 bg-card border border-border rounded-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-foreground">2024 High Screening Priority Units (Top 100)</h3>
            <p className="text-xs text-muted-foreground">Ranked by decoupled priority score = Evidence × (Reliability / 100)</p>
          </div>
          <Link href="/priority">
            <Button variant="outline" size="sm" className="h-7 text-xs">
              View All 186 Units
            </Button>
          </Link>
        </div>

        <div className="border border-border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
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
              {top100.slice(0, 15).map((row) => (
                <TableRow
                  key={row.eqdcellcode}
                  className="cursor-pointer hover:bg-surface-hover/70"
                  onClick={() => handleSelectCell(row.eqdcellcode)}
                >
                  <TableCell className="font-mono font-medium text-xs text-foreground">
                    {row.eqdcellcode}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono">
                    {formatCoordinates(row.latitude, row.longitude)}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-right text-foreground">
                    {row.species_richness}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-right text-info">
                    {Number(row.selected_expected_richness || row.negative_binomial_expected_richness).toFixed(1)}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-right text-muted-foreground">
                    {row.total_occurrences}
                  </TableCell>
                  <TableCell className={`text-xs font-mono text-right ${row.relative_deviation < 0 ? "text-danger" : "text-success"}`}>
                    {formatPercentage(row.relative_deviation)}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-center text-foreground">
                    {row.persistence_count} yr
                  </TableCell>
                  <TableCell className="text-xs font-mono text-center text-muted-foreground">
                    {row.method_agreement_count} / 6
                  </TableCell>
                  <TableCell className="text-xs font-mono text-right text-muted-foreground">
                    {row.reliability_score.toFixed(1)}
                  </TableCell>
                  <TableCell className="text-xs font-mono font-bold text-right text-accent">
                    {formatPriority(row.priority_score)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Grid Detail Sheet when clicked */}
      <GridDetailSheet
        record={detailRecord}
        isOpen={!!detailRecord}
        onClose={() => setDetailRecord(null)}
      />
    </div>
  );
}
