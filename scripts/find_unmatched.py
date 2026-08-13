"""Find the correct product matches for the 5 unmatched images."""
import json

with open('src/lib/data/products.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

search_terms = {
    'Lavender Florence': ['lavender florence', 'lavender flor'],
    'Orchid Bloom': ['orchid', 'orchid bloom'],
    'Sweet Basil': ['sweet basil', 'basil'],
    'Temple Fragrance': ['temple'],
    'Vanilla Planifolia': ['vanilla planifolia', 'planifolia'],
}

for label, terms in search_terms.items():
    print(f"\n=== Searching for: {label} ===")
    matches = []
    for p in products:
        name_lower = p['name'].lower()
        for term in terms:
            if term in name_lower:
                matches.append(p)
                break
    for m in matches:
        print(f"  ID:{m['id']} | {m['name']} | cat:{m.get('category','?')} | img:{m.get('image','')[:50]}")
    if not matches:
        print("  NO MATCHES FOUND")
