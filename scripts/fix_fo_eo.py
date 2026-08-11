"""
Ekora Bazaar – F.O. / E.O. Fragrance & Essential Oil Re-Categorizer
===================================================================
Detects products with F O, F.O., F.O, FO (Fragrance Oil) and E O, E.O., E.O, EO (Essential Oil)
in their titles and moves them directly to Fragrance Oils or Essential Oils.

Usage:  python scripts/fix_fo_eo.py
"""

import json
import re
import os

PRODUCTS_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                             "src", "lib", "data", "products.json")


def main():
    print("=== Ekora Bazaar F.O. & E.O. Re-categorizer ===\n")
    
    with open(PRODUCTS_FILE, 'r', encoding='utf-8') as f:
        products = json.load(f)

    fo_pattern = re.compile(r'\b(F\s*O|F\.O\.|F\.O|F/O|FRAGRANCE\s*OIL|PERFUME\s*OIL|AROMA\s*OIL|SCENT\s*OIL)\b', re.IGNORECASE)
    eo_pattern = re.compile(r'\b(E\s*O|E\.O\.|E\.O|E/O|ESSENTIAL\s*OIL)\b', re.IGNORECASE)

    moved_fo = 0
    moved_eo = 0

    for p in products:
        name = p.get('name', '')
        old_cat = p.get('category', '')
        name_lower = name.lower()

        # Skip actual molds/jars/bottles
        if any(w in name_lower for w in ['mold', 'mould', 'silicone', 'silicon', 'jar', 'bottle', 'tin', 'container', 'cap']):
            continue

        if eo_pattern.search(name):
            if old_cat != 'Essential Oils':
                p['category'] = 'Essential Oils'
                moved_eo += 1
                print(f"  🌿 EO Moved: '{name}' (was {old_cat}) -> Essential Oils")

        elif fo_pattern.search(name) or any(w in name_lower for w in ['flavour', 'flavor', 'attar']):
            if old_cat != 'Fragrance Oils':
                p['category'] = 'Fragrance Oils'
                moved_fo += 1
                print(f"  🌸 FO Moved: '{name}' (was {old_cat}) -> Fragrance Oils")

    print(f"\n✅ Total F.O. products moved to Fragrance Oils: {moved_fo}")
    print(f"✅ Total E.O. products moved to Essential Oils: {moved_eo}")

    with open(PRODUCTS_FILE, 'w', encoding='utf-8') as f:
        json.dump(products, f, indent=2, ensure_ascii=False)

    print(f"📁 Updated catalog saved to {PRODUCTS_FILE}")


if __name__ == "__main__":
    main()
