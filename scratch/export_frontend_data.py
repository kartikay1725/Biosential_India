"""
Exports high-performance, typed JSON datasets from the authoritative Phase 3 artifacts
into lib/data/ for direct zero-latency consumption by Next.js server components and APIs.
"""

import json
from pathlib import Path
import pandas as pd
import numpy as np

PROJECT_ROOT = Path("D:/Biosential_India")
FINAL_DIR = PROJECT_ROOT / "data/processed/analytics/person3/final"
OUT_DIR = PROJECT_ROOT / "lib/data"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# 1. Summary JSON
with open(FINAL_DIR / "biosentinel_integration_summary.json", "r") as f:
    summary_data = json.load(f)

with open(OUT_DIR / "summary.json", "w", encoding="utf-8") as f:
    json.dump(summary_data, f, indent=2)

# 2. Master integrated parquet
df_master = pd.read_parquet(FINAL_DIR / "biosentinel_master_integrated.parquet")

# 3. 2024 Screened Units
df_2024 = df_master[df_master["year"] == 2024].sort_values("priority_score", ascending=False)

# Top 186 high priority units
high_prio = df_2024[df_2024["priority_category"] == "high screening priority"]
high_prio_records = high_prio.to_dict(orient="records")
# Convert any numpy types
with open(OUT_DIR / "top_priority_2024.json", "w", encoding="utf-8") as f:
    json.dump(high_prio_records, f, indent=2, default=str)

# Top 100 units
top_100_records = df_2024.head(100).to_dict(orient="records")
with open(OUT_DIR / "top_100_2024.json", "w", encoding="utf-8") as f:
    json.dump(top_100_records, f, indent=2, default=str)

# 4. Lightweight Map Points for all 2,630 screened units in 2024
map_points = []
for _, r in df_2024.iterrows():
    map_points.append({
        "cell": str(r["eqdcellcode"]),
        "lat": round(float(r["latitude"]), 3),
        "lon": round(float(r["longitude"]), 3),
        "priority": round(float(r["priority_score"]), 2),
        "evidence": round(float(r["evidence_score"]), 2),
        "reliability": round(float(r["reliability_score"]), 2),
        "category": str(r["priority_category"]),
        "observed": int(r["species_richness"]),
        "expected": round(float(r["selected_expected_richness"]), 1),
        "effort": int(r["total_occurrences"]),
        "deviation": round(float(r["relative_deviation"]), 1),
        "persistence": int(r["persistence_count"]),
        "agreement": int(r["method_agreement_count"]),
        "trend": str(r["effort_adjusted_trend"]),
        "diagnostic": str(r["signal_diagnostic"])
    })

with open(OUT_DIR / "map_points_2024.json", "w", encoding="utf-8") as f:
    json.dump(map_points, f, indent=1)

# 5. Case Studies Full Trajectories
cs_df = df_master[df_master["eqdcellcode"].isin(["E076N28AA", "E078N09BC"])].sort_values(["eqdcellcode", "year"])
case_studies = {
    "E076N28AA": cs_df[cs_df["eqdcellcode"] == "E076N28AA"].to_dict(orient="records"),
    "E078N09BC": cs_df[cs_df["eqdcellcode"] == "E078N09BC"].to_dict(orient="records")
}
with open(OUT_DIR / "case_studies.json", "w", encoding="utf-8") as f:
    json.dump(case_studies, f, indent=2, default=str)

# 6. Species list for E076N28AA 2024
import sys
sys.path.insert(0, str(PROJECT_ROOT / "src"))
import biosentinel as bs
pipeline = bs.BioSentinelPipeline.get_instance(load_species=False)
sp_df = pipeline.get_species_list("E076N28AA", 2024)
sp_records = sp_df.replace({np.nan: None}).to_dict(orient="records")
with open(OUT_DIR / "species_e076n28aa.json", "w", encoding="utf-8") as f:
    json.dump(sp_records, f, indent=2)

# 7. Trend distribution summary across all 12,913 units
trend_counts = df_master["effort_adjusted_trend"].value_counts().to_dict()
trend_stats = []
for cat, cnt in trend_counts.items():
    subset = df_master[df_master["effort_adjusted_trend"] == cat]
    trend_stats.append({
        "category": cat,
        "count": int(cnt),
        "percentage": round(float(cnt / len(df_master) * 100), 1),
        "mean_raw_slope": round(float(subset["temporal_slope"].mean()), 2) if "temporal_slope" in subset else 0.0,
        "mean_effort_slope": round(float(subset["effort_slope"].mean()), 3) if "effort_slope" in subset else 0.0,
        "mean_adjusted_slope": round(float(subset["effort_adjusted_slope"].mean()), 3) if "effort_adjusted_slope" in subset else 0.0
    })

with open(OUT_DIR / "trend_summary.json", "w", encoding="utf-8") as f:
    json.dump(trend_stats, f, indent=2)

print("Export completed successfully into lib/data/")
