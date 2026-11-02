"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSelectedYear } from "@/components/context/YearContext";
import { Calendar, ChevronDown, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function GlobalYearSelector() {
  const { selectedYear, setSelectedYear, availableYears, isPending } = useSelectedYear();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const getYearDescriptor = (year: number) => {
    switch (year) {
      case 2024:
        return "2,630 screened (Latest)";
      case 2023:
        return "2,406 screened";
      case 2022:
        return "2,152 screened";
      case 2021:
        return "1,865 screened";
      case 2020:
        return "1,553 screened";
      case 2019:
        return "1,316 screened";
      case 2018:
        return "991 screened (Baseline)";
      default:
        return "Valid observation year";
    }
  };

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-2 px-2.5 py-1 text-xs font-mono rounded-lg bg-surface border transition-all duration-200 shadow-sm focus:outline-none focus:ring-1 focus:ring-accent ${
          isPending ? "opacity-70 animate-pulse" : "hover:border-accent/60"
        } ${isOpen ? "border-accent ring-1 ring-accent/30" : "border-border"} text-foreground`}
        title="Global Year Filter — updates all maps, statistics, and species observations"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <Calendar className="h-3.5 w-3.5 text-accent" />
        <span className="text-muted-foreground text-[11px] font-sans font-medium">YEAR:</span>
        <span className="font-bold text-accent">{selectedYear}</span>
        <ChevronDown
          className={`h-3 w-3 text-muted-foreground ml-0.5 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-64 rounded-xl bg-[#13151b] border border-border/80 shadow-2xl z-50 p-1.5 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
          <div className="text-[11px] font-semibold text-muted-foreground px-2.5 py-1.5 uppercase tracking-wider flex items-center justify-between border-b border-border/50 pb-2 mb-1">
            <span>Authoritative Monitoring Years</span>
            <Badge variant="muted" className="text-[10px] font-mono py-0 px-1 bg-surface-raised">
              7 Years
            </Badge>
          </div>

          <div className="space-y-0.5 max-h-64 overflow-y-auto py-1">
            {availableYears.map((yr) => {
              const isSelected = yr === selectedYear;
              return (
                <button
                  key={yr}
                  type="button"
                  onClick={() => {
                    setSelectedYear(yr);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono flex items-center justify-between transition-colors ${
                    isSelected
                      ? "bg-accent/15 text-accent font-bold"
                      : "text-foreground hover:bg-surface-raised"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={isSelected ? "text-accent" : "text-foreground"}>{yr}</span>
                    {yr === 2024 && (
                      <span className="text-[9px] font-sans px-1.5 py-0.5 rounded bg-accent/20 text-accent font-semibold">
                        LATEST
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-sans">
                    <span>{getYearDescriptor(yr)}</span>
                    {isSelected && <Check className="h-3.5 w-3.5 text-accent" />}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="border-t border-border/50 pt-2 px-2 pb-1 text-[10px] text-muted-foreground leading-tight">
            Synchronized globally across Dashboard, Map, Priority Registry, Anomalies, Species, and Grid Details.
          </div>
        </div>
      )}
    </div>
  );
}
