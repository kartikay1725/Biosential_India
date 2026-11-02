"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  getMapPoints,
  getTop100Units,
  getGridRecord,
  getSpeciesStats,
  getSpeciesOccurrences,
} from "@/lib/api/data-service";
import { useSelectedYear } from "@/components/context/YearContext";
import { MapView, MapLayer } from "@/components/maps/MapView";
import { PriorityBadge, ReliabilityBadge } from "@/components/biosentinel/StatusBadge";
import { PriorityExplanation } from "@/components/biosentinel/PriorityExplanation";
import { GridDetailSheet } from "@/components/biosentinel/GridDetailSheet";
import { formatCoordinates } from "@/lib/formatting/formatters";
import { OccurrencePoint } from "@/types/biosentinel";
import { Search, Sparkles, X, ExternalLink, ArrowRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function MapPage() {
  const { selectedYear } = useSelectedYear();
  const searchParams = useSearchParams();
  const router = useRouter();

  const speciesParam = searchParams.get("species") || "";

  const allPoints = getMapPoints(selectedYear);
  const top100 = getTop100Units(selectedYear);

  const [selectedCell, setSelectedCell] = useState<string>("E076N28AA");
  const [filterPriority, setFilterPriority] = useState<"all" | "high" | "moderate">("all");
  const [activeLayer, setActiveLayer] = useState<MapLayer>("priority");
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [selectedOccurrence, setSelectedOccurrence] = useState<OccurrencePoint | null>(null);

  // Species Intelligence overlay
  const speciesStats = speciesParam ? getSpeciesStats(speciesParam, selectedYear) : null;
  const speciesOccurrencePoints = speciesParam ? getSpeciesOccurrences(speciesParam, selectedYear) : [];

  // Update selectedCell if current selection doesn't exist in new year
  useEffect(() => {
    const current = getGridRecord(selectedCell, selectedYear);
    if (!current && top100.length > 0) {
      setSelectedCell(top100[0].eqdcellcode);
    }
  }, [selectedYear, selectedCell, top100]);

  const selectedRecord = getGridRecord(selectedCell, selectedYear) || top100[0];

  // Dynamic priority counts for selected year
  const highCount = allPoints.filter((pt) => pt.priority >= 38.42).length;
  const modCount = allPoints.filter((pt) => pt.priority >= 30.1 && pt.priority < 38.42).length;

  // Filtered points
  const filteredPoints = allPoints.filter((pt) => {
    if (filterPriority === "high" && pt.priority < 38.42) return false;
    if (filterPriority === "moderate" && (pt.priority < 30.1 || pt.priority >= 38.42)) return false;
    if (searchQuery && !pt.cell.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleSelectCell = (cellCode: string) => {
    setSelectedCell(cellCode);
    setSelectedOccurrence(null);
    setMobileSheetOpen(true);
  };

  const handleSelectOccurrence = (pt: OccurrencePoint) => {
    setSelectedOccurrence(pt);
  };

  const handleClearSpecies = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("species");
    router.replace(`/map?${params.toString()}`);
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col overflow-hidden bg-transparent">
      {/* Species Filter Banner (when exploring identified species) */}
      {speciesStats && speciesStats.found && (
        <div className="px-5 py-2.5 bg-gradient-to-r from-cyan-950/60 via-teal-950/40 to-neutral-900/60 border-b border-cyan-500/30 backdrop-blur-xl flex flex-wrap items-center justify-between gap-3 shrink-0 animate-in fade-in-50">
          <div className="flex items-center gap-3 text-xs">
            <span className="h-7 w-7 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-sm shadow-cyan-950/40">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <span className="text-neutral-400 mr-2 font-medium">Species Intelligence Overlay:</span>
              <strong className="text-cyan-300 italic text-sm">{speciesStats.scientificName}</strong>
              <span className="text-neutral-400 text-xs ml-2 font-mono">
                ({speciesOccurrencePoints.length} verified field coordinates in {selectedYear} • {speciesStats.totalOccurrences.toLocaleString()} total historical records)
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/species?search=${encodeURIComponent(speciesStats.scientificName)}&year=${selectedYear}`}>
              <Button variant="ghost" size="sm" className="h-7 text-xs text-cyan-300 hover:text-white hover:bg-cyan-900/30 gap-1 rounded-lg">
                View Species Profile <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearSpecies}
              className="h-7 text-xs border-cyan-500/30 text-cyan-300 hover:bg-cyan-950/50 hover:text-white rounded-lg"
            >
              <X className="h-3 w-3 mr-1" /> Clear Overlay
            </Button>
          </div>
        </div>
      )}

      {/* Top Filter Bar */}
      <div className="px-4 sm:px-6 py-3 bg-[#07080c]/60 border-b border-white/[0.08] backdrop-blur-xl flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="h-3.5 w-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter cell ID (e.g. E076)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 pr-3 text-xs bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:border-emerald-500/50 w-44 sm:w-60 transition-colors"
            />
          </div>

          <div className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/[0.08] text-xs">
            <button
              onClick={() => setFilterPriority("all")}
              className={`px-3 py-1 rounded-lg text-[11px] font-medium transition-all ${
                filterPriority === "all" ? "bg-white/[0.1] text-white font-bold shadow-sm" : "text-neutral-400 hover:text-white"
              }`}
            >
              All ({allPoints.length})
            </button>
            <button
              onClick={() => setFilterPriority("high")}
              className={`px-3 py-1 rounded-lg text-[11px] font-medium transition-all ${
                filterPriority === "high" ? "bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30 shadow-sm" : "text-neutral-400 hover:text-rose-300"
              }`}
            >
              High Priority ({highCount})
            </button>
            <button
              onClick={() => setFilterPriority("moderate")}
              className={`px-3 py-1 rounded-lg text-[11px] font-medium transition-all ${
                filterPriority === "moderate" ? "bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 shadow-sm" : "text-neutral-400 hover:text-amber-300"
              }`}
            >
              Moderate ({modCount})
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-neutral-400">
          <div className="font-mono bg-white/[0.03] px-3 py-1 rounded-xl border border-white/[0.06]">
            <span className="text-white font-bold">{filteredPoints.length}</span> grid cells in <span className="text-emerald-400 font-bold">{selectedYear}</span>
          </div>
          {speciesOccurrencePoints.length > 0 && (
            <div className="text-cyan-400 font-mono bg-cyan-950/30 px-3 py-1 rounded-xl border border-cyan-500/30">
              + <span className="font-bold">{speciesOccurrencePoints.length}</span> verified GPS field points
            </div>
          )}
        </div>
      </div>

      {/* Main Split Canvas */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden p-3 lg:p-4 gap-3 lg:gap-4">
        {/* Left: Map Canvas */}
        <div className="flex-1 lg:w-[65%] h-full rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl flex flex-col bg-neutral-900/40">
          <MapView
            points={filteredPoints}
            selectedCell={selectedCell}
            onSelectCell={handleSelectCell}
            speciesPoints={speciesOccurrencePoints}
            selectedOccurrence={selectedOccurrence}
            onSelectOccurrence={handleSelectOccurrence}
            selectedYear={selectedYear}
            initialLayer={activeLayer}
            height="h-full"
          />
        </div>

        {/* Right: Detail & Inspection Panel (Desktop) */}
        <div className="hidden lg:flex lg:w-[35%] rounded-2xl border border-white/[0.08] bg-neutral-900/60 backdrop-blur-2xl flex-col h-full overflow-hidden shadow-2xl">
          {/* Selected Individual Occurrence Inspection */}
          {selectedOccurrence ? (
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-white/[0.08] bg-cyan-950/30 flex items-center justify-between shrink-0">
                <div className="space-y-1">
                  <Badge variant="outline" className="border-cyan-400/50 text-cyan-300 text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-500/10">
                    Verified Field Observation (Exact GPS)
                  </Badge>
                  <div className="font-mono text-sm font-bold text-white">
                    {formatCoordinates(selectedOccurrence.lat, selectedOccurrence.lon)}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-neutral-400 hover:text-white rounded-lg hover:bg-white/[0.05]"
                  onClick={() => setSelectedOccurrence(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                {selectedOccurrence.image_url && (
                  <div className="rounded-xl border border-white/10 overflow-hidden shadow-lg">
                    <img
                      src={selectedOccurrence.image_url}
                      alt="Verified field photograph"
                      className="w-full h-48 object-cover"
                    />
                  </div>
                )}

                <div className="p-4 bg-white/[0.03] rounded-2xl border border-white/[0.06] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400">Observation Year:</span>
                    <span className="font-mono font-bold text-white">{selectedOccurrence.year || "Historical"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400">Recorded Date:</span>
                    <span className="font-mono text-neutral-200">{selectedOccurrence.date?.slice(0, 10) || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400">State / Region:</span>
                    <span className="text-white font-medium">{selectedOccurrence.state}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400">Observer Attribution:</span>
                    <span className="text-neutral-200">{selectedOccurrence.observer}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400">License:</span>
                    <span className="font-mono text-neutral-400 text-[11px]">{selectedOccurrence.license}</span>
                  </div>
                </div>

                <div className="p-3.5 bg-cyan-500/10 rounded-2xl border border-cyan-500/20 text-[11px] text-cyan-200/90 flex items-start gap-2.5 leading-relaxed">
                  <Info className="h-4 w-4 shrink-0 text-cyan-400 mt-0.5" />
                  <div>
                    <strong>GPS Coordinates Provenance:</strong> This point reflects the exact coordinates recorded during biological field survey. It is not an interpolated centroid.
                  </div>
                </div>

                {selectedOccurrence.occurrence_url && (
                  <a
                    href={selectedOccurrence.occurrence_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline pt-1 font-medium"
                  >
                    <span>View Authoritative Record On Source Portal</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
          ) : selectedRecord ? (
            /* Selected Grid Cell Unit Inspection */
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-white/[0.08] bg-white/[0.02] flex items-center justify-between shrink-0">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-white">{selectedRecord.eqdcellcode}</span>
                    <PriorityBadge priority={selectedRecord.priority_score} category={selectedRecord.priority_category} />
                  </div>
                  <div className="text-[11px] text-neutral-400 font-mono mt-1">
                    {formatCoordinates(selectedRecord.latitude, selectedRecord.longitude)} • {selectedYear} Evaluation
                  </div>
                </div>
                <ReliabilityBadge score={selectedRecord.reliability_score} />
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <PriorityExplanation record={selectedRecord} />
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-neutral-500">
              Select a grid cell or species occurrence point to view detailed evidence.
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Sheet for Detail */}
      {selectedRecord && (
        <GridDetailSheet
          record={selectedRecord}
          isOpen={mobileSheetOpen}
          onClose={() => setMobileSheetOpen(false)}
        />
      )}
    </div>
  );
}
