---
title: BioSentinel India Ecological Integrity & Zero-Hallucination Standards
trigger: always_on
---

# BioSentinel India Ecological Integrity Standards

When developing, analyzing, or reporting on the BioSentinel India platform, strictly enforce the following scientific and engineering mandates:

## 1. Dual-Slope Scientific Grounding
- Never equate raw species richness growth with ecological recovery.
- In citizen science data, volunteer sampling surges routinely create false richness inflation. Always evaluate the effort-adjusted slope ($\beta_{\text{adj}} = \beta_{\text{rich}} - \gamma \cdot \beta_{\text{effort}}$) to decouple observation effort from true biological state.

## 2. Zero-Hallucination Data Protocols
- Never fabricate confidence scores, species counts, grid cell IDs, GPS coordinates, or taxonomic ranks.
- Display explicit error states or empty notices when records are unavailable.
- Clearly distinguish individual verified field GPS coordinates (photo field observation locations) from 0.25° EQDGC grid-cell centroids (~25km × 25km).

## 3. Epistemic Integrity
- Occurrence record counts reflect observation events, not animal population size.
- Machine learning predictions (e.g. BioCLIP ViT-B/16) must be labeled as model inference candidates until matched against verified scientific occurrence databases.

## 4. Antigravity Agentic Verification
- Every automated feature must undergo rigorous test validation using walk-forward cross-validation principles and reproducible offline test suites.
