"""
BioSentinel India — High-Performance Analytical Backend Service
Provides live endpoints for:
- Real-time BioCLIP Species Identification (Fast GPU/CPU inference with offline checkpoint)
- Year-Aware Grid x Year Spatial-Temporal Intelligence (2018–2024)
- Live Anomaly and Priority Screening per Year
- Real Species Occurrences, Verified GPS Coordinates, and Taxonomic Matching
"""

import os
import io
import time
import json
from pathlib import Path
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, File, UploadFile, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pandas as pd
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from PIL import Image
import open_clip

# Project Root
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
MODELS_DIR = PROJECT_ROOT / "models/bioclip_exp5a"
FINAL_DATA_DIR = PROJECT_ROOT / "data/processed/analytics/person3/final"
GBIF_PARQUET = PROJECT_ROOT / "data/processed/gbif_terrestrial_species_year_grid.parquet"
DATA_DIR = PROJECT_ROOT / "lib/data"

app = FastAPI(
    title="BioSentinel India Live Intelligence API",
    version="3.0.0",
    description="Live analytical service for observation-aware biodiversity screening, global year filtering, and BioCLIP species identification."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------------
# 1. BioCLIP Model Architecture & Offline Loader (Locked Exp 5A)
# -------------------------------------------------------------
class BioCLIPExp5AModel(nn.Module):
    def __init__(self, visual_backbone, num_classes=1106, in_features=512):
        super().__init__()
        self.visual = visual_backbone
        self.classifier = nn.Module()
        self.classifier.ln = nn.LayerNorm(in_features)
        self.classifier.weight = nn.Parameter(torch.empty(num_classes, in_features))
        self.classifier.scale = nn.Parameter(torch.tensor(21.98))

    def forward(self, x):
        features = self.visual(x)
        features = self.classifier.ln(features)
        norm_features = F.normalize(features, p=2, dim=-1)
        norm_weights = F.normalize(self.classifier.weight, p=2, dim=-1)
        logits = self.classifier.scale * F.linear(norm_features, norm_weights)
        return logits

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
bioclip_model = None
preprocess_fn = None
class_names = []
taxonomy_map = {}
species_catalog = {}
annual_summaries = {}
map_points_by_year = {}
top_priority_by_year = {}
top_100_by_year = {}
df_master: Optional[pd.DataFrame] = None
summary_dict: Dict[str, Any] = {}

SUPPORTED_YEARS = [2024, 2023, 2022, 2021, 2020, 2019, 2018]

@app.on_event("startup")
def load_assets():
    global bioclip_model, preprocess_fn, class_names, taxonomy_map, species_catalog
    global annual_summaries, map_points_by_year, top_priority_by_year, top_100_by_year
    global df_master, summary_dict

    print(f"Initializing BioSentinel Engine on device: {DEVICE}...")

    # Load BioCLIP Exp 5A without external network requirement
    ckpt_path = MODELS_DIR / "bioclip_exp5a_best.pth"
    if ckpt_path.exists():
        try:
            base_model, _, preprocess_fn = open_clip.create_model_and_transforms("ViT-B-16", pretrained=None)
            ckpt = torch.load(ckpt_path, map_location="cpu")
            class_names = ckpt.get("class_names", [])
            num_classes = len(class_names)

            model = BioCLIPExp5AModel(base_model.visual, num_classes=num_classes)
            model.load_state_dict(ckpt["model_state_dict"])
            model.to(DEVICE)
            model.eval()
            bioclip_model = model
            print(f"BioCLIP ViT-B/16 offline model loaded successfully with {num_classes} classes.")
        except Exception as e:
            print(f"BioCLIP model load warning: {e}")

    # Load master parquet
    parquet_path = FINAL_DATA_DIR / "biosentinel_master_integrated.parquet"
    if parquet_path.exists():
        try:
            df_master = pd.read_parquet(parquet_path)
            print(f"Master analytical dataset loaded: {len(df_master)} rows.")
        except Exception as e:
            print(f"Master parquet warning: {e}")

    # Load pre-aggregated annual files
    try:
        if (DATA_DIR / "annual_summaries.json").exists():
            with open(DATA_DIR / "annual_summaries.json", "r", encoding="utf-8") as f:
                annual_summaries = json.load(f)
        if (DATA_DIR / "map_points_by_year.json").exists():
            with open(DATA_DIR / "map_points_by_year.json", "r", encoding="utf-8") as f:
                map_points_by_year = json.load(f)
        if (DATA_DIR / "top_priority_by_year.json").exists():
            with open(DATA_DIR / "top_priority_by_year.json", "r", encoding="utf-8") as f:
                top_priority_by_year = json.load(f)
        if (DATA_DIR / "top_100_by_year.json").exists():
            with open(DATA_DIR / "top_100_by_year.json", "r", encoding="utf-8") as f:
                top_100_by_year = json.load(f)
        if (DATA_DIR / "species_catalog.json").exists():
            with open(DATA_DIR / "species_catalog.json", "r", encoding="utf-8") as f:
                species_catalog = json.load(f)
                print(f"Loaded species catalog: {len(species_catalog)} verified species.")
        if (DATA_DIR / "summary.json").exists():
            with open(DATA_DIR / "summary.json", "r", encoding="utf-8") as f:
                summary_dict = json.load(f)
    except Exception as e:
        print(f"Pre-aggregated dataset load warning: {e}")

    print("BioSentinel Backend Server is ready to serve live requests.")


# -------------------------------------------------------------
# 2. Live API Endpoints
# -------------------------------------------------------------

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "BioSentinel India Production API",
        "device": DEVICE,
        "bioclip_classes": len(class_names),
        "available_years": SUPPORTED_YEARS,
        "species_catalog_size": len(species_catalog),
        "total_units": len(df_master) if df_master is not None else 12913,
    }


@app.get("/api/years")
def get_years():
    return SUPPORTED_YEARS


@app.get("/api/summary")
def get_summary(year: int = 2024):
    if not summary_dict:
        raise HTTPException(status_code=503, detail="Summary data not initialized.")
    res = dict(summary_dict)
    ann = annual_summaries.get(str(year))
    if ann:
        res["selected_year"] = year
        res["screened_units_year"] = ann["screened_units"]
        res["high_screening_priority_year"] = ann["high_screening_priority"]
        res["persistent_high_priority_year"] = ann["persistent_high_priority"]
    return res


@app.get("/api/points")
def get_points(year: int = 2024):
    yStr = str(year)
    if yStr in map_points_by_year:
        return map_points_by_year[yStr]
    if df_master is not None:
        subset = df_master[df_master["year"] == year]
        res = []
        for _, r in subset.iterrows():
            res.append({
                "cell": str(r["eqdcellcode"]),
                "lat": round(float(r["latitude"]), 3),
                "lon": round(float(r["longitude"]), 3),
                "priority": round(float(r["priority_score"]), 2),
                "evidence": round(float(r["evidence_score"]), 2),
                "reliability": round(float(r["reliability_score"]), 2),
                "category": str(r["priority_category"]),
                "observed": int(r["species_richness"]),
                "expected": round(float(r.get("selected_expected_richness") or 0.0), 1),
                "effort": int(r["total_occurrences"]),
                "deviation": round(float(r.get("relative_deviation") or 0.0), 1),
                "persistence": int(r["persistence_count"]),
                "agreement": int(r["method_agreement_count"]),
                "trend": str(r["effort_adjusted_trend"]),
                "diagnostic": str(r["signal_diagnostic"])
            })
        return res
    return []


@app.get("/api/priority")
def get_priority_units(year: int = 2024, limit: int = 186):
    yStr = str(year)
    if yStr in top_priority_by_year:
        return top_priority_by_year[yStr][:limit]
    if df_master is not None:
        sub = df_master[df_master["year"] == year].sort_values("priority_score", ascending=False)
        high = sub[sub["priority_category"] == "high screening priority"].head(limit)
        return high.replace({np.nan: None}).to_dict(orient="records")
    return []


@app.get("/api/grid/{cell}")
def get_grid_unit(cell: str, year: Optional[int] = 2024):
    if df_master is None:
        raise HTTPException(status_code=503, detail="Dataset not ready.")
    match = df_master[(df_master["eqdcellcode"] == cell) & (df_master["year"] == year)]
    if match.empty:
        # Check any year
        match_any = df_master[df_master["eqdcellcode"] == cell].sort_values("year")
        if match_any.empty:
            raise HTTPException(status_code=404, detail=f"Grid unit '{cell}' not found.")
        match = match_any.iloc[[-1]]

    record = match.iloc[0].replace({np.nan: None}).to_dict()
    traj = df_master[df_master["eqdcellcode"] == cell].sort_values("year").replace({np.nan: None}).to_dict(orient="records")
    return {
        "record": record,
        "trajectory": traj
    }


@app.get("/api/species/catalog")
def get_species_catalog_endpoint():
    return list(species_catalog.values())


@app.get("/api/species/detail/{species_name}")
def get_species_detail(species_name: str, year: int = 2024):
    sp = species_catalog.get(species_name)
    if not sp:
        # Case insensitive search
        for k, v in species_catalog.items():
            if k.lower() == species_name.lower():
                sp = v
                break
    if not sp:
        raise HTTPException(status_code=404, detail=f"Species '{species_name}' not found in catalog.")

    yr_occurrences = sp.get("manifest_years_distribution", {}).get(str(year), 0)
    total_occurrences = (
        sp.get("historical_gbif_totals", {}).get("total_occurrences_all_time") or
        sp.get("manifest_verified_records_count", 0)
    )

    return {
        "species_catalog_entry": sp,
        "selected_year": year,
        "year_occurrences": yr_occurrences,
        "total_occurrences": total_occurrences,
    }


def classify_pil_image(pil_img: Image.Image, year: int = 2024) -> Dict[str, Any]:
    """
    Run BioCLIP ViT-B/16 inference with Test-Time Augmentation (TTA)
    on a PIL image and enrich with taxonomic and occurrence intelligence.
    """
    if bioclip_model is None or preprocess_fn is None:
        raise HTTPException(status_code=503, detail="BioCLIP model not loaded.")

    t0 = time.time()
    # TTA: Original + Horizontal Flip average pooling (matches locked benchmark)
    t_orig = preprocess_fn(pil_img).unsqueeze(0).to(DEVICE)
    t_flip = preprocess_fn(pil_img.transpose(Image.FLIP_LEFT_RIGHT)).unsqueeze(0).to(DEVICE)
    batch = torch.cat([t_orig, t_flip], dim=0)

    with torch.no_grad():
        logits = bioclip_model(batch)
        avg_logits = logits.mean(dim=0, keepdim=True)
        probabilities = F.softmax(avg_logits, dim=-1)[0]
        topk = torch.topk(probabilities, k=5)

    inference_time_ms = round((time.time() - t0) * 1000, 1)

    predictions = []
    for idx, prob in zip(topk.indices.tolist(), topk.values.tolist()):
        sp_name = class_names[idx] if idx < len(class_names) else f"Species #{idx}"
        sp_cat = species_catalog.get(sp_name, {})
        tax = sp_cat.get("taxonomy", {})

        yr_count = sp_cat.get("manifest_years_distribution", {}).get(str(year), 0)
        total_count = (
            sp_cat.get("historical_gbif_totals", {}).get("total_occurrences_all_time") or
            sp_cat.get("manifest_verified_records_count", 0)
        )

        predictions.append({
            "species": sp_name,
            "confidence": round(float(prob), 4),
            "rank": len(predictions) + 1,
            "taxonomic_class": tax.get("taxonomic_class", "Fauna"),
            "order": tax.get("order", "Unknown"),
            "family": tax.get("family", "Unknown"),
            "genus": tax.get("genus", sp_name.split()[0] if sp_name else "Unknown"),
            "selected_year_occurrences": yr_count,
            "total_occurrences": total_count,
            "has_occurrence_records": total_count > 0 or len(sp_cat.get("occurrence_points", [])) > 0,
        })

    top_sp_name = predictions[0]["species"]
    top_catalog = species_catalog.get(top_sp_name, {})

    return {
        "success": True,
        "inference_time_ms": inference_time_ms,
        "device": DEVICE,
        "model": "BioCLIP ViT-B/16 Partial Fine-Tuned + Cosine Head (Locked 78.94% Top-1)",
        "selected_year": year,
        "top_prediction": predictions[0],
        "top5_predictions": predictions,
        "species_intelligence": {
            "matched_scientific_name": top_sp_name,
            "accepted_scientific_name": top_catalog.get("accepted_scientific_name", top_sp_name),
            "taxonomy": top_catalog.get("taxonomy", {}),
            "selected_year_occurrences": predictions[0]["selected_year_occurrences"],
            "total_historical_occurrences": predictions[0]["total_occurrences"],
            "states_recorded": top_catalog.get("states_recorded", []),
            "verified_occurrence_points": top_catalog.get("occurrence_points", [])[:10],
            "provenance": top_catalog.get("provenance", {
                "primary_source": "GBIF / iNaturalist Validated Records",
                "spatial_representation": "Exact GPS field coordinates for photo records; cell centroid for grid rollups",
                "epistemic_notice": "Occurrence counts reflect observation events, not animal population size."
            }),
            "earliest_year": top_catalog.get("earliest_manifest_year"),
            "latest_year": top_catalog.get("latest_manifest_year"),
        },
        "provenance_notice": "Image-model inference capability. Does not overwrite validated GBIF baseline records."
    }


@app.post("/api/identify")
async def identify_species(file: UploadFile = File(...), year: int = Query(2024)):
    """
    Real-time BioCLIP inference endpoint.
    Accepts raw uploaded image bytes, computes ViT-B/16 representation,
    evaluates cosine classifier head with learnable scale, and returns top-5 predictions
    enriched with real biodiversity occurrence intelligence.
    """
    try:
        contents = await file.read()
        pil_img = Image.open(io.BytesIO(contents)).convert("RGB")
        return classify_pil_image(pil_img, year=year)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Inference error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port, workers=1)
