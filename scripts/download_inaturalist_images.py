
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from threading import Lock
import hashlib
import mimetypes
import shutil
import time

import pandas as pd
import requests


PROJECT_ROOT = Path(r"D:\Biosential_India")

# IMPORTANT:
# This is already the final 30-images/species manifest produced by the
# reuse-first preparation script. The downloader MUST NOT select another
# subset, because doing so can drop classes.
MANIFEST = (
    PROJECT_ROOT
    / "data"
    / "processed"
    / "inaturalist"
    / "efficientnet_30_reuse_manifest.csv"
)

IMAGE_ROOT = (
    PROJECT_ROOT
    / "data"
    / "raw"
    / "inaturalist"
    / "images"
)

MAX_WORKERS = 12
TIMEOUT = 45
MAX_RETRIES = 4
RESUME = True
DRY_RUN = False
BATCH_SIZE = MAX_WORKERS * 8

SUPPORTED_EXTENSIONS = {
    ".jpg": ".jpg",
    ".jpeg": ".jpg",
    ".png": ".png",
    ".gif": ".gif",
    ".webp": ".webp",
}


print_lock = Lock()


def log(message: str):
    with print_lock:
        print(message, flush=True)


def extension_from_format(media_format: str, url: str) -> str:
    media_format = str(media_format or "").strip().lower()

    mapping = {
        "image/jpeg": ".jpg",
        "image/pjpeg": ".jpg",
        "image/png": ".png",
        "image/gif": ".gif",
        "image/webp": ".webp",
    }

    if media_format in mapping:
        return mapping[media_format]

    suffix = Path(str(url)).suffix.lower()

    if suffix in SUPPORTED_EXTENSIONS:
        return SUPPORTED_EXTENSIONS[suffix]

    return ".jpg"


def make_filename(row: pd.Series) -> str:
    gbif_id = str(row["gbifID"]).strip()
    url = str(row["image_url"]).strip()

    url_hash = hashlib.sha1(
        url.encode("utf-8")
    ).hexdigest()[:12]

    extension = extension_from_format(
        row.get("media_format", ""),
        url,
    )

    return f"{gbif_id}__{url_hash}{extension}"


def build_existing_index():
    """
    Index every existing image by deterministic filename.
    """
    index = {}

    if not IMAGE_ROOT.exists():
        return index

    for path in IMAGE_ROOT.rglob("*"):
        if not path.is_file():
            continue

        if path.suffix.lower() not in SUPPORTED_EXTENSIONS:
            continue

        index.setdefault(
            path.name,
            []
        ).append(path)

    return index


def expected_path(row: pd.Series) -> Path:
    return (
        IMAGE_ROOT
        / str(row["split"]).strip()
        / str(row["species_folder"]).strip()
        / make_filename(row)
    )


def relocate_existing(
    row: pd.Series,
    existing_index: dict,
):
    """
    Reuse an already downloaded image, even when it lives in the previous
    directory layout.
    """
    target = expected_path(row)

    if target.exists():
        return target

    matches = existing_index.get(
        target.name,
        []
    )

    for source in matches:
        if not source.exists():
            continue

        target.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        try:
            if source.resolve() != target.resolve():
                shutil.move(
                    str(source),
                    str(target),
                )

            return target

        except OSError:
            return source

    return None


def download_one(
    row_dict: dict,
    existing_index: dict,
):
    row = pd.Series(row_dict)

    split = str(
        row["split"]
    ).strip()

    url = str(
        row["image_url"]
    ).strip()

    if not url:
        return {
            "status": "failed",
            "reason": "empty_url",
            "split": split,
            "path": "",
        }

    target = expected_path(row)

    # First: exact target.
    if RESUME and target.exists():
        return {
            "status": "exists",
            "reason": "",
            "split": split,
            "path": str(target),
        }

    # Second: previous download anywhere under IMAGE_ROOT.
    if RESUME:
        reused = relocate_existing(
            row,
            existing_index,
        )

        if reused is not None:
            return {
                "status": "exists",
                "reason": "reused_existing_file",
                "split": split,
                "path": str(reused),
            }

    if DRY_RUN:
        return {
            "status": "dry_run",
            "reason": "",
            "split": split,
            "path": str(target),
        }

    target.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    headers = {
        "User-Agent": (
            "BioSentinel-India/1.0 "
            "(research biodiversity monitoring project)"
        )
    }

    for attempt in range(1, MAX_RETRIES + 1):

        temp_path = target.with_suffix(
            target.suffix + ".part"
        )

        try:
            response = requests.get(
                url,
                headers=headers,
                timeout=TIMEOUT,
                stream=True,
            )

            response.raise_for_status()

            content_type = (
                response.headers
                .get("Content-Type", "")
                .split(";")[0]
                .strip()
                .lower()
            )

            # Do not trust the archive metadata to determine whether the URL
            # is usable. The server response is the final check.
            if content_type and not content_type.startswith("image/"):
                return {
                    "status": "failed",
                    "reason": (
                        f"non_image_content_type:{content_type}"
                    ),
                    "split": split,
                    "path": "",
                }

            with temp_path.open("wb") as f:
                for chunk in response.iter_content(
                    chunk_size=1024 * 256
                ):
                    if chunk:
                        f.write(chunk)

            if temp_path.stat().st_size == 0:
                temp_path.unlink(
                    missing_ok=True
                )
                raise ValueError(
                    "Downloaded file is empty."
                )

            temp_path.replace(target)

            return {
                "status": "downloaded",
                "reason": "",
                "split": split,
                "path": str(target),
            }

        except Exception as exc:

            temp_path.unlink(
                missing_ok=True
            )

            if attempt >= MAX_RETRIES:
                return {
                    "status": "failed",
                    "reason": (
                        f"{type(exc).__name__}: {exc}"
                    ),
                    "split": split,
                    "path": "",
                }

            time.sleep(
                min(2 ** attempt, 10)
            )

    return {
        "status": "failed",
        "reason": "unknown",
        "split": split,
        "path": "",
    }


def validate_manifest(df: pd.DataFrame):
    required = {
        "gbifID",
        "species",
        "speciesKey",
        "species_folder",
        "split",
        "image_url",
    }

    missing = required - set(df.columns)

    if missing:
        raise ValueError(
            f"Manifest missing columns: {sorted(missing)}"
        )

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

    # The final manifest is expected to contain exactly 30 rows/species.
    counts = df.groupby("speciesKey").size()

    if (
        len(counts) != 1106
        or counts.min() != 30
        or counts.max() != 30
    ):
        raise RuntimeError(
            "FINAL MANIFEST VALIDATION FAILED. Expected exactly "
            "1,106 species × 30 images/species. "
            f"Found {len(counts)} species, "
            f"min={counts.min() if len(counts) else 0}, "
            f"max={counts.max() if len(counts) else 0}."
        )

    # Each occurrence must remain in only one split.
    occurrence_split_counts = (
        df.groupby("gbifID")["split"].nunique()
    )

    leakage = occurrence_split_counts[
        occurrence_split_counts > 1
    ]

    if len(leakage):
        raise RuntimeError(
            f"Manifest leakage detected: "
            f"{len(leakage):,} GBIF occurrences span multiple splits."
        )

    return df


def main():

    print("=" * 100)
    print("BIOSENTINEL INDIA — FINAL IMAGE DOWNLOADER")
    print("=" * 100)

    if not MANIFEST.exists():
        raise FileNotFoundError(
            f"Final manifest not found:\n{MANIFEST}"
        )

    IMAGE_ROOT.mkdir(
        parents=True,
        exist_ok=True,
    )

    print("\nLoading FINAL 30-image/species manifest...")

    df = pd.read_csv(
        MANIFEST,
        low_memory=False,
    )

    df = validate_manifest(df)

    print(
        f"Species:     {df['speciesKey'].nunique():,}"
    )

    print(
        f"Images:      {len(df):,}"
    )

    print(
        f"Occurrences: {df['gbifID'].nunique():,}"
    )

    print("\nSplit counts:")
    print(
        df.groupby("split")
        .size()
        .reindex(
            ["train", "val", "test"]
        )
        .to_string()
    )

    print("\nIndexing existing downloaded images...")

    existing_index = build_existing_index()

    existing_files = sum(
        len(v)
        for v in existing_index.values()
    )

    print(
        f"Existing image files found: "
        f"{existing_files:,}"
    )

    # Determine exact reuse count without changing the manifest.
    reusable = 0

    for _, row in df.iterrows():

        target = expected_path(row)

        if target.exists():
            reusable += 1
            continue

        if row["image_url"]:
            matches = existing_index.get(
                target.name,
                []
            )

            if matches:
                reusable += 1

    need_download = len(df) - reusable

    print(
        f"\nAlready reusable: {reusable:,}"
    )

    print(
        f"Actually need download: {need_download:,}"
    )

    if DRY_RUN:
        print("\nDRY RUN ENABLED.")
        for _, row in df.head(10).iterrows():
            print(
                download_one(
                    row.to_dict(),
                    existing_index,
                )
            )
        return

    rows = [
        row.to_dict()
        for _, row in df.iterrows()
    ]

    results = []

    completed = 0
    downloaded = 0
    existing = 0
    failed = 0

    start = time.time()

    try:
        with ThreadPoolExecutor(
            max_workers=MAX_WORKERS
        ) as executor:

            for batch_start in range(
                0,
                len(rows),
                BATCH_SIZE,
            ):
                batch = rows[
                    batch_start:
                    batch_start + BATCH_SIZE
                ]

                futures = [
                    executor.submit(
                        download_one,
                        row,
                        existing_index,
                    )
                    for row in batch
                ]

                for future in as_completed(futures):

                    result = future.result()
                    results.append(result)

                    completed += 1

                    if result["status"] == "downloaded":
                        downloaded += 1

                    elif result["status"] == "exists":
                        existing += 1

                    elif result["status"] == "failed":
                        failed += 1

                    if (
                        completed % 100 == 0
                        or completed == len(rows)
                    ):
                        elapsed = time.time() - start

                        rate = (
                            completed / elapsed
                            if elapsed > 0
                            else 0
                        )

                        remaining = max(
                            len(rows) - completed,
                            0,
                        )

                        eta = (
                            remaining / rate
                            if rate > 0
                            else 0
                        )

                        log(
                            f"[{completed:,}/{len(rows):,}] "
                            f"downloaded={downloaded:,} "
                            f"existing={existing:,} "
                            f"failed={failed:,} "
                            f"rate={rate:.1f}/sec "
                            f"ETA={eta/3600:.2f}h"
                        )

    except KeyboardInterrupt:
        print("\n\nDownload interrupted.")
        print(
            "Completed files remain on disk. "
            "Run the same command again to resume."
        )

    audit_path = (
        PROJECT_ROOT
        / "data"
        / "processed"
        / "inaturalist"
        / "download_audit_final.csv"
    )

    pd.DataFrame(results).to_csv(
        audit_path,
        index=False,
    )

    print("\n" + "=" * 100)
    print("DOWNLOAD RUN FINISHED")
    print("=" * 100)

    print(
        f"\nProcessed:  {completed:,}"
    )

    print(
        f"Downloaded: {downloaded:,}"
    )

    print(
        f"Existing:   {existing:,}"
    )

    print(
        f"Failed:     {failed:,}"
    )

    print(
        f"\nAudit:\n{audit_path}"
    )


if __name__ == "__main__":
    main()