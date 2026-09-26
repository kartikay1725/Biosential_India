from pathlib import Path
from zipfile import ZipFile
import csv

PROJECT_ROOT = Path(r"D:\Biosential_India")
INAT_ROOT = PROJECT_ROOT / "data" / "raw" / "inaturalist"


def find_zip() -> Path:
    zips = sorted(INAT_ROOT.glob("*.zip"))

    if not zips:
        raise FileNotFoundError(
            f"No ZIP file found in:\n{INAT_ROOT}"
        )

    if len(zips) > 1:
        print("Multiple ZIP files found:")
        for i, path in enumerate(zips, 1):
            print(f"{i}. {path.name}")

        raise RuntimeError(
            "Keep only the GBIF iNaturalist download in this directory "
            "or update the script to select the correct archive."
        )

    return zips[0]


def inspect_text_member(zf: ZipFile, member: str, sample_rows: int = 3):
    print(f"\n{'=' * 80}")
    print(f"{member}")
    print(f"{'=' * 80}")

    with zf.open(member, "r") as raw:
        reader = csv.reader(
            (line.decode("utf-8", errors="replace") for line in raw),
            delimiter="\t",
        )

        header = next(reader)
        print("\nColumns:")
        for i, col in enumerate(header):
            print(f"{i:3}: {col}")

        print("\nSample rows:")
        for i, row in enumerate(reader):
            print(row[:15])
            if i + 1 >= sample_rows:
                break


def main():
    zip_path = find_zip()

    print("Archive:")
    print(zip_path)

    print("\nSize:")
    print(f"{zip_path.stat().st_size / (1024 ** 2):,.2f} MB")

    with ZipFile(zip_path, "r") as zf:
        names = zf.namelist()

        print("\nArchive contents:")
        for name in names:
            print(name)

        normalized = {
            Path(name).name.lower(): name
            for name in names
        }

        print("\nRequired files:")
        for required in [
            "occurrence.txt",
            "multimedia.txt",
            "meta.xml",
        ]:
            print(
                f"{required:20} -> "
                f"{'FOUND' if required in normalized else 'MISSING'}"
            )

        for required in ["occurrence.txt", "multimedia.txt"]:
            if required in normalized:
                inspect_text_member(
                    zf,
                    normalized[required],
                )


if __name__ == "__main__":
    main()