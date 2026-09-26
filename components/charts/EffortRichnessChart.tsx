"use client";

import React from "react";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

export function EffortRichnessChart() {
  // Representative sample of grid-year units across log-effort vs species richness
  const samplePoints = [
    { logEffort: 3.2, richness: 18, cell: "E070N22AB" },
    { logEffort: 3.8, richness: 26, cell: "E072N18CD" },
    { logEffort: 4.1, richness: 34, cell: "E074N20BA" },
    { logEffort: 4.5, richness: 42, cell: "E075N15AA" },
    { logEffort: 4.9, richness: 56, cell: "E076N12BC" },
    { logEffort: 5.2, richness: 65, cell: "E076N28AA" },
    { logEffort: 5.5, richness: 82, cell: "E077N28AC" },
    { logEffort: 5.8, richness: 98, cell: "E079N13AA" },
    { logEffort: 6.2, richness: 124, cell: "E080N16BB" },
    { logEffort: 6.8, richness: 165, cell: "E088N22AA" },
    { logEffort: 7.2, richness: 210, cell: "E077N10DD" },
  ];

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 10, right: 10, left: -15, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.6} />
          <XAxis
            type="number"
            dataKey="logEffort"
            name="Log-Effort"
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            tickLine={false}
            label={{ value: "ln(1 + Occurrences)", position: "insideBottom", offset: -10, fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
          />
          <YAxis
            type="number"
            dataKey="richness"
            name="Richness"
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            tickLine={false}
            label={{ value: "Observed Species", angle: -90, position: "insideLeft", fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
          />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              borderColor: "hsl(var(--border))",
              borderRadius: "0.5rem",
              fontSize: "12px",
              color: "hsl(var(--foreground))",
            }}
          />
          <Scatter name="Grid Units" data={samplePoints} fill="#f59e0b" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
