"use client";

import React from "react";
import { ProgressionChart } from "@/components/charts/ProgressionChart";
import { Award, CheckCircle2, Info, Layers } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function ModelsPage() {
  const models = [
    { id: "Exp 1", name: "EfficientNet-B0 Standard", type: "CNN Baseline", top1: "42.60%", top5: "68.20%", macroF1: "39.80%", notes: "Initial baseline on Indian fauna" },
    { id: "Exp 2", name: "EfficientNet-B0 50img Filter", type: "CNN Filtered", top1: "50.02%", top5: "75.10%", macroF1: "47.30%", notes: "Filtered to species with ≥50 images" },
    { id: "Exp 3A", name: "BioCLIP ViT-B/16 Zero-Shot", type: "Foundation Vision-Language", top1: "62.72%", top5: "84.50%", macroF1: "59.40%", notes: "Pre-trained Imageomics weights" },
    { id: "Exp 3B", name: "BioCLIP Linear Probe", type: "Frozen Backbone + Linear Head", top1: "68.69%", top5: "89.36%", macroF1: "66.68%", notes: "Logit regression on embeddings" },
    { id: "Exp 4", name: "BioCLIP Cosine Classifier Head", type: "Cosine Normalization", top1: "77.04%", top5: "91.12%", macroF1: "76.46%", notes: "Learnable temperature scaling τ=21.98" },
    { id: "Exp 5A", name: "BioCLIP Partial Fine-Tuning + TTA", type: "2 Transformer Blocks + TTA", top1: "78.94%", top5: "92.87%", macroF1: "78.27%", notes: "Final locked research model" },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="space-y-2 pb-5 border-b border-white/[0.08]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-emerald-500/10 to-transparent border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Species Identification Model Progression
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  EMPIRICAL BENCHMARKS
                </span>
              </div>
              <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
                Empirical evaluation across 6 controlled experimental stages on 1,106 Indian terrestrial species.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Progression Chart Card */}
      <div className="p-5 sm:p-6 bg-neutral-900/60 border border-white/[0.08] rounded-2xl backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Accuracy &amp; Macro F1 Progression</h3>
            <p className="text-xs text-neutral-400">Evaluated on fixed held-out test split (2,765 images)</p>
          </div>
          <Badge variant="success" className="font-mono text-xs rounded-full px-3 py-1">
            Final Locked: 78.94% Top-1
          </Badge>
        </div>
        <ProgressionChart />
      </div>

      {/* Comparison Table */}
      <div className="border border-white/[0.08] rounded-2xl overflow-hidden bg-neutral-900/50 backdrop-blur-xl shadow-xl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Stage</TableHead>
              <TableHead>Architecture &amp; Method</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Top-1 Accuracy</TableHead>
              <TableHead className="text-right">Top-5 Accuracy</TableHead>
              <TableHead className="text-right">Macro F1</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {models.map((m) => {
              const isLocked = m.id === "Exp 5A";
              return (
                <TableRow key={m.id} className={isLocked ? "bg-emerald-500/[0.08] font-medium" : "hover:bg-white/[0.04]"}>
                  <TableCell className="font-mono font-bold text-xs text-white">
                    {m.id}
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-white">
                    {m.name}
                  </TableCell>
                  <TableCell className="text-xs text-neutral-400">
                    {m.type}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-right text-emerald-400 font-bold">
                    {m.top1}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-right text-info">
                    {m.top5}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-right text-emerald-300">
                    {m.macroF1}
                  </TableCell>
                  <TableCell className="text-xs text-neutral-400">
                    {m.notes}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Statistical Models Section */}
      <div className="p-5 sm:p-6 bg-neutral-900/60 rounded-2xl border border-white/[0.08] backdrop-blur-xl text-xs space-y-3 shadow-xl">
        <h4 className="font-semibold text-white flex items-center gap-2">
          <Layers className="h-4 w-4 text-cyan-400" />
          Statistical Model Roles (Phase 2 &amp; Phase 3 Integration)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-neutral-400 pt-1">
          <div className="p-4 bg-neutral-900/80 rounded-xl border border-white/[0.08] space-y-1.5">
            <span className="font-bold text-white flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              1. Poisson GLM:
            </span>
            <p className="text-[11px] leading-relaxed text-neutral-300">
              <strong className="text-white">PRIMARY EXPECTED-MEAN BASELINE.</strong> Achieved lowest walk-forward MAE (31.72 species), outperforming historical median (46.20) and rolling median (36.73).
            </p>
          </div>
          <div className="p-4 bg-neutral-900/80 rounded-xl border border-white/[0.08] space-y-1.5">
            <span className="font-bold text-white flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              2. Negative Binomial GLM:
            </span>
            <p className="text-[11px] leading-relaxed text-neutral-300">
              <strong className="text-white">OVERDISPERSION &amp; ROBUSTNESS MODEL.</strong> Vastly superior likelihood (AIC = 112,335.54 vs Poisson 194,276.78) and dispersion ϕ = 0.1742 for probabilistic confidence bounds.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
