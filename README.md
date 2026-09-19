# BioSentinel India

AI-Assisted Biodiversity Intelligence System

BioSentinel India is a terrestrial biodiversity monitoring framework that
combines real-world biodiversity observations, AI-based species identification,
biodiversity indicators, spatial-temporal analysis, baseline comparison,
anomaly detection and explainable priority scoring.

## Project Pipeline

Data Collection
→ Data Preprocessing
→ Species Identification
→ Bias Analysis
→ Biodiversity Indicators
→ Spatial-Temporal Analysis
→ Baseline
→ Anomaly Detection
→ Explainable Priority Score
→ Output

## Project Scope

Primary SDG:
SDG 15 — Life on Land

## Data Sources

- GBIF
- iNaturalist

## Run the Notebooks

From the project root in Windows PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m jupyterlab
```

In JupyterLab, run the notebooks in this order:

1. `notebooks/01_gbif_audit.ipynb`
2. `notebooks/02_biodiversity_data_analysis.ipynb`

Notebook 01 creates the processed GBIF Parquet dataset. Notebook 02 creates the
biodiversity indicators and CSV/Parquet tables under
`data/processed/analytics/`.

To execute both notebooks without opening JupyterLab:

```powershell
python -m nbconvert --to notebook --execute --inplace --ExecutePreprocessor.timeout=1800 notebooks/01_gbif_audit.ipynb
python -m nbconvert --to notebook --execute --inplace --ExecutePreprocessor.timeout=1800 notebooks/02_biodiversity_data_analysis.ipynb
```
