"use client";

import React, { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { GridYearRecord, SpeciesRecord } from "@/types/biosentinel";
import { PriorityBadge, ReliabilityBadge, DiagnosticBadge } from "./StatusBadge";
import { PriorityExplanation } from "./PriorityExplanation";
import { TrajectoryChart } from "@/components/charts/TrajectoryChart";
import { formatCoordinates, formatPercentage, formatSigma } from "@/lib/formatting/formatters";
import { getCaseStudy, getSpeciesForGrid } from "@/lib/api/data-service";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShieldCheck, Info, Sparkles } from "lucide-react";

interface GridDetailSheetProps {
  record: GridYearRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export function GridDetailSheet({ record, isOpen, onClose }: GridDetailSheetProps) {
  const [trajectory, setTrajectory] = useState<GridYearRecord[]>([]);
  const [species, setSpecies] = useState<SpeciesRecord[]>([]);

  useEffect(() => {
    if (record) {
      const hist = getCaseStudy(record.eqdcellcode);
      if (hist.length > 0) {
        setTrajectory(hist);
      } else {
        setTrajectory([record]);
      }
      setSpecies(getSpeciesForGrid(record.eqdcellcode, record.year));
    }
  }, [record]);

  if (!record) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto bg-[#07080c]/95 border-white/[0.08] backdrop-blur-2xl p-6 sm:p-7 space-y-6">
        <SheetHeader className="space-y-2 pb-4 border-b border-white/[0.08]">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-xl bg-neutral-900/80 border border-white/[0.08] text-white">
              {record.eqdcellcode}
            </span>
            <span className="text-xs text-neutral-400 font-mono">
              Year {record.year} • {formatCoordinates(record.latitude, record.longitude)}
            </span>
          </div>
          <SheetTitle className="text-xl font-bold tracking-tight text-white flex items-center justify-between">
            <span>Grid Unit Intelligence</span>
            <span className="font-mono text-emerald-400 text-lg">
              Priority: {record.priority_score.toFixed(1)}
            </span>
          </SheetTitle>
          <SheetDescription className="text-xs text-neutral-400">
            Observation-aware multi-detector anomaly evaluation and historical baseline divergence.
          </SheetDescription>
        </SheetHeader>

        {/* Hero metrics strip */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 text-center">
          <div className="p-3 rounded-2xl bg-neutral-900/60 border border-white/[0.08] backdrop-blur-xl shadow-md">
            <div className="text-[10px] uppercase text-neutral-400 font-medium">Observed</div>
            <div className="text-lg font-bold font-mono text-white mt-1">{record.species_richness}</div>
            <div className="text-[10px] text-neutral-500">species</div>
          </div>
          <div className="p-3 rounded-2xl bg-neutral-900/60 border border-white/[0.08] backdrop-blur-xl shadow-md">
            <div className="text-[10px] uppercase text-neutral-400 font-medium">Expected</div>
            <div className="text-lg font-bold font-mono text-info mt-1">
              {Number(record.selected_expected_richness || record.negative_binomial_expected_richness).toFixed(1)}
            </div>
            <div className="text-[10px] text-neutral-500">Poisson GLM</div>
          </div>
          <div className="p-3 rounded-2xl bg-neutral-900/60 border border-white/[0.08] backdrop-blur-xl shadow-md">
            <div className="text-[10px] uppercase text-neutral-400 font-medium">Deviation</div>
            <div className={`text-lg font-bold font-mono mt-1 ${record.relative_deviation < 0 ? "text-danger" : "text-success"}`}>
              {formatPercentage(record.relative_deviation)}
            </div>
            <div className="text-[10px] text-neutral-500">{formatSigma(record.standardized_residual)}</div>
          </div>
          <div className="p-3 rounded-2xl bg-neutral-900/60 border border-white/[0.08] backdrop-blur-xl shadow-md">
            <div className="text-[10px] uppercase text-neutral-400 font-medium">Effort</div>
            <div className="text-lg font-bold font-mono text-white mt-1">{record.total_occurrences}</div>
            <div className="text-[10px] text-neutral-500">records</div>
          </div>
        </div>

        {/* Tabbed Detail Sections */}
        <Tabs defaultValue="evidence" className="w-full">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="evidence">Evidence & Why</TabsTrigger>
            <TabsTrigger value="trajectory">Historical Trajectory</TabsTrigger>
            <TabsTrigger value="species">Observed Species ({species.length})</TabsTrigger>
          </TabsList>

          {/* Tab 1: Why Flagged & Evidence */}
          <TabsContent value="evidence" className="space-y-4 pt-3">
            <PriorityExplanation record={record} />
          </TabsContent>

          {/* Tab 2: Temporal Trajectory */}
          <TabsContent value="trajectory" className="space-y-4 pt-3">
            <div className="p-5 bg-neutral-900/60 rounded-2xl border border-white/[0.08] backdrop-blur-xl space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Multi-Year Trajectory</h4>
                  <p className="text-[11px] text-neutral-400">Observed richness vs model expected conditional on effort</p>
                </div>
                <span className="text-xs font-mono text-neutral-400">{trajectory.length} observation years</span>
              </div>
              <TrajectoryChart records={trajectory} />
            </div>

            <div className="p-4 bg-neutral-900/60 rounded-2xl border border-white/[0.08] backdrop-blur-xl text-xs space-y-1.5 shadow-md">
              <div className="font-semibold text-white">Dual-Slope Classification:</div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-emerald-400 font-medium">{record.effort_adjusted_trend}</span>
                <span className="text-neutral-400">• Raw slope: {record.temporal_slope?.toFixed(2) || "—"} sp/yr</span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                BioSentinel decouples observation effort slopes from biological trends. 
                Even when raw richness slopes trend upward, units driven solely by observer influx are designated as effort-driven growth.
              </p>
            </div>
          </TabsContent>

          {/* Tab 3: Observed Species List */}
          <TabsContent value="species" className="space-y-3 pt-3">
            <div className="flex items-center justify-between text-xs text-neutral-400">
              <span>GBIF Verified Occurrences</span>
              <span className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono">
                <Sparkles className="h-3 w-3" /> BioCLIP Evaluated (1,106 classes)
              </span>
            </div>
            <div className="border border-white/[0.08] rounded-2xl overflow-hidden max-h-96 overflow-y-auto bg-neutral-900/50 backdrop-blur-xl">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Scientific Name</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead className="text-right">Records</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {species.map((s, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium italic text-xs text-white">{s.scientific_name}</TableCell>
                      <TableCell className="text-xs text-neutral-400">{s.taxonomic_class}</TableCell>
                      <TableCell className="font-mono text-xs text-right text-emerald-400">{s.occurrences}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="text-[10px] text-neutral-500">
              *Historical records from GBIF represent verified occurrences. BioCLIP model confidence applies strictly when new image submissions are evaluated.
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
