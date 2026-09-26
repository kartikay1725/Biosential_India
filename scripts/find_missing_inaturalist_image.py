from pathlib import Path
import pandas as pd
import hashlib

PROJECT_ROOT = Path(r"D:\Biosential_India")

manifest = PROJECT_ROOT / "data/processed/inaturalist/efficientnet_30_reuse_manifest.csv"
image_root = PROJECT_ROOT / "data/raw/inaturalist/images"

df = pd.read_csv(manifest, low_memory=False)

def filename(row):
    gbif = str(row["gbifID"]).strip()
    url = str(row["image_url"]).strip()
    h = hashlib.sha1(url.encode("utf-8")).hexdigest()[:12]

    fmt = str(row.get("media_format", "")).lower()
    if fmt in ("image/jpeg", "image/pjpeg"):
        ext = ".jpg"
    elif fmt == "image/png":
        ext = ".png"
    elif fmt == "image/gif":
        ext = ".gif"
    elif fmt == "image/webp":
        ext = ".webp"
    else:
        ext = ".jpg"

    return f"{gbif}__{h}{ext}"

missing = []

for _, row in df.iterrows():
    target = (
        image_root
        / str(row["split"])
        / str(row["species_folder"])
        / filename(row)
    )

    if not target.exists():
        missing.append({
            "gbifID": row["gbifID"],
            "species": row["species"],
            "speciesKey": row["speciesKey"],
            "split": row["split"],
            "image_url": row["image_url"],
            "media_format": row.get("media_format", ""),
            "target": str(target),
        })

print("=" * 100)
print("MISSING FINAL IMAGE")
print("=" * 100)

print("Missing count:", len(missing))

for row in missing:
    print("\nGBIF ID:", row["gbifID"])
    print("Species:", row["species"])
    print("Split:", row["split"])
    print("Format:", row["media_format"])
    print("URL:", row["image_url"])
    print("Target:", row["target"])
