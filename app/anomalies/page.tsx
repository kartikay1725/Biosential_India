"use client";

import React, { useState, useMemo } from "react";
import { getTop100Units } from "@/lib/api/data-service";
import { PriorityBadge, ReliabilityBadge, DiagnosticBadge } from "@/components/biosentinel/StatusBadge";
import { GridDetailSheet } from "@/components/biosentinel/GridDetailSheet";
import { formatCoordinates, formatPriority, formatPercentage, formatSigma } from "@/lib/formatting/formatters";
import { GridYearRecord } from "@/types/biosentinel";
import { AlertTriangle, Filter, Search } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function AnomaliesPage() {
  const allUnits = getTop100Units();

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
      <div className="space-y-1.5 pb-4 border-b border-border">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-warning" />
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Multi-Detector Anomaly Explorer
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Consensus anomalies evaluated across Poisson GLM, Negative Binomial, Baseline IQR, and Isolation Forest detectors.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="p-3.5 bg-card rounded-lg border border-border flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Cell ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 pr-3 text-xs bg-surface border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none w-44"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Min Agreement:</span>
            <select
              value={minAgreement}
              onChange={(e) => setMinAgreement(Number(e.target.value))}
              className="h-8 px-2 text-xs bg-surface border border-border rounded-md text-foreground focus:outline-none"
            >
              <option value={0}>Any Consensus (0+)</option>
              <option value={2}>2+ Detectors</option>
              <option value={3}>3+ Detectors</option>
              <option value={4}>4+ Detectors</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Signal Diagnostic:</span>
            <select
              value={filterDiagnostic}
              onChange={(e) => setFilterDiagnostic(e.target.value)}
              className="h-8 px-2 text-xs bg-surface border border-border rounded-md text-foreground focus:outline-none"
            >
              <option value="all">All Diagnostics</option>
              <option value="robust_multimethod_signal">Multi-Method Signal</option>
              <option value="effort_driven_signal">Effort-Driven Signal</option>
              <option value="expected_observation_pattern">Expected Pattern</option>
            </select>
          </div>
        </div>

        <div className="font-mono text-muted-foreground">
          Showing <span className="text-foreground font-semibold">{filteredData.length}</span> units
        </div>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden bg-card">
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
                className="cursor-pointer hover:bg-surface-hover/70"
                onClick={() => setSelectedRecord(row)}
              >
                <TableCell className="font-mono font-medium text-xs text-foreground">
                  {row.eqdcellcode}
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
                <TableCell className="text-xs font-mono text-right text-muted-foreground">
                  {formatSigma(row.standardized_residual)}
                </TableCell>
                <TableCell className="text-xs font-mono text-center">
                  <span className="px-1.5 py-0.5 rounded bg-surface border border-border">
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
