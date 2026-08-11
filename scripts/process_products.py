"""
Ekora Bazaar – Product Data Transformer
========================================
Reads all product JSON files (jindeal + soap-base), applies title cleansing,
smart categorization, +20% pricing, and SEO tag explosion, then exports
a single clean output.json ready for website upload.

Usage:  python scripts/process_products.py
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

    # Remove brand words (case-insensitive, whole-word)
    title = re.sub(r'(?i)\b(jindeal|vedini|lyba)\b', '', title)

    # Remove trailing SKU codes like ", JKB-3187" or "- JKB-3187" or standalone "Jkb-3407"
    title = re.sub(r'[,\s\-–]*[A-Za-z]{2,5}[\-]\d{2,6}\s*$', '', title)

    # Remove filler phrases (order matters – longer phrases first)
    filler_patterns = [
        r'(?i)\bAromatherapy\s+Candle\s+Silicone\s+Moulds?\b',
        r'(?i)\bSilicone\s+Moulds?\b',
        r'(?i)\bAromatherapy\b',
    ]
    for pat in filler_patterns:
        title = re.sub(pat, '', title)

    # Remove pipe separators and everything after (e.g. "| Pack 3| Loofa...")
    # Keep the main product name
    if '|' in title:
        parts = title.split('|')
        # Keep first meaningful part but also check if second part adds value
        title = parts[0].strip()

    # Clean up artifacts
    title = re.sub(r'\s*[–\-]\s*$', '', title)   # trailing dashes
    title = re.sub(r'\s*,\s*$', '', title)         # trailing commas
    title = re.sub(r'\s{2,}', ' ', title)          # double spaces
    title = title.strip(' ,–-')

    # Convert from ALL CAPS to Title Case
    if title == title.upper() and len(title) > 5:
        title = title.title()

    return title


# ─── 2. SMART CATEGORIZATION ───────────────────────────────────────────────────

def assign_category(raw_title: str, existing_category: str = "") -> str:
    combined = f"{raw_title} {existing_category}".lower()

    if any(w in combined for w in ['chocolate', 'cake', 'fondant', 'baking', 'cookie', 'cupcake']):
        return "Fondant Mould"
    if any(w in combined for w in ['wax', 'candle', 'aromatherapy', 'tealight', 'pillar', 'taper']):
        return "Candle Mould"
    if any(w in combined for w in ['resin', 'concrete', 'jesmonite', 'tray', 'coaster', 'terrazzo', 'epoxy']):
        return "Eco Resin Mould"
    if any(w in combined for w in ['soap', 'bath bomb', 'loofah', 'shower', 'bath']):
        return "Soap Mould"
    if any(w in combined for w in ['mould', 'mold', 'silicone']):
        return "Multi-Purpose Craft Mould"

    return "Craft Supplies"


# ─── 3. PRICE ADJUSTMENT (+20%) ────────────────────────────────────────────────

def parse_price(raw_price) -> float:
    """Extract numeric value from strings like '₹35.00' or '35.00' or 35.
    Also handles corrupted concatenated prices like '84.001499.0084.001499.00'
    by extracting the first valid decimal number."""
    if raw_price is None:
        return 0.0
    if isinstance(raw_price, (int, float)):
        return float(raw_price)
    raw_str = str(raw_price)
    # Remove currency symbols and whitespace
    raw_str = re.sub(r'[₹$€£\s,]', '', raw_str)
    if not raw_str:
        return 0.0
    # Extract the first valid decimal number (e.g. '84.00' from '84.001499.0084.001499.00')
    match = re.match(r'(\d+\.\d{1,2})', raw_str)
    if match:
        return float(match.group(1))
    # Fallback: try extracting just digits
    match = re.match(r'(\d+)', raw_str)
    if match:
        return float(match.group(1))
    return 0.0


def adjust_price(price_val: float) -> int:
    """Increase by 20% and round to nearest whole number."""
    return round(price_val * 1.20)


# ─── 4. SEO TAG EXPLOSION ──────────────────────────────────────────────────────

BROAD_TAGS = [
    "DIY craft supplies india", "silicone mould for artists", "premium crafting tools",
    "handmade craft supplies", "silicone molds online india", "high quality silicone moulds",
    "crafting essentials", "creative casting molds", "reusable silicone molds",
    "artisan craft tools india", "buy craft supplies online", "best silicone moulds india",
    "craft mould shop", "professional grade moulds", "craft supplies wholesale india",
    "ekora bazaar", "ekora craft supplies", "silicone mold india buy online",
]

CATEGORY_TAGS = {
    "Fondant Mould": [
        "fondant decorating mould", "cake design mold", "baking accessories india",
        "chocolate molding supplies", "edible art molds", "fondant cake topper mold",
        "sugar craft mould", "cake decorating tools india", "bakery mould supplies",
        "chocolate silicone mold india", "cupcake topper mold", "cake pop mold",
        "gum paste mold", "pastry decoration mould",
    ],
    "Candle Mould": [
        "candle making mould india", "wax casting mold", "aroma candle mould",
        "diy candle making supplies", "pillar candle mold", "tealight mold",
        "decorative candle mould", "luxury candle making tools", "candle craft supplies",
        "soy wax candle mold", "taper candle mold", "candle making kit india",
        "scented candle mould", "designer candle mold",
    ],
    "Eco Resin Mould": [
        "jesmonite casting mould", "resin art mold india", "concrete mold diy",
        "terrazzo tray mold", "epoxy resin mold", "coaster silicone mold",
        "resin jewelry mold", "home decor casting mould", "planter mold silicone",
        "resin craft supplies india", "decorative tray mould", "cement mold diy",
        "eco friendly craft mold", "trinket dish mould",
    ],
    "Soap Mould": [
        "soap making mold india", "cold process soap mould", "melt and pour soap mold",
        "bath bomb mold silicone", "handmade soap supplies", "soap bar mould",
        "loofah soap making", "glycerin soap mold", "soap craft tools india",
        "artisan soap mould", "bath fizzy mold", "natural soap making kit",
        "soap making supplies india", "designer soap mold",
    ],
    "Multi-Purpose Craft Mould": [
        "multi use silicone mold", "versatile craft mould", "all purpose casting mold",
        "hobby mould india", "craft casting supplies", "art resin mold",
        "decorative mould", "gift making mold", "creative hobby supplies india",
        "silicone mold multipurpose", "general craft mould", "hobby craft tools",
        "clay mold silicone", "plaster casting mould",
    ],
    "Craft Supplies": [
        "craft accessories india", "diy craft tools", "creative supplies online",
        "art supplies india", "crafting accessories", "handmade supplies",
        "creative tools india", "art and craft materials", "hobby supplies online",
        "diy project supplies", "craft kit essentials", "maker supplies india",
        "creative workspace tools", "artisan materials india",
    ],
}


def generate_seo_tags(category: str, clean_title: str) -> list:
    tags = list(BROAD_TAGS)
    tags.extend(CATEGORY_TAGS.get(category, CATEGORY_TAGS["Craft Supplies"]))

    # Generate title-specific tags from meaningful words
    if isinstance(clean_title, str):
        stop_words = {'the', 'for', 'and', 'with', 'diy', 'set', 'pack', 'size', 'new', 'best'}
        words = [w.lower() for w in re.findall(r'[A-Za-z]{4,}', clean_title) if w.lower() not in stop_words]
        unique_words = list(dict.fromkeys(words))  # preserve order, dedupe

        for w in unique_words[:8]:
            tags.append(f"{w} mold")
            tags.append(f"{w} mould india")
            tags.append(f"{w} silicone mold")

    # Deduplicate while preserving order
    seen = set()
    unique_tags = []
    for tag in tags:
        tag_lower = tag.lower().strip()
        if tag_lower not in seen:
            seen.add(tag_lower)
            unique_tags.append(tag)

    return unique_tags[:50]


# ─── 5. MAIN PROCESSING ────────────────────────────────────────────────────────

def load_all_products(base_dir: str) -> list:
    """Load all product JSON files from the project root."""
    all_products = []

    # Main jindeal file
    main_file = os.path.join(base_dir, 'shop 400 products jindeal.json')
    if os.path.exists(main_file):
        with open(main_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            print(f"  📦 Loaded {len(data)} products from jindeal file")
            all_products.extend(data)

    # Soap base files
    soap_files = glob.glob(os.path.join(base_dir, 'soap-base-products-list*.json'))
    for sf in soap_files:
        try:
            with open(sf, 'r', encoding='utf-8') as f:
                data = json.load(f)
                print(f"  🧼 Loaded {len(data)} products from {os.path.basename(sf)}")
                all_products.extend(data)
        except Exception as e:
            print(f"  ⚠️ Skipping {os.path.basename(sf)}: {e}")

    return all_products


def process_single_product(item: dict) -> dict:
    """Transform a single product dict into the clean output format."""
    raw_title = item.get('Product Name', item.get('title', ''))
    existing_cat = item.get('Category', '')

    # Determine price field (different schemas)
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

    # Build the clean output object
    output = {
        "title": new_title,
        "category": category,
        "price": new_price,
        "image": item.get('Main Image', item.get('image', '')),
        "image_alt": item.get('Main Image Alt Text', item.get('Image Description', new_title)),
        "alt_image": item.get('Alternative Image', None),
        "seo_tags": seo_tags,
    }

    # Carry over any extra useful fields
    if item.get('Product Link'):
        output['source_url'] = item['Product Link']

    return output


def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    print(f"🔍 Scanning for product files in: {base_dir}\n")

    all_products = load_all_products(base_dir)
    if not all_products:
        print("❌ No products found. Exiting.")
        return

    print(f"\n📊 Total raw products loaded: {len(all_products)}")
    print("🔧 Processing...\n")

    output_data = []
    processed = 0
    errors = 0

    for idx, item in enumerate(all_products):
        try:
            if not isinstance(item, dict):
                continue
            result = process_single_product(item)
            output_data.append(result)
            processed += 1
        except Exception as e:
            errors += 1
            print(f"  ⚠️ Error on item {idx}: {e}")
            # Fallback: push raw item with minimal cleanup
            output_data.append({
                "title": str(item.get('Product Name', 'Unknown')),
                "category": "Multi-Purpose Craft Mould",
                "price": 0,
                "image": item.get('Main Image', ''),
                "seo_tags": list(BROAD_TAGS),
                "_error": str(e),
            })

    # Remove exact duplicates (by title)
    seen_titles = set()
    deduped = []
    dupes = 0
    for p in output_data:
        t = p['title'].lower().strip()
        if t not in seen_titles:
            seen_titles.add(t)
            deduped.append(p)
        else:
            dupes += 1

    output_file = os.path.join(base_dir, 'scripts', 'output.json')
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(deduped, f, indent=2, ensure_ascii=False)

    print(f"✅ Successfully processed: {processed} products")
    print(f"🗑️  Duplicates removed: {dupes}")
    if errors:
        print(f"⚠️  Errors (fallback used): {errors}")
    print(f"📁 Final output: {len(deduped)} unique products → {output_file}")

    # Print a few samples
    print("\n─── SAMPLE OUTPUT (first 3 items) ───\n")
    for p in deduped[:3]:
        print(f"  Title:    {p['title']}")
        print(f"  Category: {p['category']}")
        print(f"  Price:    ₹{p['price']}")
        print(f"  Tags:     {len(p['seo_tags'])} tags")
        print()


if __name__ == "__main__":
    main()
