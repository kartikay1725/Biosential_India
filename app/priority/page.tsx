"use client";

import React, { useState } from "react";
import { getTopPriorityUnits, getTop100Units, getGridRecord, getAnnualSummary } from "@/lib/api/data-service";
import { useSelectedYear } from "@/components/context/YearContext";
import { PriorityBadge, ReliabilityBadge, DiagnosticBadge } from "@/components/biosentinel/StatusBadge";
import { GridDetailSheet } from "@/components/biosentinel/GridDetailSheet";
import { formatCoordinates, formatPriority, formatPercentage, formatSigma, formatNumber } from "@/lib/formatting/formatters";
import { GridYearRecord } from "@/types/biosentinel";
import { Flame, ShieldAlert, Sparkles, Filter, CheckCircle2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PriorityPage() {
  const { selectedYear } = useSelectedYear();
  const annual = getAnnualSummary(selectedYear);
  const topPriorityUnits = getTopPriorityUnits(selectedYear);
  const persistentUnits = topPriorityUnits.filter((r) => r.persistence_count >= 2);
  const top25 = topPriorityUnits.slice(0, 25);
  const top100 = getTop100Units(selectedYear);

  const [selectedCell, setSelectedCell] = useState<GridYearRecord | null>(null);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="space-y-2 pb-5 border-b border-white/[0.08]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-rose-500/20 via-rose-500/10 to-transparent border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.15)]">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  {selectedYear} Priority Screening Registry
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  DECOUPLED FORMULATION
                </span>
              </div>
              <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
                Screening units prioritized by:{" "}
                <code className="text-emerald-300 bg-neutral-900/80 px-2 py-0.5 rounded-lg border border-white/[0.08] font-mono text-xs">
                  Priority = Evidence × (Reliability / 100)
                </code>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-neutral-900/60 border border-white/[0.08] backdrop-blur-xl hover:border-rose-500/30 transition-all shadow-lg hover:shadow-rose-950/20 group">
          <div className="text-[11px] uppercase tracking-wider text-neutral-400 font-medium">High Priority Units</div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-rose-400 mt-1.5 group-hover:scale-[1.02] transition-transform">
            {annual.high_screening_priority}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">≥ 38.42 (95th percentile)</div>
        </div>
        <div className="p-4 sm:p-5 rounded-2xl bg-neutral-900/60 border border-white/[0.08] backdrop-blur-xl hover:border-amber-500/30 transition-all shadow-lg hover:shadow-amber-950/20 group">
          <div className="text-[11px] uppercase tracking-wider text-neutral-400 font-medium">Persistent Candidates</div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-amber-400 mt-1.5 group-hover:scale-[1.02] transition-transform">
            {annual.persistent_high_priority}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">≥ 2 consecutive supported years</div>
        </div>
        <div className="p-4 sm:p-5 rounded-2xl bg-neutral-900/60 border border-white/[0.08] backdrop-blur-xl hover:border-white/20 transition-all shadow-lg group">
          <div className="text-[11px] uppercase tracking-wider text-neutral-400 font-medium">Moderate Priority</div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-white mt-1.5 group-hover:scale-[1.02] transition-transform">
            {annual.moderate_screening_priority}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">30.10 – 38.42 threshold</div>
        </div>
        <div className="p-4 sm:p-5 rounded-2xl bg-neutral-900/60 border border-white/[0.08] backdrop-blur-xl hover:border-emerald-500/30 transition-all shadow-lg hover:shadow-emerald-950/20 group">
          <div className="text-[11px] uppercase tracking-wider text-neutral-400 font-medium">Total Screened</div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-white mt-1.5 group-hover:scale-[1.02] transition-transform">
            {formatNumber(annual.screened_units)}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">Eligible {selectedYear} units</div>
        </div>
      </div>

      {/* Tabbed Priority Subsets */}
      <Tabs defaultValue="all-high" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all-high">All {topPriorityUnits.length} High Priority</TabsTrigger>
          <TabsTrigger value="persistent">{persistentUnits.length} Persistent Candidates</TabsTrigger>
          <TabsTrigger value="top25">Top 25 Priority</TabsTrigger>
          <TabsTrigger value="top100">Top 100 Registry</TabsTrigger>
        </TabsList>

        {/* Tab 1: All 186 Units */}
        <TabsContent value="all-high" className="space-y-3">
          <div className="border border-white/[0.08] rounded-2xl overflow-hidden bg-neutral-900/50 backdrop-blur-xl shadow-xl">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Grid Cell</TableHead>
                  <TableHead>Centroid</TableHead>
                  <TableHead className="text-right">Observed</TableHead>
                  <TableHead className="text-right">Expected</TableHead>
                  <TableHead className="text-right">Deviation</TableHead>
                  <TableHead className="text-right">Residual</TableHead>
                  <TableHead className="text-center">Persistence</TableHead>
                  <TableHead className="text-center">Agreement</TableHead>
                  <TableHead className="text-right">Evidence</TableHead>
                  <TableHead className="text-right">Reliability</TableHead>
                  <TableHead className="text-right">Priority Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topPriorityUnits.map((r) => (
                  <TableRow
                    key={r.eqdcellcode}
                    className="cursor-pointer hover:bg-surface-hover/70"
                    onClick={() => setSelectedCell(r)}
                  >
                    <TableCell className="font-mono font-medium text-xs text-foreground">
                      {r.eqdcellcode}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {formatCoordinates(r.latitude, r.longitude)}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-right text-foreground">
                      {r.species_richness}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-right text-info">
                      {Number(r.selected_expected_richness || r.negative_binomial_expected_richness).toFixed(1)}
                    </TableCell>
                    <TableCell className={`text-xs font-mono text-right ${r.relative_deviation < 0 ? "text-danger" : "text-success"}`}>
                      {formatPercentage(r.relative_deviation)}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-right text-muted-foreground">
                      {formatSigma(r.standardized_residual)}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-center text-foreground">
                      {r.persistence_count} yr
                    </TableCell>
                    <TableCell className="text-xs font-mono text-center text-muted-foreground">
                      {r.method_agreement_count} / 6
                    </TableCell>
                    <TableCell className="text-xs font-mono text-right text-muted-foreground">
                      {r.evidence_score.toFixed(1)}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-right text-muted-foreground">
                      {r.reliability_score.toFixed(1)}
                    </TableCell>
                    <TableCell className="text-xs font-mono font-bold text-right text-accent">
                      {formatPriority(r.priority_score)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Tab 2: 17 Persistent Candidates */}
        <TabsContent value="persistent" className="space-y-3">
          <div className="p-4 bg-amber-500/5 rounded-2xl border border-amber-500/20 text-xs text-amber-200/90 backdrop-blur-xl flex items-center gap-2.5">
            <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0" />
            <span>
              Multi-year persistent anomaly candidates have demonstrated statistical departure for 2 or more consecutive supported evaluation years.
            </span>
          </div>
          <div className="border border-white/[0.08] rounded-2xl overflow-hidden bg-neutral-900/50 backdrop-blur-xl shadow-xl">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Grid Cell</TableHead>
                  <TableHead>Centroid</TableHead>
                  <TableHead className="text-right">Observed</TableHead>
                  <TableHead className="text-right">Expected</TableHead>
                  <TableHead className="text-right">Deviation</TableHead>
                  <TableHead className="text-center">Run Length</TableHead>
                  <TableHead className="text-right">Evidence</TableHead>
                  <TableHead className="text-right">Reliability</TableHead>
                  <TableHead className="text-right">Priority</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {persistentUnits.map((r) => (
                  <TableRow
                    key={r.eqdcellcode}
                    className="cursor-pointer hover:bg-surface-hover/70"
                    onClick={() => setSelectedCell(r)}
                  >
                    <TableCell className="font-mono font-medium text-xs text-foreground">
                      {r.eqdcellcode}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {formatCoordinates(r.latitude, r.longitude)}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-right text-foreground">
                      {r.species_richness}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-right text-info">
                      {Number(r.selected_expected_richness || r.negative_binomial_expected_richness).toFixed(1)}
                    </TableCell>
                    <TableCell className={`text-xs font-mono text-right ${r.relative_deviation < 0 ? "text-danger" : "text-success"}`}>
                      {formatPercentage(r.relative_deviation)}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-center font-bold text-warning">
                      {r.persistence_count} consecutive yrs
                    </TableCell>
                    <TableCell className="text-xs font-mono text-right text-muted-foreground">
                      {r.evidence_score.toFixed(1)}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-right text-muted-foreground">
                      {r.reliability_score.toFixed(1)}
                    </TableCell>
                    <TableCell className="text-xs font-mono font-bold text-right text-accent">
                      {formatPriority(r.priority_score)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Tab 3: Top 25 */}
        <TabsContent value="top25" className="space-y-3">
          <div className="border border-white/[0.08] rounded-2xl overflow-hidden bg-neutral-900/50 backdrop-blur-xl shadow-xl">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Grid Cell</TableHead>
                  <TableHead className="text-right">Observed</TableHead>
                  <TableHead className="text-right">Expected</TableHead>
                  <TableHead className="text-right">Deviation</TableHead>
                  <TableHead className="text-right">Evidence</TableHead>
                  <TableHead className="text-right">Reliability</TableHead>
                  <TableHead className="text-right">Priority</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {top25.map((r, idx) => (
                  <TableRow
                    key={r.eqdcellcode}
                    className="cursor-pointer hover:bg-surface-hover/70"
                    onClick={() => setSelectedCell(r)}
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">#{idx + 1}</TableCell>
                    <TableCell className="font-mono font-medium text-xs text-foreground">{r.eqdcellcode}</TableCell>
                    <TableCell className="text-xs font-mono text-right">{r.species_richness}</TableCell>
                    <TableCell className="text-xs font-mono text-right text-info">
                      {Number(r.selected_expected_richness || r.negative_binomial_expected_richness).toFixed(1)}
                    </TableCell>
                    <TableCell className={`text-xs font-mono text-right ${r.relative_deviation < 0 ? "text-danger" : "text-success"}`}>
                      {formatPercentage(r.relative_deviation)}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-right text-muted-foreground">{r.evidence_score.toFixed(1)}</TableCell>
                    <TableCell className="text-xs font-mono text-right text-muted-foreground">{r.reliability_score.toFixed(1)}</TableCell>
                    <TableCell className="text-xs font-mono font-bold text-right text-accent">{formatPriority(r.priority_score)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Tab 4: Top 100 */}
        <TabsContent value="top100" className="space-y-3">
          <div className="border border-white/[0.08] rounded-2xl overflow-hidden bg-neutral-900/50 backdrop-blur-xl shadow-xl">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Grid Cell</TableHead>
                  <TableHead className="text-right">Observed</TableHead>
                  <TableHead className="text-right">Expected</TableHead>
                  <TableHead className="text-right">Deviation</TableHead>
                  <TableHead className="text-right">Evidence</TableHead>
                  <TableHead className="text-right">Reliability</TableHead>
                  <TableHead className="text-right">Priority</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {top100.map((r, idx) => (
                  <TableRow
                    key={r.eqdcellcode}
                    className="cursor-pointer hover:bg-surface-hover/70"
                    onClick={() => setSelectedCell(r)}
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">#{idx + 1}</TableCell>
                    <TableCell className="font-mono font-medium text-xs text-foreground">{r.eqdcellcode}</TableCell>
                    <TableCell className="text-xs font-mono text-right">{r.species_richness}</TableCell>
                    <TableCell className="text-xs font-mono text-right text-info">
                      {Number(r.selected_expected_richness || r.negative_binomial_expected_richness).toFixed(1)}
                    </TableCell>
                    <TableCell className={`text-xs font-mono text-right ${r.relative_deviation < 0 ? "text-danger" : "text-success"}`}>
                      {formatPercentage(r.relative_deviation)}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-right text-muted-foreground">{r.evidence_score.toFixed(1)}</TableCell>
                    <TableCell className="text-xs font-mono text-right text-muted-foreground">{r.reliability_score.toFixed(1)}</TableCell>
                    <TableCell className="text-xs font-mono font-bold text-right text-accent">{formatPriority(r.priority_score)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Grid Detail Sheet */}
      <GridDetailSheet
        record={selectedCell}
        isOpen={!!selectedCell}
        onClose={() => setSelectedCell(null)}
      />
    </div>
  );
}
