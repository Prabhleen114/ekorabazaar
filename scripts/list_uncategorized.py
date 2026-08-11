import json

with open('src/lib/data/products.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

uncategorized = [p for p in products if p.get('category') == 'Uncategorized - Needs Review']

print(f"Total Uncategorized Products: {len(uncategorized)}\n")
for idx, p in enumerate(uncategorized, 1):
    print(f"{idx}. ID: `{p['id']}` | **{p['name']}** | Price: ₹{p['price']}")
