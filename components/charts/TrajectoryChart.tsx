"use client";

import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { GridYearRecord } from "@/types/biosentinel";

export function TrajectoryChart({ records }: { records: GridYearRecord[] }) {
  if (!records || records.length === 0) {
    return <div className="text-xs text-muted-foreground p-4">No trajectory data available.</div>;
  }

  const sorted = [...records].sort((a, b) => a.year - b.year);

  const data = sorted.map((r) => ({
    year: r.year,
    observed: r.species_richness,
    expected: Number(r.selected_expected_richness || r.negative_binomial_expected_richness || 0).toFixed(1),
    effort: r.total_occurrences,
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.6} />
          <XAxis
            dataKey="year"
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            tickLine={false}
          />
          <YAxis
            yAxisId="richness"
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            tickLine={false}
            label={{ value: "Species", angle: -90, position: "insideLeft", fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
          />
          <YAxis
            yAxisId="effort"
            orientation="right"
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            tickLine={false}
            label={{ value: "Records", angle: 90, position: "insideRight", fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              borderColor: "hsl(var(--border))",
              borderRadius: "0.5rem",
              fontSize: "12px",
              color: "hsl(var(--foreground))",
            }}
          />
          <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
          <Bar
            yAxisId="effort"
            dataKey="effort"
            name="Observation Effort"
            fill="hsl(var(--muted-foreground))"
            opacity={0.25}
            radius={[2, 2, 0, 0]}
          />
          <Line
            yAxisId="richness"
            type="monotone"
            dataKey="observed"
            name="Observed Richness"
            stroke="#ef4444"
            strokeWidth={2}
            dot={{ r: 3, fill: "#ef4444" }}
          />
          <Line
            yAxisId="richness"
            type="monotone"
            dataKey="expected"
            name="Model Expected"
            stroke="#3b82f6"
            strokeWidth={1.75}
            strokeDasharray="4 4"
            dot={{ r: 2, fill: "#3b82f6" }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
