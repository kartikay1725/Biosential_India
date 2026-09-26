"""
BioSentinel India — Phase 3 Integration Tests
Comprehensive suite of 10 automated integration tests validating:
- Query interface and data retrieval
- Precision reproducing locked Phase 2 values
- Explanation structure and evidence completeness
- Decoupled scoring dynamics
- Effort bias diagnostics and sensitivity
- Strict historical boundary enforcement
- Accurate GLM baseline labeling
- Zero retraining guarantee for BioCLIP
"""

import sys
import unittest
from pathlib import Path
import numpy as np
import pandas as pd

# Add src to python path
sys.path.insert(0, str(Path("D:/Biosential_India/src")))
import biosentinel as bs


class TestBioSentinelPhase3Integration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.pipeline = bs.BioSentinelPipeline.get_instance()
        cls.df = cls.pipeline.df

    def test_01_query_known_grid_e076n28aa_2024(self):
        """TEST 1: Query known grid E076N28AA / 2024."""
        res = bs.analyze_grid_year("E076N28AA", 2024)
        self.assertEqual(res["grid_cell"], "E076N28AA")
        self.assertEqual(res["year"], 2024)
        self.assertEqual(res["A_observation_summary"]["species_richness"], 67)
        self.assertEqual(res["A_observation_summary"]["total_occurrences"], 354)
        self.assertAlmostEqual(res["M_final_priority"]["priority_score"], 53.06, places=1)
        self.assertEqual(res["M_final_priority"]["priority_category"], "high screening priority")

    def test_02_query_e078n09bc_2024(self):
        """TEST 2: Query E078N09BC / 2024 (Effort-driven sampling artifact case)."""
        res = bs.analyze_grid_year("E078N09BC", 2024)
        diag = bs.diagnose_data_quality("E078N09BC", 2024)
        self.assertEqual(res["grid_cell"], "E078N09BC")
        self.assertEqual(res["year"], 2024)
        self.assertEqual(res["A_observation_summary"]["species_richness"], 21)
        self.assertEqual(res["A_observation_summary"]["total_occurrences"], 33)
        self.assertTrue(diag["possible_effort_driven_bias"])
        self.assertEqual(res["N_explanation"]["signal_diagnostic"], "effort_driven_signal")

    def test_03_priority_score_reproduces_stored_phase2(self):
        """TEST 3: Priority score reproduces stored Phase 2 value within numerical tolerance."""
        sample_rows = self.df.sample(n=25, random_state=42)
        for _, row in sample_rows.iterrows():
            ev = float(row["evidence_score"])
            rel = float(row["reliability_score"])
            stored_prio = float(row["priority_score"])
            recomputed_prio = bs.compute_priority_score(ev, rel, config="balanced")
            self.assertAlmostEqual(stored_prio, recomputed_prio, places=1)

    def test_04_explanation_contains_all_required_evidence_fields(self):
        """TEST 4: Explanation contains all required evidence fields."""
        record = self.df[(self.df["eqdcellcode"] == "E076N28AA") & (self.df["year"] == 2024)].iloc[0].to_dict()
        exp_text = bs.generate_explanation(record)
        required_headers = [
            "SUMMARY:", "OBSERVATION:", "EFFORT:", "BASELINE:",
            "ANOMALY EVIDENCE:", "TEMPORAL EVIDENCE:", "SPATIAL EVIDENCE:",
            "RELIABILITY:", "PRIORITY:", "CAUTION:", "INTERPRETATION:"
        ]
        for header in required_headers:
            self.assertIn(header, exp_text, f"Missing required header {header} in explanation.")

    def test_05_reliability_is_separate_from_evidence(self):
        """TEST 5: Reliability is separate from evidence (decoupled formulation)."""
        # Given identical evidence, higher reliability MUST yield higher priority
        prio_low_rel = bs.compute_priority_score(evidence_score=80.0, reliability_score=30.0)
        prio_high_rel = bs.compute_priority_score(evidence_score=80.0, reliability_score=90.0)
        self.assertLess(prio_low_rel, prio_high_rel)
        self.assertAlmostEqual(prio_low_rel, 24.0, places=2)
        self.assertAlmostEqual(prio_high_rel, 72.0, places=2)

    def test_06_changing_effort_changes_effort_diagnostics_appropriately(self):
        """TEST 6: Changing observation effort changes effort diagnostics appropriately."""
        stable_row = pd.Series({
            "eqdcellcode": "TEST_STABLE", "year": 2024, "total_occurrences": 300,
            "effort_change_pct": 5.0, "baseline_years": 6.0, "sampling_support_level": "strong",
            "grid_temporal_coverage_pct": 100.0, "grid_usable_year_coverage_pct": 100.0,
            "reliability_score": 85.0
        })
        plunge_row = pd.Series({
            "eqdcellcode": "TEST_PLUNGE", "year": 2024, "total_occurrences": 20,
            "effort_change_pct": -75.0, "baseline_years": 6.0, "sampling_support_level": "limited",
            "grid_temporal_coverage_pct": 100.0, "grid_usable_year_coverage_pct": 100.0,
            "reliability_score": 45.0
        })
        diag_stable = bs.diagnose_data_quality_record(stable_row)
        diag_plunge = bs.diagnose_data_quality_record(plunge_row)
        self.assertFalse(diag_stable["possible_effort_driven_bias"])
        self.assertTrue(diag_plunge["possible_effort_driven_bias"])
        self.assertEqual(diag_plunge["caution_level"], "high")

    def test_07_insufficient_history_produces_caution_flag(self):
        """TEST 7: Missing/insufficient history produces a caution rather than a false strong signal."""
        sparse_history_row = pd.Series({
            "eqdcellcode": "TEST_SPARSE", "year": 2024, "total_occurrences": 150,
            "effort_change_pct": 0.0, "baseline_years": 1.0, "sampling_support_level": "adequate",
            "grid_temporal_coverage_pct": 30.0, "grid_usable_year_coverage_pct": 30.0,
            "reliability_score": 35.0
        })
        diag = bs.diagnose_data_quality_record(sparse_history_row)
        self.assertTrue(diag["missing_data_indicators"]["missing_baseline"])
        self.assertTrue(diag["missing_data_indicators"]["insufficient_temporal_coverage"])
        self.assertEqual(diag["caution_level"], "high")

    def test_08_no_2024_information_used_to_train_historical_baseline(self):
        """TEST 8: No 2024 information is accidentally used to train historical models."""
        # Baseline start and end years for all rows in the dataset
        for _, row in self.df.iterrows():
            if row["year"] == 2024 and pd.notna(row.get("baseline_end_year")):
                self.assertLessEqual(row["baseline_end_year"], 2023)

    def test_09_poisson_negbin_roles_correctly_labelled(self):
        """TEST 9: Poisson / Negative Binomial roles remain correctly labelled."""
        res = bs.analyze_grid_year("E076N28AA", 2024)
        exp = res["E_expected_richness"]
        self.assertIn("PRIMARY EXPECTED-MEAN BASELINE", exp["poisson_role"])
        self.assertIn("OVERDISPERSION / UNCERTAINTY", exp["negbin_role"])
        # Poisson has lowest walk-forward MAE = 31.72
        self.assertIn("31.72", exp["poisson_role"])

    def test_10_bioclip_not_retrained_by_integration_layer(self):
        """TEST 10: BioCLIP is not retrained by the integration layer (locked metrics verified)."""
        metrics = self.pipeline.bioclip_metrics
        self.assertEqual(metrics["status"], "LOCKED")
        self.assertAlmostEqual(metrics["top1_accuracy"] * 100, 78.94, places=2)
        self.assertAlmostEqual(metrics["top5_accuracy"] * 100, 92.87, places=2)
        self.assertAlmostEqual(metrics["macro_f1"] * 100, 78.27, places=2)


if __name__ == "__main__":
    unittest.main()
