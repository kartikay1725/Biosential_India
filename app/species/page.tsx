"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { getSpeciesList, getSpeciesStats } from "@/lib/api/data-service";
import { useSelectedYear } from "@/components/context/YearContext";
import {
  Search,
  Bug,
  Sparkles,
  Database,
  Info,
  MapPin,
  ArrowRight,
  Filter,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { SpeciesCatalogEntry } from "@/types/biosentinel";
import { formatCoordinates } from "@/lib/formatting/formatters";

export default function SpeciesExplorerPage() {
  const { selectedYear } = useSelectedYear();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [activeSpecies, setActiveSpecies] = useState<SpeciesCatalogEntry | null>(null);

  // Sync with URL search if it changes
  useEffect(() => {
    if (initialSearch) {
      setSearchTerm(initialSearch);
    }
  }, [initialSearch]);

  const allSpecies = useMemo(() => getSpeciesList(), []);

  const filteredSpecies = useMemo(() => {
    return allSpecies.filter((s) => {
      if (
        searchTerm &&
        !s.scientific_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !s.accepted_scientific_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !(s.taxonomy.family && s.taxonomy.family.toLowerCase().includes(searchTerm.toLowerCase()))
      ) {
        return false;
      }
      if (selectedClass !== "all" && s.taxonomy.taxonomic_class !== selectedClass) {
        return false;
      }
      return true;
    });
  }, [allSpecies, searchTerm, selectedClass]);

  // Unique taxonomic classes
  const taxonomicClasses = useMemo(() => {
    const set = new Set<string>();
    allSpecies.forEach((s) => {
      if (s.taxonomy.taxonomic_class) set.add(s.taxonomy.taxonomic_class);
    });
    return Array.from(set).sort();
  }, [allSpecies]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="space-y-2 pb-5 border-b border-white/[0.08]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-cyan-500/10 to-transparent border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
              <Bug className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Species Explorer &amp; Taxonomic Registry
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  GBIF × BIOCLIP
                </span>
              </div>
              <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
                Authoritative GBIF occurrence records paired with BioCLIP ViT-B/16 image classification capabilities across 1,106 Indian species.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Protocol distinction banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-cyan-500/5 border border-cyan-500/20 backdrop-blur-xl flex items-start gap-3.5 text-xs text-neutral-300 shadow-lg">
        <Info className="h-4 w-4 shrink-0 text-cyan-400 mt-0.5" />
        <div className="space-y-1">
          <div className="font-semibold text-white">Strict Epistemic Protocol:</div>
          <p className="text-neutral-400 leading-relaxed">
            BioSentinel strictly distinguishes <strong className="text-neutral-200">GBIF Verified Species Occurrences</strong> from <strong className="text-neutral-200">BioCLIP Image Predictions</strong>.
            Occurrence records represent audited biodiversity observations in the field. Model confidence scores apply strictly when photographic observations are evaluated by the vision model.
          </p>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="p-4 bg-neutral-900/60 rounded-2xl border border-white/[0.08] backdrop-blur-xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-lg">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="h-4 w-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search scientific name, family..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-56 sm:w-72 h-9 pl-9 pr-3 text-xs bg-neutral-900/80 border border-white/[0.08] focus:border-cyan-500/50 rounded-xl text-white placeholder:text-neutral-500 focus:outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-neutral-400 font-medium">Taxonomic Class:</span>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="h-9 px-3 text-xs bg-neutral-900/80 border border-white/[0.08] focus:border-cyan-500/50 rounded-xl text-neutral-200 focus:outline-none transition-all cursor-pointer"
            >
              <option value="all">All Classes ({allSpecies.length})</option>
              {taxonomicClasses.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-xs font-mono text-neutral-400">
          Showing <span className="font-bold text-cyan-400">{filteredSpecies.length}</span> of {allSpecies.length} species ({selectedYear} filter active)
        </div>
      </div>

      {/* Species Table */}
      <div className="border border-white/[0.08] rounded-2xl overflow-hidden bg-neutral-900/50 backdrop-blur-xl shadow-xl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Scientific Name</TableHead>
              <TableHead>Class / Family</TableHead>
              <TableHead className="text-right">{selectedYear} Occurrences</TableHead>
              <TableHead className="text-right">Total Historical</TableHead>
              <TableHead className="text-center">Geographic Scope</TableHead>
              <TableHead>Data Provenance</TableHead>
              <TableHead className="text-right">Spatial Exploration</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSpecies.slice(0, 100).map((s) => {
              const yrCount = s.manifest_years_distribution?.[String(selectedYear)] || 0;
              const totalCount =
                s.historical_gbif_totals?.total_occurrences_all_time ||
                s.manifest_verified_records_count ||
                0;

              return (
                <TableRow
                  key={s.scientific_name}
                  className="cursor-pointer hover:bg-surface-hover/70"
                  onClick={() => setActiveSpecies(s)}
                >
                  <TableCell>
                    <div className="font-medium italic text-xs text-foreground">
                      {s.scientific_name}
                    </div>
                    {s.accepted_scientific_name && s.accepted_scientific_name !== s.scientific_name && (
                      <div className="text-[10px] text-muted-foreground">
                        {s.accepted_scientific_name}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <div>{s.taxonomy.taxonomic_class}</div>
                    <div className="text-[10px] opacity-80">{s.taxonomy.family || s.taxonomy.order}</div>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-right font-bold text-accent">
                    {yrCount > 0 ? yrCount.toLocaleString() : "—"}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-right text-foreground">
                    {totalCount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-xs text-center font-mono text-muted-foreground">
                    {s.states_recorded.length > 0 ? `${s.states_recorded.length} states` : "India"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="muted" className="text-[10px] gap-1 font-normal">
                      <Database className="h-3 w-3 text-muted-foreground" />
                      GBIF Verified
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <Link href={`/map?species=${encodeURIComponent(s.scientific_name)}&year=${selectedYear}`}>
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-accent hover:text-accent/80 gap-1">
                        <MapPin className="h-3 w-3" /> Map <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Species Detail Sheet */}
      {activeSpecies && (
        <Sheet open={!!activeSpecies} onOpenChange={(open) => !open && setActiveSpecies(null)}>
          <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto bg-card border-border p-6 space-y-6">
            <SheetHeader className="space-y-1.5 pb-4 border-b border-border">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-surface border border-border text-foreground">
                  Key: {activeSpecies.species_key || "GBIF-SP"}
                </span>
                <Badge variant="success" className="text-[10px] gap-1 font-mono">
                  <Sparkles className="h-3 w-3" /> 1,106 BioCLIP Class
                </Badge>
              </div>
              <SheetTitle className="text-xl font-bold italic tracking-tight text-foreground">
                {activeSpecies.scientific_name}
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground">
                {activeSpecies.accepted_scientific_name}
              </SheetDescription>
            </SheetHeader>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-3 text-center text-xs">
              <div className="p-3 bg-surface rounded-lg border border-border">
                <div className="text-[10px] uppercase text-muted-foreground">{selectedYear} Observations</div>
                <div className="text-xl font-bold font-mono text-accent mt-0.5">
                  {(activeSpecies.manifest_years_distribution?.[String(selectedYear)] || 0).toLocaleString()}
                </div>
                <div className="text-[10px] text-muted-foreground">records</div>
              </div>

              <div className="p-3 bg-surface rounded-lg border border-border">
                <div className="text-[10px] uppercase text-muted-foreground">Historical Dataset Total</div>
                <div className="text-xl font-bold font-mono text-foreground mt-0.5">
                  {(
                    activeSpecies.historical_gbif_totals?.total_occurrences_all_time ||
                    activeSpecies.manifest_verified_records_count ||
                    0
                  ).toLocaleString()}
                </div>
                <div className="text-[10px] text-muted-foreground">occurrence records</div>
              </div>
            </div>

            {/* Complete Taxonomy */}
            <div className="p-4 bg-surface rounded-lg border border-border space-y-2 text-xs">
              <h4 className="font-semibold text-foreground uppercase tracking-wider text-[11px]">
                Taxonomic Classification
              </h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground pt-1 border-t border-border">
                <div>Kingdom: <strong className="text-foreground">{activeSpecies.taxonomy.kingdom}</strong></div>
                <div>Phylum: <strong className="text-foreground">{activeSpecies.taxonomy.phylum || "—"}</strong></div>
                <div>Class: <strong className="text-foreground">{activeSpecies.taxonomy.taxonomic_class}</strong></div>
                <div>Order: <strong className="text-foreground">{activeSpecies.taxonomy.order || "—"}</strong></div>
                <div>Family: <strong className="text-foreground">{activeSpecies.taxonomy.family || "—"}</strong></div>
                <div>Genus: <strong className="text-foreground">{activeSpecies.taxonomy.genus}</strong></div>
              </div>
            </div>

            {/* Verified Field Observations Sample */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-foreground uppercase tracking-wider text-[11px]">
                  Sample Verified Occurrence Points ({activeSpecies.occurrence_points.length})
                </h4>
                <span className="text-[10px] font-mono text-muted-foreground">Exact GPS</span>
              </div>
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {activeSpecies.occurrence_points.map((pt, idx) => (
                  <div key={idx} className="p-2.5 rounded bg-surface border border-border text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-foreground font-semibold">
                        {formatCoordinates(pt.lat, pt.lon)}
                      </span>
                      <span className="text-muted-foreground font-mono text-[11px]">
                        Year {pt.year || "Historical"}
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground flex items-center justify-between">
                      <span>{pt.state} • {pt.observer}</span>
                      {pt.occurrence_url && (
                        <a
                          href={pt.occurrence_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent hover:underline flex items-center gap-1"
                        >
                          Source <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Map Action Link */}
            <div className="pt-2">
              <Link
                href={`/map?species=${encodeURIComponent(activeSpecies.scientific_name)}&year=${selectedYear}`}
                className="w-full inline-block"
              >
                <Button className="w-full text-xs font-semibold h-9 gap-2 bg-accent hover:bg-accent/90 text-accent-foreground">
                  <MapPin className="h-4 w-4" />
                  Explore {activeSpecies.scientific_name} on Map ({selectedYear})
                </Button>
              </Link>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
