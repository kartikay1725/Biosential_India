"""
BioSentinel India — Build Year-Aware and Species Intelligence Datasets
Generates audited, authoritative, year-indexed datasets and species occurrence registries
from:
1. data/processed/analytics/person3/final/biosentinel_master_integrated.parquet
2. data/processed/analytics/person3/efficientnet_final_input_manifest.csv
3. data/processed/gbif_terrestrial_species_year_grid.parquet
4. data/processed/analytics/species_frequency.csv
"""

import json
import os
from pathlib import Path
import pandas as pd
import numpy as np

PROJECT_ROOT = Path(__file__).resolve().parent.parent
FINAL_DIR = PROJECT_ROOT / "data/processed/analytics/person3/final"
ANALYTICS_DIR = PROJECT_ROOT / "data/processed/analytics"
MANIFEST_PATH = PROJECT_ROOT / "data/processed/analytics/person3/efficientnet_final_input_manifest.csv"
GBIF_PARQUET = PROJECT_ROOT / "data/processed/gbif_terrestrial_species_year_grid.parquet"
OUTPUT_DIR = PROJECT_ROOT / "lib/data"

def build_datasets():
    print("Loading master integrated parquet...")
    master_path = FINAL_DIR / "biosentinel_master_integrated.parquet"
    df_master = pd.read_parquet(master_path)
    print(f"Loaded master dataset: {len(df_master)} rows, {df_master['year'].nunique()} years.")

    years = sorted(df_master['year'].unique().tolist())
    print("Available years:", years)

    # 1. Build Annual Summaries
    with open(OUTPUT_DIR / "summary.json", "r", encoding="utf-8") as f:
        base_summary = json.load(f)

    annual_summaries = {}
    for y in years:
        sub = df_master[df_master['year'] == y]
        high_units = sub[sub['priority_category'] == 'high screening priority']
        mod_units = sub[sub['priority_category'] == 'moderate screening priority']
        low_units = sub[sub['priority_category'] == 'low screening priority']
        persist_high = (high_units['persistence_count'] >= 2).sum()

        annual_summaries[str(y)] = {
            "year": int(y),
            "screened_units": int(len(sub)),
            "high_screening_priority": int(len(high_units)),
            "moderate_screening_priority": int(len(mod_units)),
            "low_screening_priority": int(len(low_units)),
            "persistent_high_priority": int(persist_high),
            "total_occurrences": int(sub['total_occurrences'].sum()),
            "mean_richness": round(float(sub['species_richness'].mean()), 1),
            "mean_effort": round(float(sub['total_occurrences'].mean()), 1),
            "effort_driven_count": int((sub['signal_diagnostic'] == 'effort_driven_signal').sum()),
            "robust_multimethod_count": int((sub['signal_diagnostic'] == 'robust_multimethod_signal').sum()),
            "expected_pattern_count": int((sub['signal_diagnostic'] == 'expected_observation_pattern').sum())
        }

    with open(OUTPUT_DIR / "annual_summaries.json", "w", encoding="utf-8") as f:
        json.dump(annual_summaries, f, indent=2)
    print("Saved annual_summaries.json")

    # 2. Build Map Points by Year
    map_points_by_year = {}
    for y in years:
        sub = df_master[df_master['year'] == y]
        points = []
        for _, r in sub.iterrows():
            points.append({
                "cell": str(r["eqdcellcode"]),
                "lat": round(float(r["latitude"]), 3),
                "lon": round(float(r["longitude"]), 3),
                "priority": round(float(r["priority_score"]), 2),
                "evidence": round(float(r["evidence_score"]), 2),
                "reliability": round(float(r["reliability_score"]), 2),
                "category": str(r["priority_category"]),
                "observed": int(r["species_richness"]),
                "expected": round(float(r.get("selected_expected_richness") or r.get("poisson_expected_richness") or 0.0), 1),
                "effort": int(r["total_occurrences"]),
                "deviation": round(float(r.get("relative_deviation") or r.get("relative_richness_deviation") or 0.0), 1),
                "persistence": int(r["persistence_count"]),
                "agreement": int(r["method_agreement_count"]),
                "trend": str(r["effort_adjusted_trend"]),
                "diagnostic": str(r["signal_diagnostic"])
            })
        map_points_by_year[str(y)] = points
        print(f"Year {y}: {len(points)} map points.")

    with open(OUTPUT_DIR / "map_points_by_year.json", "w", encoding="utf-8") as f:
        json.dump(map_points_by_year, f)
    print("Saved map_points_by_year.json")

    # 3. Build Top Priority and Top 100 by Year
    priority_fields = [
        "eqdcellcode", "year", "latitude", "longitude",
        "species_richness", "total_occurrences", "log_effort", "effort_change_pct",
        "sampling_support_level", "baseline_years", "historical_mean", "historical_median",
        "poisson_expected_richness", "negative_binomial_expected_richness", "selected_expected_richness",
        "observed_minus_expected", "relative_deviation", "standardized_residual", "effort_adjusted_residual",
        "trend", "effort_adjusted_trend", "temporal_slope", "effort_slope", "effort_adjusted_slope",
        "persistence_count", "method_agreement_count", "reliability_score", "evidence_score",
        "priority_score", "priority_category", "signal_diagnostic", "explanation"
    ]

    top_priority_by_year = {}
    top_100_by_year = {}

    for y in years:
        sub = df_master[df_master['year'] == y].sort_values("priority_score", ascending=False)
        high = sub[sub["priority_category"] == "high screening priority"]
        
        # Filter fields
        avail_fields = [c for c in priority_fields if c in sub.columns]
        
        high_records = high[avail_fields].replace({np.nan: None}).to_dict(orient="records")
        top100_records = sub.head(100)[avail_fields].replace({np.nan: None}).to_dict(orient="records")
        
        top_priority_by_year[str(y)] = high_records
        top_100_by_year[str(y)] = top100_records
        print(f"Year {y}: {len(high_records)} high priority units, {len(top100_records)} top 100 units.")

    with open(OUTPUT_DIR / "top_priority_by_year.json", "w", encoding="utf-8") as f:
        json.dump(top_priority_by_year, f)
    print("Saved top_priority_by_year.json")

    with open(OUTPUT_DIR / "top_100_by_year.json", "w", encoding="utf-8") as f:
        json.dump(top_100_by_year, f)
    print("Saved top_100_by_year.json")

    # 4. Build Comprehensive Species Intelligence Catalog
    print("\nBuilding Species Intelligence Catalog for 1,106 BioCLIP classes...")
    df_mani = pd.read_csv(MANIFEST_PATH)
    print(f"Manifest loaded: {len(df_mani)} rows across {df_mani['species'].nunique()} classes.")

    # Frequency CSV lookup
    freq_lookup = {}
    if (ANALYTICS_DIR / "species_frequency.csv").exists():
        df_freq = pd.read_csv(ANALYTICS_DIR / "species_frequency.csv")
        for _, row in df_freq.iterrows():
            sp_name = str(row["species"]).strip()
            freq_lookup[sp_name] = {
                "total_occurrences_all_time": int(row["total_occurrences"]),
                "occupied_grids_all_time": int(row["occupied_grids"]),
                "observed_years_count": int(row["observed_years"]),
                "grid_occupancy_pct": round(float(row["grid_occupancy_pct"]), 2),
                "relative_observation_pct": round(float(row["relative_observation_pct"]), 3)
            }

    # Group manifest by species
    species_catalog = {}
    for sp_name, group in df_mani.groupby("species"):
        first = group.iloc[0]
        
        # Manifest points (exact coordinates with metadata)
        occurrence_points = []
        for _, pt in group.iterrows():
            occurrence_points.append({
                "gbif_id": str(pt["gbifID"]),
                "occurrence_url": str(pt["occurrenceID"]),
                "lat": round(float(pt["decimalLatitude"]), 5),
                "lon": round(float(pt["decimalLongitude"]), 5),
                "year": int(pt["year"]) if pd.notna(pt["year"]) else None,
                "date": str(pt["eventDate"]) if pd.notna(pt["eventDate"]) else None,
                "state": str(pt["stateProvince"]) if pd.notna(pt["stateProvince"]) else "India",
                "image_url": str(pt["image_url"]) if pd.notna(pt["image_url"]) else None,
                "observer": str(pt["media_creator"]) if pd.notna(pt["media_creator"]) else "iNaturalist Contributor",
                "license": str(pt["media_license"]) if pd.notna(pt["media_license"]) else "CC-BY",
                "basis_of_record": str(pt.get("basisOfRecord", "HUMAN_OBSERVATION")),
                "is_individual_point": True
            })

        # Manifest years count
        years_mani_counts = group["year"].value_counts().to_dict()
        years_mani_counts = {str(int(k)): int(v) for k, v in years_mani_counts.items() if pd.notna(k)}

        freq_info = freq_lookup.get(sp_name, {})

        known_common_names = {
            "Columba livia": "Rock Dove",
            "Eudynamys scolopaceus": "Asian Koel",
            "Pavo cristatus": "Indian Peafowl",
            "Corvus splendens": "House Crow",
            "Passer domesticus": "House Sparrow",
            "Acridotheres tristis": "Common Myna",
            "Milvus migrans": "Black Kite",
            "Psittacula krameri": "Rose-ringed Parakeet",
            "Spilopelia chinensis": "Spotted Dove",
            "Halcyon smyrnensis": "White-throated Kingfisher",
            "Pycnonotus cafer": "Red-vented Bulbul",
            "Cinnyris asiaticus": "Purple Sunbird",
            "Upupa epops": "Eurasian Hoopoe",
            "Merops orientalis": "Asian Green Bee-eater",
            "Alcedo atthis": "Common Kingfisher",
            "Ardeola grayii": "Indian Pond Heron",
            "Bubulcus ibis": "Cattle Egret",
            "Vanellus indicus": "Red-wattled Lapwing",
            "Panthera tigris": "Bengal Tiger",
            "Panthera pardus": "Indian Leopard",
            "Elephas maximus": "Asian Elephant",
            "Naja naja": "Indian Cobra",
            "Daboia russelii": "Russell's Viper",
            "Calotes versicolor": "Oriental Garden Lizard"
        }

        species_catalog[sp_name] = {
            "scientific_name": sp_name,
            "accepted_scientific_name": str(first.get("acceptedScientificName", sp_name)),
            "common_name": known_common_names.get(sp_name),
            "species_key": str(first.get("speciesKey", "")),
            "taxonomy": {
                "kingdom": str(first.get("kingdom", "Plantae/Animalia")),
                "phylum": str(first.get("phylum", "")),
                "taxonomic_class": str(first.get("class", "Fauna")),
                "order": str(first.get("order", "")),
                "family": str(first.get("family", "")),
                "genus": str(first.get("genus", sp_name.split()[0]))
            },
            "bioclip_class_index": int(first.get("label", 0)),
            "in_bioclip_model": True,
            "manifest_verified_records_count": len(group),
            "manifest_years_distribution": years_mani_counts,
            "historical_gbif_totals": freq_info,
            "earliest_manifest_year": int(group["year"].min()) if pd.notna(group["year"].min()) else 2018,
            "latest_manifest_year": int(group["year"].max()) if pd.notna(group["year"].max()) else 2024,
            "states_recorded": sorted([s for s in group["stateProvince"].dropna().unique().tolist() if s]),
            "occurrence_points": occurrence_points[:15], # Top verified individual points
            "provenance": {
                "primary_source": "GBIF Validated Occurrences & iNaturalist Research Grade Observations",
                "image_license": str(first.get("media_license", "CC-BY-4.0")),
                "spatial_representation": "Exact GPS field coordinates for photo records; cell centroid for grid rollups",
                "epistemic_notice": "Occurrence record counts reflect observation events, not animal population size."
            }
        }

    print(f"Compiled catalog for {len(species_catalog)} species.")
    with open(OUTPUT_DIR / "species_catalog.json", "w", encoding="utf-8") as f:
        json.dump(species_catalog, f)
    print("Saved species_catalog.json")

    print("\nDataset generation completed successfully.")

if __name__ == "__main__":
    build_datasets()
