/**
 * Standardized scientific formatting utilities for BioSentinel India.
 * Enforces uniform decimal precision and human-readable units.
 */

export function formatNumber(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return "—";
  return new Intl.NumberFormat("en-US").format(val);
}

export function formatPriority(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return "—";
  return val.toFixed(1);
}

export function formatPercentage(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return "—";
  const sign = val > 0 ? "+" : "";
  return `${sign}${val.toFixed(1)}%`;
}

export function formatSigma(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return "—";
  const sign = val > 0 ? "+" : "";
  return `${sign}${val.toFixed(2)}σ`;
}

export function formatCoordinates(lat: number, lon: number): string {
  const latStr = `${Math.abs(lat).toFixed(2)}° ${lat >= 0 ? "N" : "S"}`;
  const lonStr = `${Math.abs(lon).toFixed(2)}° ${lon >= 0 ? "E" : "W"}`;
  return `${latStr}, ${lonStr}`;
}

export function formatDecimal(val: number | null | undefined, digits = 1): string {
  if (val === null || val === undefined || isNaN(val)) return "—";
  return val.toFixed(digits);
}

export function formatDiagnostic(diag: string): { label: string; tone: "danger" | "warning" | "success" | "muted" } {
  switch (diag) {
    case "robust_multimethod_signal":
      return { label: "Robust Multi-Method Signal", tone: "danger" };
    case "effort_driven_signal":
      return { label: "Effort-Driven Sampling Signal", tone: "warning" };
    case "expected_observation_pattern":
      return { label: "Expected Observation Pattern", tone: "muted" };
    default:
      return { label: diag.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()), tone: "muted" };
  }
}

export function formatTrendCategory(trend: string): { label: string; tone: "danger" | "warning" | "success" | "info" | "muted" } {
  switch (trend) {
    case "effort_driven_richness_growth":
      return { label: "Effort-Driven Growth", tone: "warning" };
    case "effort_adjusted_stable":
      return { label: "Effort-Adjusted Stable", tone: "info" };
    case "effort_adjusted_decrease":
      return { label: "Effort-Adjusted Decrease", tone: "danger" };
    case "effort_adjusted_increase":
      return { label: "Effort-Adjusted Increase", tone: "success" };
    case "insufficient_history":
      return { label: "Insufficient Baseline", tone: "muted" };
    default:
      return { label: trend.replace(/_/g, " "), tone: "muted" };
  }
}
