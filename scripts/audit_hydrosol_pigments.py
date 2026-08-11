import json

with open('src/lib/data/products.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

# Audit hydrosols
hydrosols = [p for p in products if 'hydrosol' in p['name'].lower() or 'hydrosol' in p.get('category','').lower()]
print('=== HYDROSOL PRODUCTS ===')
for p in hydrosols[:20]:
    print(f"  Name: {p['name']}")
    print(f"  Category: {p['category']}")
    print()
print(f"Total hydrosol matches: {len(hydrosols)}\n")

# Audit pigments
pigments = [p for p in products if any(w in p['name'].lower() for w in ['pigment', 'mica', 'dye', 'color dye', 'candle dye', 'soap dye', 'liquid color', 'oxide'])]
print('=== PIGMENT PRODUCTS ===')
for p in pigments[:20]:
    print(f"  Name: {p['name']}")
    print(f"  Category: {p['category']}")
    print()
print(f"Total pigment matches: {len(pigments)}\n")

# Show all unique categories and their counts
from collections import Counter
cats = Counter(p['category'] for p in products)
print('=== ALL CATEGORIES ===')
for cat, count in cats.most_common():
    print(f"  {cat}: {count}")
