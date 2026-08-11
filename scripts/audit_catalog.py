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

    # 1. Fragrance & Essential Oils (Preserve existing if valid)
    if 'essential oil' in n or 'pure essential' in n:
        return "Essential Oils"
    if 'fragrance oil' in n or 'aroma oil' in n or 'scent oil' in n or 'perfume oil' in n or 'flavour' in n:
        return "Fragrance Oils"

    # 2. Containers & Packaging (Priority Non-Mould)
    container_keywords = ['jar', 'tin', 'container', 'glass', 'lid', 'bottle', 'vial', 'flask', 'canister', 'diffuser bottle', 'dropper', 'box', 'packaging', 'atomizer', 'pump']
    if any(w in n for w in container_keywords) and 'mould' not in n and 'mold' not in n:
        return "Containers & Packaging"

    # 3. Pigments & Colors (Priority Non-Mould)
    pigment_keywords = ['pigment', 'mica', 'color', 'colour', 'dye', 'powder']
    if any(w in n for w in pigment_keywords) and 'mould' not in n and 'mold' not in n and 'soap' not in n:
        return "Pigments & Colors"

    # 4. Candle Making Accessories (Priority Non-Mould)
    accessory_keywords = ['wick', 'sustainer', 'thread', 'wick sticker', 'wick centering']
    if any(w in n for w in accessory_keywords) and 'mould' not in n and 'mold' not in n:
        return "Candle Making Accessories"

    # 5. Premium Bases & Waxes (Priority Non-Mould)
    base_keywords = ['soap base', 'wax flakes', 'soy wax', 'paraffin wax', 'beeswax', 'melt and pour', 'liquid base', 'cream base', 'butter']
    if any(w in n for w in base_keywords) and 'mould' not in n and 'mold' not in n:
        return "Premium Bases & Waxes"

    # 6. Specific Mould Categories
    if any(w in n for w in ['resin', 'jesmonite', 'concrete', 'tray', 'coaster', 'planter', 'terrazzo', 'epoxy']):
        return "Eco-Resin & Stone Moulds"
    if any(w in n for w in ['chocolate', 'cake', 'fondant', 'baking', 'bake', 'cookie', 'cupcake', 'pastry']):
        return "Culinary & Fondant Moulds"
    if any(w in n for w in ['soap', 'bath bomb', 'loaf']):
        return "Soap & Bar Moulds"
    if any(w in n for w in ['candle', 'pillar', 'taper']):
        return "Candle & Pillar Moulds"
    if any(w in n for w in ['mould', 'mold', 'silicone']):
        return "General Silicone Moulds"

    # If current category is already specific, keep it
    if current_cat in [
        "Eco-Resin & Stone Moulds", "Culinary & Fondant Moulds", "Containers & Packaging",
        "Fragrance Oils", "Candle & Pillar Moulds", "General Silicone Moulds",
        "Essential Oils", "Soap & Bar Moulds", "Premium Bases & Waxes",
        "Pigments & Colors", "Candle Making Accessories"
    ]:
        return current_cat

    return "Uncategorized - Needs Review"


def main():
    print("=== Ekora Bazaar Catalog Audit & Deduplication ===\n")
    
    with open(PRODUCTS_FILE, 'r', encoding='utf-8') as f:
        products = json.load(f)

    print(f"Total raw items in catalog: {len(products)}")

    # 1. DEDUPLICATION (by normalized name)
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

    # 2. RE-CATEGORIZATION AUDIT
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

    # Re-assign sequential IDs to guarantee 1..N cleanliness
    for idx, p in enumerate(cleaned_products, 1):
        p['id'] = str(idx)

    # Save cleaned file
    with open(PRODUCTS_FILE, 'w', encoding='utf-8') as f:
        json.dump(cleaned_products, f, indent=2, ensure_ascii=False)

    print(f"\n✅ Saved clean catalog ({len(cleaned_products)} products) to {PRODUCTS_FILE}")


if __name__ == "__main__":
    main()
