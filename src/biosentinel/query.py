"""
BioSentinel India — Query Interface Module
Provides high-level, reviewer-friendly query functions for spatial-temporal intelligence,
data quality diagnosis, priority explanation, and coordinate mapping.
"""

from typing import Dict, Any, Optional, Union
import pandas as pd
import numpy as np

from .integration import BioSentinelPipeline
from .explain import generate_explanation, get_top_contributors_and_cautions
from .diagnostics import diagnose_data_quality_record


def analyze_grid_year(eqdcellcode: str, year: int) -> Dict[str, Any]:
    """
    Performs comprehensive multi-dimensional intelligence analysis on a single Grid x Year.
    Returns a structured object containing components A through N:
    A. observation summary
    B. biodiversity indicators
    C. observation effort
    D. historical baseline
    E. expected richness
    F. residual/deviation
    G. composition change
    H. temporal evidence
    I. spatial evidence
    J. anomaly detector outputs
    K. method agreement
    L. reliability
    M. final priority
    N. explanation
    """
    pipeline = BioSentinelPipeline.get_instance()
    match = pipeline.df[(pipeline.df["eqdcellcode"] == eqdcellcode) & (pipeline.df["year"] == int(year))]
    
    if match.empty:
        raise ValueError(f"Grid unit '{eqdcellcode}' for year {year} not found in authoritative dataset.")
        
    row = match.iloc[0].to_dict()
    
    # Generate explanation
    structured_explanation = generate_explanation(row)

    # Compile structured components A - N
    analysis = {
        "grid_cell": str(eqdcellcode),
        "year": int(year),
        "approximate_center": {
            "latitude": float(row.get("latitude", 0.0)),
            "longitude": float(row.get("longitude", 0.0)),
            "spatial_resolution": "0.25° (~25km x 25km)"
        },
        
        # A. Observation Summary
        "A_observation_summary": {
            "species_richness": int(row.get("species_richness", 0)),
            "total_occurrences": int(row.get("total_occurrences", 0)),
            "data_source": "GBIF Validated Occurrences"
        },
        
        # B. Biodiversity Indicators
        "B_biodiversity_indicators": {
            "shannon_diversity": round(float(row.get("shannon_diversity", 0.0)), 3),
            "simpson_diversity": round(float(row.get("simpson_diversity", 0.0)), 3),
            "pielou_evenness": round(float(row.get("pielou_evenness", 0.0)), 3)
        },
        
        # C. Observation Effort
        "C_observation_effort": {
            "log_effort": round(float(row.get("log_effort", 0.0)), 3),
            "effort_ratio": round(float(row.get("effort_ratio", 1.0)), 2),
            "effort_change_pct": round(float(row.get("effort_change_pct", 0.0)), 2),
            "sampling_support_level": str(row.get("sampling_support_level", "adequate")),
            "temporal_coverage_pct": round(float(row.get("grid_temporal_coverage_pct", 0.0)), 1)
        },
        
        # D. Historical Baseline
        "D_historical_baseline": {
            "baseline_years": round(float(row.get("baseline_years", 0.0)), 1),
            "historical_mean": round(float(row.get("historical_mean", 0.0)), 2),
            "historical_median": round(float(row.get("historical_median", 0.0)), 2),
            "baseline_supported": bool(row.get("baseline_supported", True))
        },
        
        # E. Expected Richness
        "E_expected_richness": {
            "poisson_expected_richness": round(float(row.get("poisson_expected_richness", 0.0)), 2),
            "poisson_role": "PRIMARY EXPECTED-MEAN BASELINE (lowest walk-forward MAE = 31.72)",
            "negative_binomial_expected_richness": round(float(row.get("negative_binomial_expected_richness", 0.0)), 2),
            "negbin_role": "OVERDISPERSION / UNCERTAINTY / ROBUSTNESS MODEL (dispersion = 0.17)",
            "selected_expected_richness": round(float(row.get("selected_expected_richness", row.get("poisson_expected_richness", 0.0))), 2)
        },
        
        # F. Residual / Deviation
        "F_residual_deviation": {
            "observed_minus_expected": round(float(row.get("observed_minus_expected", 0.0)), 2),
            "relative_deviation_pct": round(float(row.get("relative_deviation", 0.0)), 2),
            "standardized_residual": round(float(row.get("standardized_residual", 0.0)), 2),
            "poisson_standardized_residual": round(float(row.get("poisson_standardized_residual", 0.0)), 2),
            "effort_adjusted_residual": round(float(row.get("effort_adjusted_residual", 0.0)), 2)
        },
        
        # G. Composition Change
        "G_composition_change": {
            "jaccard_dissimilarity": round(float(row.get("jaccard_dissimilarity", 0.0)), 3),
            "composition_change_score": round(float(row.get("composition_change_score", 0.0)), 2)
        },
        
        # H. Temporal Evidence
        "H_temporal_evidence": {
            "trend": str(row.get("trend", "stable")),
            "effort_adjusted_trend": str(row.get("effort_adjusted_trend", "effort_adjusted_stable")),
            "temporal_slope": round(float(row.get("temporal_slope", 0.0)), 3),
            "effort_slope": round(float(row.get("effort_slope", 0.0)), 3),
            "effort_adjusted_slope": round(float(row.get("effort_adjusted_slope", 0.0)), 3),
            "persistence_count": int(row.get("persistence_count", 0)),
            "longest_anomaly_run": int(row.get("longest_anomaly_run", 0)),
            "recovery_signal": bool(row.get("recovery_signal", False))
        },
        
        # I. Spatial Evidence
        "I_spatial_evidence": {
            "neighbour_count": int(row.get("neighbour_count", 8)),
            "neighbour_anomaly_count": int(row.get("neighbour_anomaly_count", 0)),
            "neighbour_anomaly_proportion": round(float(row.get("neighbour_anomaly_proportion", 0.0)), 3),
            "spatial_consistency_score": round(float(row.get("spatial_consistency_score", 0.0)), 2)
        },
        
        # J. Anomaly Detector Outputs
        "J_anomaly_detectors": {
            "statistical_anomaly_flag": bool(row.get("statistical_anomaly_flag", False)),
            "poisson_flag": bool(row.get("poisson_flag", False)),
            "negative_binomial_flag": bool(row.get("negative_binomial_flag", False)),
            "isolation_forest_flag": bool(row.get("isolation_forest_flag", False)),
            "combined_anomaly_score": round(float(row.get("combined_anomaly_score", 0.0)), 2)
        },
        
        # K. Method Agreement
        "K_method_agreement": {
            "method_agreement_count": int(row.get("method_agreement_count", 0)),
            "method_agreement_pct": round(float(row.get("method_agreement_pct", 0.0)), 1)
        },
        
        # L. Reliability
        "L_reliability": {
            "coverage_support_score": round(float(row.get("coverage_support_score", 0.0)), 2),
            "data_quality_score": round(float(row.get("data_quality_score", 100.0)), 2),
            "reliability_score": round(float(row.get("reliability_score", 0.0)), 2)
        },
        
        # M. Final Priority
        "M_final_priority": {
            "evidence_score": round(float(row.get("evidence_score", 0.0)), 2),
            "reliability_score": round(float(row.get("reliability_score", 0.0)), 2),
            "priority_score": round(float(row.get("priority_score", 0.0)), 2),
            "priority_category": str(row.get("priority_category", "low screening priority"))
        },
        
        # N. Explanation
        "N_explanation": {
            "signal_diagnostic": str(row.get("signal_diagnostic", "expected_observation_pattern")),
            "pattern_type": str(row.get("pattern_type", "observation_pattern")),
            "structured_explanation": structured_explanation
        }
    }
    return analysis


def explain_priority(eqdcellcode: str, year: int) -> Dict[str, Any]:
    """
    Reviewer-friendly 'Why was this flagged?' diagnostic function.
    Returns:
    - grid_cell
    - year
    - priority_score
    - category
    - evidence_score
    - reliability_score
    - top_contributors (derived from actual metric magnitudes)
    - supporting_signals
    - caution_flags
    - explanation
    """
    pipeline = BioSentinelPipeline.get_instance()
    match = pipeline.df[(pipeline.df["eqdcellcode"] == eqdcellcode) & (pipeline.df["year"] == int(year))]
    if match.empty:
        raise ValueError(f"Grid unit '{eqdcellcode}' for year {year} not found.")
    
    row = match.iloc[0].to_dict()
    attr = get_top_contributors_and_cautions(row)
    explanation_txt = generate_explanation(row)
    
    return {
        "grid_cell": str(eqdcellcode),
        "year": int(year),
        "priority_score": round(float(row.get("priority_score", 0.0)), 2),
        "category": str(row.get("priority_category", "low screening priority")),
        "evidence_score": round(float(row.get("evidence_score", 0.0)), 2),
        "reliability_score": round(float(row.get("reliability_score", 0.0)), 2),
        "top_contributors": attr["top_contributors"],
        "supporting_signals": attr["supporting_signals"],
        "caution_flags": attr["caution_flags"],
        "explanation": explanation_txt
    }


def diagnose_data_quality(eqdcellcode: str, year: int) -> Dict[str, Any]:
    """
    Reviewer-friendly 'Why not trust this?' quality diagnostic function.
    Returns:
    - observation effort
    - effort change
    - spatial coverage
    - temporal coverage
    - historical support
    - sampling support level
    - missing-data indicators
    - possible effort-driven bias
    - reliability score
    """
    pipeline = BioSentinelPipeline.get_instance()
    match = pipeline.df[(pipeline.df["eqdcellcode"] == eqdcellcode) & (pipeline.df["year"] == int(year))]
    if match.empty:
        raise ValueError(f"Grid unit '{eqdcellcode}' for year {year} not found.")
    
    row = match.iloc[0]
    return diagnose_data_quality_record(row)


def biosentinel_query(
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    eqdcellcode: Optional[str] = None,
    year: int = 2024
) -> Dict[str, Any]:
    """
    Unified query interface for BioSentinel India.
    Accepts either an EQDGC cell code OR geographical coordinates (latitude, longitude).
    If coordinates are provided, maps to the nearest grid cell via KDTree and explicitly
    notes that coordinates represent the approximate cell centroid.
    """
    pipeline = BioSentinelPipeline.get_instance()
    approx_note = None
    query_dist = None

    if eqdcellcode is None:
        if latitude is None or longitude is None:
            raise ValueError("Must provide either 'eqdcellcode' or both 'latitude' and 'longitude'.")
        
        nearest_cell, center_lat, center_lon, dist = pipeline.query_nearest_grid(latitude, longitude)
        eqdcellcode = nearest_cell
        query_dist = round(dist, 4)
        approx_note = (
            f"Input ({latitude:.4f}, {longitude:.4f}) mapped to nearest EQDGC grid cell {nearest_cell} "
            f"(center: {center_lat:.4f}°N, {center_lon:.4f}°E; distance: {query_dist}°). "
            f"All biodiversity metrics reflect aggregated 0.25° grid unit area, not a specific point coordinate."
        )

    # Perform analysis
    analysis = analyze_grid_year(eqdcellcode, year)
    
    res = {
        "grid": eqdcellcode,
        "year": int(year),
        "location_mapping_note": approx_note,
        "query_distance_deg": query_dist,
        "approximate_grid_center": analysis["approximate_center"],
        "observed_richness": analysis["A_observation_summary"]["species_richness"],
        "effort": analysis["A_observation_summary"]["total_occurrences"],
        "expected_richness": analysis["E_expected_richness"]["selected_expected_richness"],
        "anomaly": {
            "relative_deviation_pct": analysis["F_residual_deviation"]["relative_deviation_pct"],
            "standardized_residual": analysis["F_residual_deviation"]["standardized_residual"],
            "combined_anomaly_score": analysis["J_anomaly_detectors"]["combined_anomaly_score"],
            "method_agreement_count": analysis["K_method_agreement"]["method_agreement_count"]
        },
        "priority": {
            "priority_score": analysis["M_final_priority"]["priority_score"],
            "category": analysis["M_final_priority"]["priority_category"],
            "evidence_score": analysis["M_final_priority"]["evidence_score"]
        },
        "reliability": {
            "reliability_score": analysis["L_reliability"]["reliability_score"],
            "sampling_support_level": analysis["C_observation_effort"]["sampling_support_level"],
            "historical_baseline_years": analysis["D_historical_baseline"]["baseline_years"]
        },
        "explanation": analysis["N_explanation"]["structured_explanation"]
    }
    return res
