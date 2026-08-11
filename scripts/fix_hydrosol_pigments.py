"""
Fix Hydrosol + Pigments + Uncategorized items.
"""
import json
import re

PRODUCTS_FILE = 'src/lib/data/products.json'

with open(PRODUCTS_FILE, 'r', encoding='utf-8') as f:
    products = json.load(f)

fixed_hydrosol = 0
fixed_pigment = 0
fixed_other = 0

for p in products:
    name = p.get('name', '')
    n = name.lower()
    cat = p.get('category', '')

    # 1. Hydrosols -> "Hydrosols" category
    if 'hydrosol' in n:
        if cat != 'Hydrosols':
            p['category'] = 'Hydrosols'
            fixed_hydrosol += 1
            print(f"  HYDROSOL: '{name}' was '{cat}' -> 'Hydrosols'")
        continue

    # 2. Fix pigment items stuck in wrong categories
    if any(w in n for w in ['pigment', 'mica', 'candle dye', 'soap dye', 'candle color powder', 'candle colour', 'candle color']):
        # But not soap base / bath butter
        if 'butter' not in n and 'base' not in n and 'soap base' not in n:
            if cat != 'Pigments & Colors':
                p['category'] = 'Pigments & Colors'
                fixed_pigment += 1
                print(f"  PIGMENT: '{name}' was '{cat}' -> 'Pigments & Colors'")
            continue

    # 3. Fix remaining "Uncategorized - Needs Review" items
    if cat == 'Uncategorized - Needs Review':
        # Essential oils
        if re.search(r'\b(e\s*o|e\.o\.|essential\s*oil)\b', n):
            p['category'] = 'Essential Oils'
            fixed_other += 1
            continue
        # Fragrance oils
        if re.search(r'\b(f\s*o|f\.o\.|fragrance\s*oil|perfume\s*oil|attar|flavour|flavor)\b', n):
            p['category'] = 'Fragrance Oils'
            fixed_other += 1
            continue
        # Wicks / accessories
        if any(w in n for w in ['wick', 'sustainer', 'thread']):
            p['category'] = 'Candle Making Accessories'
            fixed_other += 1
            continue
        # Bases & waxes
        if any(w in n for w in ['soy wax', 'soap base', 'paraffin', 'melt and pour', 'melt & pour', 'beeswax', 'butter', 'gel wax', 'base']):
            p['category'] = 'Premium Bases & Waxes'
            fixed_other += 1
            continue
        # Jars / bottles / containers
        if any(w in n for w in ['jar', 'tin', 'bottle', 'vial', 'glass', 'lid', 'cap', 'diffuser', 'spray', 'dropper', 'container', 'packaging']):
            p['category'] = 'Containers & Packaging'
            fixed_other += 1
            continue
        # Pigments
        if any(w in n for w in ['pigment', 'mica', 'dye', 'color', 'colour', 'oxide', 'glitter']):
            if 'mold' not in n and 'mould' not in n:
                p['category'] = 'Pigments & Colors'
                fixed_other += 1
                continue
        # Moulds
        if any(w in n for w in ['mold', 'mould', 'silicone', 'silicon']):
            p['category'] = 'General Silicone Moulds'
            fixed_other += 1
            continue

    # 4. Fix FOAMING BATH BUTTER BASE wrongly in Pigments
    if 'foaming bath butter base' in n and cat == 'Pigments & Colors':
        p['category'] = 'Premium Bases & Waxes'
        fixed_other += 1
        print(f"  BASE FIX: '{name}' was 'Pigments & Colors' -> 'Premium Bases & Waxes'")

print(f"\nFixed hydrosols: {fixed_hydrosol}")
print(f"Fixed pigments: {fixed_pigment}")
print(f"Fixed other uncategorized: {fixed_other}")

# Count remaining uncategorized
remaining = sum(1 for p in products if p['category'] == 'Uncategorized - Needs Review')
print(f"Remaining uncategorized: {remaining}")

# Show final category breakdown
from collections import Counter
cats = Counter(p['category'] for p in products)
print("\nFinal Category Breakdown:")
for cat, count in cats.most_common():
    print(f"  {cat}: {count}")

with open(PRODUCTS_FILE, 'w', encoding='utf-8') as f:
    json.dump(products, f, indent=2, ensure_ascii=False)

print(f"\nSaved to {PRODUCTS_FILE}")
