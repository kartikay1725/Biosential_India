---
name: biosentinel-verification
description: Autonomous runbook for validating BioSentinel India biodiversity intelligence datasets, multi-year statistical filters, and BioCLIP AI inference pipelines.
---

# BioSentinel Verification Runbook

This skill outlines the standard automated verification workflow for the BioSentinel India platform under Google Antigravity 2.0.

## 1. Multi-Year Dataset Integrity Check
- Verify that `annual_summaries.json`, `map_points_by_year.json`, and `top_priority_by_year.json` span all 7 authoritative monitoring years (`2018`–`2024`).
- Validate that the cumulative grid-year units equal exactly 12,913 across 2,773 unique 0.25° EQDGC cells.
- Verify that high-priority screening units meet the decoupled threshold ($\ge 38.42$, representing $\ge 95\text{th}$ percentile).

## 2. BioCLIP Vision-Language Model Verification
- Check that the 1,106 classes in `species_catalog.json` match the fine-tuned ViT-B/16 checkpoint (`models/bioclip_exp5a/bioclip_exp5a_best.pth`).
- Verify offline model weight loading without external Hugging Face hub dependencies.
- Ensure verified occurrence GPS points contain valid coordinates, observer credits, and CC licensing.

## 3. Automated Test Execution
Run the full test suite:
```bash
npm test
```
Ensure all tests pass before deploying or publishing.
