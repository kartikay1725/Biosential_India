"""
BioSentinel India — Research Integration Layer
A reproducible analytical pipeline for observation-aware spatial-temporal biodiversity intelligence,
historical baseline modeling, effort-adjusted anomaly detection, and explainable prioritization.
"""

from .integration import BioSentinelPipeline
from .query import (
    analyze_grid_year,
    explain_priority,
    diagnose_data_quality,
    biosentinel_query
)
from .explain import (
    generate_explanation,
    get_top_contributors_and_cautions
)
from .priority import (
    compute_evidence_score,
    compute_reliability_score,
    compute_priority_score,
    categorize_priority
)
from .diagnostics import diagnose_data_quality_record

__version__ = "3.0.0"
__all__ = [
    "BioSentinelPipeline",
    "analyze_grid_year",
    "explain_priority",
    "diagnose_data_quality",
    "biosentinel_query",
    "generate_explanation",
    "get_top_contributors_and_cautions",
    "compute_evidence_score",
    "compute_reliability_score",
    "compute_priority_score",
    "categorize_priority",
    "diagnose_data_quality_record"
]
