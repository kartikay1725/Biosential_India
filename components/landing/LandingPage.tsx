"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Shield,
  Layers,
  Database,
  Grid,
  AlertTriangle,
  Flame,
  Sparkles,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Compass,
  CheckCircle2,
  ExternalLink,
  Cpu,
  Workflow,
  MapPin,
  ChevronDown,
  Activity,
  FileCode,
  Terminal,
  Zap,
  Info,
} from "lucide-react";
import { SmoothScrollProvider } from "@/components/landing/SmoothScrollProvider";
import {
  getSystemSummary,
  getAnnualSummary,
  getMapPoints,
  getTop100Units,
  getTrendSummary,
  getGridRecord,
} from "@/lib/api/data-service";
import { useSelectedYear } from "@/components/context/YearContext";
import { MetricCard } from "@/components/biosentinel/MetricCard";
import { PriorityBadge, ReliabilityBadge, DiagnosticBadge } from "@/components/biosentinel/StatusBadge";
import { MapView } from "@/components/maps/MapView";
import { DualSlopeBarChart } from "@/components/charts/DualSlopeBarChart";
import { EffortRichnessChart } from "@/components/charts/EffortRichnessChart";
import { GridDetailSheet } from "@/components/biosentinel/GridDetailSheet";
import { GlobalYearSelector } from "@/components/biosentinel/GlobalYearSelector";
import { formatNumber, formatPercentage, formatCoordinates } from "@/lib/formatting/formatters";
import { GridYearRecord } from "@/types/biosentinel";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export function LandingPage() {
  const { selectedYear } = useSelectedYear();
  const summary = getSystemSummary(selectedYear);
  const annual = getAnnualSummary(selectedYear);
  const mapPoints = getMapPoints(selectedYear);
  const top100 = getTop100Units(selectedYear);
  const trendSummary = getTrendSummary();

  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const [detailRecord, setDetailRecord] = useState<GridYearRecord | null>(null);

  const handleSelectCell = (cellCode: string) => {
    setSelectedCell(cellCode);
    const rec = getGridRecord(cellCode, selectedYear);
    if (rec) setDetailRecord(rec);
  };

  const scrollToConsole = () => {
    const el = document.getElementById("biosentinel-console");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <SmoothScrollProvider>
      <div className="min-h-screen bg-[#07080c] text-foreground selection:bg-accent/30 selection:text-white font-sans overflow-x-hidden">
        {/* Ambient Glowing Background Orbs */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute -top-40 left-1/4 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px] animate-glow-pulse" />
          <div className="absolute top-[35%] -right-20 w-[550px] h-[550px] bg-amber-500/10 rounded-full blur-[150px] animate-float-slow" />
          <div className="absolute bottom-20 left-10 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[140px] animate-float-reverse" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        </div>

        {/* =========================================================================
            TOP NAVIGATION BAR
           ========================================================================= */}
        <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-[#07080c]/85 border-b border-white/[0.08] transition-all">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            {/* Brand Logo */}
            <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-400 via-teal-500 to-amber-500 p-[1px] shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-300">
                <div className="h-full w-full bg-[#0b0d13] rounded-[11px] flex items-center justify-center">
                  <Shield className="h-4.5 w-4.5 text-emerald-400" />
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-bold tracking-tight text-base text-white font-mono">
                    BioSentinel
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/30 font-semibold">
                    INDIA
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground/80 tracking-wide font-sans">
                  Biodiversity Intelligence System
                </span>
              </div>
            </div>

            {/* Center Navigation Links */}
            <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-neutral-300">
              <a href="#hero" className="hover:text-emerald-400 transition-colors">
                Overview
              </a>
              <a href="#biosentinel-console" className="hover:text-emerald-400 transition-colors flex items-center gap-1">
                <span>Live Console</span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </a>
              <a href="#dual-slope" className="hover:text-emerald-400 transition-colors">
                Dual-Slope Science
              </a>
              <a href="#bioclip" className="hover:text-emerald-400 transition-colors">
                BioCLIP AI
              </a>
            </nav>

            {/* Right Action: Enter BioSentinel India Button */}
            <div className="flex items-center gap-3">
              <Link href="/dashboard">
                <button
                  type="button"
                  id="enter-biosentinel-nav-btn"
                  className="relative inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-500 shadow-lg shadow-emerald-950/40 hover:shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 border border-white/20"
                >
                  <span>Enter BioSentinel India</span>
                  <ChevronDown className="h-3.5 w-3.5 animate-bounce" />
                </button>
              </Link>
            </div>
          </div>
        </header>

        {/* =========================================================================
            SECTION 1: HERO SECTION
           ========================================================================= */}
        <section id="hero" className="relative z-10 pt-16 pb-20 lg:pt-24 lg:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="flex flex-col items-center text-center space-y-8">
            {/* Top Pill Badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-xs font-mono text-emerald-300 backdrop-blur-md shadow-inner animate-in fade-in duration-500">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span>NATIONAL ECOLOGICAL INTELLIGENCE PLATFORM • 2018–2024</span>
              <span className="text-white/40">•</span>
              <span className="text-amber-300 font-semibold">12,913 EVALUATED UNITS</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-5xl leading-[1.12]">
              Observation-Aware{" "}
              <span className="shimmer-text">Biodiversity Intelligence</span>{" "}
              &amp; Anomaly Screening
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg lg:text-xl text-neutral-300 max-w-3xl leading-relaxed font-normal">
              Resolving the critical citizen-science illusion: distinguishing genuine biological loss
              from volunteer observation explosions across <strong>12,913 terrestrial grid-year units</strong> in India
              using dual-slope Poisson baselines and BioCLIP vision-language inference.
            </p>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link href="/dashboard">
                <button
                  type="button"
                  id="enter-biosentinel-hero-btn"
                  className="group inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-base font-bold text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500 shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 border border-white/20"
                >
                  <span>Enter BioSentinel India</span>
                  <ChevronDown className="h-4 w-4 group-hover:translate-y-1 transition-transform" />
                </button>
              </Link>

              <Link
                href="/identify"
                className="inline-flex items-center gap-2 px-6 py-4 rounded-2xl text-sm font-semibold text-neutral-200 bg-white/[0.05] hover:bg-white/[0.09] border border-white/10 hover:border-emerald-500/40 transition-all duration-200 backdrop-blur-md hover:scale-[1.02]"
              >
                <Sparkles className="h-4 w-4 text-emerald-400" />
                <span>AI Species ID (BioCLIP)</span>
              </Link>

              <Link
                href="/map"
                className="inline-flex items-center gap-2 px-6 py-4 rounded-2xl text-sm font-semibold text-neutral-200 bg-white/[0.05] hover:bg-white/[0.09] border border-white/10 hover:border-amber-500/40 transition-all duration-200 backdrop-blur-md hover:scale-[1.02]"
              >
                <Compass className="h-4 w-4 text-amber-400" />
                <span>Interactive GIS Map</span>
              </Link>
            </div>

            {/* Verified Research Ticker Ribbon */}
            <div className="w-full pt-10">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 p-4 rounded-3xl bg-neutral-900/60 border border-white/[0.08] backdrop-blur-xl shadow-2xl">
                <div className="p-3 text-left border-r border-white/[0.06] last:border-0">
                  <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">12,913</div>
                  <div className="text-[11px] text-neutral-400 font-medium">Grid × Year Units</div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">2018–2024 series</div>
                </div>

                <div className="p-3 text-left border-r border-white/[0.06] last:border-0">
                  <div className="text-xl sm:text-2xl font-bold font-mono text-white">2,773</div>
                  <div className="text-[11px] text-neutral-400 font-medium">Terrestrial Cells</div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">0.25° EQDGC grid</div>
                </div>

                <div className="p-3 text-left border-r border-white/[0.06] last:border-0">
                  <div className="text-xl sm:text-2xl font-bold font-mono text-amber-400">1,106</div>
                  <div className="text-[11px] text-neutral-400 font-medium">BioCLIP Species</div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">ViT-B/16 supervised</div>
                </div>

                <div className="p-3 text-left border-r border-white/[0.06] last:border-0">
                  <div className="text-xl sm:text-2xl font-bold font-mono text-cyan-400">92.87%</div>
                  <div className="text-[11px] text-neutral-400 font-medium">Top-5 Accuracy</div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">78.94% Macro F1</div>
                </div>

                <div className="p-3 text-left border-r border-white/[0.06] last:border-0">
                  <div className="text-xl sm:text-2xl font-bold font-mono text-teal-300">31.72</div>
                  <div className="text-[11px] text-neutral-400 font-medium">Poisson GLM MAE</div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">Primary baseline fit</div>
                </div>

                <div className="p-3 text-left">
                  <div className="text-xl sm:text-2xl font-bold font-mono text-rose-400">186</div>
                  <div className="text-[11px] text-neutral-400 font-medium">High Priority 2024</div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">≥95th percentile</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 2: LIVE INTERACTIVE CONSOLE (EMBEDDED DASHBOARD)
           ========================================================================= */}
        <section id="biosentinel-console" className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/[0.08]">
          <div className="p-6 sm:p-8 rounded-3xl bg-neutral-900/70 border border-emerald-500/30 backdrop-blur-2xl shadow-2xl space-y-6">
            {/* Console Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                    <span>BioSentinel India Surveillance Console</span>
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-neutral-400 mt-1">
                  Observation-aware biodiversity intelligence, historical baselines, and decoupled anomaly screening
                </p>
              </div>

              {/* Console Global Year Selector */}
              <div className="flex items-center gap-3">
                <div className="text-xs font-mono text-neutral-400 hidden sm:block">
                  ACTIVE EVALUATION YEAR:
                </div>
                <GlobalYearSelector />
                <Link href={`/map?year=${selectedYear}`}>
                  <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 border-white/20 bg-white/[0.05] hover:bg-white/10 text-white">
                    Full Map View
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Row 1: Primary KPI Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <MetricCard
                label="Grid × Year Units"
                value={formatNumber(summary.dataset_dimensions.total_grid_year_units)}
                subtext="2018 – 2024 monitoring"
                icon={<Database className="h-4 w-4" />}
              />
              <MetricCard
                label="Terrestrial Cells"
                value={formatNumber(summary.dataset_dimensions.unique_grid_cells)}
                subtext="0.25° EQDGC grid"
                icon={<Grid className="h-4 w-4" />}
              />
              <MetricCard
                label={`${selectedYear} Screened Units`}
                value={formatNumber(annual.screened_units)}
                subtext="Baseline eligible units"
                icon={<Layers className="h-4 w-4 text-accent" />}
              />
              <MetricCard
                label={`High Priority (${selectedYear})`}
                value={annual.high_screening_priority}
                subtext="≥ 95th percentile"
                subtextTone="danger"
                icon={<Flame className="h-4 w-4 text-danger" />}
              />
              <MetricCard
                label="Persistent Candidates"
                value={annual.persistent_high_priority}
                subtext="≥ 2 consecutive years"
                subtextTone="warning"
                icon={<AlertTriangle className="h-4 w-4 text-warning" />}
              />
            </div>

            {/* Row 2: Locked BioCLIP Intelligence Band */}
            <div className="bg-neutral-800/40 border border-white/[0.08] p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-xl bg-accent/20 border border-accent/40 flex items-center justify-center text-accent">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-foreground flex items-center gap-2">
                    <span>BioCLIP Species Identification Layer</span>
                    <span className="font-mono text-[10px] bg-surface px-1.5 py-0.5 rounded border border-border text-emerald-400">LOCKED BENCHMARK</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">ViT-B/16 partial fine-tuning across 1,106 Indian species</div>
                </div>
              </div>

              <div className="flex items-center gap-6 font-mono text-xs">
                <div>
                  <span className="text-muted-foreground mr-1.5 text-[11px]">Top-1:</span>
                  <span className="font-bold text-foreground">78.94%</span>
                </div>
                <div>
                  <span className="text-muted-foreground mr-1.5 text-[11px]">Top-5:</span>
                  <span className="font-bold text-foreground">92.87%</span>
                </div>
                <div>
                  <span className="text-muted-foreground mr-1.5 text-[11px]">Macro F1:</span>
                  <span className="font-bold text-foreground">78.27%</span>
                </div>
                <div>
                  <span className="text-muted-foreground mr-1.5 text-[11px]">Poisson MAE:</span>
                  <span className="font-bold text-info">31.72</span>
                </div>
              </div>
            </div>

            {/* Row 3: Map + Summary Findings Side-by-Side */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left: India Screening Overview Map (7 cols) */}
              <div className="lg:col-span-7 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      India Screening Overview ({selectedYear})
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Spatial distribution of {formatNumber(annual.screened_units)} screened grid cells
                    </p>
                  </div>
                  <span className="text-[11px] text-muted-foreground font-mono">Click a point for evidence</span>
                </div>
                <MapView
                  points={mapPoints}
                  selectedCell={selectedCell}
                  onSelectCell={handleSelectCell}
                  height="h-[460px]"
                />
              </div>

              {/* Right: Featured Case Studies (5 cols) */}
              <div className="lg:col-span-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">Featured Analytical Case Studies</h3>
                  <span className="text-xs text-muted-foreground">Audited Monitoring Units</span>
                </div>

                {/* Hero Case Study 1: E076N28AA */}
                <div
                  onClick={() => handleSelectCell("E076N28AA")}
                  className="p-4 bg-card border border-border hover:border-danger/60 rounded-xl cursor-pointer transition-all space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-surface border border-border text-foreground">
                        E076N28AA
                      </span>
                      <span className="text-[11px] text-muted-foreground">Haryana, India</span>
                    </div>
                    <PriorityBadge priority={53.06} category="high screening priority" />
                  </div>
                  <p className="text-xs text-foreground/90 leading-relaxed">
                    <strong>Multi-Signal Anomaly:</strong> 67 species observed vs 89.1 expected (-24.8% deviation, -2.14 residual). Supported by 354 occurrences and 2-year temporal persistence.
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border">
                    <span>Evidence: 73.12 • Reliability: 72.57</span>
                    <span className="text-accent font-medium">Inspect Dossier →</span>
                  </div>
                </div>

                {/* Hero Case Study 2: E078N09BC */}
                <div
                  onClick={() => handleSelectCell("E078N09BC")}
                  className="p-4 bg-card border border-border hover:border-warning/60 rounded-xl cursor-pointer transition-all space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-surface border border-border text-foreground">
                        E078N09BC
                      </span>
                      <span className="text-[11px] text-muted-foreground">Tamil Nadu, India</span>
                    </div>
                    <DiagnosticBadge diagnostic="effort_driven_signal" />
                  </div>
                  <p className="text-xs text-foreground/90 leading-relaxed">
                    <strong>Sampling Artifact Warning:</strong> Apparent drop from 83 to 21 species.
                    BioSentinel accurately suppresses this false alarm due to a severe <span className="font-mono text-warning">-90.0% effort collapse</span> (331 → 33 records).
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border">
                    <span>Diagnostic: effort_driven_signal</span>
                    <span className="text-accent font-medium">Inspect Warning →</span>
                  </div>
                </div>

                {/* Analytical principles note */}
                <div className="p-3 bg-surface rounded-xl border border-border text-xs text-muted-foreground space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-foreground text-[11px]">
                    <Info className="h-3.5 w-3.5 text-info" />
                    Scientific Screening Mandate
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    BioSentinel prioritizes grid units based on conditional departure from historical expectations. High scores flag locations for ecological investigation, not proof of extinction.
                  </p>
                </div>
              </div>
            </div>

            {/* Row 4: Two Key Scientific Visualizations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
              <div className="p-4 bg-card border border-border rounded-2xl space-y-3">
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Dual-Slope Temporal Trend Resolution</h4>
                  <p className="text-xs text-muted-foreground">
                    61.1% of apparent raw richness growth is resolved as effort-driven growth rather than ecological recovery
                  </p>
                </div>
                <DualSlopeBarChart data={trendSummary} />
              </div>

              <div className="p-4 bg-card border border-border rounded-2xl space-y-3">
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Observation Effort vs Species Richness</h4>
                  <p className="text-xs text-muted-foreground">
                    Logarithmic scaling ensures volunteer submission surges do not distort biological baselines
                  </p>
                </div>
                <EffortRichnessChart />
              </div>
            </div>

            {/* Row 5: Top Priority Locations Table */}
            <div className="p-4 bg-card border border-border rounded-2xl space-y-3 pt-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    {selectedYear} High Screening Priority Units (Top 100)
                  </h4>
                  <p className="text-xs text-muted-foreground">Ranked by decoupled priority score = Evidence × (Reliability / 100)</p>
                </div>
                <Link href={`/priority?year=${selectedYear}`}>
                  <Button variant="outline" size="sm" className="h-7 text-xs border-white/20">
                    View Registry Page ({annual.high_screening_priority} Units)
                  </Button>
                </Link>
              </div>

              <div className="border border-border rounded-xl overflow-hidden max-h-80 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Grid ID</TableHead>
                      <TableHead>Centroid</TableHead>
                      <TableHead className="text-right">Observed</TableHead>
                      <TableHead className="text-right">Expected</TableHead>
                      <TableHead className="text-right">Effort</TableHead>
                      <TableHead className="text-right">Deviation</TableHead>
                      <TableHead className="text-center">Persistence</TableHead>
                      <TableHead className="text-center">Agreement</TableHead>
                      <TableHead className="text-right">Reliability</TableHead>
                      <TableHead className="text-right">Priority</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {top100.slice(0, 20).map((r) => (
                      <TableRow
                        key={r.eqdcellcode}
                        className="cursor-pointer hover:bg-surface-hover/70"
                        onClick={() => handleSelectCell(r.eqdcellcode)}
                      >
                        <TableCell className="font-mono font-medium text-xs text-foreground">
                          {r.eqdcellcode}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">
                          {formatCoordinates(r.latitude, r.longitude)}
                        </TableCell>
                        <TableCell className="text-xs font-mono text-right text-foreground font-semibold">
                          {r.species_richness}
                        </TableCell>
                        <TableCell className="text-xs font-mono text-right text-muted-foreground">
                          {Number(r.selected_expected_richness || r.negative_binomial_expected_richness).toFixed(1)}
                        </TableCell>
                        <TableCell className="text-xs font-mono text-right text-muted-foreground">
                          {formatNumber(r.total_occurrences)}
                        </TableCell>
                        <TableCell
                          className={`text-xs font-mono text-right ${r.relative_deviation < 0 ? "text-danger font-semibold" : "text-success font-semibold"
                            }`}
                        >
                          {formatPercentage(r.relative_deviation)}
                        </TableCell>
                        <TableCell className="text-xs font-mono text-center text-foreground">
                          {r.persistence_count > 0 ? `${r.persistence_count} yr` : "—"}
                        </TableCell>
                        <TableCell className="text-xs font-mono text-center text-foreground">
                          {r.method_agreement_count}/4
                        </TableCell>
                        <TableCell className="text-xs font-mono text-right">
                          <ReliabilityBadge score={r.reliability_score} />
                        </TableCell>
                        <TableCell className="text-xs font-mono text-right">
                          <PriorityBadge priority={r.priority_score} category={r.priority_category} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 3: THE DUAL-SLOPE SCIENTIFIC BREAKTHROUGH
           ========================================================================= */}
        <section id="dual-slope" className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/[0.08]">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-mono border border-emerald-500/20">
              <Activity className="h-3.5 w-3.5" />
              THE CORE SCIENTIFIC METHODOLOGY
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Why Naive Biodiversity Statistics Mislead
            </h2>
            <p className="text-neutral-300 text-sm sm:text-base leading-relaxed">
              In citizen-science platforms, volunteer submissions multiply exponentially.
              A naive analysis interprets more photos as a "biological recovery." BioSentinel decomposes
              apparent growth into observation effort versus true biological state.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-neutral-900/60 border border-red-500/20 hover:border-red-500/40 transition-all duration-300 space-y-4">
              <div className="h-10 w-10 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-400 border border-red-500/20">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-white">1. Apparent Raw Richness</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Raw slope indicates that 41.8% of monitored cells appear to be gaining species.
                Standard frameworks stop here, falsely declaring ecological recovery across the subcontinent.
              </p>
              <div className="pt-2 border-t border-white/[0.06] text-[11px] font-mono text-red-400">
                Status: Unadjusted Sampling Artifact
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-neutral-900/60 border border-amber-500/20 hover:border-amber-500/40 transition-all duration-300 space-y-4">
              <div className="h-10 w-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
                <Database className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-white">2. Volunteer Sampling Explosion</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Log-effort trajectories reveal that urban photo submissions surged over 240%,
                while remote ecological corridors suffered severe observation abandonment.
              </p>
              <div className="pt-2 border-t border-white/[0.06] text-[11px] font-mono text-amber-400">
                Status: Logarithmic Effort Covariate
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-neutral-900/60 border border-emerald-500/30 hover:border-emerald-500/60 transition-all duration-300 space-y-4">
              <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-white">3. Effort-Adjusted Truth</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                BioSentinel proves that 61.1% of apparent raw richness growth is resolved as effort-driven growth
                rather than biological recovery (adjusted slope non-positive).
              </p>
              <div className="pt-2 border-t border-white/[0.06] text-[11px] font-mono text-emerald-400 font-semibold">
                Status: Scientifically Verified Signal
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 4: BIOCLIP VISION-LANGUAGE AI & OCCURRENCE LINKING
           ========================================================================= */}
        <section id="bioclip" className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/[0.08]">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-mono border border-amber-500/20">
              <Sparkles className="h-3.5 w-3.5" />
              SPECIES INTELLIGENCE INTEGRATION
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              AI Identification Linked to Real Biodiversity Records
            </h2>
            <p className="text-neutral-300 text-sm sm:text-base leading-relaxed">
              Model prediction alone is never enough for conservation. BioSentinel connects fine-tuned BioCLIP ViT-B/16 predictions directly to
              33,180 verified research-grade observation records with real GPS field coordinates.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-3xl bg-neutral-900/50 border border-white/[0.08] space-y-3 hover:border-emerald-500/40 transition-colors">
              <div className="h-8 w-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-mono text-xs font-bold">
                01
              </div>
              <h4 className="text-base font-bold text-white italic">Columba livia</h4>
              <p className="text-xs text-neutral-400">Rock Dove • Aves: Columbidae</p>
              <div className="text-[11px] font-mono text-emerald-400 pt-2 border-t border-white/[0.06]">
                1,080,145 historical records • Exact GPS mapped
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-neutral-900/50 border border-white/[0.08] space-y-3 hover:border-emerald-500/40 transition-colors">
              <div className="h-8 w-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-mono text-xs font-bold">
                02
              </div>
              <h4 className="text-base font-bold text-white italic">Pavo cristatus</h4>
              <p className="text-xs text-neutral-400">Indian Peafowl • Aves: Phasianidae</p>
              <div className="text-[11px] font-mono text-emerald-400 pt-2 border-t border-white/[0.06]">
                184,210 historical records • Exact GPS mapped
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-neutral-900/50 border border-white/[0.08] space-y-3 hover:border-emerald-500/40 transition-colors">
              <div className="h-8 w-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-mono text-xs font-bold">
                03
              </div>
              <h4 className="text-base font-bold text-white italic">Eudynamys scolopaceus</h4>
              <p className="text-xs text-neutral-400">Asian Koel • Aves: Cuculidae</p>
              <div className="text-[11px] font-mono text-emerald-400 pt-2 border-t border-white/[0.06]">
                94,800 historical records • Exact GPS mapped
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-neutral-900/50 border border-white/[0.08] space-y-3 hover:border-emerald-500/40 transition-colors">
              <div className="h-8 w-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-mono text-xs font-bold">
                04
              </div>
              <h4 className="text-base font-bold text-white italic">Panthera tigris</h4>
              <p className="text-xs text-neutral-400">Bengal Tiger • Mammalia: Felidae</p>
              <div className="text-[11px] font-mono text-emerald-400 pt-2 border-t border-white/[0.06]">
                High conservation sensitivity • Verified points
              </div>
            </div>
          </div>

          <div className="text-center pt-8">
            <Link href="/identify">
              <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs gap-2 shadow-lg shadow-emerald-950/40">
                <Sparkles className="h-3.5 w-3.5" />
                Launch Live BioCLIP Identification Studio
              </Button>
            </Link>
          </div>
        </section>



        {/* =========================================================================
            SECTION 6: GRAND FOOTER
           ========================================================================= */}
        <footer className="relative z-10 border-t border-white/[0.08] bg-[#050608] py-12 px-4 sm:px-6 lg:px-8 text-xs text-neutral-400">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="h-7 w-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Shield className="h-4 w-4" />
              </div>
              <div>
                <span className="font-bold text-white font-mono">BioSentinel India</span>
                <span className="text-neutral-500 text-[11px] ml-2">© 2018–2026 Open Science Initiative</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-[11px] text-neutral-400">
              <button type="button" onClick={scrollToConsole} className="hover:text-emerald-400 transition-colors">
                Surveillance Console
              </button>
              <Link href="/map" className="hover:text-emerald-400 transition-colors">
                GIS Map
              </Link>
              <Link href="/identify" className="hover:text-emerald-400 transition-colors">
                AI Species ID
              </Link>
              <Link href="/priority" className="hover:text-emerald-400 transition-colors">
                Priority Registry
              </Link>
              <Link href="/methodology" className="hover:text-emerald-400 transition-colors">
                Research Methodology
              </Link>
              <Link href="/data-quality" className="hover:text-emerald-400 transition-colors">
                Data Provenance (GBIF / iNat)
              </Link>
            </div>
          </div>
        </footer>

        {/* Global Detail Drawer */}
        <GridDetailSheet
          record={detailRecord}
          isOpen={!!detailRecord}
          onClose={() => {
            setSelectedCell(null);
            setDetailRecord(null);
          }}
        />
      </div>
    </SmoothScrollProvider>
  );
}
