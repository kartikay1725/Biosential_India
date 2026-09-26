const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

// Load data files directly
const dataDir = path.join(__dirname, "..", "lib", "data");
const summary = JSON.parse(fs.readFileSync(path.join(dataDir, "summary.json"), "utf8"));
const caseStudies = JSON.parse(fs.readFileSync(path.join(dataDir, "case_studies.json"), "utf8"));
const topPriority = JSON.parse(fs.readFileSync(path.join(dataDir, "top_priority_2024.json"), "utf8"));
const mapPoints = JSON.parse(fs.readFileSync(path.join(dataDir, "map_points_2024.json"), "utf8"));
const trendSummary = JSON.parse(fs.readFileSync(path.join(dataDir, "trend_summary.json"), "utf8"));

test("1. Dashboard summary contains locked research numbers", () => {
  assert.strictEqual(summary.bioclip_species_identification.top1_accuracy, 0.7894);
  assert.strictEqual(summary.bioclip_species_identification.top5_accuracy, 0.9287);
  assert.strictEqual(summary.bioclip_species_identification.macro_f1, 0.7827);
  assert.strictEqual(summary.dataset_dimensions.total_grid_year_units, 12913);
  assert.strictEqual(summary.dataset_dimensions.unique_grid_cells, 2773);
  assert.strictEqual(summary.dataset_dimensions.screened_units_2024, 2630);
  assert.strictEqual(summary.dataset_dimensions.high_screening_priority_2024, 186);
  assert.strictEqual(summary.dataset_dimensions.persistent_high_priority_2024, 17);
});

test("2. Case Study E076N28AA / 2024 matches locked values exactly", () => {
  const e076 = caseStudies["E076N28AA"].find((r) => r.year === 2024);
  assert.ok(e076, "E076N28AA 2024 record must exist");
  assert.strictEqual(e076.species_richness, 67);
  assert.strictEqual(e076.total_occurrences, 354);
  assert.strictEqual(e076.baseline_years, 7.0);
  assert.strictEqual(Math.round(e076.negative_binomial_expected_richness * 100) / 100, 89.08);
  assert.strictEqual(Math.round(e076.relative_deviation * 100) / 100, -24.78);
  assert.strictEqual(e076.persistence_count, 2);
  assert.strictEqual(e076.priority_score, 53.06);
  assert.strictEqual(e076.evidence_score, 73.12);
  assert.strictEqual(e076.reliability_score, 72.57);
  assert.strictEqual(e076.priority_category, "high screening priority");
});

test("3. False-Positive Case Study E078N09BC / 2024 triggers effort_driven_signal", () => {
  const e078 = caseStudies["E078N09BC"].find((r) => r.year === 2024);
  assert.ok(e078, "E078N09BC 2024 record must exist");
  assert.strictEqual(e078.species_richness, 21);
  assert.strictEqual(e078.total_occurrences, 33);
  assert.strictEqual(e078.signal_diagnostic, "effort_driven_signal");
  assert.ok(e078.effort_change_pct < -50, "Effort collapse must exceed -50%");
});

test("4. 2024 Map points contains exactly 2,630 screened cells", () => {
  assert.strictEqual(mapPoints.length, 2630);
  const highPoints = mapPoints.filter((pt) => pt.priority >= 38.42);
  assert.strictEqual(highPoints.length, 186);
});

test("5. Top priority list contains all 186 high screening priority units", () => {
  assert.strictEqual(topPriority.length, 186);
  for (const unit of topPriority) {
    assert.strictEqual(unit.priority_category, "high screening priority");
    assert.ok(unit.priority_score >= 38.42);
  }
});

test("6. Dual-slope taxonomy distinguishes effort-driven growth from biological recovery", () => {
  const effortDriven = trendSummary.find((t) => t.category === "effort_driven_richness_growth");
  assert.ok(effortDriven, "effort_driven_richness_growth must exist");
  assert.strictEqual(effortDriven.count, 5396);
  assert.strictEqual(effortDriven.percentage, 41.8);
  assert.ok(effortDriven.mean_raw_slope > 0, "Raw slope must be positive");
  assert.ok(effortDriven.mean_effort_slope > 0, "Effort slope must be positive");
  assert.ok(effortDriven.mean_adjusted_slope <= 0, "Adjusted slope must be non-positive");
});

test("7. Poisson GLM role is verified as primary expected mean baseline with MAE 31.72", () => {
  assert.strictEqual(summary.statistical_models.poisson_glm.walk_forward_mae, 31.72);
  assert.strictEqual(summary.statistical_models.negative_binomial_glm.walk_forward_mae, 39.01);
  assert.strictEqual(summary.statistical_models.historical_median_baseline.walk_forward_mae, 46.20);
});

test("8. Sensitivity correlations match locked research values", () => {
  assert.strictEqual(summary.sensitivity_analysis.anomaly_heavy_vs_balanced_spearman, 0.9743);
  assert.strictEqual(summary.sensitivity_analysis.reliability_heavy_vs_balanced_spearman, 0.9569);
});
