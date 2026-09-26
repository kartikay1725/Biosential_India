"use client";

import React, { useState } from "react";
import { SidebarContent, AppHeader } from "./AppSidebar";
import { CommandSearch } from "@/components/biosentinel/CommandSearch";
import { GridDetailSheet } from "@/components/biosentinel/GridDetailSheet";
import { getGridRecord } from "@/lib/api/data-service";
import { GridYearRecord } from "@/types/biosentinel";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedCellCode, setSelectedCellCode] = useState<string | null>(null);
  const [activeRecord, setActiveRecord] = useState<GridYearRecord | null>(null);

  const handleSelectGrid = (cellCode: string) => {
    setSelectedCellCode(cellCode);
    const rec = getGridRecord(cellCode);
    if (rec) {
      setActiveRecord(rec);
    }
  };

  const handleCloseDrawer = () => {
    setSelectedCellCode(null);
    setActiveRecord(null);
  };

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex w-56 flex-col shrink-0">
        <SidebarContent />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <AppHeader onOpenSearch={() => setSearchOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          {children}
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
