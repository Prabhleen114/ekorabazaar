"""
Apply exact user categorization overrides to src/lib/data/products.json
"""
import json

PRODUCTS_FILE = 'src/lib/data/products.json'

with open(PRODUCTS_FILE, 'r', encoding='utf-8') as f:
    products = json.load(f)

# Explicit ID mappings requested by user:
# 36, 181 -> Soap Making Tools
# 180, 185 -> Containers & Packaging
# 954 -> Candle Making Accessories
# 215, 381, 930, 791, 940 -> Soap Additives
# 485, 469, 483 -> Essential Oils
# 938, 929 -> Dried Botanicals
# 904, 905, 906 -> Hydrosols
# 637 -> Fragrance Oils
# 379, 1269 -> Containers & Packaging
# Mould IDs (1197, 1254, 1259, 1267, 1274, 1276, 1277, 1280, 1282) -> Candle & Pillar Moulds

overrides = {
    "36": "Soap Making Tools",
    "181": "Soap Making Tools",
    
    "180": "Containers & Packaging",
    "185": "Containers & Packaging",
    "379": "Containers & Packaging",
    "1269": "Containers & Packaging",
    
    "954": "Candle Making Accessories",
    
    "215": "Soap Additives",
    "381": "Soap Additives",
    "930": "Soap Additives",
    "791": "Soap Additives",
    "940": "Soap Additives",
    
    "485": "Essential Oils",
    "469": "Essential Oils",
    "483": "Essential Oils",
    
    "938": "Dried Botanicals",
    "929": "Dried Botanicals",
    
    "904": "Hydrosols",
    "905": "Hydrosols",
    "906": "Hydrosols",
    
    "637": "Fragrance Oils",
    
    # Moulds requested to go to candle moulds:
    "1197": "Candle & Pillar Moulds",
    "1254": "Candle & Pillar Moulds",
    "1259": "Candle & Pillar Moulds",
    "1267": "Candle & Pillar Moulds",
    "1274": "Candle & Pillar Moulds",
    "1276": "Candle & Pillar Moulds",
    "1277": "Candle & Pillar Moulds",
    "1280": "Candle & Pillar Moulds",
    "1282": "Candle & Pillar Moulds",
}

updated_count = 0

for p in products:
    pid = str(p.get('id', ''))
    if pid in overrides:
        new_cat = overrides[pid]
        old_cat = p.get('category', '')
        p['category'] = new_cat
        updated_count += 1
        print(f"✅ Product ID [{pid}] '{p['name']}': was '{old_cat}' -> NOW '{new_cat}'")

with open(PRODUCTS_FILE, 'w', encoding='utf-8') as f:
    json.dump(products, f, indent=2, ensure_ascii=False)

print(f"\nSuccessfully updated {updated_count} products!")
