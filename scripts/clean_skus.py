"""
Ekora Bazaar – SKU & Brand Purger
=================================
Strips all JKB codes (JKB-3401, JKB 5084), CODE XXX, brand names (Vedini, Jindeal, Lyba),
and trailing numeric SKU IDs from all product titles across the catalog.

Usage:  python scripts/clean_skus.py
"""

import json
import re
import os

PRODUCTS_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                             "src", "lib", "data", "products.json")


def clean_product_name(title: str) -> str:
    if not isinstance(title, str) or not title:
        return ""

    # 1. Remove brand names (Vedini, Jindeal, Lyba)
    title = re.sub(r'(?i)\b(jindeal|vedini|lyba)\b', '', title)

    # 2. Remove SKU codes like JKB-3401, JKB 5084, JKB-3376, CODE 149, SKU-12, JKB3401, NO-12
    title = re.sub(r'(?i)\s*[,\-–|]*\s*\b(JKB|CODE|SKU|NO|ITEM|REF)[\s\-_]*\d+[A-Z]?\b.*$', '', title)
    title = re.sub(r'(?i)\bJKB[\s\-_]*\d+\b', '', title)
    title = re.sub(r'(?i)\bCODE[\s\-_]*\d+\b', '', title)

    # 3. Remove trailing 3-6 digit standalone SKU numbers at the end (e.g. "CONTAINER MOLD 5413" -> "CONTAINER MOLD")
    title = re.sub(r'\s+\d{3,6}\s*$', '', title)

    # 4. Remove leftover filler phrases
    filler_patterns = [
        r'(?i)\bAromatherapy\s+Candle\s+Silicone\s+Moulds?\b',
        r'(?i)\bSilicone\s+Moulds?\b',
        r'(?i)\bAromatherapy\b',
    ]
    for pat in filler_patterns:
        title = re.sub(pat, '', title)

    # 5. Remove pipe separators if any
    if '|' in title:
        title = title.split('|')[0].strip()

    # 6. Clean up trailing dashes, commas, spaces
    title = re.sub(r'\s*[,\-–|]\s*$', '', title)
    title = re.sub(r'\s{2,}', ' ', title)
    title = title.strip(' ,-–|')

    return title


def main():
    print("=== Ekora Bazaar SKU & Brand Code Purger ===\n")
    
    with open(PRODUCTS_FILE, 'r', encoding='utf-8') as f:
        products = json.load(f)

    print(f"Loaded {len(products)} products from {PRODUCTS_FILE}")
    
    cleaned_count = 0
    samples = []

    for p in products:
        old_name = p.get('name', '')
        new_name = clean_product_name(old_name)

        if old_name != new_name:
            p['name'] = new_name
            cleaned_count += 1
            if len(samples) < 15:
                samples.append((old_name, new_name))

    print(f"\n✅ Cleaned SKU codes from {cleaned_count} product titles!")
    print("\nSample Transformations:")
    for old_t, new_t in samples:
        print(f"  ❌ BEFORE: {old_t}")
        print(f"  ✨ AFTER:  {new_t}\n")

    # Also update description if description contains JKB codes
    desc_cleaned = 0
    for p in products:
        desc = p.get('description', '')
        if 'JKB' in desc or 'Vedini' in desc or 'Jindeal' in desc:
            desc = re.sub(r'(?i)\b(jindeal|vedini|lyba)\b', 'Ekora Bazaar', desc)
            desc = re.sub(r'(?i)\s*[,\-–|]*\s*\bJKB[\s\-_]*\d+[A-Z]?\b', '', desc)
            p['description'] = desc
            desc_cleaned += 1

    with open(PRODUCTS_FILE, 'w', encoding='utf-8') as f:
        json.dump(products, f, indent=2, ensure_ascii=False)

    print(f"✅ Saved clean products to {PRODUCTS_FILE} (descriptions cleaned: {desc_cleaned})")


if __name__ == "__main__":
    main()
