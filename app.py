"""
BioSentinel India — Hugging Face Gradio Entrypoint
Runs on Hugging Face Spaces (Gradio SDK - 100% Free Tier, 16GB RAM)
Provides:
1. An interactive web UI on the Hugging Face Space page
2. The live REST API endpoints (/api/identify, /api/health, /api/summary, etc.) for Vercel
"""

import os
import sys
from pathlib import Path
from PIL import Image

PROJECT_ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(PROJECT_ROOT))

import gradio as gr
from src.api.server import app as fastapi_app, classify_pil_image, load_assets

# Ensure model and dataset assets are loaded at initialization
load_assets()

def gradio_predict(img, year):
    if img is None:
        return {"error": "Please upload or select an image to identify."}
    if not isinstance(img, Image.Image):
        img = Image.fromarray(img)
    try:
        res = classify_pil_image(img, year=int(year))
        return {
            "top_species": res["top_prediction"]["species"],
            "confidence": f"{res['top_prediction']['confidence'] * 100:.2f}%",
            "accepted_scientific_name": res["species_intelligence"]["accepted_scientific_name"],
            "order": res["top_prediction"]["order"],
            "family": res["top_prediction"]["family"],
            "selected_year_occurrences": res["top_prediction"]["selected_year_occurrences"],
            "total_occurrences": res["top_prediction"]["total_occurrences"],
            "top_5_candidates": [
                {
                    "rank": p["rank"],
                    "species": p["species"],
                    "confidence": f"{p['confidence'] * 100:.2f}%",
                }
                for p in res["top5_predictions"]
            ],
            "inference_time_ms": res["inference_time_ms"],
        }
    except Exception as e:
        return {"error": str(e)}

# Clean, modern Gradio Interface for testing directly in Hugging Face
with gr.Blocks(title="BioSentinel India — BioCLIP Inference Service") as demo:
    gr.Markdown(
        """
        # 🌿 BioSentinel India — BioCLIP Intelligence API
        **Active Model Service:** BioCLIP ViT-B/16 (78.94% Top-1 Accuracy, 1,106 Indian Wildlife Taxa)

        *This Hugging Face Space serves as the live ML inference backend for the BioSentinel India dashboard on Vercel.*
        """
    )
    with gr.Row():
        with gr.Column():
            input_img = gr.Image(type="pil", label="Field Observation Image")
            year_input = gr.Slider(minimum=2018, maximum=2024, value=2024, step=1, label="Analysis Year")
            run_btn = gr.Button("🔍 Identify Species", variant="primary")
        with gr.Column():
            output_data = gr.JSON(label="Model Output & Scientific Intelligence")

    run_btn.click(fn=gradio_predict, inputs=[input_img, year_input], outputs=output_data)

# Mount Gradio onto the FastAPI app so that all /api/* routes remain accessible to Vercel
app = gr.mount_gradio_app(fastapi_app, demo, path="/")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 7860))
    uvicorn.run(app, host="0.0.0.0", port=port)
