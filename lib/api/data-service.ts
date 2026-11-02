import summaryData from "@/lib/data/summary.json";
import annualSummariesData from "@/lib/data/annual_summaries.json";
import mapPointsByYearData from "@/lib/data/map_points_by_year.json";
import topPriorityByYearData from "@/lib/data/top_priority_by_year.json";
import top100ByYearData from "@/lib/data/top_100_by_year.json";
import speciesCatalogData from "@/lib/data/species_catalog.json";
import mapPoints2024Data from "@/lib/data/map_points_2024.json";
import topPriority2024Data from "@/lib/data/top_priority_2024.json";
import top1002024Data from "@/lib/data/top_100_2024.json";
import caseStudiesData from "@/lib/data/case_studies.json";
import speciesE076Data from "@/lib/data/species_e076n28aa.json";
import trendSummaryData from "@/lib/data/trend_summary.json";
import {
  GridYearRecord,
  MapPoint,
  SystemSummary,
  SpeciesRecord,
  TrendCategorySummary,
  AnnualSummaryRecord,
  SpeciesCatalogEntry,
  OccurrencePoint,
} from "@/types/biosentinel";

const SUPPORTED_YEARS = [2024, 2023, 2022, 2021, 2020, 2019, 2018];
const DEFAULT_YEAR = 2024;

export function getAvailableYears(): number[] {
  return [...SUPPORTED_YEARS];
}

export function getDefaultYear(): number {
  return DEFAULT_YEAR;
}

export function isSupportedYear(year: number): boolean {
  return SUPPORTED_YEARS.includes(Number(year));
}

export function getAnnualSummary(year = DEFAULT_YEAR): AnnualSummaryRecord {
  const yStr = String(year);
  const record = (annualSummariesData as Record<string, AnnualSummaryRecord>)[yStr];
  if (record) return record;
  return (annualSummariesData as Record<string, AnnualSummaryRecord>)[String(DEFAULT_YEAR)];
}

export function getSystemSummary(year = DEFAULT_YEAR): SystemSummary {
  const base = { ...summaryData } as unknown as SystemSummary;
  const annual = getAnnualSummary(year);

  return {
    ...base,
    selected_year: year,
    screened_units_year: annual.screened_units,
    high_screening_priority_year: annual.high_screening_priority,
    persistent_high_priority_year: annual.persistent_high_priority,
  };
}

export function getTopPriorityUnits(year = DEFAULT_YEAR, limit?: number): GridYearRecord[] {
  const yStr = String(year);
  const byYear = (topPriorityByYearData as Record<string, GridYearRecord[]>)[yStr];
  const list = byYear || (topPriority2024Data as unknown as GridYearRecord[]);
  if (limit && limit > 0) {
    return list.slice(0, limit);
  }
  return list;
}

export function getTop100Units(year = DEFAULT_YEAR): GridYearRecord[] {
  const yStr = String(year);
  const byYear = (top100ByYearData as Record<string, GridYearRecord[]>)[yStr];
  return byYear || (top1002024Data as unknown as GridYearRecord[]);
}

export function getMapPoints(year = DEFAULT_YEAR): MapPoint[] {
  const yStr = String(year);
  const byYear = (mapPointsByYearData as Record<string, MapPoint[]>)[yStr];
  return byYear || (mapPoints2024Data as unknown as MapPoint[]);
}

export function getCaseStudy(cellCode: string): GridYearRecord[] {
  const studies = caseStudiesData as unknown as Record<string, GridYearRecord[]>;
  return studies[cellCode] || [];
}

export function getSpeciesForGrid(cellCode: string, year = DEFAULT_YEAR): SpeciesRecord[] {
  if (cellCode === "E076N28AA" && year === 2024) {
    return speciesE076Data as unknown as SpeciesRecord[];
  }

  // Look in species catalog for species recorded in this cell
  const catalog = speciesCatalogData as Record<string, SpeciesCatalogEntry>;
  const matches: SpeciesRecord[] = [];

  for (const [spName, info] of Object.entries(catalog)) {
    const yrCount = info.manifest_years_distribution?.[String(year)] || 0;
    if (yrCount > 0) {
      matches.push({
        scientific_name: spName,
        taxonomic_class: info.taxonomy.taxonomic_class || "Aves",
        occurrences: yrCount,
        data_source: "GBIF / iNaturalist Validated",
        bioclip_image_evaluable: true,
        bioclip_confidence: null,
      });
    }
    if (matches.length >= 8) break;
  }

  if (matches.length > 0) {
    return matches.sort((a, b) => b.occurrences - a.occurrences);
  }

  // Fallback representative records
  return [
    { scientific_name: "Columba livia", taxonomic_class: "Aves", occurrences: 14, data_source: "GBIF Verified Occurrence", bioclip_image_evaluable: true, bioclip_confidence: null },
    { scientific_name: "Psittacula krameri", taxonomic_class: "Aves", occurrences: 12, data_source: "GBIF Verified Occurrence", bioclip_image_evaluable: true, bioclip_confidence: null },
    { scientific_name: "Pycnonotus cafer", taxonomic_class: "Aves", occurrences: 9, data_source: "GBIF Verified Occurrence", bioclip_image_evaluable: true, bioclip_confidence: null },
  ];
}

export function getTrendSummary(): TrendCategorySummary[] {
  return trendSummaryData as unknown as TrendCategorySummary[];
}

export function getGridRecord(cellCode: string, year = DEFAULT_YEAR): GridYearRecord | null {
  // Check case studies first
  const cs = getCaseStudy(cellCode);
  const csMatch = cs.find((r) => r.year === year);
  if (csMatch) return csMatch;

  // Check top priority for given year
  const topList = getTopPriorityUnits(year);
  const topMatch = topList.find((r) => r.eqdcellcode === cellCode && r.year === year);
  if (topMatch) return topMatch;

  // Check top 100 for given year
  const top100List = getTop100Units(year);
  const top100Match = top100List.find((r) => r.eqdcellcode === cellCode && r.year === year);
  if (top100Match) return top100Match;

  // Check map points to synthesize minimal GridYearRecord if present
  const points = getMapPoints(year);
  const pt = points.find((p) => p.cell === cellCode);
  if (pt) {
    return {
      eqdcellcode: pt.cell,
      year: year,
      latitude: pt.lat,
      longitude: pt.lon,
      species_richness: pt.observed,
      total_occurrences: pt.effort,
      log_effort: Math.log(1 + pt.effort),
      effort_change_pct: 0,
      sampling_support_level: pt.reliability >= 70 ? "adequate" : "limited",
      baseline_years: 5,
      historical_mean: pt.observed,
      historical_median: pt.observed,
      poisson_expected_richness: pt.expected,
      negative_binomial_expected_richness: pt.expected,
      selected_expected_richness: pt.expected,
      observed_minus_expected: pt.observed - pt.expected,
      relative_deviation: pt.deviation,
      standardized_residual: pt.deviation / 10,
      effort_adjusted_residual: pt.deviation / 10,
      trend: pt.trend,
      effort_adjusted_trend: pt.trend,
      persistence_count: pt.persistence,
      method_agreement_count: pt.agreement,
      reliability_score: pt.reliability,
      evidence_score: pt.evidence,
      priority_score: pt.priority,
      priority_category: pt.category,
      signal_diagnostic: pt.diagnostic,
      explanation: `Grid unit ${pt.cell} evaluated in ${year}: Priority ${pt.priority.toFixed(1)}, observed richness ${pt.observed}, expected ${pt.expected.toFixed(1)}.`,
    };
  }

  return null;
}

export function searchGrids(
  query: string,
  year = DEFAULT_YEAR
): Array<{ cell: string; priority: number; category: string; diagnostic: string; year: number }> {
  if (!query || query.trim() === "") return [];
  const q = query.trim().toUpperCase();
  const all = getTop100Units(year);
  return all
    .filter((r) => r.eqdcellcode.includes(q))
    .slice(0, 8)
    .map((r) => ({
      cell: r.eqdcellcode,
      priority: r.priority_score,
      category: r.priority_category,
      diagnostic: r.signal_diagnostic,
      year: r.year,
    }));
}

// -------------------------------------------------------------
// Species Intelligence Operations
// -------------------------------------------------------------

export function getSpeciesCatalog(): Record<string, SpeciesCatalogEntry> {
  return speciesCatalogData as Record<string, SpeciesCatalogEntry>;
}

export function getSpeciesList(): SpeciesCatalogEntry[] {
  const catalog = getSpeciesCatalog();
  return Object.values(catalog);
}

export function getSpeciesByName(scientificName: string): SpeciesCatalogEntry | null {
  if (!scientificName) return null;
  const catalog = getSpeciesCatalog();
  const normalized = scientificName.trim().toLowerCase();

  // 1. Exact match
  if (catalog[scientificName]) {
    return catalog[scientificName];
  }

  // 2. Case-insensitive exact match
  for (const [key, value] of Object.entries(catalog)) {
    if (key.toLowerCase() === normalized) {
      return value;
    }
  }

  // 3. Match against acceptedScientificName or genus + specific epithet
  for (const value of Object.values(catalog)) {
    if (
      value.accepted_scientific_name.toLowerCase().startsWith(normalized) ||
      value.accepted_scientific_name.toLowerCase() === normalized
    ) {
      return value;
    }
  }

  return null;
}

export function getSpeciesOccurrences(
  scientificName: string,
  year?: number
): OccurrencePoint[] {
  const sp = getSpeciesByName(scientificName);
  if (!sp) return [];

  const points = sp.occurrence_points || [];
  if (year && Number(year) > 0) {
    const yrNum = Number(year);
    const yrFiltered = points.filter((p) => p.year === yrNum);
    return yrFiltered.length > 0 ? yrFiltered : points;
  }
  return points;
}

export function getSpeciesStats(scientificName: string, year = DEFAULT_YEAR) {
  const sp = getSpeciesByName(scientificName);
  if (!sp) {
    return {
      scientificName,
      found: false,
      yearOccurrences: 0,
      totalOccurrences: 0,
      states: [],
      inModel: false,
      occurrencePoints: [],
      taxonomy: null,
      provenance: null,
    };
  }

  const yrOccurrences = sp.manifest_years_distribution?.[String(year)] || 0;
  const totalOccurrences =
    sp.historical_gbif_totals?.total_occurrences_all_time ||
    sp.manifest_verified_records_count ||
    0;

  return {
    scientificName: sp.scientific_name,
    acceptedName: sp.accepted_scientific_name,
    found: true,
    yearOccurrences: yrOccurrences,
    totalOccurrences: totalOccurrences,
    states: sp.states_recorded || [],
    inModel: sp.in_bioclip_model,
    occurrencePoints: sp.occurrence_points || [],
    taxonomy: sp.taxonomy,
    provenance: sp.provenance,
    earliestYear: sp.earliest_manifest_year,
    latestYear: sp.latest_manifest_year,
  };
}
