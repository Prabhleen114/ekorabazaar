import json

with open('src/lib/data/products.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

for p in products:
    if str(p['id']) == '418':
        p['image'] = "/images/products/essential oils/Bois De Bois.png"
    elif str(p['id']) == '822':
        p['category'] = "Soap & Bar Moulds"
        p['name'] = p['name'].replace("Mold", "Mould")
    elif str(p['id']) == '820':
        p['image'] = "/images/products/essential oils/anise essential oil.png"
    elif str(p['id']) == '417':
        p['image'] = "/images/products/essential oils/ekora-bazaar-rose-geranium-essential-oil.png"
    elif str(p['id']) == '815':
        p['image'] = "/images/products/essential oils/ekora-bazaar-jasmine-grandiflorum-essential-oil.webp"

with open('src/lib/data/products.json', 'w', encoding='utf-8') as f:
    json.dump(products, f, indent=2, ensure_ascii=False)

print("Fixed discrepancies in products.json.")
