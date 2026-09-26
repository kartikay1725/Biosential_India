"use client";

import React, { useState } from "react";
import { getTopPriorityUnits, getTop100Units, getGridRecord } from "@/lib/api/data-service";
import { PriorityBadge, ReliabilityBadge, DiagnosticBadge } from "@/components/biosentinel/StatusBadge";
import { GridDetailSheet } from "@/components/biosentinel/GridDetailSheet";
import { formatCoordinates, formatPriority, formatPercentage, formatSigma } from "@/lib/formatting/formatters";
import { GridYearRecord } from "@/types/biosentinel";
import { Flame, ShieldAlert, Sparkles, Filter, CheckCircle2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PriorityPage() {
  const topPriorityUnits = getTopPriorityUnits(); // 186 units
  const persistentUnits = topPriorityUnits.filter((r) => r.persistence_count >= 2); // 17 units
  const top25 = topPriorityUnits.slice(0, 25);
  const top100 = topPriorityUnits.slice(0, 100);

  const [selectedCell, setSelectedCell] = useState<GridYearRecord | null>(null);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="space-y-1.5 pb-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-danger" />
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            2024 Priority Screening Registry
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Screening units prioritized by decoupled formulation:{" "}
          <code className="text-foreground bg-surface px-1.5 py-0.5 rounded border border-border">
            Priority = Evidence × (Reliability / 100)
          </code>
        </p>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-lg bg-card border border-border">
          <div className="text-xs uppercase text-muted-foreground font-medium">High Priority Units</div>
          <div className="text-2xl font-bold font-mono text-danger mt-1">186</div>
          <div className="text-xs text-muted-foreground mt-0.5">≥ 38.42 (95th percentile)</div>
        </div>
        <div className="p-4 rounded-lg bg-card border border-border">
          <div className="text-xs uppercase text-muted-foreground font-medium">Persistent Candidates</div>
          <div className="text-2xl font-bold font-mono text-warning mt-1">17</div>
          <div className="text-xs text-muted-foreground mt-0.5">≥ 2 consecutive supported years</div>
        </div>
        <div className="p-4 rounded-lg bg-card border border-border">
          <div className="text-xs uppercase text-muted-foreground font-medium">Moderate Priority</div>
          <div className="text-2xl font-bold font-mono text-foreground mt-1">520</div>
          <div className="text-xs text-muted-foreground mt-0.5">30.10 – 38.42 threshold</div>
        </div>
        <div className="p-4 rounded-lg bg-card border border-border">
          <div className="text-xs uppercase text-muted-foreground font-medium">Total Screened</div>
          <div className="text-2xl font-bold font-mono text-foreground mt-1">2,630</div>
          <div className="text-xs text-muted-foreground mt-0.5">Eligible 2024 units</div>
        </div>
      </div>

      {/* Tabbed Priority Subsets */}
      <Tabs defaultValue="all-high" className="space-y-4">
        <TabsList className="bg-surface border border-border">
          <TabsTrigger value="all-high">All 186 High Priority</TabsTrigger>
          <TabsTrigger value="persistent">17 Persistent Candidates</TabsTrigger>
          <TabsTrigger value="top25">Top 25 Priority</TabsTrigger>
          <TabsTrigger value="top100">Top 100 Registry</TabsTrigger>
        </TabsList>

        {/* Tab 1: All 186 Units */}
        <TabsContent value="all-high" className="space-y-3">
          <div className="border border-border rounded-lg overflow-hidden bg-card">
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
          <div className="p-3 bg-surface rounded-lg border border-border text-xs text-muted-foreground">
            Multi-year persistent anomaly candidates have demonstrated statistical departure for 2 or more consecutive supported evaluation years.
          </div>
          <div className="border border-border rounded-lg overflow-hidden bg-card">
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
          <div className="border border-border rounded-lg overflow-hidden bg-card">
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
          <div className="border border-border rounded-lg overflow-hidden bg-card">
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
