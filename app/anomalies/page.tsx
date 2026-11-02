"use client";

import React, { useState, useMemo } from "react";
import { getTop100Units } from "@/lib/api/data-service";
import { useSelectedYear } from "@/components/context/YearContext";
import { PriorityBadge, ReliabilityBadge, DiagnosticBadge } from "@/components/biosentinel/StatusBadge";
import { GridDetailSheet } from "@/components/biosentinel/GridDetailSheet";
import { formatCoordinates, formatPriority, formatPercentage, formatSigma } from "@/lib/formatting/formatters";
import { GridYearRecord } from "@/types/biosentinel";
import { AlertTriangle, Filter, Search } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function AnomaliesPage() {
  const { selectedYear } = useSelectedYear();
  const allUnits = getTop100Units(selectedYear);

  const [search, setSearch] = useState("");
  const [minAgreement, setMinAgreement] = useState<number>(0);
  const [filterDiagnostic, setFilterDiagnostic] = useState<string>("all");
  const [selectedRecord, setSelectedRecord] = useState<GridYearRecord | null>(null);

  const filteredData = useMemo(() => {
    return allUnits.filter((r) => {
      if (search && !r.eqdcellcode.toLowerCase().includes(search.toLowerCase())) return false;
      if (r.method_agreement_count < minAgreement) return false;
      if (filterDiagnostic !== "all" && r.signal_diagnostic !== filterDiagnostic) return false;
      return true;
    });
  }, [allUnits, search, minAgreement, filterDiagnostic]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="space-y-2 pb-5 border-b border-white/[0.08]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-amber-500/20 via-amber-500/10 to-transparent border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Multi-Detector Anomaly Explorer ({selectedYear})
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  CONSENSUS AUDIT
                </span>
              </div>
              <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
                Consensus anomalies for {selectedYear} evaluated across Poisson GLM, Negative Binomial, Baseline IQR, and Isolation Forest detectors.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-neutral-900/60 rounded-2xl border border-white/[0.08] backdrop-blur-xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-lg">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="h-4 w-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Cell ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-9 pr-3 text-xs bg-neutral-900/80 border border-white/[0.08] focus:border-amber-500/50 rounded-xl text-white placeholder:text-neutral-500 focus:outline-none w-48 sm:w-56 transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-neutral-400 font-medium">Min Agreement:</span>
            <select
              value={minAgreement}
              onChange={(e) => setMinAgreement(Number(e.target.value))}
              className="h-9 px-3 text-xs bg-neutral-900/80 border border-white/[0.08] focus:border-amber-500/50 rounded-xl text-neutral-200 focus:outline-none transition-all cursor-pointer"
            >
              <option value={0}>Any Consensus (0+)</option>
              <option value={2}>2+ Detectors</option>
              <option value={3}>3+ Detectors</option>
              <option value={4}>4+ Detectors</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-neutral-400 font-medium">Signal Diagnostic:</span>
            <select
              value={filterDiagnostic}
              onChange={(e) => setFilterDiagnostic(e.target.value)}
              className="h-9 px-3 text-xs bg-neutral-900/80 border border-white/[0.08] focus:border-amber-500/50 rounded-xl text-neutral-200 focus:outline-none transition-all cursor-pointer"
            >
              <option value="all">All Diagnostics</option>
              <option value="robust_multimethod_signal">Multi-Method Signal</option>
              <option value="effort_driven_signal">Effort-Driven Signal</option>
              <option value="expected_observation_pattern">Expected Pattern</option>
            </select>
          </div>
        </div>

        <div className="font-mono text-xs text-neutral-400">
          Showing <span className="text-emerald-400 font-bold">{filteredData.length}</span> units
        </div>
      </div>

      {/* Table */}
      <div className="border border-white/[0.08] rounded-2xl overflow-hidden bg-neutral-900/50 backdrop-blur-xl shadow-xl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Grid ID</TableHead>
              <TableHead className="text-right">Observed</TableHead>
              <TableHead className="text-right">Expected</TableHead>
              <TableHead className="text-right">Effort</TableHead>
              <TableHead className="text-right">Deviation</TableHead>
              <TableHead className="text-right">Poisson Res.</TableHead>
              <TableHead className="text-center">Agreement</TableHead>
              <TableHead className="text-center">Persistence</TableHead>
              <TableHead>Diagnostic State</TableHead>
              <TableHead className="text-right">Priority</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((row) => (
              <TableRow
                key={row.eqdcellcode}
                className="cursor-pointer hover:bg-white/[0.04] transition-colors"
                onClick={() => setSelectedRecord(row)}
              >
                <TableCell className="font-mono font-medium text-xs text-white">
                  {row.eqdcellcode}
                </TableCell>
                <TableCell className="text-xs font-mono text-right text-white">
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
                <TableCell className="text-xs font-mono text-right text-muted-foreground">
                  {formatSigma(row.standardized_residual)}
                </TableCell>
                <TableCell className="text-xs font-mono text-center">
                  <span className="px-2 py-0.5 rounded-full bg-neutral-900/80 border border-white/[0.08] text-neutral-300 text-[11px]">
                    {row.method_agreement_count} / 6
                  </span>
                </TableCell>
                <TableCell className="text-xs font-mono text-center text-foreground">
                  {row.persistence_count} yr
                </TableCell>
                <TableCell>
                  <DiagnosticBadge diagnostic={row.signal_diagnostic} />
                </TableCell>
                <TableCell className="text-xs font-mono font-bold text-right text-accent">
                  {formatPriority(row.priority_score)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Grid Detail Sheet */}
      <GridDetailSheet
        record={selectedRecord}
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
      />
    </div>
  );
}
