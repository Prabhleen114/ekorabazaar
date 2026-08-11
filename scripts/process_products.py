"""
Ekora Bazaar – Product Data Transformer & Categorizer (Strict Multi-Tier)
==========================================================================
Reads product JSON files, applies title cleansing, strict multi-tier categorization,
+20% pricing boost, and 30-50 hidden SEO tag generation.

Usage:  python scripts/process_products.py [input.json] [output.json]
"""

import json
import re
import glob
import os
import sys

# ─── 1. TITLE CLEANSING ────────────────────────────────────────────────────────

def clean_title(title: str) -> str:
    if not isinstance(title, str):
        return str(title) if title else ""

    # Remove specific brand words (case-insensitive, whole-word)
    title = re.sub(r'(?i)\b(jindeal|vedini|lyba)\b', '', title)

    # Remove trailing SKU codes like ", JKB-3187" or "- JKB-3187" or "Jkb-3407"
    title = re.sub(r'[,\s\-–]*[A-Za-z]{2,5}[\-]\d{2,6}\s*$', '', title)

    # Remove redundant filler words/phrases
    filler_patterns = [
        r'(?i)\bAromatherapy\s+Candle\s+Silicone\s+Moulds?\b',
        r'(?i)\bSilicone\s+Moulds?\b',
        r'(?i)\bAromatherapy\b',
    ]
    for pat in filler_patterns:
        title = re.sub(pat, '', title)

    # Remove pipe separators and extra content if any
    if '|' in title:
        title = title.split('|')[0].strip()

    # Clean up artifacts
    title = re.sub(r'\s*[–\-]\s*$', '', title)
    title = re.sub(r'\s*,\s*$', '', title)
    title = re.sub(r'\s{2,}', ' ', title)
    title = title.strip(' ,–-')

    # Convert from ALL CAPS to Title Case
    if title == title.upper() and len(title) > 5:
        title = title.title()

    return title


# ─── 2. STRICT MULTI-TIER CATEGORIZATION ────────────────────────────────────────

def assign_category(raw_title: str, existing_category: str = "") -> str:
    if not isinstance(raw_title, str):
        return "Uncategorized - Needs Review"
        
    t = f"{raw_title} {existing_category}".lower()

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

    # ── TIER 3: The Safe Fallback (Crucial: DO NOT guess) ──
    return "Uncategorized - Needs Review"


# ─── 3. PRICING (+20% BOOST) ───────────────────────────────────────────────────

def parse_price(raw_price) -> float:
    """Extract numeric value handling currency strings & concatenated price corruptions."""
    if raw_price is None:
        return 0.0
    if isinstance(raw_price, (int, float)):
        return float(raw_price)
    raw_str = str(raw_price)
    raw_str = re.sub(r'[₹$€£\s,]', '', raw_str)
    if not raw_str:
        return 0.0
    match = re.match(r'(\d+\.\d{1,2})', raw_str)
    if match:
        return float(match.group(1))
    match = re.match(r'(\d+)', raw_str)
    if match:
        return float(match.group(1))
    return 0.0


def adjust_price(price_val: float) -> int:
    """Increase by 20% and round to nearest whole number."""
    return round(price_val * 1.20)


# ─── 4. SEO TAG EXPLOSION (30-50 HIDDEN TAGS) ──────────────────────────────────

BROAD_TAGS = [
    "DIY craft supplies india", "silicone mould for artists", "premium crafting tools",
    "handmade craft supplies", "silicone molds online india", "high quality silicone moulds",
    "crafting essentials", "creative casting molds", "reusable silicone molds",
    "artisan craft tools india", "buy craft supplies online", "best silicone moulds india",
    "craft mould shop", "professional grade moulds", "craft supplies wholesale india",
    "ekora bazaar", "ekora craft supplies", "silicone mold india buy online",
]

CATEGORY_TAGS = {
    "Pigments & Colors": [
        "craft pigments india", "mica powder for resin", "soap colorants",
        "liquid candle dyes", "epoxy resin pigments", "cosmetic safe mica",
        "pigment powder wholesale", "vibrant craft colors", "pearl mica powders",
    ],
    "Containers & Packaging": [
        "candle containers india", "amber glass jars", "metal tin containers",
        "clear lid tin box", "candle packaging supplies", "wax melt packaging",
        "cookie tin containers", "storage tin box", "cosmetic jars wholesale",
    ],
    "Candle Making Accessories": [
        "candle wicks india", "cotton candle wicks", "wick sustainers",
        "wooden candle wicks", "candle making tools", "wick centering tool",
        "candle testing supplies", "high performance wicks", "candle craft accessories",
    ],
    "Premium Bases & Waxes": [
        "melt and pour soap base", "soy wax flakes india", "paraffin wax wholesale",
        "beeswax pellets", "liquid soap base", "body lotion base",
        "natural candle wax", "cosmetic raw bases", "soap making ingredients",
    ],
    "Eco-Resin & Stone Moulds": [
        "jesmonite casting mould", "resin art mold india", "concrete mold diy",
        "terrazzo tray mold", "epoxy resin mold", "coaster silicone mold",
        "resin jewelry mold", "home decor casting mould", "planter mold silicone",
        "trinket dish mould", "cement casting molds",
    ],
    "Culinary & Fondant Moulds": [
        "fondant decorating mould", "cake design mold", "baking accessories india",
        "chocolate molding supplies", "edible art molds", "fondant cake topper mold",
        "sugar craft mould", "bakery mould supplies", "chocolate silicone mold india",
    ],
    "Soap & Bar Moulds": [
        "soap making mold india", "cold process soap mould", "melt and pour soap mold",
        "bath bomb mold silicone", "handmade soap supplies", "soap bar mould",
        "loofah soap making", "soap craft tools india", "bath fizzy mold",
    ],
    "Candle & Pillar Moulds": [
        "candle making mould india", "wax casting mold", "aroma candle mould",
        "diy candle making supplies", "pillar candle mold", "tealight mold",
        "decorative candle mould", "soy wax candle mold", "taper candle mold",
    ],
    "General Silicone Moulds": [
        "multi use silicone mold", "versatile craft mould", "all purpose casting mold",
        "hobby mould india", "craft casting supplies", "art resin mold",
        "silicone mold multipurpose", "general craft mould", "clay mold silicone",
    ],
    "Uncategorized - Needs Review": [
        "raw materials india", "craft supplies wholesale", "artisan materials",
        "diy project supplies", "creative craft materials", "ekora bazaar catalog",
    ],
}


def generate_seo_tags(category: str, clean_title: str) -> list:
    tags = list(BROAD_TAGS)
    tags.extend(CATEGORY_TAGS.get(category, CATEGORY_TAGS["Uncategorized - Needs Review"]))

    if isinstance(clean_title, str):
        stop_words = {'the', 'for', 'and', 'with', 'diy', 'set', 'pack', 'size', 'new', 'best', 'series'}
        words = [w.lower() for w in re.findall(r'[A-Za-z]{4,}', clean_title) if w.lower() not in stop_words]
        unique_words = list(dict.fromkeys(words))

        for w in unique_words[:10]:
            tags.append(f"{w} mold")
            tags.append(f"{w} mould india")
            tags.append(f"{w} casting")

    seen = set()
    unique_tags = []
    for tag in tags:
        tag_lower = tag.lower().strip()
        if tag_lower not in seen:
            seen.add(tag_lower)
            unique_tags.append(tag)

    return unique_tags[:50]


# ─── 5. PROCESS SINGLE PRODUCT ─────────────────────────────────────────────────

def process_single_product(item: dict) -> dict:
    raw_title = item.get('Product Name', item.get('title', item.get('name', '')))
    existing_cat = item.get('Category', item.get('category', ''))

    if 'Minimum Price' in item:
        price = parse_price(item.get('Minimum Price', 0))
    elif 'Price' in item:
        price = parse_price(item.get('Price', 0))
    else:
        price = parse_price(item.get('price', 0))

    new_title = clean_title(raw_title)
    category = assign_category(raw_title, existing_cat)
    new_price = adjust_price(price)
    seo_tags = generate_seo_tags(category, new_title)

    output = {
        "title": new_title,
        "category": category,
        "price": new_price,
        "image": item.get('Main Image', item.get('image', '')),
        "image_alt": item.get('Main Image Alt Text', item.get('Image Description', new_title)),
        "alt_image": item.get('Alternative Image', None),
        "seo_tags": seo_tags,
    }

    # Override / remove caps explicitly
    output.pop('compare_at_price', None)
    output.pop('max_price', None)
    output.pop('upper_limit', None)

    return output


# ─── 6. MAIN CONTROLLER ────────────────────────────────────────────────────────

def main():
    input_file = sys.argv[1] if len(sys.argv) > 1 else 'input.json'
    output_file = sys.argv[2] if len(sys.argv) > 2 else 'output.json'

    # Fallback to local files if input.json doesn't exist
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if not os.path.exists(input_file):
        merged_path = r"C:\Users\prabh\Downloads\merged-1786422768217.json"
        if os.path.exists(merged_path):
            input_file = merged_path
        else:
            input_file = os.path.join(base_dir, 'shop 400 products jindeal.json')

    print(f"📖 Reading input file: {input_file}")
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"❌ Failed to load input file '{input_file}': {e}")
        return

    output_data = []
    processed = 0
    errors = 0

    for idx, item in enumerate(data):
        try:
            if not isinstance(item, dict):
                continue
            res = process_single_product(item)
            output_data.append(res)
            processed += 1
        except Exception as e:
            errors += 1
            print(f"  ⚠️ Error at index {idx}: {e}")
            output_data.append({
                "title": str(item.get('Product Name', item.get('title', 'Unknown'))),
                "category": "Uncategorized - Needs Review",
                "price": 0,
                "seo_tags": list(BROAD_TAGS),
                "_error": str(e)
            })

    # Deduplicate by title
    seen = set()
    deduped = []
    dupes = 0
    for p in output_data:
        t = p['title'].lower().strip()
        if t not in seen:
            seen.add(t)
            deduped.append(p)
        else:
            dupes += 1

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(deduped, f, indent=2, ensure_ascii=False)

    print(f"\n✅ Done! Processed: {processed} items | Duplicates removed: {dupes} | Errors: {errors}")
    print(f"📁 Output saved to: {output_file}\n")

    # Category breakdown report
    cat_counts = {}
    for p in deduped:
        cat_counts[p['category']] = cat_counts.get(p['category'], 0) + 1

    print("📊 Category Distribution:")
    for cat, count in sorted(cat_counts.items(), key=lambda x: -x[1]):
        print(f"  • {cat:<32}: {count}")


if __name__ == "__main__":
    main()
