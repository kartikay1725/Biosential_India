import pandas as pd

path = r"data/processed/inaturalist/image_class_audit.csv"
df = pd.read_csv(path)

print("=" * 80)
print("iNATURALIST CLASS DISTRIBUTION")
print("=" * 80)

print(f"\nTotal species: {len(df):,}")
print(f"Total images:  {df['image_count'].sum():,}\n")

for n in [5, 10, 20, 50, 100, 200, 500, 1000]:
    species_count = (df["image_count"] >= n).sum()
    image_count = df.loc[
        df["image_count"] >= n,
        "image_count"
    ].sum()

    print(
        f">= {n:4} images: "
        f"{species_count:,} species | "
        f"{image_count:,} images"
    )

print("\n" + "=" * 80)
print("TOP 50 SPECIES BY IMAGE COUNT")
print("=" * 80)

print(
    df.head(50).to_string(index=False)
)
