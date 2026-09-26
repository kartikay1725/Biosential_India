"use client";

import React, { useState, useRef } from "react";
import { Sparkles, UploadCloud, CheckCircle2, Info, AlertCircle, Loader2, Image as ImageIcon, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Prediction {
  species: string;
  confidence: number;
  rank: number;
  taxonomic_class?: string;
  order?: string;
  family?: string;
  genus?: string;
}

interface InferenceResponse {
  success: boolean;
  inference_time_ms: number;
  device: string;
  model: string;
  top_prediction: Prediction;
  top5_predictions: Prediction[];
  provenance_notice: string;
}

export default function IdentifyPage() {
  const [analyzing, setAnalyzing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<InferenceResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please upload a valid image file (JPEG, PNG, WebP).");
      return;
    }

    setErrorMsg(null);
    setFileName(file.name);
    setAnalyzing(true);
    setResult(null);

    // Preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/identify", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({ error: "Server error" }));
        throw new Error(errJson.error || `HTTP ${res.status}`);
      }

      const data: InferenceResponse = await res.json();
      setResult(data);
    } catch (err: any) {
      console.error("Identification failed:", err);
      setErrorMsg(err.message || "Failed to identify species. Ensure backend is active.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const loadSampleImage = async () => {
    try {
      setAnalyzing(true);
      setErrorMsg(null);
      // Fetch a real sample image from test dataset
      const res = await fetch("/api/sample-image");
      if (!res.ok) {
        // Fallback create dummy canvas blob
        const canvas = document.createElement("canvas");
        canvas.width = 224;
        canvas.height = 224;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#2d5a27";
          ctx.fillRect(0, 0, 224, 224);
          ctx.fillStyle = "#ffffff";
          ctx.font = "16px sans-serif";
          ctx.fillText("BioSentinel Test", 50, 110);
        }
        canvas.toBlob((blob) => {
          if (blob) {
            const sampleFile = new File([blob], "sample_test.jpg", { type: "image/jpeg" });
            processFile(sampleFile);
          }
        }, "image/jpeg");
        return;
      }
      const blob = await res.blob();
      const sampleFile = new File([blob], "sample_observation.jpg", { type: "image/jpeg" });
      processFile(sampleFile);
    } catch (e: any) {
      setErrorMsg("Sample load failed: " + e.message);
      setAnalyzing(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-1.5 pb-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent" />
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            AI Species Identification (BioCLIP Vision Layer)
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Live inference via fine-tuned BioCLIP ViT-B/16 on GPU across 1,106 Indian terrestrial species.
        </p>
      </div>

      {/* Benchmark Badge Strip */}
      <div className="p-3.5 bg-surface-raised border border-border rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 font-mono">
          <Badge variant="success" className="text-[10px]">EXPERIMENT 5A (LOCKED)</Badge>
          <span className="text-muted-foreground">•</span>
          <span>Top-1: <strong className="text-foreground">78.94%</strong></span>
          <span className="text-muted-foreground">•</span>
          <span>Top-5: <strong className="text-foreground">92.87%</strong></span>
          <span className="text-muted-foreground">•</span>
          <span>Macro F1: <strong className="text-foreground">78.27%</strong></span>
        </div>
        <div className="text-[11px] text-muted-foreground font-mono">
          Live Backend: CUDA Accelerated
        </div>
      </div>

      {/* Real Upload Dropzone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`p-8 border-2 border-dashed rounded-xl bg-card transition-all cursor-pointer flex flex-col items-center justify-center text-center space-y-3 ${
          dragActive
            ? "border-accent bg-accent/5 scale-[0.99]"
            : "border-border hover:border-accent/60"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="hidden"
        />

        {imagePreview ? (
          <div className="flex flex-col items-center space-y-2">
            <img
              src={imagePreview}
              alt="Uploaded observation"
              className="h-36 w-36 object-cover rounded-lg border border-border shadow-md"
            />
            <span className="font-mono text-xs text-muted-foreground">
              {fileName} (Click or drag to replace)
            </span>
          </div>
        ) : (
          <>
            <div className="h-12 w-12 rounded-full bg-surface-raised border border-border flex items-center justify-center text-accent">
              <UploadCloud className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Upload Wildlife Observation Image</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Drag and drop your photograph here, or click to browse files
              </p>
            </div>
            <div className="text-[11px] text-muted-foreground">
              Supports JPEG, PNG, WebP up to 20MB
            </div>
          </>
        )}

        <div className="pt-2 flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={analyzing}
            className="text-xs font-semibold h-8"
          >
            {analyzing ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Evaluating Model...
              </span>
            ) : (
              "Browse From Computer"
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={loadSampleImage}
            disabled={analyzing}
            className="text-xs h-8 text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Sample Photo
          </Button>
        </div>
      </div>

      {/* Error state */}
      {errorMsg && (
        <div className="p-3.5 rounded-lg border border-danger/40 bg-danger/10 text-danger text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Real Inference Output Section */}
      {result && (
        <div className="p-5 bg-card border border-border rounded-xl space-y-4 animate-in fade-in-50 duration-300">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <h3 className="text-sm font-bold text-foreground">Live Inference Complete</h3>
            </div>
            <span className="text-xs font-mono text-muted-foreground">
              Latency: {result.inference_time_ms}ms • Device: {result.device}
            </span>
          </div>

          {/* Top Prediction Hero */}
          <div className="p-4 bg-surface rounded-lg border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="text-[11px] text-accent uppercase tracking-wider font-semibold font-mono">
                Top Prediction (Rank 1)
              </div>
              <div className="text-lg font-bold italic text-foreground mt-0.5">
                {result.top_prediction.species}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Genus: <span className="text-foreground">{result.top_prediction.genus || "—"}</span> • 
                Family: <span className="text-foreground">{result.top_prediction.family || "—"}</span> • 
                Order: <span className="text-foreground">{result.top_prediction.order || "—"}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold font-mono text-success">
                {(result.top_prediction.confidence * 100).toFixed(1)}%
              </div>
              <div className="text-[10px] text-muted-foreground">Softmax probability</div>
            </div>
          </div>

          {/* Top 5 Candidates */}
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Top-5 Candidates (92.87% Top-5 Benchmark)
            </h4>
            <div className="space-y-2 text-xs">
              {result.top5_predictions.map((p, i) => (
                <div key={p.species} className="p-2.5 rounded bg-surface border border-border flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-muted-foreground w-4">#{i + 1}</span>
                    <div>
                      <span className="font-medium italic text-foreground">{p.species}</span>
                      {p.family && p.family !== "Unknown" && (
                        <span className="text-muted-foreground ml-2 text-[11px]">({p.family})</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-28 h-1.5 bg-surface-raised rounded-full overflow-hidden hidden sm:block">
                      <div
                        className="h-full bg-accent rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(p.confidence * 100, 100)}%` }}
                      />
                    </div>
                    <span className="font-mono font-medium text-foreground w-12 text-right">
                      {(p.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Provenance Notice */}
          <div className="p-3 bg-surface-raised rounded-lg border border-border text-[11px] text-muted-foreground flex items-start gap-2">
            <Info className="h-4 w-4 shrink-0 text-info mt-0.5" />
            <div>
              <strong>Taxonomic Pipeline Boundary:</strong> {result.provenance_notice}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
