"""
Reassign product 1430 to 'Soap & Bar Moulds' category
"""
import json

PRODUCTS_FILE = 'src/lib/data/products.json'

with open(PRODUCTS_FILE, 'r', encoding='utf-8') as f:
    products = json.load(f)

updated = False

for p in products:
    if str(p.get('id')) == '1430':
        old_cat = p.get('category')
        p['category'] = 'Soap & Bar Moulds'
        updated = True
        print(f"✅ Product ID [1430] '{p['name']}': was '{old_cat}' -> NOW 'Soap & Bar Moulds'")

if updated:
    with open(PRODUCTS_FILE, 'w', encoding='utf-8') as f:
        json.dump(products, f, indent=2, ensure_ascii=False)
    print(f"Saved updated catalog to {PRODUCTS_FILE}")
else:
    print("❌ Product ID 1430 not found!")
