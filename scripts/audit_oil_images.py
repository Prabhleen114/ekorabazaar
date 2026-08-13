"""
Audit Fragrance Oils and Essential Oils in src/lib/data/products.json
Identify products missing customized cover photos (using /og-image.jpg, placeholders, or broken/generic links).
"""

import json
from collections import defaultdict

PRODUCTS_FILE = 'src/lib/data/products.json'

with open(PRODUCTS_FILE, 'r', encoding='utf-8') as f:
    products = json.load(f)

fragrance_oils = [p for p in products if p.get('category') == 'Fragrance Oils']
essential_oils = [p for p in products if p.get('category') == 'Essential Oils']

print(f"Total Fragrance Oils in catalog: {len(fragrance_oils)}")
print(f"Total Essential Oils in catalog: {len(essential_oils)}\n")

fo_missing = []
fo_has_custom = []

for p in fragrance_oils:
    img = p.get('image', '')
    if not img or img == '/og-image.jpg' or 'placeholder' in img.lower():
        fo_missing.append(p)
    else:
        fo_has_custom.append(p)

eo_missing = []
eo_has_custom = []

for p in essential_oils:
    img = p.get('image', '')
    if not img or img == '/og-image.jpg' or 'placeholder' in img.lower():
        eo_missing.append(p)
    else:
        eo_has_custom.append(p)

print("=== FRAGRANCE OILS IMAGE AUDIT ===")
print(f"  • Custom/Supplier Cover Photos: {len(fo_has_custom)}")
print(f"  • Missing / Default Cover Photos (/og-image.jpg): {len(fo_missing)}")

print("\n=== ESSENTIAL OILS IMAGE AUDIT ===")
print(f"  • Custom/Supplier Cover Photos: {len(eo_has_custom)}")
print(f"  • Missing / Default Cover Photos (/og-image.jpg): {len(eo_missing)}")

# Show details of missing cover photos
print("\n--- Fragrance Oils Missing Cover Photos ---")
for idx, p in enumerate(fo_missing, 1):
    print(f"{idx}. ID: [{p['id']}] {p['name']} | Current Img: '{p.get('image')}'")

print("\n--- Essential Oils Missing Cover Photos ---")
for idx, p in enumerate(eo_missing, 1):
    print(f"{idx}. ID: [{p['id']}] {p['name']} | Current Img: '{p.get('image')}'")

# Also check supplier image domains to classify generic supplier stock vs custom Ekora artwork
domain_counts = defaultdict(int)
for p in fragrance_oils + essential_oils:
    img = p.get('image', '')
    if img.startswith('http'):
        domain = img.split('/')[2]
        domain_counts[domain] += 1
    else:
        domain_counts[img] += 1

print("\n--- Image Domains for Oils ---")
for dom, cnt in domain_counts.items():
    print(f"  • {dom}: {cnt} products")
