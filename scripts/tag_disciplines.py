import json

PRODUCTS_JSON = 'src/lib/data/products.json'

with open(PRODUCTS_JSON, 'r', encoding='utf-8') as f:
    products = json.load(f)

for p in products:
    cat = p.get('category', '')
    dept = p.get('department', '')
    name = p.get('name', '').lower()
    
    disciplines = set()
    
    # Category based assignment
    if cat == "Candle & Pillar Moulds":
        disciplines.add("candle-studio")
    elif cat == "Soap & Bar Moulds":
        disciplines.add("soap-atelier")
    elif cat == "Eco-Resin & Stone Moulds":
        disciplines.add("stone-studio")
        disciplines.add("resin-lab")
    elif cat == "Culinary & Fondant Moulds":
        disciplines.add("soap-atelier")
        disciplines.add("stone-studio")
    elif cat == "General Silicone Moulds":
        if any(w in name for w in ['candle', 'pillar']):
            disciplines.add("candle-studio")
        if any(w in name for w in ['soap', 'bar']):
            disciplines.add("soap-atelier")
        if any(w in name for w in ['tray', 'coaster', 'pot', 'box', 'plate', 'dish', 'planter', 'concrete', 'jesmonite']):
            disciplines.add("stone-studio")
            disciplines.add("resin-lab")
        if not disciplines:
            disciplines.update(["candle-studio", "soap-atelier", "stone-studio", "resin-lab"])
            
    elif cat in ["Fragrance Oils", "Essential Oils"]:
        disciplines.add("candle-studio")
        disciplines.add("soap-atelier")
    elif cat in ["Food-Grade Flavor Oils", "Hydrosols & Floral Waters"]:
        disciplines.add("soap-atelier")
        
    elif cat == "Candle Waxes & Additives":
        disciplines.add("candle-studio")
    elif cat in ["Artisan Soap Bases", "Skincare & Body Bases", "Haircare & Wash Bases", "Raw Butters & Carrier Oils", "Cosmetic Preservatives & Chemicals"]:
        disciplines.add("soap-atelier")
        
    elif cat == "Micas & Pigments":
        disciplines.update(["candle-studio", "soap-atelier", "stone-studio", "resin-lab"])
        
    elif cat == "Candle Jars & Containers":
        disciplines.add("candle-studio")
    elif cat == "Attar & Perfume Bottles":
        disciplines.add("soap-atelier")
    elif cat == "Diffuser Bottles & Accessories":
        disciplines.add("candle-studio")
    elif cat == "Cosmetic Jars & Bottles":
        disciplines.add("soap-atelier")
    elif cat == "Metal Containers & Tins":
        disciplines.add("candle-studio")
        disciplines.add("soap-atelier")
    elif cat in ["Gift Bags & Pouches", "Packaging Boxes & Mailers", "Lids, Caps & Closures", "Stickers & Labels"]:
        disciplines.update(["candle-studio", "soap-atelier", "stone-studio", "resin-lab"])
        
    elif cat == "Wick Systems & Hardware":
        disciplines.add("candle-studio")
    elif cat == "Soap Making Tools":
        disciplines.add("soap-atelier")
    elif cat == "Dried Botanicals & Additives":
        disciplines.update(["candle-studio", "soap-atelier", "resin-lab"])
    elif cat == "Studio Equipment":
        if any(w in name for w in ['wax', 'candle', 'cooktop', 'induction']):
            disciplines.add("candle-studio")
        if any(w in name for w in ['soap', 'cutter']):
            disciplines.add("soap-atelier")
        if not disciplines:
            disciplines.update(["candle-studio", "soap-atelier"])
            
    p['disciplines'] = sorted(list(disciplines))

with open(PRODUCTS_JSON, 'w', encoding='utf-8') as f:
    json.dump(products, f, indent=2, ensure_ascii=False)

# Count disciplines
counts = {}
for p in products:
    for d in p.get('disciplines', []):
        counts[d] = counts.get(d, 0) + 1

print("Discipline counts:")
for d, c in sorted(counts.items()):
    print(f"  {d}: {c}")
