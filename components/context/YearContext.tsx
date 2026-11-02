"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useTransition } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { getAvailableYears, getDefaultYear, isSupportedYear } from "@/lib/api/data-service";

interface YearContextType {
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  availableYears: number[];
  isPending: boolean;
}

const YearContext = createContext<YearContextType | undefined>(undefined);

export function YearProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const availableYears = getAvailableYears();
  const defaultYear = getDefaultYear();

  // Read year from URL if present and valid
  const urlYearStr = searchParams.get("year");
  const initialYear = urlYearStr && isSupportedYear(Number(urlYearStr)) ? Number(urlYearStr) : defaultYear;

  const [selectedYear, setSelectedYearState] = useState<number>(initialYear);

  // Synchronize when searchParams changes (e.g. Back/Forward button)
  useEffect(() => {
    const yrFromUrl = searchParams.get("year");
    if (yrFromUrl) {
      const parsed = Number(yrFromUrl);
      if (isSupportedYear(parsed) && parsed !== selectedYear) {
        setSelectedYearState(parsed);
      }
    }
  }, [searchParams, selectedYear]);

  const setSelectedYear = useCallback(
    (newYear: number) => {
      const validatedYear = isSupportedYear(newYear) ? newYear : defaultYear;
      setSelectedYearState(validatedYear);

      startTransition(() => {
        const currentParams = new URLSearchParams(searchParams.toString());
        currentParams.set("year", String(validatedYear));
        router.replace(`${pathname}?${currentParams.toString()}`, { scroll: false });
      });
    },
    [searchParams, pathname, router, defaultYear]
  );

  return (
    <YearContext.Provider
      value={{
        selectedYear,
        setSelectedYear,
        availableYears,
        isPending,
      }}
    >
      {children}
    </YearContext.Provider>
  );
}

export function useSelectedYear(): YearContextType {
  const context = useContext(YearContext);
  if (!context) {
    // Graceful fallback for non-provider contexts or standalone unit tests
    return {
      selectedYear: getDefaultYear(),
      setSelectedYear: () => {},
      availableYears: getAvailableYears(),
      isPending: false,
    };
  }
  return context;
}
