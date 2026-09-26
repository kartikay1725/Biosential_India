"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

interface ProgressionPoint {
  experiment: string;
  name: string;
  top1: number;
  top5: number;
  macroF1: number;
}

export function ProgressionChart() {
  const data: ProgressionPoint[] = [
    { experiment: "Exp 1", name: "EfficientNet-B0 (Standard)", top1: 42.60, top5: 68.20, macroF1: 39.80 },
    { experiment: "Exp 2", name: "EfficientNet-B0 (50img)", top1: 50.02, top5: 75.10, macroF1: 47.30 },
    { experiment: "Exp 3A", name: "BioCLIP Zero-Shot", top1: 62.72, top5: 84.50, macroF1: 59.40 },
    { experiment: "Exp 3B", name: "BioCLIP Linear Probe", top1: 68.69, top5: 89.36, macroF1: 66.68 },
    { experiment: "Exp 4", name: "BioCLIP Cosine Head", top1: 77.04, top5: 91.12, macroF1: 76.46 },
    { experiment: "Exp 5A", name: "BioCLIP Fine-Tuned + TTA (Locked)", top1: 78.94, top5: 92.87, macroF1: 78.27 },
  ];

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 25 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.6} />
          <XAxis
            dataKey="experiment"
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            tickLine={false}
          />
          <YAxis
            domain={[30, 100]}
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            tickLine={false}
            label={{ value: "Accuracy / Score (%)", angle: -90, position: "insideLeft", fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              borderColor: "hsl(var(--border))",
              borderRadius: "0.5rem",
              fontSize: "12px",
              color: "hsl(var(--foreground))",
            }}
            formatter={(value: any, name: any) => [`${Number(value).toFixed(2)}%`, name]}
          />
          <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "6px" }} />
          <Bar dataKey="top1" name="Top-1 Accuracy" fill="#f59e0b" radius={[3, 3, 0, 0]} />
          <Bar dataKey="top5" name="Top-5 Accuracy" fill="#3b82f6" radius={[3, 3, 0, 0]} />
          <Bar dataKey="macroF1" name="Macro F1" fill="#10b981" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
