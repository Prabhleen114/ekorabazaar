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


def assign_category(raw_title: str, existing_category: str = "") -> str:
    if not isinstance(raw_title, str):
        return "Uncategorized - Needs Review"
        
    n = f"{raw_title} {existing_category}".lower()

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

    return "General Silicone Moulds" if ('silicone' in existing_category.lower() or 'mould' in existing_category.lower() or 'mold' in existing_category.lower()) else "Uncategorized - Needs Review"


def parse_price(raw_price) -> float:
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
    return round(price_val * 1.20)


BROAD_TAGS = [
    "DIY craft supplies india", "silicone mould for artists", "premium crafting tools",
    "handmade craft supplies", "silicone molds online india", "high quality silicone moulds",
    "crafting essentials", "creative casting molds", "reusable silicone molds",
    "artisan craft tools india", "buy craft supplies online", "best silicone moulds india",
    "craft mould shop", "professional grade moulds", "craft supplies wholesale india",
    "ekora bazaar", "ekora craft supplies", "silicone mold india buy online",
]


def generate_seo_tags(category: str, clean_title: str) -> list:
    tags = list(BROAD_TAGS)
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

    return output


def main():
    input_file = sys.argv[1] if len(sys.argv) > 1 else 'input.json'
    output_file = sys.argv[2] if len(sys.argv) > 2 else 'output.json'

    print(f"📖 Reading input file: {input_file}")
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"❌ Failed to load input file '{input_file}': {e}")
        return

    output_data = []
    processed = 0

    for idx, item in enumerate(data):
        if isinstance(item, dict):
            res = process_single_product(item)
            output_data.append(res)
            processed += 1

    seen = set()
    deduped = []
    for p in output_data:
        t = p['title'].lower().strip()
        if t not in seen:
            seen.add(t)
            deduped.append(p)

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(deduped, f, indent=2, ensure_ascii=False)

    print(f"\n✅ Saved {len(deduped)} products to {output_file}")


if __name__ == "__main__":
    main()
