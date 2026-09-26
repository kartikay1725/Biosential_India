"""
BioSentinel India — Explainability Module
Generates human-readable, evidence-traceable explanations and priority attribution.
Every statement is derived strictly from stored statistical metrics.
"""

from typing import Dict, Any, List
import pandas as pd
import numpy as np


def generate_explanation(record: Dict[str, Any]) -> str:
    """
    Generates a structured, multi-section analytical explanation for a Grid x Year unit.
    Follows strict BioSentinel explainability structure:
    SUMMARY, OBSERVATION, EFFORT, BASELINE, ANOMALY EVIDENCE, TEMPORAL EVIDENCE,
    SPATIAL EVIDENCE, RELIABILITY, PRIORITY, CAUTION, INTERPRETATION.
    """
    cell = record.get("eqdcellcode", "Unknown")
    year = record.get("year", "Unknown")
    obs_richness = int(record.get("species_richness", 0))
    occurrences = int(record.get("total_occurrences", 0))
    
    # Baseline
    exp_richness = float(record.get("poisson_expected_richness") or record.get("expected_richness") or 0.0)
    base_mean = float(record.get("baseline_richness_mean") or record.get("historical_mean") or 0.0)
    base_years = float(record.get("baseline_years", 0.0))
    
    # Deviation
    rel_dev = float(record.get("relative_deviation") or record.get("relative_richness_deviation") or 0.0)
    std_res = float(record.get("standardized_residual", 0.0))
    poisson_res = float(record.get("poisson_standardized_residual", 0.0))
    
    # Persistence & Spatial
    pers_count = int(record.get("persistence_count", 0))
    neigh_anom = int(record.get("neighbour_anomaly_count", 0))
    neigh_prop = float(record.get("neighbour_anomaly_proportion", 0.0))
    
    # Scores
    evidence = float(record.get("evidence_score", 0.0))
    reliability = float(record.get("reliability_score", 0.0))
    priority = float(record.get("priority_score", 0.0))
    category = str(record.get("priority_category", "screening priority")).title()
    diag = str(record.get("signal_diagnostic", "expected_observation_pattern"))
    support_lvl = str(record.get("sampling_support_level", "adequate"))
    effort_change = float(record.get("effort_change_pct", 0.0))
    
    # Summary header
    if diag == "effort_driven_signal":
        summary_txt = "Sampling artifact detected — apparent richness shifts are dominated by observation effort fluctuations."
    elif priority >= 38.42:
        summary_txt = f"Potentially unusual observation-derived biodiversity pattern requiring high screening priority (Priority: {priority:.1f}/100)."
    elif priority >= 30.10:
        summary_txt = f"Moderate observation-derived screening signal (Priority: {priority:.1f}/100)."
    else:
        summary_txt = "Observation metrics conform closely to expected baseline distributions."

    lines = [
        "SUMMARY:",
        f"{summary_txt}",
        "",
        "OBSERVATION:",
        f"{obs_richness} species observed from {occurrences} occurrence records.",
        "",
        "EFFORT:",
        f"Log-effort is {record.get('log_effort', 0.0):.2f}. Observation effort changed by {effort_change:+.1f}% relative to prior periods ({support_lvl} sampling support).",
        "",
        "BASELINE:",
        f"Historical conditional expectation is {exp_richness:.1f} species (historical baseline mean = {base_mean:.1f} species over {base_years:.0f} prior years).",
        "",
        "ANOMALY EVIDENCE:",
        f"Observed richness is {abs(rel_dev):.1f}% {'below' if rel_dev < 0 else 'above'} effort-adjusted expectation (Residual = {std_res:.2f}σ, Poisson deviance = {poisson_res:.2f}σ).",
        "",
        "TEMPORAL EVIDENCE:",
        f"Signal demonstrates temporal persistence across {pers_count} consecutive supported year(s). Effort-adjusted trend: {record.get('effort_adjusted_trend', 'stable')}.",
        "",
        "SPATIAL EVIDENCE:",
        f"{neigh_anom} adjacent neighboring grid cell(s) exhibit coincident anomaly signals ({neigh_prop*100:.1f}% spatial agreement).",
        "",
        "RELIABILITY:",
        f"Reliability score is {reliability:.1f} / 100 ({support_lvl} sampling support, {base_years:.0f} baseline years, {record.get('grid_temporal_coverage_pct', 0.0):.1f}% temporal coverage).",
        "",
        "PRIORITY:",
        f"{priority:.1f} / 100 — {category}.",
        "",
        "CAUTION:",
        "This is an observation-derived screening signal, not confirmation of biodiversity loss, population decline, or ecological causation.",
        "",
        "INTERPRETATION:",
        f"Diagnostic state: {diag}. BioSentinel transforms heterogeneous volunteer observations into effort-controlled prioritization indices. Reviewers should assess field survey feasibility rather than infer direct ground-truth loss."
    ]
    return "\n".join(lines)


def get_top_contributors_and_cautions(record: Dict[str, Any]) -> Dict[str, Any]:
    """
    Computes top mathematical contributors to the priority score
    and extracts caution flags directly from metric magnitudes.
    """
    # Magnitudes of components
    components = {
        "Baseline Expectation Deviation": float(abs(record.get("relative_deviation") or record.get("relative_richness_deviation") or 0.0)),
        "Effort-Adjusted GLM Residual": float(abs(record.get("standardized_residual", 0.0))) * 15.0,
        "Compositional Turnover": float(record.get("composition_change_score", 0.0)),
        "Multi-Year Persistence": float(record.get("temporal_persistence_score", 0.0)),
        "Spatial Cluster Coherence": float(record.get("spatial_consistency_score", 0.0))
    }
    
    # Sort by magnitude descending
    sorted_comps = sorted(components.items(), key=lambda x: x[1], reverse=True)
    top_contributors = [k for k, v in sorted_comps if v > 15.0][:3]
    if not top_contributors:
        top_contributors = ["Observation distribution within historical bounds"]

    # Supporting signals
    supporting_signals = []
    if record.get("stat_anomaly_flag") or record.get("statistical_anomaly_flag"):
        supporting_signals.append("Statistical deviation exceeds historical IQR threshold")
    if record.get("poisson_flag"):
        supporting_signals.append("Poisson conditional mean residual beyond 2-sigma cutoff")
    if record.get("negbin_flag") or record.get("negative_binomial_flag"):
        supporting_signals.append("Negative binomial overdispersion boundary exceeded")
    if int(record.get("persistence_count", 0)) >= 2:
        supporting_signals.append(f"Multi-year persistence confirmed ({int(record.get('persistence_count', 0))} consecutive years)")
    if int(record.get("neighbour_anomaly_count", 0)) > 0:
        supporting_signals.append(f"Spatial clustering observed with {int(record.get('neighbour_anomaly_count', 0))} adjacent anomalies")
    if not supporting_signals:
        supporting_signals.append("No independent anomaly detectors triggered")

    # Caution flags
    caution_flags = []
    effort_change = float(record.get("effort_change_pct", 0.0))
    if effort_change < -50.0:
        caution_flags.append(f"Significant effort collapse ({effort_change:.1f}%): signal may be sampling-driven")
    elif effort_change > 150.0:
        caution_flags.append(f"Large effort surge (+{effort_change:.1f}%): apparent richness increase reflects sampling")
    
    if float(record.get("baseline_years", 0.0)) < 4.0:
        caution_flags.append(f"Short historical baseline ({record.get('baseline_years', 0.0):.0f} years): expectation is uncertain")
        
    if float(record.get("reliability_score", 0.0)) < 60.0:
        caution_flags.append(f"Sub-optimal reliability score ({record.get('reliability_score', 0.0):.1f}/100): low sampling support")

    if str(record.get("signal_diagnostic")) == "effort_driven_signal":
        caution_flags.append("Identified as 'effort_driven_signal': do not treat as ecological biodiversity decline")

    if not caution_flags:
        caution_flags.append("Adequate sampling support and stable historical baseline")

    return {
        "top_contributors": top_contributors,
        "supporting_signals": supporting_signals,
        "caution_flags": caution_flags
    }
