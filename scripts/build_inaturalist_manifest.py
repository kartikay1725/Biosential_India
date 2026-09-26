from pathlib import Path
from zipfile import ZipFile
from collections import Counter
import csv
import io
import re


PROJECT_ROOT = Path(r"D:\Biosential_India")

INAT_ROOT = PROJECT_ROOT / "data" / "raw" / "inaturalist"
OUTPUT_ROOT = PROJECT_ROOT / "data" / "processed" / "inaturalist"

OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)

MANIFEST_PATH = OUTPUT_ROOT / "image_manifest.csv"
CLASS_AUDIT_PATH = OUTPUT_ROOT / "image_class_audit.csv"

# Conservative media-license policy for model training.
# Keep only licenses without NC/ND restrictions.
ALLOWED_MEDIA_LICENSES = {
    "http://creativecommons.org/licenses/by/4.0/": "CC_BY_4_0",
    "https://creativecommons.org/licenses/by/4.0/": "CC_BY_4_0",
    "http://creativecommons.org/publicdomain/zero/1.0/": "CC0_1_0",
    "https://creativecommons.org/publicdomain/zero/1.0/": "CC0_1_0",
}


def find_zip() -> Path:
    zips = sorted(INAT_ROOT.glob("*.zip"))

    if not zips:
        raise FileNotFoundError(
            f"No GBIF iNaturalist ZIP found in:\n{INAT_ROOT}"
        )

    if len(zips) > 1:
        print("ZIP files found:")
        for path in zips:
            print(" ", path.name)

        raise RuntimeError(
            "Multiple ZIP files found. Keep only the intended "
            "GBIF iNaturalist archive in data/raw/inaturalist/."
        )

    return zips[0]


def open_tsv(zf: ZipFile, member: str):
    raw = zf.open(member, "r")

    return io.TextIOWrapper(
        raw,
        encoding="utf-8",
        errors="replace",
        newline="",
    )


def normalize_license(value: str):
    value = value.strip()

    return ALLOWED_MEDIA_LICENSES.get(value)


def safe_species_folder(species: str, species_key: str) -> str:
    species = species.strip() or "unknown_species"

    # Remove characters problematic on Windows.
    species = re.sub(r'[<>:"/\\|?*]', "_", species)

    # Collapse repeated whitespace.
    species = re.sub(r"\s+", "_", species)

    species = species[:100]

    if species_key:
        return f"{species_key}__{species}"

    return species


def main():
    zip_path = find_zip()

    print("=" * 100)
    print("BIOSENTINEL INDIA — iNATURALIST IMAGE MANIFEST")
    print("=" * 100)

    print("\nArchive:")
    print(zip_path)

    print(
        f"Size: "
        f"{zip_path.stat().st_size / (1024 ** 2):,.2f} MB"
    )

    # ------------------------------------------------------------------
    # STEP 1 — Load occurrence metadata required for the image dataset
    # ------------------------------------------------------------------

    print("\n[1/3] Loading occurrence metadata...")

    occurrence = {}

    with ZipFile(zip_path, "r") as zf:
        with open_tsv(zf, "occurrence.txt") as f:
            reader = csv.DictReader(f, delimiter="\t")

            for row in reader:
                gbif_id = row.get("gbifID", "").strip()

                if not gbif_id:
                    continue

                species = row.get("species", "").strip()
                species_key = row.get("speciesKey", "").strip()

                # A species-level label is required for classification.
                if not species or not species_key:
                    continue

                occurrence[gbif_id] = {
                    "gbifID": gbif_id,
                    "occurrenceID": row.get("occurrenceID", "").strip(),
                    "species": species,
                    "speciesKey": species_key,

                    "acceptedScientificName": row.get(
                        "acceptedScientificName", ""
                    ).strip(),

                    "genus": row.get("genus", "").strip(),
                    "family": row.get("family", "").strip(),
                    "order": row.get("order", "").strip(),
                    "class": row.get("class", "").strip(),
                    "phylum": row.get("phylum", "").strip(),
                    "kingdom": row.get("kingdom", "").strip(),

                    "year": row.get("year", "").strip(),
                    "eventDate": row.get("eventDate", "").strip(),

                    "decimalLatitude": row.get(
                        "decimalLatitude", ""
                    ).strip(),

                    "decimalLongitude": row.get(
                        "decimalLongitude", ""
                    ).strip(),

                    "coordinateUncertaintyInMeters": row.get(
                        "coordinateUncertaintyInMeters", ""
                    ).strip(),

                    "countryCode": row.get("countryCode", "").strip(),

                    "stateProvince": row.get(
                        "stateProvince", ""
                    ).strip(),

                    "locality": row.get("locality", "").strip(),

                    "occurrenceStatus": row.get(
                        "occurrenceStatus", ""
                    ).strip(),

                    "basisOfRecord": row.get(
                        "basisOfRecord", ""
                    ).strip(),

                    "occurrenceLicense": row.get(
                        "license", ""
                    ).strip(),

                    "references": row.get(
                        "references", ""
                    ).strip(),
                }

    print(
        f"Occurrence records with valid species labels: "
        f"{len(occurrence):,}"
    )

    # ------------------------------------------------------------------
    # STEP 2 — Join multimedia to occurrences
    # ------------------------------------------------------------------

    print("\n[2/3] Joining multimedia records...")

    manifest_rows = []

    seen_urls = set()

    media_total = 0
    media_still_image = 0
    media_with_identifier = 0
    media_allowed_license = 0
    media_joined = 0
    duplicate_urls = 0
    unmatched_occurrences = 0

    media_license_counts = Counter()
    species_counts = Counter()

    with ZipFile(zip_path, "r") as zf:
        with open_tsv(zf, "multimedia.txt") as f:
            reader = csv.DictReader(f, delimiter="\t")

            for row in reader:
                media_total += 1

                media_type = row.get("type", "").strip()

                if media_type != "StillImage":
                    continue

                media_still_image += 1

                identifier = row.get("identifier", "").strip()

                if not identifier:
                    continue

                media_with_identifier += 1

                media_license_raw = row.get("license", "").strip()
                media_license = normalize_license(
                    media_license_raw
                )

                media_license_counts[
                    media_license_raw or "[blank]"
                ] += 1

                if media_license is None:
                    continue

                media_allowed_license += 1

                gbif_id = row.get("gbifID", "").strip()

                occurrence_row = occurrence.get(gbif_id)

                if occurrence_row is None:
                    unmatched_occurrences += 1
                    continue

                # Global image URL deduplication.
                if identifier in seen_urls:
                    duplicate_urls += 1
                    continue

                seen_urls.add(identifier)

                species = occurrence_row["species"]
                species_key = occurrence_row["speciesKey"]

                folder = safe_species_folder(
                    species,
                    species_key,
                )

                manifest_rows.append({
                    **occurrence_row,

                    "media_type": media_type,
                    "media_format": row.get(
                        "format", ""
                    ).strip(),

                    "image_url": identifier,

                    "media_reference": row.get(
                        "references", ""
                    ).strip(),

                    "media_created": row.get(
                        "created", ""
                    ).strip(),

                    "media_creator": row.get(
                        "creator", ""
                    ).strip(),

                    "media_publisher": row.get(
                        "publisher", ""
                    ).strip(),

                    "media_license": media_license,
                    "media_license_url": media_license_raw,

                    "media_rightsHolder": row.get(
                        "rightsHolder", ""
                    ).strip(),

                    "species_folder": folder,
                })

                species_counts[species_key] += 1

    print("\nMultimedia statistics:")
    print(f"  Total multimedia rows:       {media_total:,}")
    print(f"  StillImage rows:             {media_still_image:,}")
    print(f"  With image identifier:       {media_with_identifier:,}")
    print(f"  Allowed-license images:      {media_allowed_license:,}")
    print(f"  Joined to species records:   {len(manifest_rows):,}")
    print(f"  Duplicate image URLs:        {duplicate_urls:,}")
    print(f"  Unmatched GBIF IDs:           {unmatched_occurrences:,}")

    # ------------------------------------------------------------------
    # STEP 3 — Write manifest
    # ------------------------------------------------------------------

    print("\n[3/3] Writing manifest...")

    fieldnames = [
        "gbifID",
        "occurrenceID",

        "species",
        "speciesKey",
        "acceptedScientificName",

        "kingdom",
        "phylum",
        "class",
        "order",
        "family",
        "genus",

        "year",
        "eventDate",

        "decimalLatitude",
        "decimalLongitude",
        "coordinateUncertaintyInMeters",

        "countryCode",
        "stateProvince",
        "locality",

        "occurrenceStatus",
        "basisOfRecord",
        "occurrenceLicense",
        "references",

        "media_type",
        "media_format",
        "image_url",
        "media_reference",
        "media_created",
        "media_creator",
        "media_publisher",
        "media_license",
        "media_license_url",
        "media_rightsHolder",

        "species_folder",
    ]

    with MANIFEST_PATH.open(
        "w",
        encoding="utf-8",
        newline="",
    ) as f:

        writer = csv.DictWriter(
            f,
            fieldnames=fieldnames,
        )

        writer.writeheader()

        writer.writerows(manifest_rows)

    # ------------------------------------------------------------------
    # Class audit
    # ------------------------------------------------------------------

    class_rows = []

    for species_key, count in sorted(
        species_counts.items(),
        key=lambda x: x[1],
        reverse=True,
    ):
        # Find species name from first matching manifest row.
        species_name = next(
            (
                row["species"]
                for row in manifest_rows
                if row["speciesKey"] == species_key
            ),
            "unknown",
        )

        class_rows.append({
            "speciesKey": species_key,
            "species": species_name,
            "image_count": count,
            "eligible_20_plus": count >= 20,
            "eligible_50_plus": count >= 50,
            "eligible_100_plus": count >= 100,
        })

    with CLASS_AUDIT_PATH.open(
        "w",
        encoding="utf-8",
        newline="",
    ) as f:

        writer = csv.DictWriter(
            f,
            fieldnames=[
                "speciesKey",
                "species",
                "image_count",
                "eligible_20_plus",
                "eligible_50_plus",
                "eligible_100_plus",
            ],
        )

        writer.writeheader()
        writer.writerows(class_rows)

    print("\nOutputs:")
    print(f"  Manifest:     {MANIFEST_PATH}")
    print(f"  Class audit:  {CLASS_AUDIT_PATH}")

    print("\nDataset summary:")
    print(f"  Unique image records: {len(manifest_rows):,}")
    print(f"  Unique species:       {len(species_counts):,}")

    for threshold in [20, 50, 100, 500]:
        n = sum(
            1
            for count in species_counts.values()
            if count >= threshold
        )

        images = sum(
            count
            for count in species_counts.values()
            if count >= threshold
        )

        print(
            f"  Species with >= {threshold:3} images: "
            f"{n:6,} | images in those classes: {images:,}"
        )

    print("\n" + "=" * 100)
    print("MANIFEST BUILD COMPLETE")
    print("=" * 100)


if __name__ == "__main__":
    main()