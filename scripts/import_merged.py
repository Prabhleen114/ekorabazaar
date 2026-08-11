"""
Ekora Bazaar – Catalog Re-Categorizer & Merger
==============================================
Applies strict multi-tier categorization rules to the catalog products,
cleans titles, applies +20% prices, generates SEO tags, and updates products.json.

Usage:  python scripts/import_merged.py
"""

import json
import re
import sys
import os

INPUT_FILE = r"C:\Users\prabh\Downloads\merged-1786422768217.json"
EXISTING_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                             "src", "lib", "data", "products.json")


def clean_title(title: str) -> str:
    if not isinstance(title, str):
        return str(title) if title else ""
    title = re.sub(r'(?i)\b(jindeal|vedini|lyba)\b', '', title)
    title = re.sub(r'[,\s\-–]*[A-Za-z]{2,5}[\-]\d{2,6}\s*$', '', title)
    filler_patterns = [
        r'(?i)\bAromatherapy\s+Candle\s+Silicone\s+Moulds?\b',
        r'(?i)\bSilicone\s+Moulds?\b',
        r'(?i)\bAromatherapy\b',
    ]
    for pat in filler_patterns:
        title = re.sub(pat, '', title)
    if '|' in title:
        title = title.split('|')[0].strip()
    title = re.sub(r'\s*[–\-]\s*$', '', title)
    title = re.sub(r'\s*,\s*$', '', title)
    title = re.sub(r'\s{2,}', ' ', title)
    title = title.strip(' ,–-')
    if title == title.upper() and len(title) > 5:
        title = title.title()
    return title


def assign_category(raw_title: str, existing_cat: str = "") -> str:
    if not isinstance(raw_title, str):
        return "Uncategorized - Needs Review"
        
    t = f"{raw_title} {existing_cat}".lower()

    # ── TIER 1: Priority Non-Mould Buckets (Check FIRST before assuming it is a mould) ──
    if any(w in t for w in ['pigment', 'mica', 'color', 'colour', 'dye', 'powder']):
        return "Pigments & Colors"
    if any(w in t for w in ['jar', 'tin', 'container', 'glass', 'lid', 'bottle', 'vial', 'flask', 'canister', 'diffuser']):
        return "Containers & Packaging"
    if any(w in t for w in ['wick', 'sustainer', 'thread']):
        return "Candle Making Accessories"
    if any(w in t for w in ['base', 'melt', 'pour']):
        return "Premium Bases & Waxes"

    # ── TIER 2: Strict Mould Categorization (ONLY apply if item didn't match Tier 1) ──
    if any(w in t for w in ['resin', 'jesmonite', 'concrete', 'tray', 'coaster', 'planter']):
        return "Eco-Resin & Stone Moulds"
    if any(w in t for w in ['chocolate', 'cake', 'fondant', 'baking', 'bake']):
        return "Culinary & Fondant Moulds"
    if any(w in t for w in ['soap', 'bath bomb', 'loaf']):
        return "Soap & Bar Moulds"
    if any(w in t for w in ['candle', 'pillar', 'wax']):
        return "Candle & Pillar Moulds"
    if any(w in t for w in ['mould', 'mold', 'silicone']):
        return "General Silicone Moulds"

    # ── TIER 3: Safe Fallback ──
    return "Uncategorized - Needs Review"


def parse_price(raw_price) -> float:
    if raw_price is None:
        return 0.0
    if isinstance(raw_price, (int, float)):
        return float(raw_price)
    raw_str = re.sub(r'[₹$€£\s,]', '', str(raw_price))
    if not raw_str:
        return 0.0
    match = re.match(r'(\d+\.\d{1,2})', raw_str)
    if match:
        return float(match.group(1))
    match = re.match(r'(\d+)', raw_str)
    if match:
        return float(match.group(1))
    return 0.0


def generate_tiers(base_price: int) -> list:
    if base_price <= 0:
        return []
    return [
        {"minQty": 1,  "maxQty": 11,  "price": base_price, "discountPct": 0},
        {"minQty": 12, "maxQty": 51,  "price": round(base_price * 0.95), "discountPct": 5},
        {"minQty": 52, "maxQty": None, "price": round(base_price * 0.90), "discountPct": 10},
    ]


def generate_tags(name: str, category: str) -> list:
    base_tags = [
        "wholesale", "b2b", "bulk", "supplies", "raw materials", "india",
        "premium", "craft", "handmade", "artisan", "manufacturing",
        "factory price", "ekora", "eco-friendly"
    ]
    words = re.findall(r'[a-z]{3,}', name.lower())
    cat_words = re.findall(r'[a-z]{3,}', category.lower())
    all_tags = list(dict.fromkeys(words + cat_words + base_tags))
    return all_tags[:45]


def main():
    print("=== Ekora Bazaar Multi-Tier Categorizer & Re-indexer ===\n")

    # Load existing products.json
    with open(EXISTING_FILE, 'r', encoding='utf-8') as f:
        products = json.load(f)

    print(f"Re-categorizing {len(products)} products in {EXISTING_FILE}...")
    
    updated_count = 0
    cat_counts = {}

    for p in products:
        raw_name = p.get('name', '')
        old_cat = p.get('category', '')
        new_cat = assign_category(raw_name, old_cat)

        # Preserve fragrance/essential oils if already set properly
        if 'FRAGRANCE' in old_cat.upper() or 'ESSENTIAL' in old_cat.upper():
            if 'ESSENTIAL' in old_cat.upper() or 'essential' in raw_name.lower():
                new_cat = "Essential Oils"
            elif 'FRAGRANCE' in old_cat.upper() or 'fragrance' in raw_name.lower():
                new_cat = "Fragrance Oils"

        p['category'] = new_cat
        cat_counts[new_cat] = cat_counts.get(new_cat, 0) + 1
        updated_count += 1

    with open(EXISTING_FILE, 'w', encoding='utf-8') as f:
        json.dump(products, f, indent=2, ensure_ascii=False)

    print(f"\n✅ Successfully updated categories for all {updated_count} products!")
    print("\n📊 New Category Breakdown:")
    for cat, count in sorted(cat_counts.items(), key=lambda x: -x[1]):
        print(f"  • {cat:<30}: {count}")


if __name__ == "__main__":
    main()
