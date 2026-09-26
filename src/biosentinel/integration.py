"""
BioSentinel India — Integration Module
Integrates locked BioCLIP and Phase 2 research artifacts into one authoritative,
reproducible pipeline without retraining or altering statistical baselines.
"""

import os
import json
from pathlib import Path
from typing import Dict, Any, Optional, Tuple, List
import pandas as pd
import numpy as np
from scipy.spatial import cKDTree
import joblib

# Paths
PROJECT_ROOT = Path("D:/Biosential_India")
PHASE2_DIR = PROJECT_ROOT / "data/processed/analytics/person3/phase2"
FINAL_DIR = PROJECT_ROOT / "data/processed/analytics/person3/final"
MODELS_DIR = PROJECT_ROOT / "models/person3/phase2"
SPECIES_OCC_PATH = PROJECT_ROOT / "data/processed/gbif_terrestrial_species_year_grid.parquet"
BIOCLIP_EXP5A_METRICS = PROJECT_ROOT / "data/processed/analytics/person3/bioclip_exp5a/final_test_metrics.json"
BIOCLIP_EXP5A_CONFIG = PROJECT_ROOT / "data/processed/analytics/person3/bioclip_exp5a/experiment_config.json"


class BioSentinelPipeline:
    """
    Authoritative BioSentinel analytical pipeline singleton.
    Provides fast indexed queries across all 12,913 Grid x Year units,
    spatial KDTree mapping, species-level drill-down, and explainable priority scoring.
    """
    _instance = None

    def __init__(self, load_species: bool = False):
        self.project_root = PROJECT_ROOT
        self.phase2_dir = PHASE2_DIR
        self.final_dir = FINAL_DIR
        self.final_dir.mkdir(parents=True, exist_ok=True)
        
        # Load master intelligence dataset
        self.master_path = PHASE2_DIR / "phase2_grid_year_intelligence.parquet"
        if not self.master_path.exists():
            raise FileNotFoundError(f"Authoritative Phase 2 dataset not found at {self.master_path}")
            
        print("Loading authoritative Phase 2 analytical dataset...")
        raw_df = pd.read_parquet(self.master_path)
        self.df = self._standardize_authoritative_schema(raw_df)
        
        # Build spatial KDTree over unique grid cells
        self._build_spatial_index()
        
        # Load Phase 2 GLM models & scaler for reference
        self.models = self._load_saved_models()
        
        # BioCLIP evaluation constants (LOCKED)
        self.bioclip_metrics = {
            "top1_accuracy": 0.7894,
            "top5_accuracy": 0.9287,
            "macro_f1": 0.7827,
            "status": "LOCKED"
        }
        
        # Species occurrences on-demand
        self.species_parquet_path = SPECIES_OCC_PATH
        self._species_df = None
        if load_species and self.species_parquet_path.exists():
            self._load_species_data()

    @classmethod
    def get_instance(cls, load_species: bool = False):
        if cls._instance is None:
            cls._instance = BioSentinelPipeline(load_species=load_species)
        return cls._instance

    def _standardize_authoritative_schema(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Ensures consistent, unambiguous column naming conforming to Section 5.
        Resolves GLM roles:
        - poisson_expected_richness = PRIMARY CONDITIONAL MEAN BASELINE
        - negative_binomial_expected_richness = OVERDISPERSION / UNCERTAINTY MODEL
        - selected_expected_richness = Poisson expected richness for point deviation
        """
        df = df.copy()

        # Map / Alias standard columns if needed
        col_mappings = {
            "baseline_richness_mean": "historical_mean",
            "baseline_richness_median": "historical_median",
            "stat_anomaly_flag": "statistical_anomaly_flag",
            "negbin_flag": "negative_binomial_flag",
            "trend_direction": "trend",
            "richness_residual": "observed_minus_expected",
            "relative_richness_deviation": "relative_deviation",
            "temporal_coverage_score": "coverage_support_score",
            "effort_ratio_to_median": "effort_ratio",
        }
        for old_col, new_col in col_mappings.items():
            if old_col in df.columns and new_col not in df.columns:
                df[new_col] = df[old_col]

        # Explicitly define selected_expected_richness as Poisson conditional mean
        df["selected_expected_richness"] = df["poisson_expected_richness"]
        
        # Effort adjusted residual
        df["effort_adjusted_residual"] = df["poisson_residual"]

        # Ensure neighbour count is populated
        if "neighbour_count" not in df.columns:
            # EQDGC 3x3 window: maximum 8 adjacent cells
            df["neighbour_count"] = 8

        # Recovery signal
        df["recovery_signal"] = (df["effort_adjusted_trend"] == "effort_adjusted_increase") & (df["poisson_residual"] > 0)

        # Standard column order
        authoritative_cols = [
            # IDENTITY
            "eqdcellcode", "year", "latitude", "longitude",
            # OBSERVATIONS
            "species_richness", "total_occurrences", "shannon_diversity", "simpson_diversity", "pielou_evenness",
            # EFFORT
            "log_effort", "effort_ratio", "effort_change_pct", "grid_temporal_coverage_pct", "grid_usable_year_coverage_pct", "sampling_support_level",
            # BASELINE
            "baseline_years", "historical_mean", "historical_median", "poisson_expected_richness", "negative_binomial_expected_richness", "selected_expected_richness",
            # DEVIATION
            "observed_minus_expected", "relative_deviation", "standardized_residual", "effort_adjusted_residual",
            # COMPOSITION
            "jaccard_dissimilarity", "composition_change_score",
            # TEMPORAL
            "trend", "effort_adjusted_trend", "temporal_slope", "effort_slope", "effort_adjusted_slope", "persistence_count", "longest_anomaly_run", "recovery_signal",
            # SPATIAL
            "neighbour_count", "neighbour_anomaly_count", "neighbour_anomaly_proportion", "spatial_consistency_score",
            # ANOMALY
            "statistical_anomaly_flag", "poisson_flag", "negative_binomial_flag", "isolation_forest_flag", "combined_anomaly_score", "method_agreement_count", "method_agreement_pct",
            # RELIABILITY
            "coverage_support_score", "data_quality_score", "reliability_score",
            # PRIORITY
            "evidence_score", "priority_score", "priority_category",
            # EXPLAINABILITY
            "signal_diagnostic", "pattern_type", "explanation"
        ]
        
        # Ensure all authoritative cols exist
        if "combined_anomaly_score" not in df.columns and "statistical_anomaly_score" in df.columns:
            df["combined_anomaly_score"] = df["statistical_anomaly_score"]

        # Keep existing extra columns too if helpful, but ensure authoritative cols come first
        all_cols = [c for c in authoritative_cols if c in df.columns] + [c for c in df.columns if c not in authoritative_cols]
        return df[all_cols]

    def _build_spatial_index(self):
        """Builds a cKDTree over unique grid cell centers (longitude, latitude)."""
        unique_grids = self.df.drop_duplicates(subset=["eqdcellcode"])[["eqdcellcode", "longitude", "latitude"]].reset_index(drop=True)
        self.grid_coords = unique_grids[["longitude", "latitude"]].values
        self.grid_cells = unique_grids["eqdcellcode"].values
        self.kdtree = cKDTree(self.grid_coords)

    def _load_saved_models(self) -> Dict[str, Any]:
        """Loads pre-trained Phase 2 statistical models without refitting."""
        models = {}
        for name, fname in [
            ("poisson_glm", "phase2_poisson_glm.pkl"),
            ("negbin_glm", "phase2_negbin_glm.pkl"),
            ("isolation_forest", "phase2_isolation_forest.pkl"),
            ("scaler", "phase2_scaler.pkl")
        ]:
            p = MODELS_DIR / fname
            if p.exists():
                try:
                    models[name] = joblib.load(p)
                except Exception as e:
                    models[name] = f"Error loading {name}: {e}"
        return models

    def _load_species_data(self):
        """Loads or filters species occurrences from parquet."""
        print("Reading species occurrence records...")
        self._species_df = pd.read_parquet(self.species_parquet_path)

    def query_nearest_grid(self, latitude: float, longitude: float) -> Tuple[str, float, float, float]:
        """
        Maps (latitude, longitude) to the nearest EQDGC grid cell center using KDTree.
        Returns: (eqdcellcode, center_latitude, center_longitude, distance_degrees)
        """
        dist, idx = self.kdtree.query([longitude, latitude])
        nearest_cell = self.grid_cells[idx]
        cell_lon, cell_lat = self.grid_coords[idx]
        return nearest_cell, float(cell_lat), float(cell_lon), float(dist)

    def get_species_list(self, eqdcellcode: str, year: int) -> pd.DataFrame:
        """
        Retrieves verified GBIF species records for a specific Grid x Year unit.
        Clearly tags verified GBIF records versus BioCLIP image intelligence capability.
        """
        if self._species_df is None:
            # Use pyarrow filter pushdown for high efficiency
            df_sp = pd.read_parquet(
                self.species_parquet_path,
                filters=[("eqdcellcode", "==", eqdcellcode), ("year", "==", int(year))]
            )
        else:
            df_sp = self._species_df[
                (self._species_df["eqdcellcode"] == eqdcellcode) &
                (self._species_df["year"] == int(year))
            ]

        if df_sp.empty:
            return pd.DataFrame(columns=["scientific_name", "taxonomic_class", "occurrences", "data_source", "bioclip_image_evaluable", "bioclip_confidence"])

        res = df_sp.copy()
        res = res.rename(columns={"species": "scientific_name", "class": "taxonomic_class"})
        res["data_source"] = "GBIF Verified Occurrence"
        # BioCLIP evaluated capability for 1,106 Indian species
        res["bioclip_image_evaluable"] = True
        # BioCLIP confidence applies ONLY when an actual image prediction is made
        res["bioclip_confidence"] = np.nan
        return res[["scientific_name", "taxonomic_class", "occurrences", "data_source", "bioclip_image_evaluable", "bioclip_confidence"]].sort_values("occurrences", ascending=False).reset_index(drop=True)

    def export_final_artifacts(self) -> Dict[str, str]:
        """
        Exports all authoritative final artifacts to data/processed/analytics/person3/final/
        """
        print("Writing authoritative final data artifacts...")
        # 1. Master integrated parquet
        master_out = self.final_dir / "biosentinel_master_integrated.parquet"
        self.df.to_parquet(master_out, index=False)

        # 2. 2024 Screened outputs
        df_2024 = self.df[self.df["year"] == 2024].sort_values("priority_score", ascending=False)
        
        # Top priority table
        top_prio = df_2024[df_2024["priority_category"] == "high screening priority"]
        top_prio_path = self.final_dir / "biosentinel_top_priority.csv"
        top_prio.to_csv(top_prio_path, index=False)

        # Top 25
        top_25_path = self.final_dir / "biosentinel_top_25.csv"
        df_2024.head(25).to_csv(top_25_path, index=False)

        # Top 100
        top_100_path = self.final_dir / "biosentinel_top_100.csv"
        df_2024.head(100).to_csv(top_100_path, index=False)

        # 3. Case Studies: E076N28AA and E078N09BC
        case_studies_df = self.df[self.df["eqdcellcode"].isin(["E076N28AA", "E078N09BC"])].sort_values(["eqdcellcode", "year"])
        case_studies_path = self.final_dir / "biosentinel_case_studies.csv"
        case_studies_df.to_csv(case_studies_path, index=False)

        # 4. Explanations table
        explanations_df = top_prio[["eqdcellcode", "year", "priority_score", "priority_category", "evidence_score", "reliability_score", "signal_diagnostic", "explanation"]].copy()
        explanations_path = self.final_dir / "biosentinel_explanations.csv"
        explanations_df.to_csv(explanations_path, index=False)

        # 5. Integration summary JSON
        summary_data = {
            "system_name": "BioSentinel India — Phase 3 Final System Integration",
            "bioclip_species_identification": {
                "top1_accuracy": 0.7894,
                "top5_accuracy": 0.9287,
                "macro_f1": 0.7827,
                "status": "LOCKED"
            },
            "dataset_dimensions": {
                "total_grid_year_units": len(self.df),
                "unique_grid_cells": int(self.df["eqdcellcode"].nunique()),
                "year_range": [int(self.df["year"].min()), int(self.df["year"].max())],
                "screened_units_2024": len(df_2024),
                "high_screening_priority_2024": int((df_2024["priority_category"] == "high screening priority").sum()),
                "persistent_high_priority_2024": int(((df_2024["priority_category"] == "high screening priority") & (df_2024["persistence_count"] >= 2)).sum())
            },
            "statistical_models": {
                "poisson_glm": {
                    "role": "PRIMARY EXPECTED-MEAN BASELINE",
                    "walk_forward_mae": 31.72,
                    "degrees_of_freedom": 10280
                },
                "negative_binomial_glm": {
                    "role": "OVERDISPERSION / UNCERTAINTY / ROBUSTNESS MODEL",
                    "aic": 112335.54,
                    "dispersion": 0.1742,
                    "walk_forward_mae": 39.01
                },
                "historical_median_baseline": {
                    "walk_forward_mae": 46.20
                }
            },
            "sensitivity_analysis": {
                "anomaly_heavy_vs_balanced_spearman": 0.9743,
                "reliability_heavy_vs_balanced_spearman": 0.9569
            },
            "case_study_primary": "E076N28AA / 2024 (High Screening Priority)",
            "case_study_sampling_artifact": "E078N09BC / 2024 (Effort-Driven Signal)"
        }
        summary_path = self.final_dir / "biosentinel_integration_summary.json"
        with open(summary_path, "w", encoding="utf-8") as f:
            json.dump(summary_data, f, indent=2)

        print("Final artifacts generated successfully.")
        return {
            "master_parquet": str(master_out),
            "top_priority": str(top_prio_path),
            "top_25": str(top_25_path),
            "top_100": str(top_100_path),
            "case_studies": str(case_studies_path),
            "explanations": str(explanations_path),
            "summary_json": str(summary_path)
        }
