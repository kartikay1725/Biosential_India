"""
BioSentinel India — High-Performance Analytical Backend Service
Provides live endpoints for:
- Real-time BioCLIP Species Identification (Fast inference on GPU/CPU)
- Authoritative Grid x Year Spatial-Temporal Intelligence
- Live 2,630 Grid Anomaly and Priority Screening
- Species occurrences and taxonomy drill-down
"""

import os
import io
import time
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
PROJECT_ROOT = Path("D:/Biosential_India")
MODELS_DIR = PROJECT_ROOT / "models/bioclip_exp5a"
FINAL_DATA_DIR = PROJECT_ROOT / "data/processed/analytics/person3/final"
GBIF_PARQUET = PROJECT_ROOT / "data/processed/gbif_terrestrial_species_year_grid.parquet"

app = FastAPI(
    title="BioSentinel India Live Intelligence API",
    version="3.0.0",
    description="Live analytical service for observation-aware biodiversity screening and BioCLIP species identification."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------------
# 1. BioCLIP Model Architecture & Loader (Locked Exp 5A)
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

# -------------------------------------------------------------
# 2. In-Memory Data Registries
# -------------------------------------------------------------
df_master: Optional[pd.DataFrame] = None
summary_dict: Dict[str, Any] = {}
map_points_cache: List[Dict[str, Any]] = []


@app.on_event("startup")
def load_assets():
    global bioclip_model, preprocess_fn, class_names, taxonomy_map, df_master, summary_dict, map_points_cache

    print(f"Initializing BioSentinel Engine on device: {DEVICE}...")

    # Load BioCLIP Exp 5A
    ckpt_path = MODELS_DIR / "bioclip_exp5a_best.pth"
    if ckpt_path.exists():
        base_model, _, preprocess_fn = open_clip.create_model_and_transforms("hf-hub:imageomics/bioclip")
        ckpt = torch.load(ckpt_path, map_location="cpu")
        class_names = ckpt.get("class_names", [])
        num_classes = len(class_names)

        model = BioCLIPExp5AModel(base_model.visual, num_classes=num_classes)
        model.load_state_dict(ckpt["model_state_dict"])
        model.to(DEVICE)
        model.eval()
        bioclip_model = model
        print(f"BioCLIP ViT-B/16 model loaded successfully with {num_classes} classes.")

    # Load master parquet
    parquet_path = FINAL_DATA_DIR / "biosentinel_master_integrated.parquet"
    if parquet_path.exists():
        df_master = pd.read_parquet(parquet_path)
        print(f"Master analytical dataset loaded: {len(df_master)} rows.")

        # Cache map points
        df_2024 = df_master[df_master["year"] == 2024]
        for _, r in df_2024.iterrows():
            map_points_cache.append({
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
        print(f"Map points cache prepared: {len(map_points_cache)} 2024 points.")

    # Load summary JSON
    summary_path = FINAL_DATA_DIR / "biosentinel_integration_summary.json"
    if summary_path.exists():
        import json
        with open(summary_path, "r", encoding="utf-8") as f:
            summary_dict = json.load(f)

    # Build taxonomy mapping for class names
    if GBIF_PARQUET.exists():
        try:
            print("Indexing taxonomy hierarchy...")
            sp_sample = pd.read_parquet(GBIF_PARQUET, columns=["species", "class", "order", "family", "genus"]).drop_duplicates("species")
            for _, r in sp_sample.iterrows():
                taxonomy_map[r["species"]] = {
                    "taxonomic_class": str(r["class"]),
                    "order": str(r["order"]),
                    "family": str(r["family"]),
                    "genus": str(r["genus"]),
                }
            print(f"Indexed {len(taxonomy_map)} species taxonomy records.")
        except Exception as e:
            print(f"Taxonomy index warning: {e}")

    print("BioSentinel Backend Server is ready to serve live requests.")


# -------------------------------------------------------------
# 3. Live API Endpoints
# -------------------------------------------------------------

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "BioSentinel India Production API",
        "device": DEVICE,
        "bioclip_classes": len(class_names),
        "total_units": len(df_master) if df_master is not None else 0,
        "screened_2024_units": len(map_points_cache)
    }


@app.get("/api/summary")
def get_summary():
    if not summary_dict:
        raise HTTPException(status_code=503, detail="Summary data not initialized.")
    return summary_dict


@app.get("/api/points")
def get_points(year: int = 2024):
    if year == 2024:
        return map_points_cache
    if df_master is None:
        raise HTTPException(status_code=503, detail="Dataset not ready.")
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


@app.get("/api/priority")
def get_priority_units(limit: int = 186):
    if df_master is None:
        raise HTTPException(status_code=503, detail="Dataset not ready.")
    df_2024 = df_master[df_master["year"] == 2024].sort_values("priority_score", ascending=False)
    high = df_2024[df_2024["priority_category"] == "high screening priority"].head(limit)
    return high.replace({np.nan: None}).to_dict(orient="records")


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
    # Also get trajectory
    traj = df_master[df_master["eqdcellcode"] == cell].sort_values("year").replace({np.nan: None}).to_dict(orient="records")
    return {
        "record": record,
        "trajectory": traj
    }


@app.get("/api/species/{cell}")
def get_species_occurrences(cell: str, year: int = 2024):
    if not GBIF_PARQUET.exists():
        raise HTTPException(status_code=503, detail="Species parquet not found.")
    try:
        sp_df = pd.read_parquet(
            GBIF_PARQUET,
            filters=[("eqdcellcode", "==", cell), ("year", "==", int(year))]
        )
        if sp_df.empty:
            return []
        res = sp_df.copy().rename(columns={"species": "scientific_name", "class": "taxonomic_class"})
        res["data_source"] = "GBIF Verified Occurrence"
        res["bioclip_image_evaluable"] = True
        res["bioclip_confidence"] = None
        sorted_sp = res[["scientific_name", "taxonomic_class", "occurrences", "data_source", "bioclip_image_evaluable", "bioclip_confidence"]].sort_values("occurrences", ascending=False)
        return sorted_sp.to_dict(orient="records")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/search")
def search_cells(q: str = Query(..., min_length=1)):
    if df_master is None:
        return []
    query_upper = q.strip().toUpperCase() if hasattr(q, "toUpperCase") else q.strip().upper()
    df_2024 = df_master[df_master["year"] == 2024]
    matches = df_2024[df_2024["eqdcellcode"].str.contains(query_upper, na=False)].head(10)
    return matches[["eqdcellcode", "priority_score", "priority_category", "signal_diagnostic", "species_richness"]].to_dict(orient="records")


@app.post("/api/identify")
async def identify_species(file: UploadFile = File(...)):
    """
    Real-time BioCLIP inference endpoint.
    Accepts raw uploaded image bytes, preprocesses, computes ViT-B/16 representations,
    evaluates cosine classifier head with learnable scale, and returns top-5 predictions.
    """
    if bioclip_model is None or preprocess_fn is None:
        raise HTTPException(status_code=503, detail="BioCLIP model not loaded.")

    try:
        t0 = time.time()
        contents = await file.read()
        pil_img = Image.open(io.BytesIO(contents)).convert("RGB")

        # TTA: Original + Horizontal Flip average pooling (matches final benchmark)
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
            tax = taxonomy_map.get(sp_name, {})
            predictions.append({
                "species": sp_name,
                "confidence": round(float(prob), 4),
                "rank": len(predictions) + 1,
                "taxonomic_class": tax.get("taxonomic_class", "Fauna"),
                "order": tax.get("order", "Unknown"),
                "family": tax.get("family", "Unknown"),
                "genus": tax.get("genus", sp_name.split()[0] if sp_name else "Unknown")
            })

        return {
            "success": True,
            "inference_time_ms": inference_time_ms,
            "device": DEVICE,
            "model": "BioCLIP ViT-B/16 Partial Fine-Tuned + Cosine Head (Locked 78.94% Top-1)",
            "top_prediction": predictions[0],
            "top5_predictions": predictions,
            "provenance_notice": "Image-model inference capability. Does not overwrite validated GBIF baseline records."
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Inference error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="127.0.0.1", port=8000, reload=False, workers=1)
