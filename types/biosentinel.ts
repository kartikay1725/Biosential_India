export interface GridYearRecord {
  eqdcellcode: string;
  year: number;
  latitude: number;
  longitude: number;

  // Observations
  species_richness: number;
  total_occurrences: number;
  shannon_diversity?: number;
  simpson_diversity?: number;
  pielou_evenness?: number;

  // Effort
  log_effort: number;
  effort_ratio?: number;
  effort_change_pct: number;
  grid_temporal_coverage_pct?: number;
  grid_usable_year_coverage_pct?: number;
  sampling_support_level: string;

  // Baseline
  baseline_years: number;
  historical_mean: number;
  historical_median: number;
  poisson_expected_richness: number;
  negative_binomial_expected_richness: number;
  selected_expected_richness: number;

  // Deviation
  observed_minus_expected: number;
  relative_deviation: number;
  standardized_residual: number;
  poisson_standardized_residual?: number;
  effort_adjusted_residual: number;

  // Composition
  jaccard_dissimilarity?: number;
  composition_change_score?: number;

  // Temporal
  trend: string;
  effort_adjusted_trend: "effort_driven_richness_growth" | "effort_adjusted_stable" | "effort_adjusted_increase" | "effort_adjusted_decrease" | "insufficient_history" | string;
  temporal_slope?: number;
  effort_slope?: number;
  effort_adjusted_slope?: number;
  persistence_count: number;
  longest_anomaly_run?: number;
  recovery_signal?: boolean;

  // Spatial
  neighbour_count?: number;
  neighbour_anomaly_count?: number;
  neighbour_anomaly_proportion?: number;
  spatial_consistency_score?: number;

  // Anomaly
  statistical_anomaly_flag?: boolean;
  poisson_flag?: boolean;
  negative_binomial_flag?: boolean;
  isolation_forest_flag?: boolean;
  combined_anomaly_score?: number;
  method_agreement_count: number;
  method_agreement_pct?: number;

  // Reliability
  coverage_support_score?: number;
  data_quality_score?: number;
  reliability_score: number;

  // Priority
  evidence_score: number;
  priority_score: number;
  priority_category: "high screening priority" | "moderate screening priority" | "low screening priority" | string;

  // Explainability
  signal_diagnostic: "robust_multimethod_signal" | "effort_driven_signal" | "expected_observation_pattern" | string;
  pattern_type?: string;
  explanation: string;
}

export interface MapPoint {
  cell: string;
  lat: number;
  lon: number;
  priority: number;
  evidence: number;
  reliability: number;
  category: string;
  observed: number;
  expected: number;
  effort: number;
  deviation: number;
  persistence: number;
  agreement: number;
  trend: string;
  diagnostic: string;
}

export interface SystemSummary {
  system_name: string;
  bioclip_species_identification: {
    top1_accuracy: number;
    top5_accuracy: number;
    macro_f1: number;
    status: string;
  };
  dataset_dimensions: {
    total_grid_year_units: number;
    unique_grid_cells: number;
    year_range: [number, number];
    screened_units_2024: number;
    high_screening_priority_2024: number;
    persistent_high_priority_2024: number;
  };
  statistical_models: {
    poisson_glm: {
      role: string;
      walk_forward_mae: number;
      degrees_of_freedom: number;
    };
    negative_binomial_glm: {
      role: string;
      aic: number;
      dispersion: number;
      walk_forward_mae: number;
    };
    historical_median_baseline: {
      walk_forward_mae: number;
    };
  };
  sensitivity_analysis: {
    anomaly_heavy_vs_balanced_spearman: number;
    reliability_heavy_vs_balanced_spearman: number;
  };
  case_study_primary: string;
  case_study_sampling_artifact: string;
}

export interface SpeciesRecord {
  scientific_name: string;
  taxonomic_class: string;
  occurrences: number;
  data_source: string;
  bioclip_image_evaluable: boolean;
  bioclip_confidence: number | null;
}

export interface TrendCategorySummary {
  category: string;
  count: number;
  percentage: number;
  mean_raw_slope: number;
  mean_effort_slope: number;
  mean_adjusted_slope: number;
}
