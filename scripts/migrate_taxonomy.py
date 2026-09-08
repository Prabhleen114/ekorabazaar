"""
Ekora Bazaar — Full Taxonomy Migration Script
Assigns every product a `department` and updates `category` (sub-category) to the new taxonomy.
"""
import json
import re

PRODUCTS_JSON = 'src/lib/data/products.json'

# ─── NEW TAXONOMY DEFINITION ───────────────────────────────────────────────────
# Department → list of sub-categories
TAXONOMY = {
    "Casting Mediums & Raw Bases": [
        "Candle Waxes & Additives",
        "Artisan Soap Bases",
        "Skincare & Body Bases",
        "Haircare & Wash Bases",
        "Raw Butters & Carrier Oils",
        "Cosmetic Preservatives & Chemicals",
    ],
    "Scent & Flavor Lab": [
        "Fragrance Oils",
        "Essential Oils",
        "Food-Grade Flavor Oils",
        "Hydrosols & Floral Waters",
    ],
    "Color & Pigment Studio": [
        "Micas & Pigments",
    ],
    "Precision Studio Moulds": [
        "Candle & Pillar Moulds",
        "Soap & Bar Moulds",
        "Eco-Resin & Stone Moulds",
        "Culinary & Fondant Moulds",
        "General Silicone Moulds",
    ],
    "Vessels & Packaging Studio": [
        "Candle Jars & Containers",
        "Attar & Perfume Bottles",
        "Diffuser Bottles & Accessories",
        "Cosmetic Jars & Bottles",
        "Gift Bags & Pouches",
        "Packaging Boxes & Mailers",
        "Lids, Caps & Closures",
        "Stickers & Labels",
        "Metal Containers & Tins",
    ],
    "Tools & Studio Equipment": [
        "Wick Systems & Hardware",
        "Soap Making Tools",
        "Dried Botanicals & Additives",
        "Studio Equipment",
    ],
}

# ─── DIRECT CATEGORY MAPPINGS (old → new department + sub-category) ─────────
DIRECT_MAP = {
    "Fragrance Oils":           ("Scent & Flavor Lab", "Fragrance Oils"),
    "Essential Oils":           ("Scent & Flavor Lab", "Essential Oils"),
    "Food Safe Flavour Oil":    ("Scent & Flavor Lab", "Food-Grade Flavor Oils"),
    "Hydrosols":                ("Scent & Flavor Lab", "Hydrosols & Floral Waters"),
    "Candle & Pillar Moulds":   ("Precision Studio Moulds", "Candle & Pillar Moulds"),
    "Culinary & Fondant Moulds":("Precision Studio Moulds", "Culinary & Fondant Moulds"),
    "Eco-Resin & Stone Moulds": ("Precision Studio Moulds", "Eco-Resin & Stone Moulds"),
    "Soap & Bar Moulds":        ("Precision Studio Moulds", "Soap & Bar Moulds"),
    "General Silicone Moulds":  ("Precision Studio Moulds", "General Silicone Moulds"),
    "Pigments & Colors":        ("Color & Pigment Studio", "Micas & Pigments"),
    "Candle Making Accessories":("Tools & Studio Equipment", "Wick Systems & Hardware"),
    "Soap Additives":           ("Tools & Studio Equipment", "Soap Making Tools"),
    "Soap Making Tools":        ("Tools & Studio Equipment", "Soap Making Tools"),
    "Dried Botanicals":         ("Tools & Studio Equipment", "Dried Botanicals & Additives"),
}

# ─── KEYWORD CLASSIFIER for mixed categories ───────────────────────────────────
def classify_base(name):
    """Classify products from 'Premium Bases & Waxes' into new sub-categories."""
    n = name.lower()
    
    # Candle waxes
    if any(kw in n for kw in ['candle wax', 'soy wax', 'beeswax', 'paraffin wax', 'coconut wax', 'palm wax', 'soy butter wax', 'wax slab', 'wax pellet', 'wax granul', 'wax flake', 'wax chunk', 'candle fragrance']):
        return ("Casting Mediums & Raw Bases", "Candle Waxes & Additives")
    
    # Soap bases
    if any(kw in n for kw in ['soap base', 'melt & pour', 'melt and pour', 'foaming bath butter']):
        return ("Casting Mediums & Raw Bases", "Artisan Soap Bases")
    
    # Haircare & wash bases
    if any(kw in n for kw in ['shampoo', 'hair oil', 'face wash', 'hand wash']):
        return ("Casting Mediums & Raw Bases", "Haircare & Wash Bases")
    
    # Skincare & body bases
    if any(kw in n for kw in ['body butter', 'cream base', 'lotion base', 'gel base', 'body wash', 'shower gel', 'scrub base', 'scrub gel', 'foot scrub', 'sugar scrub', 'under eye']):
        return ("Casting Mediums & Raw Bases", "Skincare & Body Bases")
    
    # Raw butters & carrier oils
    if any(kw in n for kw in ['shea butter', 'cocoa butter', 'mango butter', 'avocado butter', 'raw shea', 'butter cream']):
        return ("Casting Mediums & Raw Bases", "Raw Butters & Carrier Oils")
    
    # Diffuser base
    if 'diffuser base' in n or 'diffuser' in n:
        return ("Casting Mediums & Raw Bases", "Candle Waxes & Additives")
    
    # Triple butter soap (contains "butter" but is actually a soap base)
    if 'triple butter' in n and 'soap' in n:
        return ("Casting Mediums & Raw Bases", "Artisan Soap Bases")
    if 'triple butter' in n and 'bar' in n:
        return ("Casting Mediums & Raw Bases", "Artisan Soap Bases")
    
    # Fallback for gel bases
    if 'gel base' in n:
        return ("Casting Mediums & Raw Bases", "Skincare & Body Bases")
    
    # Default
    return ("Casting Mediums & Raw Bases", "Artisan Soap Bases")


def classify_container(name):
    """Classify products from 'Containers & Packaging' into new sub-categories."""
    n = name.lower()
    
    # Stickers & labels
    if any(kw in n for kw in ['sticker', 'label', 'warning sticker', 'thank you sticker']):
        return ("Vessels & Packaging Studio", "Stickers & Labels")
    
    # Gift bags & pouches
    if any(kw in n for kw in ['potli', 'organza', 'jute', 'goodie bag', 'gift bag', 'pvc bag', 'pvc gift']):
        return ("Vessels & Packaging Studio", "Gift Bags & Pouches")
    
    # Packaging boxes & mailers
    if any(kw in n for kw in ['gift box', 'packaging box', 'corrugated', 'courier', 'polybag', 'mailer', 'pvc box', 'pvc candle', 'pvc sweet', 'empty box', 'candle gift box', 'transparent packaging']):
        return ("Vessels & Packaging Studio", "Packaging Boxes & Mailers")
    
    # Lids, caps & closures
    if any(kw in n for kw in ['cap ', 'cork lid', 'wooden lid', 'flip top cap', 'seal cap', 'inner lid', 'plug']):
        return ("Vessels & Packaging Studio", "Lids, Caps & Closures")
    
    # Self-adhesive cork dots (accessories)
    if 'cork dot' in n:
        return ("Vessels & Packaging Studio", "Lids, Caps & Closures")
    
    # Attar & perfume bottles
    if any(kw in n for kw in ['perfume', 'attar', 'roll-on', 'roll on', 'spray bottle', 'atomizer']):
        return ("Vessels & Packaging Studio", "Attar & Perfume Bottles")
    
    # Diffuser bottles & accessories
    if any(kw in n for kw in ['diffuser', 'reed stick', 'reed diffuser', 'fibre reed', 'aroma diffuser']):
        return ("Vessels & Packaging Studio", "Diffuser Bottles & Accessories")
    
    # Cosmetic jars & bottles  
    if any(kw in n for kw in ['cream jar', 'cosmetic jar', 'lip balm', 'shan jar', 'dropper', 'frosted glass pump', 'lotion', 'sanitizer', 'oil bottle', 'edible oil', 'hdpe', 'amber glass jar', 'amber glass bottle', 'euro dropper', 'glass bottle', 'pump bottle', 'aluminium bottle', 'refillable plastic', 'plastic bottle']):
        return ("Vessels & Packaging Studio", "Cosmetic Jars & Bottles")
    
    # Metal containers & tins
    if any(kw in n for kw in ['tin container', 'tin box', 'sliding tin', 'metal tin', 'mandala tin', 'round tin', 'aluminium tea light', 'metal bucket', 'metal candle', 'iron candle', 'brass', 'copper', 'diya', 'urli']):
        return ("Vessels & Packaging Studio", "Metal Containers & Tins")
    
    # Candle jars & containers (default for glass jars)
    if any(kw in n for kw in ['candle jar', 'candle glass', 'candle cup', 'candle container', 'candle bowl', 'candy jar', 'glass jar', 'cork jar', 'frosted', 'cloche', 'glass set', 'roly poly', 'shot glass', 'chai glass', 'tea glass', 'cringe bowl', 'salt pig', 'deli glass', 'test tube', 'clear glass', 'yankee']):
        return ("Vessels & Packaging Studio", "Candle Jars & Containers")
    
    # Tools that ended up here
    if any(kw in n for kw in ['tape cutter', 'utility knife', 'induction', 'cooktop', 'wax melter', 'spoon']):
        return ("Tools & Studio Equipment", "Studio Equipment")
    
    # Cello tape
    if 'cello tape' in n or 'tape' in n:
        return ("Vessels & Packaging Studio", "Packaging Boxes & Mailers")
    
    # Default
    return ("Vessels & Packaging Studio", "Candle Jars & Containers")


def classify_uncategorized(name):
    """Classify products from 'Uncategorized - Needs Review'."""
    n = name.lower()
    
    # Carrier oils
    if any(kw in n for kw in ['oil cold pressed', 'carrier oil', 'seed oil', 'shea oil', 'marula oil', 'chaulmoogra', 'green tea oil', 'borage oil', 'black seed oil', 'kalonji', 'apricot oil', 'onion hair oil', 'bakuchi oil', 'buckthorn oil', 'coconut carrier', 'pumpkin seed oil', 'flax seed oil']):
        return ("Casting Mediums & Raw Bases", "Raw Butters & Carrier Oils")
    
    # Preservatives & chemicals
    if any(kw in n for kw in ['preservative', 'dmdm', 'phenoxyethanol', 'polysorbate', 'isopropyl', 'diethyl phthalate', 'olivem', 'potassium sorbate', 'sodium benzoate', 'triethanolamine', 'saliguard', 'iscaguard', 'geoguard']):
        return ("Casting Mediums & Raw Bases", "Cosmetic Preservatives & Chemicals")
    
    # Packaging
    if any(kw in n for kw in ['sticker', 'potli', 'organza', 'pvc bag', 'jute', 'craft paper', 'zipper pouch', 'stand up']):
        return ("Vessels & Packaging Studio", "Packaging Boxes & Mailers")
    
    # Induction cooktops (studio equipment)
    if any(kw in n for kw in ['induction', 'cooktop', 'wax melter']):
        return ("Tools & Studio Equipment", "Studio Equipment")
    
    # Spoons & tools
    if any(kw in n for kw in ['spoon', 'knife', 'cutter', 'tape']):
        return ("Tools & Studio Equipment", "Studio Equipment")
    
    # Diffuser/perfume base liquid
    if any(kw in n for kw in ['diffuser base', 'perfume base']):
        return ("Casting Mediums & Raw Bases", "Candle Waxes & Additives")
    
    # Bottles & packaging
    if any(kw in n for kw in ['bottle', 'jar', 'dropper', 'cap']):
        return ("Vessels & Packaging Studio", "Cosmetic Jars & Bottles")
    
    # Default
    return ("Tools & Studio Equipment", "Studio Equipment")


# ─── MAIN MIGRATION ───────────────────────────────────────────────────────────
with open(PRODUCTS_JSON, 'r', encoding='utf-8') as f:
    products = json.load(f)

stats = {}
for p in products:
    old_cat = p.get('category', 'Uncategorized - Needs Review')
    
    if old_cat in DIRECT_MAP:
        dept, sub = DIRECT_MAP[old_cat]
    elif old_cat == 'Premium Bases & Waxes':
        dept, sub = classify_base(p['name'])
    elif old_cat == 'Containers & Packaging':
        dept, sub = classify_container(p['name'])
    elif old_cat == 'Uncategorized - Needs Review':
        dept, sub = classify_uncategorized(p['name'])
    else:
        dept, sub = "Tools & Studio Equipment", "Studio Equipment"
    
    p['department'] = dept
    p['category'] = sub
    
    key = f"{dept} > {sub}"
    stats[key] = stats.get(key, 0) + 1

with open(PRODUCTS_JSON, 'w', encoding='utf-8') as f:
    json.dump(products, f, indent=2, ensure_ascii=False)

print("=== MIGRATION COMPLETE ===")
print(f"Total products: {len(products)}")
print()
for key in sorted(stats.keys()):
    print(f"  {key}: {stats[key]}")
print()
print(f"Total sub-categories used: {len(stats)}")
