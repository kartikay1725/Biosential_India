const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const dataDir = path.join(__dirname, "..", "lib", "data");
const annualSummaries = JSON.parse(fs.readFileSync(path.join(dataDir, "annual_summaries.json"), "utf8"));
const speciesCatalog = JSON.parse(fs.readFileSync(path.join(dataDir, "species_catalog.json"), "utf8"));
const mapPointsByYear = JSON.parse(fs.readFileSync(path.join(dataDir, "map_points_by_year.json"), "utf8"));
const topPriorityByYear = JSON.parse(fs.readFileSync(path.join(dataDir, "top_priority_by_year.json"), "utf8"));
const top100ByYear = JSON.parse(fs.readFileSync(path.join(dataDir, "top_100_by_year.json"), "utf8"));

// -------------------------------------------------------------
// PART 1: Global Year Selection & Analytical Integrity
// -------------------------------------------------------------

test("1. Available years are derived from real dataset (2018-2024)", () => {
  const supportedYears = Object.keys(annualSummaries).map(Number).sort((a, b) => b - a);
  assert.deepStrictEqual(supportedYears, [2024, 2023, 2022, 2021, 2020, 2019, 2018]);
  assert.strictEqual(supportedYears[0], 2024, "Default year must be latest supported year (2024)");
});

test("2. Year-specific summaries match authoritative master dataset counts", () => {
  // 2024
  const sum2024 = annualSummaries["2024"];
  assert.ok(sum2024, "2024 summary must exist");
  assert.strictEqual(sum2024.screened_units, 2630);
  assert.strictEqual(sum2024.high_screening_priority, 186);
  assert.strictEqual(sum2024.persistent_high_priority, 17);
  assert.strictEqual(sum2024.total_occurrences, 11688800);

  // 2023
  const sum2023 = annualSummaries["2023"];
  assert.ok(sum2023, "2023 summary must exist");
  assert.strictEqual(sum2023.screened_units, 2406);
  assert.strictEqual(sum2023.high_screening_priority, 129);
  assert.strictEqual(sum2023.persistent_high_priority, 14);

  // Check differentiation: 2024 != 2023
  assert.notStrictEqual(sum2024.screened_units, sum2023.screened_units);
  assert.notStrictEqual(sum2024.high_screening_priority, sum2023.high_screening_priority);
});

test("3. Map points indexed by year match cell counts and bounds", () => {
  assert.strictEqual(mapPointsByYear["2024"].length, 2630);
  assert.strictEqual(mapPointsByYear["2023"].length, 2406);
  assert.strictEqual(mapPointsByYear["2022"].length, 2152);
  assert.strictEqual(mapPointsByYear["2018"].length, 991);

  // Total grid-year units across all 7 years must equal exactly 12,913
  const totalUnits = Object.values(mapPointsByYear).reduce((acc, pts) => acc + pts.length, 0);
  assert.strictEqual(totalUnits, 12913, "Total grid-year units across all years must equal 12,913");

  // Coordinates must be valid latitudes/longitudes in India bounding box
  for (const pt of mapPointsByYear["2024"].slice(0, 50)) {
    assert.ok(pt.lat >= 6.0 && pt.lat <= 38.0, `Latitude ${pt.lat} in India`);
    assert.ok(pt.lon >= 68.0 && pt.lon <= 98.0, `Longitude ${pt.lon} in India`);
    assert.ok(pt.cell && pt.cell.length >= 6);
  }
});

test("4. Priority units are recalculated per year with verified cutoffs", () => {
  const p2024 = topPriorityByYear["2024"];
  const p2023 = topPriorityByYear["2023"];
  
  assert.strictEqual(p2024.length, 186);
  assert.strictEqual(p2023.length, 129);
  
  // All units in priority list must meet the priority threshold
  p2024.forEach(u => {
    assert.ok(u.priority_score >= 38.42, "2024 unit priority must be >= 38.42");
    assert.strictEqual(u.year, 2024);
  });
  p2023.forEach(u => {
    assert.ok(u.priority_score >= 38.42, "2023 unit priority must be >= 38.42");
    assert.strictEqual(u.year, 2023);
  });
});

test("5. Top 100 registries are populated and year-specific", () => {
  const top100_2024 = top100ByYear["2024"];
  const top100_2023 = top100ByYear["2023"];

  assert.strictEqual(top100_2024.length, 100);
  assert.strictEqual(top100_2023.length, 100);

  // Top ranked cells can differ between years
  assert.strictEqual(top100_2024[0].year, 2024);
  assert.strictEqual(top100_2023[0].year, 2023);
  assert.ok(top100_2024[0].priority_score >= 50.0);
  assert.ok(top100_2023[0].priority_score >= 50.0);
});

// -------------------------------------------------------------
// PART 2: Species Identification & Biodiversity Intelligence Linking
// -------------------------------------------------------------

test("6. Species catalog has exactly 1,106 BioCLIP classes with full metadata", () => {
  const speciesList = Object.values(speciesCatalog);
  assert.strictEqual(speciesList.length, 1106, "Catalog must have exactly 1,106 BioCLIP classes");

  // Test an iconic Indian species: Columba livia (Rock Dove)
  const columba = speciesCatalog["Columba livia"];
  assert.ok(columba, "Columba livia must be in catalog");
  assert.strictEqual(columba.scientific_name, "Columba livia");
  assert.strictEqual(columba.common_name, "Rock Dove");
  assert.strictEqual(columba.taxonomy.taxonomic_class, "Aves");
  assert.strictEqual(columba.taxonomy.family, "Columbidae");
  assert.ok(columba.occurrence_points.length > 0, "Must have verified GPS occurrences");

  // Verify coordinates are realistic GPS field coordinates, NOT grid centroids
  const firstOcc = columba.occurrence_points[0];
  assert.ok(firstOcc.lat >= 8.0 && firstOcc.lat <= 35.0, "Latitude in India");
  assert.ok(firstOcc.lon >= 68.0 && firstOcc.lon <= 95.0, "Longitude in India");
  assert.ok(firstOcc.gbif_id, "Must have occurrence ID");
  assert.ok(firstOcc.license, "Must have license attribution");
  assert.strictEqual(firstOcc.is_individual_point, true);
});

test("7. Species occurrence counts distinguish selected year from historical total", () => {
  const columba = speciesCatalog["Columba livia"];
  assert.ok(columba.manifest_years_distribution["2024"] > 0, "Columba livia must have 2024 manifest records");
  assert.ok(columba.historical_gbif_totals.total_occurrences_all_time > 1000, 
    "Historical GBIF occurrences must reflect total occurrence records");
  assert.notStrictEqual(columba.manifest_years_distribution["2024"], columba.historical_gbif_totals.total_occurrences_all_time,
    "Selected year count must be distinct from historical total");
});

test("8. Asian Koel (Eudynamys scolopaceus) resolution and GPS mapping", () => {
  const koel = speciesCatalog["Eudynamys scolopaceus"];
  assert.ok(koel, "Eudynamys scolopaceus must exist in catalog");
  assert.strictEqual(koel.common_name, "Asian Koel");
  assert.strictEqual(koel.taxonomy.taxonomic_class, "Aves");
  assert.strictEqual(koel.taxonomy.family, "Cuculidae");
  assert.ok(koel.occurrence_points.length >= 10, "Must have verified field observations");

  // Every sample coordinate must be a real GPS coordinate
  koel.occurrence_points.forEach(occ => {
    assert.strictEqual(typeof occ.lat, "number");
    assert.strictEqual(typeof occ.lon, "number");
    assert.strictEqual(occ.is_individual_point, true);
  });
});

test("9. Unmatched species lookup returns null / safe empty state", () => {
  const nonExistent = speciesCatalog["Tyrannosaurus rex"];
  assert.strictEqual(nonExistent, undefined, "Extinct / non-Indian species must not match");
});
