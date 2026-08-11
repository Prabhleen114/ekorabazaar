"""
Ekora Bazaar – Merge New Products Into Website Catalog
======================================================
Reads the merged JSON from Downloads, transforms each product into the
website's product schema, deduplicates against existing products.json,
and writes the combined result.

Usage:  python scripts/import_merged.py
"""

import json
import re
import sys
import os

# ─── CONFIG ─────────────────────────────────────────────────────────────────────

INPUT_FILE = r"C:\Users\prabh\Downloads\merged-1786422768217.json"
EXISTING_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                             "src", "lib", "data", "products.json")
OUTPUT_FILE = EXISTING_FILE  # overwrite in-place


# ─── HELPERS ────────────────────────────────────────────────────────────────────

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
    return title


def assign_category(raw_title: str) -> str:
    t = raw_title.lower()
    if any(w in t for w in ['chocolate', 'cake', 'fondant', 'baking', 'cookie', 'cupcake']):
        return "Fondant Mould"
    if any(w in t for w in ['wax', 'candle', 'aromatherapy', 'tealight', 'pillar', 'taper', 'wick', 'fragrance oil']):
        return "Candle Mould"
    if any(w in t for w in ['resin', 'concrete', 'jesmonite', 'tray', 'coaster', 'terrazzo', 'epoxy']):
        return "Eco Resin Mould"
    if any(w in t for w in ['soap', 'bath bomb', 'loofah', 'shower', 'bath', 'glycerin']):
        return "Soap Mould"
    if any(w in t for w in ['mould', 'mold', 'silicone']):
        return "Multi-Purpose Craft Mould"
    if any(w in t for w in ['tin', 'jar', 'container', 'box', 'packaging', 'bottle']):
        return "Packaging & Containers"
    if any(w in t for w in ['pigment', 'dye', 'color', 'colour', 'mica']):
        return "Dyes & Pigments"
    if any(w in t for w in ['essential oil', 'fragrance', 'aroma']):
        return "Fragrance & Essential Oils"
    return "Craft Supplies"


def parse_price(raw_price) -> float:
    if raw_price is None:
        return 0.0
    if isinstance(raw_price, (int, float)):
        return float(raw_price)
    raw_str = re.sub(r'[₹$€£\s,]', '', str(raw_price))
    if not raw_str:
        return 0.0
    match = re.match(r'(\d+\.?\d{0,2})', raw_str)
    if match:
        return float(match.group(1))
    return 0.0


def generate_description(name: str, category: str) -> str:
    return (f"Premium quality {name.lower()} sourced directly for creators. "
            f"Perfect for your next creative project with batch-tested reliability.")


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
        "manufacturer", "distributor", "vendor", "sourcing", "factory price",
        "discount", "quality", "ekora", "eco-friendly",
    ]
    # Add words from name
    stop_words = {'the', 'for', 'and', 'with', 'diy', 'set', 'pack', 'size',
                  'new', 'best', 'from', 'per', 'all', 'use', 'can', 'its'}
    words = re.findall(r'[a-z]{3,}', name.lower())
    name_tags = [w for w in words if w not in stop_words]
    # Add category words
    cat_words = re.findall(r'[a-z]{3,}', category.lower())

    all_tags = list(dict.fromkeys(name_tags + cat_words + base_tags))
    return all_tags[:45]


# ─── MAIN ───────────────────────────────────────────────────────────────────────

def main():
    print("=== Ekora Bazaar Product Importer ===\n")

    # Load existing
    print(f"Loading existing catalog: {EXISTING_FILE}")
    with open(EXISTING_FILE, 'r', encoding='utf-8') as f:
        existing = json.load(f)
    print(f"  Existing products: {len(existing)}")

    # Build a set of existing product names (normalized) for dedup
    existing_names = set()
    for p in existing:
        norm = re.sub(r'\s+', ' ', (p.get('name', '') or '').lower().strip())
        existing_names.add(norm)

    # Find the max existing ID
    max_id = 0
    for p in existing:
        try:
            pid = int(p.get('id', 0))
            if pid > max_id:
                max_id = pid
        except (ValueError, TypeError):
            pass

    # Load new
    print(f"\nLoading new products: {INPUT_FILE}")
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        new_raw = json.load(f)
    print(f"  New raw products: {len(new_raw)}")

    # Process
    added = 0
    skipped_dupes = 0
    skipped_errors = 0
    next_id = max_id + 1

    for idx, item in enumerate(new_raw):
        try:
            if not isinstance(item, dict):
                continue

            raw_name = item.get('Product Name', item.get('title', ''))
            if not raw_name:
                skipped_errors += 1
                continue

            clean_name = clean_title(raw_name)
            norm_name = re.sub(r'\s+', ' ', clean_name.lower().strip())

            # Skip duplicates
            if norm_name in existing_names:
                skipped_dupes += 1
                continue

            # Parse price and apply +20%
            price_raw = item.get('Price', item.get('Minimum Price', item.get('price', 0)))
            base_price = round(parse_price(price_raw) * 1.20)

            category = assign_category(raw_name)
            image = item.get('Main Image', item.get('image', ''))

            product = {
                "id": str(next_id),
                "name": clean_name.upper(),
                "category": category.upper(),
                "description": generate_description(clean_name, category),
                "price": base_price,
                "bulkDiscountAvailable": True,
                "maxDiscount": 10,
                "image": image or "",
                "tiers": generate_tiers(base_price),
                "tags": generate_tags(clean_name, category),
            }

            existing.append(product)
            existing_names.add(norm_name)
            next_id += 1
            added += 1

        except Exception as e:
            skipped_errors += 1
            print(f"  Warning: Error on item {idx}: {e}")

    # Write output
    print(f"\nWriting combined catalog to: {OUTPUT_FILE}")
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(existing, f, indent=2, ensure_ascii=False)

    print(f"\n{'='*50}")
    print(f"  Existing products kept:  {len(existing) - added}")
    print(f"  New products added:      {added}")
    print(f"  Duplicates skipped:      {skipped_dupes}")
    print(f"  Errors skipped:          {skipped_errors}")
    print(f"  TOTAL in catalog now:    {len(existing)}")
    print(f"{'='*50}")


if __name__ == "__main__":
    main()
