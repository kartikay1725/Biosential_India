"use client";

import React, { useState, Suspense } from "react";
import { usePathname } from "next/navigation";
import { SidebarContent, AppHeader } from "./AppSidebar";
import { CommandSearch } from "@/components/biosentinel/CommandSearch";
import { GridDetailSheet } from "@/components/biosentinel/GridDetailSheet";
import { getGridRecord } from "@/lib/api/data-service";
import { GridYearRecord } from "@/types/biosentinel";
import { YearProvider, useSelectedYear } from "@/components/context/YearContext";

function AppShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLandingPage = pathname === "/" || pathname === "/landing";

  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedCellCode, setSelectedCellCode] = useState<string | null>(null);
  const [activeRecord, setActiveRecord] = useState<GridYearRecord | null>(null);
  const { selectedYear } = useSelectedYear();

  const handleSelectGrid = (cellCode: string) => {
    setSelectedCellCode(cellCode);
    const rec = getGridRecord(cellCode, selectedYear);
    if (rec) {
      setActiveRecord(rec);
    }
  };

  const handleCloseDrawer = () => {
    setSelectedCellCode(null);
    setActiveRecord(null);
  };

  if (isLandingPage) {
    return (
      <div className="min-h-screen w-full bg-background text-foreground">
        {children}
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-[#07080c] text-foreground overflow-hidden relative">
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex w-56 flex-col shrink-0 z-20">
        <SidebarContent />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
        <AppHeader onOpenSearch={() => setSearchOpen(true)} />
        <main className="flex-1 overflow-y-auto relative">
          {/* Subtle Ambient Background Orbs */}
          <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            <div className="absolute top-10 right-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[140px]" />
            <div className="absolute bottom-10 right-10 w-[450px] h-[450px] bg-amber-500/5 rounded-full blur-[140px]" />
            <div className="absolute top-1/2 left-1/3 w-[450px] h-[450px] bg-cyan-500/5 rounded-full blur-[140px]" />
          </div>
          <div className="relative z-10">
            {children}
          </div>
        </main>
      </div>

      {/* Global Command Search Dialog */}
      <CommandSearch
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onSelectGrid={handleSelectGrid}
      />

      {/* Hero Global Grid Detail Sheet */}
      <GridDetailSheet
        record={activeRecord}
        isOpen={!!activeRecord}
        onClose={handleCloseDrawer}
      />
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-full bg-[#0c0c10] flex items-center justify-center text-xs font-mono text-muted-foreground">
          Initializing BioSentinel...
        </div>
      }
    >
      <YearProvider>
        <AppShellInner>{children}</AppShellInner>
      </YearProvider>
    </Suspense>
  );
}
