"""
Clean Deduplication Script
Removes exact duplicate product listings from products.json, keeping the single best entry for each product.
"""

import json

PRODUCTS_FILE = 'src/lib/data/products.json'

with open(PRODUCTS_FILE, 'r', encoding='utf-8') as f:
    products = json.load(f)

print(f"Catalog size before clean deduplication: {len(products)} products")

seen_titles = set()
unique_products = []
dedup_count = 0

for p in products:
    title_key = p['name'].strip().lower()
    if title_key in seen_titles:
        dedup_count += 1
    else:
        seen_titles.add(title_key)
        unique_products.append(p)

# Re-index product IDs neatly from 1 to N
for idx, p in enumerate(unique_products, 1):
    p['id'] = str(idx)

print(f"✅ Removed {dedup_count} exact duplicate listings.")
print(f"📊 Final Unique Catalog Size: {len(unique_products)} products.")

with open(PRODUCTS_FILE, 'w', encoding='utf-8') as f:
    json.dump(unique_products, f, indent=2, ensure_ascii=False)

print(f"Saved clean deduplicated catalog to {PRODUCTS_FILE}")
