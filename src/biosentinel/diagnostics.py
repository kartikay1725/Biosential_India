"""
BioSentinel India — Diagnostics Module
Evaluates observation quality, effort shifts, historical baseline support,
and potential sampling-driven biases.
"""

from typing import Dict, Any, Optional
import pandas as pd
import numpy as np


def diagnose_data_quality_record(row: pd.Series) -> Dict[str, Any]:
    """
    Evaluates data quality, observation support, and sampling artifacts
    directly from an intelligence dataframe row.
    """
    total_occ = int(row.get("total_occurrences", 0))
    effort_change = float(row.get("effort_change_pct", 0.0))
    baseline_yrs = float(row.get("baseline_years", 0.0))
    support_lvl = str(row.get("sampling_support_level", "unknown"))
    temp_cov = float(row.get("grid_temporal_coverage_pct", 0.0))
    usable_cov = float(row.get("grid_usable_year_coverage_pct", 0.0))
    reliability = float(row.get("reliability_score", 0.0))
    
    # Assess possible effort-driven bias
    effort_bias_flag = False
    effort_bias_notes = []
    
    if effort_change < -50.0:
        effort_bias_flag = True
        effort_bias_notes.append(
            f"Severe negative observation-effort plunge ({effort_change:.1f}%). Apparent richness drop is likely sampling-driven."
        )
    elif effort_change > 200.0:
        effort_bias_flag = True
        effort_bias_notes.append(
            f"Massive positive observation-effort surge (+{effort_change:.1f}%). Richness growth is likely effort-driven."
        )
        
    if support_lvl == "limited" or total_occ < 30:
        effort_bias_notes.append(
            f"Sparse observation support ({total_occ} occurrences). Sampling is thin for statistical inference."
        )
        
    if baseline_yrs < 3.0:
        effort_bias_notes.append(
            f"Insufficient historical baseline ({baseline_yrs:.0f} years available; minimum 3 required for robust modeling)."
        )

    # Missing data indicators
    missing_indicators = {
        "missing_baseline": bool(baseline_yrs < 3.0),
        "insufficient_temporal_coverage": bool(temp_cov < 50.0),
        "sampling_discontinuity": bool(abs(effort_change) > 100.0),
        "sparse_occurrences": bool(total_occ < 30)
    }

    caution_level = "low"
    if reliability < 50.0 or effort_bias_flag:
        caution_level = "high"
    elif reliability < 70.0:
        caution_level = "moderate"

    return {
        "grid_cell": str(row.get("eqdcellcode")),
        "year": int(row.get("year")),
        "observation_effort": total_occ,
        "effort_change_pct": round(effort_change, 2),
        "spatial_coverage": "EQDGC 0.25° (~25km x 25km)",
        "temporal_coverage_pct": round(temp_cov, 1),
        "usable_year_coverage_pct": round(usable_cov, 1),
        "historical_support_years": round(baseline_yrs, 1),
        "sampling_support_level": support_lvl,
        "missing_data_indicators": missing_indicators,
        "possible_effort_driven_bias": effort_bias_flag,
        "effort_bias_notes": effort_bias_notes if effort_bias_notes else ["Observation effort is stable; no artifact detected."],
        "reliability_score": round(reliability, 2),
        "caution_level": caution_level
    }
