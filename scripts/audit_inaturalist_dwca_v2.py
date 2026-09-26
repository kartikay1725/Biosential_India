from pathlib import Path
from zipfile import ZipFile
from collections import Counter
import csv
import io


PROJECT_ROOT = Path(r"D:\Biosential_India")
INAT_ROOT = PROJECT_ROOT / "data" / "raw" / "inaturalist"


def open_tsv(zf: ZipFile, member: str):
    raw = zf.open(member, "r")
    text = io.TextIOWrapper(
        raw,
        encoding="utf-8",
        errors="replace",
        newline="",
    )
    return text


def find_archive() -> Path:
    zips = sorted(INAT_ROOT.glob("*.zip"))

    if not zips:
        raise FileNotFoundError(
            f"No ZIP archive found in:\n{INAT_ROOT}"
        )

    if len(zips) > 1:
        print("ZIP archives found:")
        for p in zips:
            print(f"  {p.name}")

        raise RuntimeError(
            "Keep only the intended GBIF iNaturalist archive in "
            "data/raw/inaturalist/."
        )

    return zips[0]


def inspect_header(zf: ZipFile, member: str):
    print(f"\n{'=' * 100}")
    print(f"FILE: {member}")
    print(f"{'=' * 100}")

    with open_tsv(zf, member) as f:
        reader = csv.reader(f, delimiter="\t")
        header = next(reader)

        print(f"Columns: {len(header)}\n")

        for i, col in enumerate(header):
            print(f"{i:3}: {col}")

        print("\nFirst 3 rows:\n")

        for i, row in enumerate(reader):
            print(row[:25])
            if i >= 2:
                break

        return header


def audit_occurrence(zf: ZipFile):
    member = "occurrence.txt"

    print(f"\n{'#' * 100}")
    print("OCCURRENCE AUDIT")
    print(f"{'#' * 100}")

    with open_tsv(zf, member) as f:
        reader = csv.DictReader(f, delimiter="\t")

        rows = 0
        unique_gbif_ids = set()

        species_count = 0
        coordinate_count = 0
        no_geo_issue_count = 0

        media_type = Counter()
        country = Counter()
        occurrence_status = Counter()
        occurrence_license = Counter()

        for row in reader:
            rows += 1

            gbif_id = row.get("gbifID", "").strip()
            if gbif_id:
                unique_gbif_ids.add(gbif_id)

            if row.get("species", "").strip():
                species_count += 1

            if row.get("hasCoordinate", "").strip().lower() == "true":
                coordinate_count += 1

            if row.get("hasGeospatialIssues", "").strip().lower() == "false":
                no_geo_issue_count += 1

            media_type[row.get("mediaType", "").strip()] += 1
            country[row.get("countryCode", "").strip()] += 1
            occurrence_status[row.get("occurrenceStatus", "").strip()] += 1
            occurrence_license[row.get("license", "").strip()] += 1

    print(f"\nTotal occurrence rows:       {rows:,}")
    print(f"Unique GBIF IDs:             {len(unique_gbif_ids):,}")
    print(f"Rows with species:            {species_count:,}")
    print(f"Rows with coordinates:        {coordinate_count:,}")
    print(f"Rows with no geo issues:      {no_geo_issue_count:,}")

    print("\nMedia types:")
    for key, value in media_type.most_common():
        print(f"  {key or '[blank]':30} {value:,}")

    print("\nCountries:")
    for key, value in country.most_common(20):
        print(f"  {key or '[blank]':30} {value:,}")

    print("\nOccurrence status:")
    for key, value in occurrence_status.most_common():
        print(f"  {key or '[blank]':30} {value:,}")

    print("\nOccurrence licenses:")
    for key, value in occurrence_license.most_common(20):
        print(f"  {key or '[blank]':30} {value:,}")

    return unique_gbif_ids


def audit_multimedia(zf: ZipFile):
    member = "multimedia.txt"

    print(f"\n{'#' * 100}")
    print("INTERPRETED MULTIMEDIA AUDIT")
    print(f"{'#' * 100}")

    with open_tsv(zf, member) as f:
        reader = csv.DictReader(f, delimiter="\t")

        rows = 0
        unique_gbif_ids = set()

        media_type = Counter()
        media_format = Counter()
        media_license = Counter()
        creators = Counter()
        publishers = Counter()

        nonempty_identifier = 0

        for row in reader:
            rows += 1

            gbif_id = row.get("gbifID", "").strip()

            if not gbif_id:
                # Some archives may use lowercase gbifid.
                gbif_id = row.get("gbifid", "").strip()

            if gbif_id:
                unique_gbif_ids.add(gbif_id)

            identifier = row.get("identifier", "").strip()
            if identifier:
                nonempty_identifier += 1

            media_type[row.get("type", "").strip()] += 1
            media_format[row.get("format", "").strip()] += 1
            media_license[row.get("license", "").strip()] += 1
            creators[row.get("creator", "").strip()] += 1
            publishers[row.get("publisher", "").strip()] += 1

    print(f"\nTotal multimedia rows:        {rows:,}")
    print(f"Unique occurrence GBIF IDs:   {len(unique_gbif_ids):,}")
    print(f"Rows with image identifier:   {nonempty_identifier:,}")

    print("\nMedia types:")
    for key, value in media_type.most_common():
        print(f"  {key or '[blank]':30} {value:,}")

    print("\nMedia formats:")
    for key, value in media_format.most_common(20):
        print(f"  {key or '[blank]':30} {value:,}")

    print("\nMedia licenses:")
    for key, value in media_license.most_common(30):
        print(f"  {key or '[blank]':30} {value:,}")

    print("\nTop creators:")
    for key, value in creators.most_common(10):
        print(f"  {key or '[blank]':30} {value:,}")

    print("\nPublishers:")
    for key, value in publishers.most_common(10):
        print(f"  {key or '[blank]':30} {value:,}")


def main():
    zip_path = find_archive()

    print("\n" + "=" * 100)
    print("BIOSENTINEL INDIA — iNATURALIST GBIF DWCA AUDIT")
    print("=" * 100)

    print(f"\nArchive:")
    print(zip_path)

    print(
        f"Size: "
        f"{zip_path.stat().st_size / (1024 ** 2):,.2f} MB"
    )

    with ZipFile(zip_path, "r") as zf:
        members = set(zf.namelist())

        required = [
            "occurrence.txt",
            "multimedia.txt",
            "verbatim/multimedia.txt",
            "meta.xml",
            "metadata.xml",
        ]

        print("\nRequired members:")
        for name in required:
            print(
                f"  {name:30} "
                f"{'FOUND' if name in members else 'MISSING'}"
            )

        if "occurrence.txt" not in members:
            raise RuntimeError("occurrence.txt is missing.")

        if "multimedia.txt" not in members:
            raise RuntimeError("multimedia.txt is missing.")

        # Explicit paths — never use basename matching here.
        occurrence_header = inspect_header(
            zf,
            "occurrence.txt",
        )

        multimedia_header = inspect_header(
            zf,
            "multimedia.txt",
        )

        print("\n")
        print("IMPORTANT:")
        print("The interpreted multimedia table is:")
        print("    multimedia.txt")
        print("NOT:")
        print("    verbatim/multimedia.txt")

        occurrence_ids = audit_occurrence(zf)
        audit_multimedia(zf)

        print("\n" + "=" * 100)
        print("AUDIT COMPLETE")
        print("=" * 100)

        print(
            "\nThe archive has been audited without extracting "
            "the full ZIP."
        )


if __name__ == "__main__":
    main()