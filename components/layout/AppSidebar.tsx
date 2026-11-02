"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MapPin,
  AlertTriangle,
  Flame,
  TrendingUp,
  BarChart2,
  Bug,
  Sparkles,
  Award,
  BookOpen,
  ShieldCheck,
  Search,
  Menu,
  X,
  Compass,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useSelectedYear } from "@/components/context/YearContext";
import { GlobalYearSelector } from "@/components/biosentinel/GlobalYearSelector";

export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface NavSection {
  section: string;
  items: NavItem[];
}

export const navigationConfig: NavSection[] = [
  {
    section: "OVERVIEW",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { title: "Project Overview", href: "/", icon: Compass },
    ],
  },
  {
    section: "EXPLORE",
    items: [
      { title: "Biodiversity Map", href: "/map", icon: MapPin },
      { title: "Priority Screening", href: "/priority", icon: Flame },
      { title: "Anomaly Explorer", href: "/anomalies", icon: AlertTriangle },
      { title: "Temporal Trends", href: "/trends", icon: TrendingUp },
      { title: "Species Explorer", href: "/species", icon: Bug },
    ],
  },
  {
    section: "INTELLIGENCE",
    items: [
      { title: "Observation Effort", href: "/observation-effort", icon: BarChart2 },
      { title: "AI Species ID", href: "/identify", icon: Sparkles },
    ],
  },
  {
    section: "RESEARCH",
    items: [
      { title: "Model Performance", href: "/models", icon: Award },
      { title: "Methodology", href: "/methodology", icon: BookOpen },
      { title: "Data Quality", href: "/data-quality", icon: ShieldCheck },
    ],
  },
];

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { selectedYear } = useSelectedYear();

  return (
    <div className="flex flex-col h-full bg-[#07080c] border-r border-white/[0.08] text-foreground select-none">
      {/* Brand Header */}
      <Link href="/" className="p-4 border-b border-white/[0.08] flex items-center gap-3 group transition-colors">
        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-emerald-400 via-teal-500 to-amber-500 p-[1px] shadow-md shadow-emerald-950/40 group-hover:scale-105 transition-transform">
          <div className="h-full w-full bg-[#0b0d13] rounded-[11px] flex items-center justify-center">
            <Compass className="h-4 w-4 text-emerald-400" />
          </div>
        </div>
        <div>
          <div className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5 font-mono">
            <span>BioSentinel</span>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-accent/20 border border-accent/40 text-accent font-semibold">IND</span>
          </div>
          <div className="text-[10px] text-neutral-400 font-sans tracking-wide">Ecological Surveillance</div>
        </div>
      </Link>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {navigationConfig.map((sec, i) => (
          <div key={i} className="space-y-1">
            <div className="px-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 mb-1.5 font-mono">
              {sec.section}
            </div>
            {sec.items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 group",
                    isActive
                      ? "bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-transparent text-white font-semibold border-l-2 border-emerald-400 shadow-sm"
                      : "text-neutral-400 hover:text-white hover:bg-white/[0.04]"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-3.5 w-3.5 transition-colors",
                      isActive ? "text-emerald-400" : "text-neutral-400 group-hover:text-emerald-400"
                    )}
                  />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-white/[0.08] text-[11px] text-neutral-400 space-y-1 bg-white/[0.02]">
        <div className="flex items-center justify-between font-mono text-[10px]">
          <span className="text-neutral-400">RESEARCH PLATFORM</span>
          <span className="text-emerald-400 flex items-center gap-1.5 font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
            AUDITED
          </span>
        </div>
        <div className="text-[10px] text-neutral-400 flex items-center justify-between pt-0.5">
          <span>Active Target:</span>
          <span className="text-white font-mono font-semibold">{selectedYear} Monitored</span>
        </div>
      </div>
    </div>
  );
}

export function AppHeader({ onOpenSearch }: { onOpenSearch: () => void }) {
  const pathname = usePathname();

  // Find page title
  let currentTitle = "Dashboard";
  for (const sec of navigationConfig) {
    for (const item of sec.items) {
      if (item.href === pathname) currentTitle = item.title;
    }
  }

  return (
    <header className="h-14 border-b border-white/[0.08] bg-[#07080c]/80 backdrop-blur-xl sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden h-8 w-8 text-neutral-400 hover:text-white">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 bg-[#07080c] border-r border-white/[0.08]">
            <SidebarContent />
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-2 text-xs">
          <Link href="/" className="text-neutral-400 hover:text-emerald-400 transition-colors hidden sm:inline font-mono">
            BioSentinel /
          </Link>
          <span className="font-semibold text-white tracking-tight">{currentTitle}</span>
        </div>
      </div>

      {/* Right toolbar */}
      <div className="flex items-center gap-2.5">
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenSearch}
          className="h-8 px-3 text-xs text-neutral-400 gap-2 bg-white/[0.04] hover:bg-white/[0.08] hover:text-white border-white/[0.08] hover:border-emerald-500/30 rounded-xl transition-all"
        >
          <Search className="h-3.5 w-3.5 text-neutral-400" />
          <span className="hidden sm:inline">Search grid, species...</span>
          <kbd className="hidden sm:inline font-mono text-[9px] bg-white/[0.06] text-neutral-400 px-1.5 py-0.5 rounded border border-white/10">⌘K</kbd>
        </Button>

        <div className="h-4 w-px bg-white/[0.08] hidden sm:block" />

        <GlobalYearSelector />
      </div>
    </header>
  );
}
