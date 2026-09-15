import json

with open('src/lib/data/products.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

print(f"Total catalog products: {len(products)}")

# Count products per category
cat_counts = {}
for p in products:
    cat = p.get('category', 'UNCATEGORIZED')
    cat_counts[cat] = cat_counts.get(cat, 0) + 1

print("\n--- PRODUCT COUNTS PER CATEGORY IN products.json ---")
for k, v in sorted(cat_counts.items(), key=lambda x: x[1], reverse=True):
    print(f"  '{k}': {v}")

# Inspect Essential Oils products
eo_products = [p for p in products if p.get('category') == 'Essential Oils']
print(f"\n--- ESSENTIAL OILS CATEGORY: {len(eo_products)} products ---")

moulds_in_eo = []
for p in eo_products:
    name = (p.get('name') or '').upper()
    desc = (p.get('description') or '').upper()
    img = p.get('image') or ''
    if any(k in name for k in ['MOLD', 'MOULD', 'CAVITY', 'SOAP BASE', 'WAX', 'JAR', 'BOTTLE', 'TIN', 'DIFFUSER']):
        moulds_in_eo.append(p)

print(f"Products in Essential Oils containing mold/mould/cavity/jar/bottle/etc: {len(moulds_in_eo)}")
for p in moulds_in_eo[:25]:
    print(f"  ID={p.get('id')} | Name='{p.get('name')[:60]}' | Img='{p.get('image')}'")

# Inspect Hydrosols
hydrosols = [p for p in products if 'Hydrosol' in p.get('category', '') or 'Hydrosol' in (p.get('name') or '') or 'Floral Water' in (p.get('name') or '') or 'Water' in (p.get('name') or '')]
print(f"\n--- HYDROSOLS / FLORAL WATERS IN CATALOG: {len(hydrosols)} products ---")
for p in hydrosols[:25]:
    print(f"  ID={p.get('id')} | Cat='{p.get('category')}' | Name='{p.get('name')[:60]}' | Img='{p.get('image')}'")
