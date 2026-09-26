"use client";

import React, { useState } from "react";
import { getSpeciesForGrid } from "@/lib/api/data-service";
import { Search, Bug, Sparkles, Database, Info } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function SpeciesExplorerPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const speciesList = getSpeciesForGrid("E076N28AA", 2024);

  const filtered = speciesList.filter(
    (s) =>
      s.scientific_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.taxonomic_class.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="space-y-1.5 pb-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Bug className="h-5 w-5 text-accent" />
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Species Explorer &amp; Taxonomic Registry
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Verified GBIF taxonomic occurrences paired with BioCLIP image classification capabilities.
        </p>
      </div>

      {/* Protocol distinction banner */}
      <div className="p-4 rounded-lg bg-surface-raised border border-border flex items-start gap-3 text-xs">
        <Info className="h-4 w-4 shrink-0 text-info mt-0.5" />
        <div className="space-y-1">
          <div className="font-semibold text-foreground">Strict Epistemic Protocol:</div>
          <p className="text-muted-foreground leading-relaxed">
            BioSentinel strictly distinguishes <strong>GBIF Verified Species Occurrences</strong> from <strong>BioCLIP Image Predictions</strong>.
            Model confidence scores apply strictly when photographic observations are processed by the vision model. Confidence is never fabricated or back-filled for historical occurrence records.
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search scientific name (e.g. Columba livia, Halcyon)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-xs bg-card border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-border/80"
          />
        </div>
        <div className="text-xs font-mono text-muted-foreground">
          Showing {filtered.length} of {speciesList.length} species in E076N28AA
        </div>
      </div>

      {/* Species Table */}
      <div className="border border-border rounded-lg overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Scientific Name</TableHead>
              <TableHead>Taxonomic Class</TableHead>
              <TableHead className="text-right">Occurrences</TableHead>
              <TableHead>Data Provenance</TableHead>
              <TableHead>BioCLIP Capability</TableHead>
              <TableHead className="text-right">Inference Confidence</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((s, idx) => (
              <TableRow key={idx}>
                <TableCell className="font-medium italic text-xs text-foreground">
                  {s.scientific_name}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {s.taxonomic_class}
                </TableCell>
                <TableCell className="text-xs font-mono text-right text-foreground font-semibold">
                  {s.occurrences}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  <Badge variant="muted" className="text-[10px] gap-1 font-normal">
                    <Database className="h-3 w-3 text-muted-foreground" />
                    {s.data_source}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="success" className="text-[10px] gap-1">
                    <Sparkles className="h-3 w-3 text-success" />
                    In 1,106 Class Model
                  </Badge>
                </TableCell>
                <TableCell className="text-xs font-mono text-right text-muted-foreground/70">
                  {s.bioclip_confidence !== null ? `${(s.bioclip_confidence * 100).toFixed(1)}%` : "— (No image uploaded)"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
