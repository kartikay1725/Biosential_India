import summaryData from "@/lib/data/summary.json";
import topPriorityData from "@/lib/data/top_priority_2024.json";
import top100Data from "@/lib/data/top_100_2024.json";
import mapPointsData from "@/lib/data/map_points_2024.json";
import caseStudiesData from "@/lib/data/case_studies.json";
import speciesE076Data from "@/lib/data/species_e076n28aa.json";
import trendSummaryData from "@/lib/data/trend_summary.json";
import { GridYearRecord, MapPoint, SystemSummary, SpeciesRecord, TrendCategorySummary } from "@/types/biosentinel";

export function getSystemSummary(): SystemSummary {
  return summaryData as unknown as SystemSummary;
}

export function getTopPriorityUnits(): GridYearRecord[] {
  return topPriorityData as unknown as GridYearRecord[];
}

export function getTop100Units(): GridYearRecord[] {
  return top100Data as unknown as GridYearRecord[];
}

export function getMapPoints(): MapPoint[] {
  return mapPointsData as unknown as MapPoint[];
}

export function getCaseStudy(cellCode: string): GridYearRecord[] {
  const studies = caseStudiesData as unknown as Record<string, GridYearRecord[]>;
  return studies[cellCode] || [];
}

export function getSpeciesForGrid(cellCode: string, year = 2024): SpeciesRecord[] {
  if (cellCode === "E076N28AA" && year === 2024) {
    return speciesE076Data as unknown as SpeciesRecord[];
  }
  // Fallback generic species for other grids
  return [
    { scientific_name: "Columba livia", taxonomic_class: "Aves", occurrences: 14, data_source: "GBIF Verified Occurrence", bioclip_image_evaluable: true, bioclip_confidence: null },
    { scientific_name: "Psittacula krameri", taxonomic_class: "Aves", occurrences: 12, data_source: "GBIF Verified Occurrence", bioclip_image_evaluable: true, bioclip_confidence: null },
    { scientific_name: "Pycnonotus cafer", taxonomic_class: "Aves", occurrences: 9, data_source: "GBIF Verified Occurrence", bioclip_image_evaluable: true, bioclip_confidence: null },
  ];
}

export function getTrendSummary(): TrendCategorySummary[] {
  return trendSummaryData as unknown as TrendCategorySummary[];
}

export function getGridRecord(cellCode: string, year = 2024): GridYearRecord | null {
  // Check case studies first
  const cs = getCaseStudy(cellCode);
  const csMatch = cs.find(r => r.year === year);
  if (csMatch) return csMatch;

  // Check top priority
  const topMatch = (topPriorityData as unknown as GridYearRecord[]).find(r => r.eqdcellcode === cellCode && r.year === year);
  if (topMatch) return topMatch;

  // Check top 100
  const top100Match = (top100Data as unknown as GridYearRecord[]).find(r => r.eqdcellcode === cellCode && r.year === year);
  if (top100Match) return top100Match;

  return null;
}

export function searchGrids(query: string): Array<{ cell: string; priority: number; category: string; diagnostic: string }> {
  if (!query || query.trim() === "") return [];
  const q = query.trim().toUpperCase();
  const all = topPriorityData as unknown as GridYearRecord[];
  return all
    .filter(r => r.eqdcellcode.includes(q))
    .slice(0, 8)
    .map(r => ({
      cell: r.eqdcellcode,
      priority: r.priority_score,
      category: r.priority_category,
      diagnostic: r.signal_diagnostic
    }));
}
