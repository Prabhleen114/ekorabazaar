"""
Ekora Bazaar – Comprehensive Catalog & Category Auditor
======================================================
1. Detects duplicate product titles listed across multiple categories or IDs.
2. Audits category accuracy using strict rule matching.
3. Automatically resolves duplicates and re-classifies misclassified items.
"""

import json
import re
import os

PRODUCTS_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                             "src", "lib", "data", "products.json")


def strict_categorize(name: str, current_cat: str) -> str:
    n = name.lower()

    # 1. Essential & Fragrance Oils
    if 'essential oil' in n or 'pure essential' in n:
        return "Essential Oils"
    if 'fragrance oil' in n or 'aroma oil' in n or 'scent oil' in n or 'perfume oil' in n or 'flavour' in n:
        return "Fragrance Oils"

    # 2. IF title contains 'mold', 'mould', or 'silicone', IT IS A MOULD!
    is_mould = any(w in n for w in ['mould', 'mold', 'silicone', 'silicon'])

    if is_mould:
        if any(w in n for w in ['resin', 'jesmonite', 'concrete', 'tray', 'coaster', 'planter', 'terrazzo', 'epoxy', 'stone', 'container mold', 'container mould']):
            return "Eco-Resin & Stone Moulds"
        if any(w in n for w in ['chocolate', 'cake', 'fondant', 'baking', 'bake', 'cookie', 'cupcake', 'pastry', 'jelly', 'pudding', 'doraemon', 'cartoon', 'snowflake', 'peppa', 'dinosaur', 'bear', 'animal']):
            return "Culinary & Fondant Moulds"
        if any(w in n for w in ['soap', 'bath bomb', 'loaf', 'bar']):
            return "Soap & Bar Moulds"
        if any(w in n for w in ['candle', 'pillar', 'taper', 'wax', 'yarn ball', 'aromatherapy']):
            return "Candle & Pillar Moulds"
        return "General Silicone Moulds"

    # 3. Non-Mould Items
    if any(w in n for w in ['jar', 'tin', 'container', 'glass', 'lid', 'bottle', 'vial', 'flask', 'canister', 'diffuser bottle', 'dropper', 'box', 'packaging', 'atomizer', 'pump']):
        return "Containers & Packaging"

    if any(w in n for w in ['pigment', 'mica', 'color', 'colour', 'dye', 'powder']):
        return "Pigments & Colors"

    if any(w in n for w in ['wick', 'sustainer', 'thread', 'wick sticker', 'wick centering']):
        return "Candle Making Accessories"

    if any(w in n for w in ['soap base', 'wax flakes', 'soy wax', 'paraffin wax', 'beeswax', 'melt and pour', 'liquid base', 'cream base', 'butter']):
        return "Premium Bases & Waxes"

    return "General Silicone Moulds" if ('silicone' in current_cat.lower() or 'mould' in current_cat.lower() or 'mold' in current_cat.lower()) else "Uncategorized - Needs Review"


def main():
    print("=== Ekora Bazaar Catalog Audit & Deduplication ===\n")
    
    with open(PRODUCTS_FILE, 'r', encoding='utf-8') as f:
        products = json.load(f)

    print(f"Total raw items in catalog: {len(products)}")

    seen_titles = {}
    cleaned_products = []
    duplicates_removed = 0

    for p in products:
        raw_name = p.get('name', '').strip()
        norm_name = re.sub(r'\s+', ' ', raw_name.lower())

        if norm_name in seen_titles:
            duplicates_removed += 1
            continue
        
        seen_titles[norm_name] = p
        cleaned_products.append(p)

    print(f"  • Duplicates removed: {duplicates_removed}")
    print(f"  • Unique products remaining: {len(cleaned_products)}")

    category_reassignments = 0
    cat_counts = {}

    for p in cleaned_products:
        old_cat = p.get('category', '')
        new_cat = strict_categorize(p.get('name', ''), old_cat)

        if old_cat != new_cat:
            p['category'] = new_cat
            category_reassignments += 1

        cat_counts[new_cat] = cat_counts.get(new_cat, 0) + 1

    print(f"\nRe-categorization Audit Complete:")
    print(f"  • Items reassigned to correct category: {category_reassignments}")

    print("\nFinal Clean Category Breakdown:")
    for cat, count in sorted(cat_counts.items(), key=lambda x: -x[1]):
        print(f"  • {cat:<32}: {count}")

    for idx, p in enumerate(cleaned_products, 1):
        p['id'] = str(idx)

    with open(PRODUCTS_FILE, 'w', encoding='utf-8') as f:
        json.dump(cleaned_products, f, indent=2, ensure_ascii=False)

    print(f"\n✅ Saved clean catalog ({len(cleaned_products)} products) to {PRODUCTS_FILE}")


if __name__ == "__main__":
    main()
