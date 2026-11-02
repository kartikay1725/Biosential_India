"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import {
  Sparkles,
  UploadCloud,
  CheckCircle2,
  Info,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  RefreshCw,
  MapPin,
  ExternalLink,
  ArrowRight,
  ShieldAlert,
  Database,
  Globe,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSelectedYear } from "@/components/context/YearContext";
import { getSpeciesStats } from "@/lib/api/data-service";

interface Prediction {
  species: string;
  confidence: number;
  rank: number;
  taxonomic_class?: string;
  order?: string;
  family?: string;
  genus?: string;
  selected_year_occurrences?: number;
  total_occurrences?: number;
  has_occurrence_records?: boolean;
}

interface InferenceResponse {
  success: boolean;
  inference_time_ms: number;
  device: string;
  model: string;
  selected_year?: number;
  top_prediction: Prediction;
  top5_predictions: Prediction[];
  species_intelligence?: {
    matched_scientific_name: string;
    accepted_scientific_name: string;
    taxonomy: {
      kingdom?: string;
      phylum?: string;
      taxonomic_class?: string;
      order?: string;
      family?: string;
      genus?: string;
    };
    selected_year_occurrences: number;
    total_historical_occurrences: number;
    states_recorded: string[];
    verified_occurrence_points: Array<{
      gbif_id: string;
      occurrence_url: string;
      lat: number;
      lon: number;
      year: number | null;
      date: string | null;
      state: string;
      image_url: string | null;
      observer: string;
      license: string;
    }>;
    provenance: {
      primary_source: string;
      image_license: string;
      spatial_representation: string;
      epistemic_notice: string;
    };
    earliest_year?: number;
    latest_year?: number;
  };
  provenance_notice: string;
}

export default function IdentifyPage() {
  const { selectedYear } = useSelectedYear();
  const [analyzing, setAnalyzing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<InferenceResponse | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
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
    setSelectedCandidate(null);

    // Preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/identify?year=${selectedYear}`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({ error: "Server error" }));
        throw new Error(errJson.error || `HTTP ${res.status}`);
      }

      const data: InferenceResponse = await res.json();
      setResult(data);
      setSelectedCandidate(data.top_prediction.species);
    } catch (err: any) {
      console.error("Identification failed:", err);
      setErrorMsg(
        err.message ||
          "Failed to identify species. Please ensure the BioCLIP backend inference service is running and connected."
      );
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
      const res = await fetch("/api/sample-image");
      if (!res.ok) {
        throw new Error("Sample image not found on disk.");
      }
      const blob = await res.blob();
      const sampleFile = new File([blob], "sample_observation.jpg", { type: "image/jpeg" });
      processFile(sampleFile);
    } catch (e: any) {
      setErrorMsg("Sample load failed: " + e.message);
      setAnalyzing(false);
    }
  };

  // Active species intelligence stats based on currently selected candidate
  const activeSpeciesName = selectedCandidate || result?.top_prediction.species || "";
  const clientSpeciesStats = activeSpeciesName ? getSpeciesStats(activeSpeciesName, selectedYear) : null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-1.5 pb-4 border-b border-white/[0.08]">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold">
            SUPERVISED MULTIMODAL AI
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <Sparkles className="h-6 w-6 text-emerald-400" />
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            AI Species Identification &amp; Biodiversity Intelligence
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-neutral-400">
          Live inference via fine-tuned BioCLIP ViT-B/16 on GPU connected to real GBIF &amp; iNaturalist observation records.
        </p>
      </div>

      {/* Benchmark Badge Strip */}
      <div className="p-4 bg-neutral-900/60 border border-white/[0.08] backdrop-blur-xl rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-lg">
        <div className="flex items-center gap-3 font-mono">
          <Badge variant="outline" className="text-[10px] bg-emerald-500/15 border-emerald-500/30 text-emerald-300 font-bold px-2 py-0.5 rounded-full">
            EXPERIMENT 5A (LOCKED)
          </Badge>
          <span className="text-neutral-500">•</span>
          <span className="text-neutral-300">Top-1: <strong className="text-white font-bold">78.94%</strong></span>
          <span className="text-neutral-500">•</span>
          <span className="text-neutral-300">Top-5: <strong className="text-white font-bold">92.87%</strong></span>
          <span className="text-neutral-500">•</span>
          <span className="text-neutral-300">Macro F1: <strong className="text-white font-bold">78.27%</strong></span>
        </div>
        <div className="text-[11px] text-neutral-400 font-mono flex items-center gap-2">
          <span className="text-emerald-400 font-bold">Active Year: {selectedYear}</span>
        </div>
      </div>

      {/* Real Upload Dropzone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`p-10 border-2 border-dashed rounded-3xl bg-neutral-900/40 backdrop-blur-xl transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center space-y-4 shadow-xl ${
          dragActive
            ? "border-emerald-400 bg-emerald-500/5 scale-[0.99]"
            : "border-white/10 hover:border-emerald-500/50 hover:bg-white/[0.02]"
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
          <div className="flex flex-col items-center space-y-3">
            <div className="p-1.5 rounded-2xl bg-white/[0.04] border border-white/10 shadow-xl">
              <img
                src={imagePreview}
                alt="Uploaded observation"
                className="h-44 w-44 object-cover rounded-xl"
              />
            </div>
            <span className="font-mono text-xs text-neutral-400">
              {fileName} (Click or drag to replace image)
            </span>
          </div>
        ) : (
          <>
            <div className="h-14 w-14 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-emerald-400 shadow-md">
              <UploadCloud className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Upload Wildlife Observation Image</h3>
              <p className="text-xs text-neutral-400 mt-1 max-w-md mx-auto">
                Drag and drop your wildlife photograph here, or click to browse files
              </p>
            </div>
            <div className="text-[11px] text-neutral-500 font-mono">
              Supports JPEG, PNG, WebP up to 20MB across 1,106 Indian species
            </div>
          </>
        )}

        <div className="pt-2 flex flex-wrap items-center justify-center gap-3" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={analyzing}
            className="text-xs font-bold h-9 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md shadow-emerald-950/40"
          >
            {analyzing ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Evaluating ViT-B/16 Head...
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
            className="text-xs h-9 px-4 rounded-xl text-neutral-300 hover:text-white bg-white/[0.04] border-white/10 hover:border-emerald-500/40"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Sample Photo (Rock Dove)
          </Button>
        </div>
      </div>

      {/* Error state */}
      {errorMsg && (
        <div className="p-4 rounded-2xl border border-rose-500/40 bg-rose-500/10 text-rose-300 text-xs flex items-start gap-3 backdrop-blur-xl shadow-lg">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
          <div className="space-y-1">
            <strong className="font-bold">Inference Service Unavailable:</strong>
            <p className="leading-relaxed text-neutral-300">{errorMsg}</p>
            <p className="text-[11px] opacity-80 pt-1 font-mono text-neutral-400">
              BioSentinel enforces epistemic integrity: predictions and confidences are never fabricated when the live backend is offline.
            </p>
          </div>
        </div>
      )}

      {/* Real Inference Output Section */}
      {result && (
        <div className="p-6 sm:p-8 bg-neutral-900/70 border border-white/[0.08] backdrop-blur-2xl rounded-3xl space-y-6 shadow-2xl animate-in fade-in-50 duration-300">
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
            <div className="flex items-center gap-2.5">
              <span className="h-6 w-6 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
              </span>
              <h3 className="text-base font-bold text-white">Live BioCLIP Inference Complete</h3>
            </div>
            <span className="text-xs font-mono text-neutral-400 bg-white/[0.03] px-2.5 py-1 rounded-lg border border-white/10">
              Latency: {result.inference_time_ms}ms • Device: {result.device}
            </span>
          </div>

          {/* Model Prediction vs Observation Protocol Notice */}
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/25 rounded-2xl text-xs text-amber-200/90 flex items-start gap-3">
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
            <div className="space-y-0.5">
              <strong className="text-amber-300">Epistemic Boundary Mandate:</strong>
              <p className="text-[11px] text-neutral-300 leading-relaxed">
                The identification below is an <strong>AI model prediction</strong> derived from image features. It does NOT constitute a verified occurrence record until validated by biological field researchers.
              </p>
            </div>
          </div>

          {/* Top Prediction Hero Card */}
          <div className="p-5 bg-gradient-to-r from-emerald-950/40 via-teal-950/20 to-neutral-900/60 rounded-2xl border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
            <div>
              <div className="text-[11px] text-emerald-400 uppercase tracking-wider font-semibold font-mono flex items-center gap-2">
                <span>Top Prediction (Rank 1)</span>
                <span className="text-[9px] py-0.5 px-2 rounded-full border border-emerald-400/40 text-emerald-300 bg-emerald-500/10">
                  Fine-Tuned ViT-B/16
                </span>
              </div>
              <div className="text-2xl font-black italic text-white mt-1">
                {result.top_prediction.species}
              </div>
              <div className="text-xs text-neutral-400 mt-1">
                Genus: <span className="text-white font-medium">{result.top_prediction.genus || "—"}</span> • 
                Family: <span className="text-white font-medium">{result.top_prediction.family || "—"}</span> • 
                Order: <span className="text-white font-medium">{result.top_prediction.order || "—"}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black font-mono text-emerald-400">
                {(result.top_prediction.confidence * 100).toFixed(1)}%
              </div>
              <div className="text-[10px] text-neutral-400 font-mono mt-0.5">Cosine Softmax Probability</div>
            </div>
          </div>

          {/* Connected Biodiversity Intelligence Panel */}
          {clientSpeciesStats && clientSpeciesStats.found ? (
            <div className="p-5 bg-neutral-900/50 rounded-2xl border border-white/[0.08] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/[0.08]">
                <div className="flex items-center gap-2.5">
                  <Database className="h-4 w-4 text-cyan-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white font-mono">
                    Authoritative Biodiversity Intelligence Records
                  </h4>
                </div>
                <div className="text-xs font-mono text-neutral-400">
                  Active Filter Year: <span className="text-emerald-400 font-bold">{selectedYear}</span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-white/[0.03] rounded-xl border border-white/[0.06]">
                  <div className="text-[10px] text-neutral-400 uppercase font-semibold">{selectedYear} Occurrences</div>
                  <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                    {clientSpeciesStats.yearOccurrences.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-neutral-500">evaluated records</div>
                </div>

                <div className="p-3 bg-white/[0.03] rounded-xl border border-white/[0.06]">
                  <div className="text-[10px] text-neutral-400 uppercase font-semibold">Historical Occurrences</div>
                  <div className="text-xl font-bold font-mono text-white mt-1">
                    {clientSpeciesStats.totalOccurrences.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-neutral-500">dataset total</div>
                </div>

                <div className="p-3 bg-white/[0.03] rounded-xl border border-white/[0.06]">
                  <div className="text-[10px] text-neutral-400 uppercase font-semibold">Geographic Scope</div>
                  <div className="text-xl font-bold font-mono text-cyan-400 mt-1">
                    {clientSpeciesStats.states.length}
                  </div>
                  <div className="text-[10px] text-neutral-500">Indian states/UTs</div>
                </div>

                <div className="p-3 bg-white/[0.03] rounded-xl border border-white/[0.06]">
                  <div className="text-[10px] text-neutral-400 uppercase font-semibold">Observation Range</div>
                  <div className="text-xl font-bold font-mono text-amber-400 mt-1">
                    {clientSpeciesStats.earliestYear}–{clientSpeciesStats.latestYear}
                  </div>
                  <div className="text-[10px] text-neutral-500">monitoring span</div>
                </div>
              </div>

              {/* Geographic Precision Notice */}
              <div className="p-3.5 bg-white/[0.02] rounded-xl border border-white/[0.06] text-[11px] text-neutral-300 space-y-1 leading-relaxed">
                <div className="flex items-center gap-1.5 font-bold text-white">
                  <MapPin className="h-3.5 w-3.5 text-cyan-400" />
                  Geographic Provenance Guarantee
                </div>
                <p>
                  BioSentinel does <strong>not pin your uploaded image at a guessed coordinate</strong>. 
                  The spatial locations displayed on the interactive map represent verified occurrence points and 0.25° grid units documented in authoritative biodiversity records.
                </p>
                {clientSpeciesStats.states.length > 0 && (
                  <div className="pt-1 text-[10px] text-neutral-400 font-mono">
                    <span className="text-white font-medium">Documented States:</span>{" "}
                    {clientSpeciesStats.states.slice(0, 8).join(", ")}
                    {clientSpeciesStats.states.length > 8 && ` +${clientSpeciesStats.states.length - 8} more`}
                  </div>
                )}
              </div>

              {/* Key Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href={`/map?species=${encodeURIComponent(activeSpeciesName)}&year=${selectedYear}`}
                  className="inline-flex"
                >
                  <Button size="sm" className="text-xs font-bold h-9 px-4 gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl shadow-md">
                    <MapPin className="h-3.5 w-3.5" />
                    Explore Species Observations on Map ({selectedYear})
                  </Button>
                </Link>

                <Link
                  href={`/species?search=${encodeURIComponent(activeSpeciesName)}&year=${selectedYear}`}
                  className="inline-flex"
                >
                  <Button variant="outline" size="sm" className="text-xs h-9 px-4 gap-1.5 border-white/10 text-neutral-300 hover:text-white rounded-xl bg-white/[0.03]">
                    View Complete Species Profile
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.08] text-xs text-neutral-400">
              No matching occurrence records found in the available dataset for {activeSpeciesName}.
            </div>
          )}

          {/* Top 5 Candidates Selection */}
          <div className="space-y-2.5 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 font-mono">
                Top-5 Candidates (92.87% Top-5 Benchmark)
              </h4>
              <span className="text-[11px] text-neutral-500">Click a candidate to inspect evidence</span>
            </div>
            <div className="space-y-2 text-xs">
              {result.top5_predictions.map((p, i) => {
                const isSelected = p.species === activeSpeciesName;
                return (
                  <div
                    key={p.species}
                    onClick={() => setSelectedCandidate(p.species)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? "bg-emerald-500/10 border-emerald-500/40 shadow-sm"
                        : "bg-white/[0.02] border-white/[0.06] hover:border-emerald-500/30 hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-neutral-500 w-4 font-bold">#{i + 1}</span>
                      <div>
                        <span className="font-semibold italic text-white">{p.species}</span>
                        {p.family && p.family !== "Unknown" && (
                          <span className="text-neutral-400 ml-2 text-[11px]">({p.family})</span>
                        )}
                        {isSelected && (
                          <span className="ml-2 text-[9px] py-0.5 px-2 rounded-full border border-emerald-400/40 text-emerald-300 bg-emerald-500/15 font-mono">
                            Active Evidence
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-28 h-1.5 bg-neutral-800 rounded-full overflow-hidden hidden sm:block">
                        <div
                          className="h-full bg-emerald-400 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(p.confidence * 100, 100)}%` }}
                        />
                      </div>
                      <span className="font-mono font-bold text-white w-12 text-right">
                        {(p.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Provenance Notice */}
          <div className="p-3.5 bg-white/[0.02] rounded-xl border border-white/[0.06] text-[11px] text-neutral-400 flex items-start gap-2.5">
            <Info className="h-4 w-4 shrink-0 text-cyan-400 mt-0.5" />
            <div>
              <strong className="text-neutral-300">Taxonomic Pipeline Boundary:</strong> {result.provenance_notice}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
