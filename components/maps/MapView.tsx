"use client";

import React, { useState } from "react";
import { MapPoint, OccurrencePoint } from "@/types/biosentinel";
import { formatCoordinates, formatPriority, formatPercentage } from "@/lib/formatting/formatters";
import { Layers, MapPin, ExternalLink, Sparkles } from "lucide-react";

export type MapLayer = "priority" | "anomaly" | "reliability" | "effort" | "trend";

interface MapViewProps {
  points: MapPoint[];
  selectedCell?: string | null;
  onSelectCell?: (cellCode: string) => void;
  speciesPoints?: OccurrencePoint[];
  selectedOccurrence?: OccurrencePoint | null;
  onSelectOccurrence?: (pt: OccurrencePoint) => void;
  selectedYear?: number;
  initialLayer?: MapLayer;
  height?: string;
}

export function MapView({
  points,
  selectedCell,
  onSelectCell,
  speciesPoints = [],
  selectedOccurrence,
  onSelectOccurrence,
  selectedYear = 2024,
  initialLayer = "priority",
  height = "h-[560px]",
}: MapViewProps) {
  const [activeLayer, setActiveLayer] = useState<MapLayer>(initialLayer);
  const [hoveredPoint, setHoveredPoint] = useState<MapPoint | null>(null);
  const [hoveredOccurrence, setHoveredOccurrence] = useState<OccurrencePoint | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // India geographical bounding box
  const minLon = 67.0;
  const maxLon = 98.0;
  const minLat = 7.0;
  const maxLat = 37.5;

  const width = 800;
  const mapHeight = 850;

  // Project lat/lon to SVG coordinate
  const project = (lat: number, lon: number) => {
    const x = ((lon - minLon) / (maxLon - minLon)) * (width - 80) + 40;
    const y = ((maxLat - lat) / (maxLat - minLat)) * (mapHeight - 80) + 40;
    return { x, y };
  };

  // Color mappings based on active layer
  const getColor = (pt: MapPoint): string => {
    switch (activeLayer) {
      case "priority":
        if (pt.priority >= 38.42) return "#ef4444"; // red/rose high priority
        if (pt.priority >= 30.1) return "#f59e0b"; // amber moderate
        return "#10b981"; // emerald low
      case "anomaly":
        if (pt.deviation <= -25) return "#ef4444";
        if (pt.deviation < 0) return "#f59e0b";
        return "#3b82f6";
      case "reliability":
        if (pt.reliability >= 70) return "#10b981";
        if (pt.reliability >= 50) return "#f59e0b";
        return "#ef4444";
      case "effort":
        if (pt.effort >= 300) return "#3b82f6";
        if (pt.effort >= 50) return "#f59e0b";
        return "#6b7280";
      case "trend":
        if (pt.trend === "effort_driven_richness_growth") return "#f59e0b";
        if (pt.trend === "effort_adjusted_stable") return "#3b82f6";
        if (pt.trend === "effort_adjusted_decrease") return "#ef4444";
        if (pt.trend === "effort_adjusted_increase") return "#10b981";
        return "#6b7280";
      default:
        return "#f59e0b";
    }
  };

  return (
    <div className={`relative w-full ${height} bg-[#0c0c10] rounded-xl border border-border overflow-hidden flex flex-col`}>
      {/* Top Toolbar: Layer Selector */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-1.5 bg-card/95 backdrop-blur-sm p-1.5 rounded-lg border border-border shadow-md">
        <div className="flex items-center gap-1 px-2 text-xs font-semibold text-muted-foreground mr-1">
          <Layers className="h-3.5 w-3.5 text-accent" />
          <span>Layer:</span>
        </div>
        {(
          [
            { id: "priority", label: "Priority" },
            { id: "anomaly", label: "Deviation" },
            { id: "reliability", label: "Reliability" },
            { id: "effort", label: "Effort" },
            { id: "trend", label: "Trend" },
          ] as const
        ).map((layer) => (
          <button
            key={layer.id}
            onClick={() => setActiveLayer(layer.id)}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              activeLayer === layer.id
                ? "bg-surface-hover text-foreground font-semibold shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground hover:bg-surface-raised"
            }`}
          >
            {layer.label}
          </button>
        ))}
      </div>

      {/* SVG Canvas Map */}
      <div className="flex-1 w-full h-full relative overflow-hidden flex items-center justify-center">
        <svg
          viewBox={`0 0 ${width} ${mapHeight}`}
          className="w-full h-full max-h-full object-contain"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
          }}
        >
          {/* Subtle Latitude / Longitude Grid lines */}
          {[10, 15, 20, 25, 30, 35].map((lat) => {
            const { y } = project(lat, minLon);
            return (
              <line
                key={`lat-${lat}`}
                x1={0}
                y1={y}
                x2={width}
                y2={y}
                stroke="hsl(var(--border))"
                strokeWidth={0.5}
                strokeDasharray="2 4"
                opacity={0.35}
              />
            );
          })}
          {[70, 75, 80, 85, 90, 95].map((lon) => {
            const { x } = project(minLat, lon);
            return (
              <line
                key={`lon-${lon}`}
                x1={x}
                y1={0}
                x2={x}
                y2={mapHeight}
                stroke="hsl(var(--border))"
                strokeWidth={0.5}
                strokeDasharray="2 4"
                opacity={0.35}
              />
            );
          })}

          {/* Render Screened Grid Cell Centroids */}
          {points.map((pt) => {
            const { x, y } = project(pt.lat, pt.lon);
            const isSelected = selectedCell === pt.cell;
            const isHero = pt.cell === "E076N28AA" || pt.cell === "E078N09BC";
            const color = getColor(pt);
            const radius = isSelected ? 7 : isHero ? 5.5 : pt.priority >= 38.42 ? 4 : 2.5;

            return (
              <circle
                key={pt.cell}
                cx={x}
                cy={y}
                r={radius}
                fill={color}
                stroke={isSelected ? "#ffffff" : isHero ? "#f8f9fa" : "#0c0c10"}
                strokeWidth={isSelected ? 2 : isHero ? 1.5 : 0.5}
                opacity={isSelected ? 1 : 0.85}
                className="cursor-pointer transition-all duration-150 hover:opacity-100 hover:scale-125"
                onMouseEnter={() => {
                  setHoveredPoint(pt);
                  setHoveredOccurrence(null);
                }}
                onMouseLeave={() => setHoveredPoint(null)}
                onClick={() => onSelectCell && onSelectCell(pt.cell)}
              />
            );
          })}

          {/* Render Verified Individual Species Occurrence Points (Exact GPS Coordinates) */}
          {speciesPoints.map((sp, idx) => {
            const { x, y } = project(sp.lat, sp.lon);
            const isSelected = selectedOccurrence?.gbif_id === sp.gbif_id;

            return (
              <g
                key={`sp-${sp.gbif_id}-${idx}`}
                className="cursor-pointer transition-all duration-200"
                onMouseEnter={() => {
                  setHoveredOccurrence(sp);
                  setHoveredPoint(null);
                }}
                onMouseLeave={() => setHoveredOccurrence(null)}
                onClick={() => onSelectOccurrence && onSelectOccurrence(sp)}
              >
                {/* Outer pulsing beacon ring */}
                <circle
                  cx={x}
                  cy={y}
                  r={isSelected ? 11 : 8}
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth={1.5}
                  opacity={0.8}
                  className="animate-pulse"
                />
                {/* Inner glowing diamond/marker */}
                <circle
                  cx={x}
                  cy={y}
                  r={isSelected ? 5 : 3.5}
                  fill="#22d3ee"
                  stroke="#ffffff"
                  strokeWidth={1.5}
                />
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip for Grid Unit */}
        {hoveredPoint && (
          <div
            className="absolute z-20 pointer-events-none bg-card/95 border border-border p-2.5 rounded-lg shadow-xl text-xs space-y-1"
            style={{
              left: `${Math.min(mousePos.x + 12, 600)}px`,
              top: `${Math.min(mousePos.y + 12, 450)}px`,
            }}
          >
            <div className="font-mono font-bold text-foreground flex items-center justify-between gap-4">
              <span>{hoveredPoint.cell}</span>
              <span className="text-[10px] text-muted-foreground">{formatCoordinates(hoveredPoint.lat, hoveredPoint.lon)}</span>
            </div>
            <div className="text-[10px] text-muted-foreground">0.25° Grid Unit Centroid</div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] pt-1 border-t border-border">
              <span className="text-muted-foreground">Priority:</span>
              <span className="font-mono font-semibold text-foreground text-right">{formatPriority(hoveredPoint.priority)}</span>
              <span className="text-muted-foreground">Observed:</span>
              <span className="font-mono text-foreground text-right">{hoveredPoint.observed} sp</span>
              <span className="text-muted-foreground">Deviation:</span>
              <span className={`font-mono text-right ${hoveredPoint.deviation < 0 ? "text-danger" : "text-success"}`}>
                {formatPercentage(hoveredPoint.deviation)}
              </span>
              <span className="text-muted-foreground">Reliability:</span>
              <span className="font-mono text-foreground text-right">{hoveredPoint.reliability.toFixed(1)}</span>
            </div>
            <div className="text-[10px] text-accent pt-0.5">Click to view complete evidence</div>
          </div>
        )}

        {/* Floating Tooltip for Species Individual Occurrence Point */}
        {hoveredOccurrence && (
          <div
            className="absolute z-20 pointer-events-none bg-card/95 border border-cyan-500/60 p-3 rounded-lg shadow-2xl text-xs space-y-1.5 max-w-xs"
            style={{
              left: `${Math.min(mousePos.x + 14, 560)}px`,
              top: `${Math.min(mousePos.y + 14, 420)}px`,
            }}
          >
            <div className="flex items-center gap-1.5 font-bold text-cyan-400 font-mono text-[11px]">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Verified Species Observation</span>
            </div>
            <div className="font-mono text-[11px] text-foreground">
              {formatCoordinates(hoveredOccurrence.lat, hoveredOccurrence.lon)}
            </div>
            <div className="text-[11px] text-muted-foreground space-y-0.5 pt-1 border-t border-border">
              <div>Region: <strong className="text-foreground">{hoveredOccurrence.state}</strong></div>
              <div>Date: <span className="font-mono text-foreground">{hoveredOccurrence.date?.slice(0, 10) || "Recorded"}</span></div>
              <div>Observer: <span className="text-foreground">{hoveredOccurrence.observer}</span></div>
              <div className="text-[10px] text-muted-foreground/80 pt-0.5">Exact field GPS from verified photo observation</div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Legend */}
      <div className="bg-card/95 border-t border-border px-3.5 py-2 text-xs flex flex-wrap items-center justify-between gap-3 text-muted-foreground">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-semibold text-foreground text-[11px] uppercase tracking-wider">Legend:</span>
          {activeLayer === "priority" && (
            <>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-danger inline-block" /> High (≥38.4)</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-warning inline-block" /> Moderate (30.1-38.4)</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-success inline-block" /> Low (&lt;30.1)</div>
            </>
          )}
          {activeLayer === "anomaly" && (
            <>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-danger inline-block" /> &lt; -25% Dev</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-warning inline-block" /> -25% to 0%</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-info inline-block" /> Above Expected</div>
            </>
          )}
          {activeLayer === "reliability" && (
            <>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-success inline-block" /> Adequate (≥70)</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-warning inline-block" /> Moderate (50-70)</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-danger inline-block" /> Limited (&lt;50)</div>
            </>
          )}
          {activeLayer === "trend" && (
            <>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-warning inline-block" /> Effort-Driven</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-info inline-block" /> Adjusted Stable</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-danger inline-block" /> Adjusted Decrease</div>
            </>
          )}

          {/* Spatial representation symbol distinction */}
          <div className="flex items-center gap-3 border-l border-border/70 pl-3">
            <div className="flex items-center gap-1 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-muted-foreground/60 inline-block" />
              <span>0.25° Grid Centroid</span>
            </div>
            {speciesPoints.length > 0 && (
              <div className="flex items-center gap-1 text-[11px] text-cyan-400 font-medium">
                <span className="w-2.5 h-2.5 rounded-full border border-cyan-300 bg-cyan-400 inline-block" />
                <span>Verified Field Observation (Exact GPS)</span>
              </div>
            )}
          </div>
        </div>

        <div className="text-[11px] font-mono">
          {points.length.toLocaleString()} Terrestrial Units Screened ({selectedYear})
        </div>
      </div>
    </div>
  );
}
