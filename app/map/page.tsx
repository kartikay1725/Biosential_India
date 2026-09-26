"use client";

import React, { useState } from "react";
import { getMapPoints, getTop100Units, getGridRecord } from "@/lib/api/data-service";
import { MapView, MapLayer } from "@/components/maps/MapView";
import { PriorityBadge, ReliabilityBadge, DiagnosticBadge } from "@/components/biosentinel/StatusBadge";
import { PriorityExplanation } from "@/components/biosentinel/PriorityExplanation";
import { GridDetailSheet } from "@/components/biosentinel/GridDetailSheet";
import { formatCoordinates, formatPriority, formatPercentage } from "@/lib/formatting/formatters";
import { GridYearRecord, MapPoint } from "@/types/biosentinel";
import { Search, Filter, Layers, Flame, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MapPage() {
  const allPoints = getMapPoints();
  const top100 = getTop100Units();

  const [selectedCell, setSelectedCell] = useState<string>("E076N28AA");
  const [filterPriority, setFilterPriority] = useState<"all" | "high" | "moderate">("all");
  const [activeLayer, setActiveLayer] = useState<MapLayer>("priority");
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  const selectedRecord = getGridRecord(selectedCell) || top100[0];

  // Filtered points
  const filteredPoints = allPoints.filter((pt) => {
    if (filterPriority === "high" && pt.priority < 38.42) return false;
    if (filterPriority === "moderate" && (pt.priority < 30.10 || pt.priority >= 38.42)) return false;
    if (searchQuery && !pt.cell.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleSelectCell = (cellCode: string) => {
    setSelectedCell(cellCode);
    setMobileSheetOpen(true);
  };

  return (
    <div className="h-[calc(100vh-3.25rem)] flex flex-col overflow-hidden">
      {/* Top Filter Bar */}
      <div className="px-4 py-2.5 bg-card border-b border-border flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter cell ID (e.g. E076)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 pr-3 text-xs bg-surface border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-border/80 w-44 sm:w-56"
            />
          </div>

          <div className="flex items-center gap-1 bg-surface p-1 rounded-md border border-border text-xs">
            <button
              onClick={() => setFilterPriority("all")}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                filterPriority === "all" ? "bg-surface-raised text-foreground font-semibold" : "text-muted-foreground"
              }`}
            >
              All ({allPoints.length})
            </button>
            <button
              onClick={() => setFilterPriority("high")}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                filterPriority === "high" ? "bg-danger/20 text-danger font-semibold" : "text-muted-foreground"
              }`}
            >
              High Priority (186)
            </button>
            <button
              onClick={() => setFilterPriority("moderate")}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                filterPriority === "moderate" ? "bg-warning/20 text-warning font-semibold" : "text-muted-foreground"
              }`}
            >
              Moderate (520)
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-mono text-foreground font-medium">{filteredPoints.length}</span>
          <span>points displayed</span>
        </div>
      </div>

      {/* Main Split Canvas */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left: 65% Map Canvas */}
        <div className="flex-1 lg:w-[65%] h-full p-3 lg:p-4 overflow-hidden flex flex-col">
          <MapView
            points={filteredPoints}
            selectedCell={selectedCell}
            onSelectCell={handleSelectCell}
            initialLayer={activeLayer}
            height="h-full"
          />
        </div>

        {/* Right: 35% Detail & Inspection Panel (Desktop) */}
        <div className="hidden lg:flex lg:w-[35%] border-l border-border bg-card flex-col h-full overflow-hidden">
          <div className="p-4 border-b border-border bg-surface-raised flex items-center justify-between shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-foreground">{selectedRecord.eqdcellcode}</span>
                <PriorityBadge priority={selectedRecord.priority_score} category={selectedRecord.priority_category} />
              </div>
              <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                {formatCoordinates(selectedRecord.latitude, selectedRecord.longitude)} • 2024 Evaluation
              </div>
            </div>
            <ReliabilityBadge score={selectedRecord.reliability_score} />
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <PriorityExplanation record={selectedRecord} />
          </div>
        </div>
      </div>

      {/* Mobile Bottom Sheet for Detail */}
      <GridDetailSheet
        record={selectedRecord}
        isOpen={mobileSheetOpen}
        onClose={() => setMobileSheetOpen(false)}
      />
    </div>
  );
}
