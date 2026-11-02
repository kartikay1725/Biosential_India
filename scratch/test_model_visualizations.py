import json
from pathlib import Path
import pandas as pd
import numpy as np

PROJECT_ROOT = Path("D:/Biosential_India")

# Load real metrics files
exp4_comp_path = PROJECT_ROOT / "data/processed/analytics/person3/bioclip_exp4/model_comparison.csv"
exp5a_comp_path = PROJECT_ROOT / "data/processed/analytics/person3/bioclip_exp5a/model_comparison.csv"
phase2_summary_path = PROJECT_ROOT / "data/processed/analytics/person3/phase2/phase2_biosentinel_summary.json"
exp4_hist_path = PROJECT_ROOT / "data/processed/analytics/person3/bioclip_exp4/training_history.csv"
exp5a_hist_path = PROJECT_ROOT / "data/processed/analytics/person3/bioclip_exp5a/training_history.csv"

print("Checking files...")
assert exp4_comp_path.exists(), "Exp4 comparison missing"
assert exp5a_comp_path.exists(), "Exp5a comparison missing"
assert phase2_summary_path.exists(), "Phase 2 summary missing"
assert exp4_hist_path.exists(), "Exp4 history missing"
assert exp5a_hist_path.exists(), "Exp5a history missing"

df_exp4 = pd.read_csv(exp4_comp_path)
df_exp5a = pd.read_csv(exp5a_comp_path)
with open(phase2_summary_path) as f:
    p2_data = json.load(f)

print("Data loaded successfully.")
print("Exp4 models:", len(df_exp4))
print("Exp5a models:", len(df_exp5a))
print("Walk-forward baselines:", list(p2_data["walk_forward_baseline_mae"].keys()))
