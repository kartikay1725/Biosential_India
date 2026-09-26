from IPython.core import display_functions
from pathlib import Path
import hashlib
import pandas as pd


PROJECT_ROOT = Path(r"D:\Biosential_India")

INPUT_MANIFEST = (
    PROJECT_ROOT
    / "data"
    / "processed"
    / "inaturalist"
    / "image_manifest.csv"
)

OUTPUT_DIR = (
    PROJECT_ROOT
    / "data"
    / "processed"
    / "inaturalist"
)

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

OUTPUT_MANIFEST = (
    OUTPUT_DIR
    / "efficientnet_manifest.csv"
)

OUTPUT_AUDIT = (
    OUTPUT_DIR
    / "efficientnet_class_audit.csv"
)


# ---------------------------------------------------------------------
# MODEL DATASET POLICY
# ---------------------------------------------------------------------

MIN_IMAGES_PER_SPECIES = 100
MAX_IMAGES_PER_SPECIES = 200
MIN_OCCURRENCES_PER_SPECIES = 5

TRAIN_FRACTION = 0.70
VAL_FRACTION = 0.15
TEST_FRACTION = 0.15

RANDOM_SEED = 42


def stable_hash(value: str) -> int:
    """
    Deterministic hash so selection is reproducible across machines/runs.
    """
    digest = hashlib.sha256(
        value.encode("utf-8")
    ).digest()

    return int.from_bytes(
        digest[:8],
        byteorder="big",
        signed=False,
    )


def select_species_images(group: pd.DataFrame) -> pd.DataFrame:
    """
    Select up to MAX_IMAGES_PER_SPECIES images while preserving
    representation across multiple GBIF observations.

    We shuffle occurrence groups deterministically and greedily add
    complete observations without exceeding the image cap.
    """

    species = group.iloc[0]["species"]
    species_key = group.iloc[0]["speciesKey"]

    occurrence_groups = []

    for gbif_id, obs in group.groupby("gbifID"):
        occurrence_groups.append(
            {
                "gbifID": gbif_id,
                "count": len(obs),
                "hash": stable_hash(
                    f"{species_key}:{gbif_id}:{RANDOM_SEED}"
                ),
            }
        )

    occurrence_groups.sort(key=lambda x: x["hash"])

    selected_ids = []
    selected_images = 0

    for item in occurrence_groups:

        count = item["count"]

        if selected_images + count <= MAX_IMAGES_PER_SPECIES:
            selected_ids.append(item["gbifID"])
            selected_images += count

        if selected_images >= MAX_IMAGES_PER_SPECIES:
            break

    selected = group[
        group["gbifID"].isin(selected_ids)
    ].copy()

    # If the greedy grouping leaves us below the minimum because of
    # unusually large observation groups, retain the selected groups
    # rather than splitting an observation.
    return selected


def split_species_by_occurrence(group: pd.DataFrame) -> pd.DataFrame:
    """
    Split one species into train/validation/test at GBIF occurrence level.

    All images from the same occurrence stay in the same split.
    """

    group = group.copy()
    group["gbifID"] = (
        group["gbifID"]
        .astype("string")
        .str.strip()
    )

    occurrences = (
        group["gbifID"]
        .dropna()
        .astype(str)
        .unique()
        .tolist()
    )

    occurrences.sort(
        key=lambda x: stable_hash(
            f"{group.iloc[0]['speciesKey']}:{x}:{RANDOM_SEED}:split"
        )
    )

    n = len(occurrences)

    if n < MIN_OCCURRENCES_PER_SPECIES:
        raise ValueError(
            f"Species {group.iloc[0]['species']} has "
            f"only {n} occurrences."
        )

    n_test = max(1, round(n * TEST_FRACTION))
    n_val = max(1, round(n * VAL_FRACTION))

    # Ensure at least one occurrence remains for training.
    while n_test + n_val >= n:
        if n_val > 1:
            n_val -= 1
        elif n_test > 1:
            n_test -= 1
        else:
            break

    test_ids = set(
        occurrences[:n_test]
    )

    val_ids = set(
        occurrences[n_test:n_test + n_val]
    )

    train_ids = set(
        occurrences[n_test + n_val:]
    )

    def assign_split(gbif_id):
        if gbif_id in test_ids:
            return "test"

        if gbif_id in val_ids:
            return "val"

        if gbif_id in train_ids:
            return "train"

        raise RuntimeError(
            f"Occurrence {gbif_id} was not assigned."
        )

    group["split"] = group["gbifID"].map(
        assign_split
    )

    return group


def main():

    print("=" * 100)
    print("BIOSENTINEL INDIA — EFFICIENTNET DATASET PREPARATION")
    print("=" * 100)

    print("\nInput:")
    print(INPUT_MANIFEST)

    if not INPUT_MANIFEST.exists():
        raise FileNotFoundError(
            f"Manifest not found:\n{INPUT_MANIFEST}"
        )

    print("\n[1/5] Loading master image manifest...")

    df = pd.read_csv(
        INPUT_MANIFEST,
        low_memory=False,
    )
    # GBIF IDs must remain strings throughout the pipeline.
    # This prevents integer/string mismatches during occurrence-level splitting.
    df["gbifID"] = (
        df["gbifID"]
        .astype("string")
        .str.strip()
    )

    df["speciesKey"] = (
        df["speciesKey"]
        .astype("string")
        .str.strip()
    )
    required = {
        "gbifID",
        "species",
        "speciesKey",
        "image_url",
        "species_folder",
    }

    missing = required - set(df.columns)

    if missing:
        raise ValueError(
            f"Manifest is missing columns: {sorted(missing)}"
        )

    print(f"Rows:    {len(df):,}")
    print(
        f"Species: {df['speciesKey'].nunique():,}"
    )

    # -----------------------------------------------------------------
    # 2. Eligibility audit
    # -----------------------------------------------------------------

    print("\n[2/5] Auditing species eligibility...")

    species_stats = (
        df.groupby(
            ["speciesKey", "species"],
            dropna=False,
        )
        .agg(
            image_count=("image_url", "count"),
            occurrence_count=("gbifID", "nunique"),
        )
        .reset_index()
    )

    species_stats["eligible_image_count"] = (
        species_stats["image_count"]
        >= MIN_IMAGES_PER_SPECIES
    )

    species_stats["eligible_occurrence_count"] = (
        species_stats["occurrence_count"]
        >= MIN_OCCURRENCES_PER_SPECIES
    )

    species_stats["eligible"] = (
        species_stats["eligible_image_count"]
        & species_stats["eligible_occurrence_count"]
    )

    eligible = species_stats[
        species_stats["eligible"]
    ].copy()

    print(
        f"\nSpecies with >= {MIN_IMAGES_PER_SPECIES} images: "
        f"{species_stats['eligible_image_count'].sum():,}"
    )

    print(
        f"Species with >= {MIN_OCCURRENCES_PER_SPECIES} "
        f"occurrences: "
        f"{species_stats['eligible_occurrence_count'].sum():,}"
    )

    print(
        f"Final eligible species: "
        f"{len(eligible):,}"
    )

    # Only retain eligible species.
    eligible_keys = set(
        eligible["speciesKey"]
    )

    work = df[
        df["speciesKey"].isin(eligible_keys)
    ].copy()

    # -----------------------------------------------------------------
    # 3. Select up to 200 images/species without splitting observations
    # -----------------------------------------------------------------

    print(
        f"\n[3/5] Selecting up to "
        f"{MAX_IMAGES_PER_SPECIES} images/species..."
    )

    selected_parts = []

    for species_key, group in work.groupby(
        "speciesKey",
        sort=False,
    ):
        selected = select_species_images(group)

        if len(selected) >= MIN_IMAGES_PER_SPECIES:
            selected_parts.append(selected)

    selected = pd.concat(
        selected_parts,
        ignore_index=True,
    )

    # Re-audit actual selected classes.
    selected_stats = (
        selected.groupby(
            ["speciesKey", "species"],
            dropna=False,
        )
        .agg(
            selected_images=("image_url", "count"),
            selected_occurrences=("gbifID", "nunique"),
        )
        .reset_index()
    )

    selected = selected.merge(
        selected_stats[
            [
                "speciesKey",
                "selected_occurrences",
            ]
        ],
        on="speciesKey",
        how="left",
    )

    # Safety check.
    selected = selected[
        selected["selected_occurrences"]
        >= MIN_OCCURRENCES_PER_SPECIES
    ].copy()

    print(
        f"Selected species: "
        f"{selected['speciesKey'].nunique():,}"
    )

    print(
        f"Selected images: "
        f"{len(selected):,}"
    )

    print(
        f"Selected occurrences: "
        f"{selected['gbifID'].nunique():,}"
    )

    # -----------------------------------------------------------------
    # 4. Group-aware train / validation / test split
    # -----------------------------------------------------------------

    print(
        "\n[4/5] Creating occurrence-grouped splits..."
    )

    split_parts = []

    for species_key, group in selected.groupby(
        "speciesKey",
        sort=False,
    ):
        split_parts.append(
            split_species_by_occurrence(group)
        )

    final_df = pd.concat(
        split_parts,
        ignore_index=True,
    )

    # -----------------------------------------------------------------
    # 5. Final audit
    # -----------------------------------------------------------------

    print("\n[5/5] Running leakage and distribution checks...")

    # Ensure occurrence cannot occur in multiple splits.
    leakage = (
        final_df.groupby("gbifID")["split"]
        .nunique()
    )

    leaked = leakage[leakage > 1]

    if len(leaked) > 0:
        raise RuntimeError(
            f"DATA LEAKAGE DETECTED: "
            f"{len(leaked)} GBIF occurrences appear "
            f"in multiple splits."
        )

    # Ensure every retained species exists in every split.
    species_split_counts = (
        final_df.groupby(
            ["speciesKey", "split"]
        )
        .size()
        .unstack(
            fill_value=0
        )
    )

    for split in ["train", "val", "test"]:
        if split not in species_split_counts.columns:
            raise RuntimeError(
                f"No {split} split generated."
            )

    missing_split_species = (
        species_split_counts[
            ["train", "val", "test"]
        ]
        .eq(0)
        .any(axis=1)
    )

    if missing_split_species.any():
        missing_species = (
            missing_split_species[
                missing_split_species
            ]
            .index
            .tolist()
        )

        raise RuntimeError(
            f"{len(missing_species)} species are missing "
            f"at least one train/val/test split."
        )

    # Class audit.
    audit = (
        final_df.groupby(
            ["speciesKey", "species"]
        )
        .agg(
            total_images=("image_url", "count"),
            total_occurrences=("gbifID", "nunique"),
            train_images=(
                "split",
                lambda s: (s == "train").sum(),
            ),
            val_images=(
                "split",
                lambda s: (s == "val").sum(),
            ),
            test_images=(
                "split",
                lambda s: (s == "test").sum(),
            ),
        )
        .reset_index()
    )

    audit["train_occurrences"] = (
        final_df[
            final_df["split"] == "train"
        ]
        .groupby("speciesKey")["gbifID"]
        .nunique()
        .reindex(audit["speciesKey"])
        .fillna(0)
        .astype(int)
        .values
    )

    audit["val_occurrences"] = (
        final_df[
            final_df["split"] == "val"
        ]
        .groupby("speciesKey")["gbifID"]
        .nunique()
        .reindex(audit["speciesKey"])
        .fillna(0)
        .astype(int)
        .values
    )

    audit["test_occurrences"] = (
        final_df[
            final_df["split"] == "test"
        ]
        .groupby("speciesKey")["gbifID"]
        .nunique()
        .reindex(audit["speciesKey"])
        .fillna(0)
        .astype(int)
        .values
    )

    # Save outputs.
    final_df.to_csv(
        OUTPUT_MANIFEST,
        index=False,
    )

    audit.to_csv(
        OUTPUT_AUDIT,
        index=False,
    )

    print("\n" + "=" * 100)
    print("FINAL DATASET")
    print("=" * 100)

    print(
        f"\nSpecies:     "
        f"{final_df['speciesKey'].nunique():,}"
    )

    print(
        f"Images:      "
        f"{len(final_df):,}"
    )

    print(
        f"Occurrences: "
        f"{final_df['gbifID'].nunique():,}"
    )

    print("\nSplit distribution:")

    split_summary = (
        final_df.groupby("split")
        .agg(
            images=("image_url", "count"),
            occurrences=("gbifID", "nunique"),
        )
        .reindex(["train", "val", "test"])
    )

    split_summary["percentage"] = (
        split_summary["images"]
        / len(final_df)
        * 100
    )

    print(split_summary)

    print("\nPer-class image statistics:")
    print(
        audit[
            [
                "total_images",
                "train_images",
                "val_images",
                "test_images",
            ]
        ]
        .describe()
        .round(2)
        .to_string()
    )

    print("\nOutputs:")
    print(f"  {OUTPUT_MANIFEST}")
    print(f"  {OUTPUT_AUDIT}")

    print("\nDATA LEAKAGE CHECK: PASSED")
    print("=" * 100)


if __name__ == "__main__":
    main()