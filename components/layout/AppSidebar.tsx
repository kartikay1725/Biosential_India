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
      { title: "Dashboard", href: "/", icon: LayoutDashboard },
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

  return (
    <div className="flex flex-col h-full bg-[#0c0c10] border-r border-border text-foreground">
      {/* Brand Header */}
      <div className="p-4 border-b border-border flex items-center gap-2.5">
        <div className="h-7 w-7 rounded bg-accent/20 border border-accent/40 flex items-center justify-center text-accent">
          <Compass className="h-4 w-4" />
        </div>
        <div>
          <div className="font-bold text-sm tracking-tight text-foreground flex items-center gap-1.5">
            <span>BioSentinel</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-surface-raised border border-border text-muted-foreground">IND</span>
          </div>
          <div className="text-[11px] text-muted-foreground leading-none">Biodiversity Intelligence</div>
        </div>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {navigationConfig.map((sec, i) => (
          <div key={i} className="space-y-1">
            <div className="px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 mb-1">
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
                    "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors",
                    isActive
                      ? "bg-surface-hover text-foreground font-semibold border border-border shadow-sm"
                      : "text-muted-foreground hover:bg-surface-raised hover:text-foreground"
                  )}
                >
                  <Icon className={cn("h-3.5 w-3.5", isActive ? "text-accent" : "text-muted-foreground")} />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-border text-[11px] text-muted-foreground space-y-1 bg-surface/50">
        <div className="flex items-center justify-between font-mono text-[10px]">
          <span>STATUS: AUDITED</span>
          <span className="text-success flex items-center gap-1">● READY</span>
        </div>
        <div className="text-[10px] text-muted-foreground/70">
          Target: 2024 Evaluation Year
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
    <header className="h-13 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden h-8 w-8">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 bg-[#0c0c10]">
            <SidebarContent />
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground hidden sm:inline">BioSentinel /</span>
          <span className="font-semibold text-foreground">{currentTitle}</span>
        </div>
      </div>

      {/* Right toolbar */}
      <div className="flex items-center gap-2.5">
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenSearch}
          className="h-8 px-2.5 text-xs text-muted-foreground gap-2 bg-surface hover:text-foreground border-border"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Search grid, species...</span>
          <kbd className="hidden sm:inline font-mono text-[10px] bg-surface-raised px-1.5 py-0.5 rounded border border-border">⌘K</kbd>
        </Button>

        <div className="h-4 w-px bg-border hidden sm:block" />

        <div className="flex items-center gap-1.5 text-xs font-mono px-2 py-1 rounded bg-surface border border-border text-foreground">
          <span className="text-muted-foreground">YEAR:</span>
          <span className="font-semibold text-accent">2024</span>
        </div>
      </div>
    </header>
  );
}
