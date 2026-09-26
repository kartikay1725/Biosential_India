"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { Flame, AlertTriangle, MapPin, Sparkles, BookOpen, Bug } from "lucide-react";
import { searchGrids } from "@/lib/api/data-service";

export function CommandSearch({
  open,
  onOpenChange,
  onSelectGrid,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectGrid?: (cellCode: string) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [gridResults, setGridResults] = useState<Array<{ cell: string; priority: number; category: string }>>([]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (query.trim().length > 1) {
      setGridResults(searchGrids(query));
    } else {
      setGridResults([]);
    }
  }, [query]);

  const handleSelectNav = (path: string) => {
    onOpenChange(false);
    router.push(path);
  };

  const handleSelectCell = (cellCode: string) => {
    onOpenChange(false);
    if (onSelectGrid) {
      onSelectGrid(cellCode);
    } else {
      router.push(`/map?cell=${cellCode}`);
    }
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Type a command, grid ID (e.g. E076N28AA), or search term..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>No results found for &quot;{query}&quot;</CommandEmpty>

        {gridResults.length > 0 && (
          <CommandGroup heading="Matching Grid Cells">
            {gridResults.map((r) => (
              <CommandItem
                key={r.cell}
                onSelect={() => handleSelectCell(r.cell)}
                className="flex items-center justify-between text-xs cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-accent" />
                  <span className="font-mono font-medium">{r.cell}</span>
                </div>
                <span className="font-mono text-muted-foreground text-[11px]">
                  Priority: {r.priority.toFixed(1)}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandGroup heading="Key Case Studies">
          <CommandItem onSelect={() => handleSelectCell("E076N28AA")} className="text-xs cursor-pointer">
            <Flame className="mr-2 h-3.5 w-3.5 text-danger" />
            <span className="font-mono font-bold mr-2">E076N28AA</span>
            <span className="text-muted-foreground">Primary Multi-Signal Anomaly (Priority 53.06)</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelectCell("E078N09BC")} className="text-xs cursor-pointer">
            <AlertTriangle className="mr-2 h-3.5 w-3.5 text-warning" />
            <span className="font-mono font-bold mr-2">E078N09BC</span>
            <span className="text-muted-foreground">Effort-Driven Sampling Collapse Diagnostic</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => handleSelectNav("/")} className="text-xs cursor-pointer">
            <MapPin className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
            <span>Dashboard Overview</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelectNav("/map")} className="text-xs cursor-pointer">
            <MapPin className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
            <span>Biodiversity Map (2,630 Cells)</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelectNav("/priority")} className="text-xs cursor-pointer">
            <Flame className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
            <span>2024 Screening Priorities</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelectNav("/identify")} className="text-xs cursor-pointer">
            <Sparkles className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
            <span>BioCLIP Species Identification</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelectNav("/methodology")} className="text-xs cursor-pointer">
            <BookOpen className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
            <span>Methodology & Mathematical Architecture</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
