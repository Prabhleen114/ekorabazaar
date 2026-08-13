"""
Scan needs_review folder and products.json to understand the current state.
"""
import json
import os

# Load products
with open('src/lib/data/products.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

print(f"Total products: {len(products)}")

# Products missing custom images (using unsplash or no image)
missing = [p for p in products if 'unsplash' in p.get('image', '') or not p.get('image', '')]
print(f"Products missing custom cover: {len(missing)}")

# Group missing by category
from collections import Counter
cat_counts = Counter(p.get('category', 'NONE') for p in missing)
print("\nMissing covers by category:")
for cat, count in cat_counts.most_common():
    print(f"  {cat}: {count}")

# List files in needs_review
needs_review_dir = 'public/images/needs_review'
files = os.listdir(needs_review_dir)
print(f"\nFiles in needs_review: {len(files)}")
for f in sorted(files):
    size_mb = os.path.getsize(os.path.join(needs_review_dir, f)) / (1024*1024)
    print(f"  {f} ({size_mb:.1f} MB)")

# Show existing product image naming pattern
products_dir = 'public/images/products'
existing = [f for f in os.listdir(products_dir) if os.path.isfile(os.path.join(products_dir, f))]
print(f"\nExisting product images: {len(existing)}")
print("Sample names:")
for f in sorted(existing)[:10]:
    print(f"  {f}")

# Show products with unsplash images (first 30)
print("\n--- Products needing custom images (first 30) ---")
for p in missing[:30]:
    print(f"  ID:{p['id']} | {p['name']} | cat:{p.get('category','?')}")
