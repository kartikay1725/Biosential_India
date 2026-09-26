"""
BioSentinel India — Priority & Scoring Module
Defines mathematical scoring functions, decoupled priority formulations,
sensitivity configurations, and diagnostic attribution.
"""

from typing import Dict, Any, Tuple
import numpy as np
import pandas as pd


def compute_evidence_score(
    baseline_deviation_score: float,
    effort_adjusted_anomaly_score: float,
    composition_change_score: float,
    temporal_persistence_score: float,
    spatial_consistency_score: float,
    config: str = "balanced"
) -> float:
    """
    Computes decoupled evidence score from underlying multi-detector signals.
    
    Weights:
    - Balanced (Default): 50% baseline & effort anomaly, 20% composition, 30% persistence & spatial
    - Anomaly-Heavy: 70% baseline + effort anomaly, 15% composition, 15% persistence & spatial
    """
    if config == "anomaly_heavy":
        w_anomaly = 0.70
        w_comp = 0.15
        w_temp_spat = 0.15
    else:  # balanced or reliability_heavy
        w_anomaly = 0.50
        w_comp = 0.20
        w_temp_spat = 0.30

    anomaly_component = 0.5 * (baseline_deviation_score + effort_adjusted_anomaly_score)
    temp_spat_component = 0.5 * (temporal_persistence_score + spatial_consistency_score)

    score = (
        w_anomaly * anomaly_component +
        w_comp * composition_change_score +
        w_temp_spat * temp_spat_component
    )
    return float(np.clip(score, 0.0, 100.0))


def compute_reliability_score(
    baseline_support_score: float,
    temporal_coverage_score: float,
    effort_coverage_score: float,
    data_quality_score: float = 100.0
) -> float:
    """
    Computes reliability score capturing observation and historical support.
    Weights:
    - 35% Baseline history support (years available before target)
    - 25% Temporal coverage across study window
    - 25% Observation effort support level
    - 15% Underlying data quality & completeness
    """
    score = (
        0.35 * baseline_support_score +
        0.25 * temporal_coverage_score +
        0.25 * effort_coverage_score +
        0.15 * data_quality_score
    )
    return float(np.clip(score, 0.0, 100.0))


def compute_priority_score(
    evidence_score: float,
    reliability_score: float,
    config: str = "balanced"
) -> float:
    """
    Decoupled priority score:
    Priority = Evidence * (Reliability / 100)
    
    If config == 'reliability_heavy':
    Priority = Evidence * (Reliability / 100)^1.5
    """
    rel_factor = np.clip(reliability_score / 100.0, 0.0, 1.0)
    if config == "reliability_heavy":
        rel_factor = rel_factor ** 1.5
    
    priority = evidence_score * rel_factor
    return float(np.clip(priority, 0.0, 100.0))


def categorize_priority(
    priority_score: float,
    mod_cutoff: float = 30.10,
    high_cutoff: float = 38.42
) -> str:
    """
    Assigns screening priority category based on empirical empirical percentiles:
    - < 30.10 (75th percentile): low screening priority
    - 30.10 - 38.42 (75th - 95th percentile): moderate screening priority
    - >= 38.42 (>= 95th percentile): high screening priority
    """
    if priority_score >= high_cutoff:
        return "high screening priority"
    elif priority_score >= mod_cutoff:
        return "moderate screening priority"
    else:
        return "low screening priority"
