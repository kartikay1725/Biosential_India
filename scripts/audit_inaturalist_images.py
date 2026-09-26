from pathlib import Path
from PIL import Image
from collections import Counter

root = Path(r"D:\Biosential_India\data\raw\inaturalist\images")

splits = ["train", "val", "test"]
valid_ext = {".jpg", ".jpeg", ".png"}

total = 0
corrupt = []
split_counts = {}
class_counts = Counter()

for split in splits:
    split_dir = root / split
    files = [
        p for p in split_dir.rglob("*")
        if p.is_file() and p.suffix.lower() in valid_ext
    ]

    split_counts[split] = len(files)
    total += len(files)

    for path in files:
        class_name = path.parent.name
        class_counts[class_name] += 1

        try:
            with Image.open(path) as img:
                img.verify()

        except Exception as exc:
            corrupt.append((str(path), str(exc)))

print("=" * 90)
print("BIOSENTINEL IMAGE INTEGRITY AUDIT")
print("=" * 90)

print("\nSplit counts:")
for split in splits:
    print(f"  {split:5}: {split_counts[split]:,}")

print(f"\nTotal images: {total:,}")
print(f"Classes:      {len(class_counts):,}")

print("\nPer-class count:")
print(f"  Min:    {min(class_counts.values())}")
print(f"  Max:    {max(class_counts.values())}")
print(f"  Mean:   {sum(class_counts.values()) / len(class_counts):.2f}")

bad_classes = {
    k: v for k, v in class_counts.items()
    if v != 30
}

print(f"\nClasses != 30 images: {len(bad_classes):,}")
print(f"Corrupt images:       {len(corrupt):,}")

if bad_classes:
    print("\nFirst abnormal classes:")
    for k, v in list(bad_classes.items())[:20]:
        print(f"  {k}: {v}")

if corrupt:
    print("\nFirst corrupt images:")
    for path, error in corrupt[:20]:
        print(f"  {path}")
        print(f"    {error}")

print("\n" + "=" * 90)

if (
    total == 33180
    and len(class_counts) == 1106
    and not bad_classes
    and not corrupt
):
    print("IMAGE DATASET INTEGRITY: PASSED")
else:
    print("IMAGE DATASET INTEGRITY: CHECK RESULTS ABOVE")

print("=" * 90)
