"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import { TrendCategorySummary } from "@/types/biosentinel";

export function DualSlopeBarChart({ data }: { data: TrendCategorySummary[] }) {
  if (!data || data.length === 0) return null;

  const colorMap: Record<string, string> = {
    effort_driven_richness_growth: "#f59e0b",
    effort_adjusted_stable: "#3b82f6",
    effort_adjusted_decrease: "#ef4444",
    effort_adjusted_increase: "#10b981",
    insufficient_history: "#6b7280",
  };

  const formattedData = data.map((d) => ({
    name: d.category.replace(/_/g, " "),
    key: d.category,
    count: d.count,
    percentage: d.percentage,
    rawSlope: d.mean_raw_slope,
    effSlope: d.mean_effort_slope,
    adjSlope: d.mean_adjusted_slope,
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={formattedData} margin={{ top: 10, right: 10, left: -15, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.6} />
          <XAxis
            dataKey="name"
            stroke="hsl(var(--muted-foreground))"
            fontSize={10}
            tickLine={false}
            interval={0}
            angle={-10}
            textAnchor="end"
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            tickLine={false}
            label={{ value: "Grid × Year Units", angle: -90, position: "insideLeft", fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              borderColor: "hsl(var(--border))",
              borderRadius: "0.5rem",
              fontSize: "12px",
              color: "hsl(var(--foreground))",
            }}
            formatter={(value: any, name: any, props: any) => [
              `${value} units (${props.payload.percentage}%)`,
              "Count",
            ]}
          />
          <Bar dataKey="count" radius={[3, 3, 0, 0]}>
            {formattedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colorMap[entry.key] || "#94a3b8"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
