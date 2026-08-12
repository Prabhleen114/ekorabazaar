"""
Import & Deduplicate ALL products from ALL 14 user uploaded JSON files into products.json
"""
import json
import re
import os

UPLOAD_DIR = r'C:\Users\prabh\.gemini\antigravity\brain\80e0808b-3057-4517-a308-a2741bddb352\.user_uploaded'
PRODUCTS_FILE = 'src/lib/data/products.json'

def clean_title(title: str) -> str:
    if not title:
        return ""
    title = re.sub(r'(?i)\s*[,\-–|]*\s*\b(ARM|JKB|CODE|SKU|NO|ITEM|REF)[\s\-_]*\d+[A-Z]?\b.*$', '', str(title))
    title = re.sub(r'(?i)\b(jindeal|vedini|lyba)\b', '', title)
    title = re.sub(r'\s+\d{3,6}\s*$', '', title)
    title = re.sub(r'\s*[,\-–|]\s*$', '', title)
    title = re.sub(r'\s{2,}', ' ', title)
    return title.strip(' ,-–|')

def assign_category(title: str) -> str:
    n = title.lower()
    if 'essential oil' in n or 'pure essential' in n or re.search(r'\b(e\s*o|e\.o\.|e\.o|e/o)\b', n):
        return "Essential Oils"
    if 'fragrance oil' in n or 'aroma oil' in n or 'scent oil' in n or 'perfume oil' in n or re.search(r'\b(f\s*o|f\.o\.|f\.o|f/o|attar|flavour|flavor)\b', n):
        return "Fragrance Oils"
    
    is_mould = any(w in n for w in ['mould', 'mold', 'silicone', 'silicon'])
    if is_mould:
        if any(w in n for w in ['resin', 'jesmonite', 'concrete', 'tray', 'coaster', 'planter', 'terrazzo', 'epoxy', 'stone', 'vessel', 'jar mold', 'jar mould', 'storage box', 'pot mold']):
            return "Eco-Resin & Stone Moulds"
        if any(w in n for w in ['chocolate', 'cake', 'fondant', 'baking', 'bake', 'cookie', 'cupcake', 'pastry', 'jelly', 'pudding', 'doraemon', 'cartoon', 'snowflake', 'peppa', 'dinosaur', 'bear', 'animal']):
            return "Culinary & Fondant Moulds"
        if any(w in n for w in ['soap', 'bath bomb', 'loaf', 'bar']):
            return "Soap & Bar Moulds"
        if any(w in n for w in ['candle', 'pillar', 'taper', 'wax', 'yarn ball', 'aromatherapy', 'tulip', 'teddy', 'santa']):
            return "Candle & Pillar Moulds"
        return "General Silicone Moulds"

    if any(w in n for w in ['jar', 'tin', 'bottle', 'vial', 'glass', 'lid', 'cap', 'container', 'pouch', 'bag', 'potli']):
        return "Containers & Packaging"
    if any(w in n for w in ['pigment', 'mica', 'dye', 'color powder', 'liquid color']):
        return "Pigments & Colors"
    if any(w in n for w in ['wick', 'sustainer', 'thread', 'thermometer', 'melter']):
        return "Candle Making Accessories"
    if any(w in n for w in ['soy wax', 'soap base', 'paraffin', 'beeswax', 'butter', 'base']):
        return "Premium Bases & Waxes"

    return "Eco-Resin & Stone Moulds"

# Load existing catalog
with open(PRODUCTS_FILE, 'r', encoding='utf-8') as f:
    products = json.load(f)

existing_titles = set(p['name'].lower().strip() for p in products)
max_id = max([int(p['id']) for p in products if p['id'].isdigit()] or [2268])

json_files = [f for f in os.listdir(UPLOAD_DIR) if f.endswith('.json')]
print(f"Auditing {len(json_files)} uploaded JSON files...")

total_raw = 0
added_count = 0
skipped_duplicate = 0

for fname in json_files:
    fpath = os.path.join(UPLOAD_DIR, fname)
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    file_items = []
    try:
        data = json.loads(content)
        if isinstance(data, list):
            file_items = data
        elif isinstance(data, dict):
            file_items = [data]
    except Exception:
        objs = re.findall(r'\{[^{}]*\}', content)
        for obj_str in objs:
            try:
                obj = json.loads(obj_str)
                file_items.append(obj)
            except:
                pass

    total_raw += len(file_items)

    for item in file_items:
        raw_name = item.get('Product Name') or item.get('title') or item.get('name') or item.get('Title') or ''
        name = clean_title(raw_name)
        if not name:
            continue

        if name.lower().strip() in existing_titles:
            skipped_duplicate += 1
            continue

        # Extract price (+20%)
        price_val = item.get('Regular Price') or item.get('price') or item.get('Price') or item.get('variant_price') or '0'
        try:
            num_match = re.search(r'\d+(?:\.\d+)?', str(price_val).replace(',', ''))
            price_num = float(num_match.group(0)) if num_match else 299.0
        except:
            price_num = 299.0

        final_price = round(price_num * 1.2) if price_num > 0 else 299

        # Extract image
        img = item.get('Image Source') or item.get('image') or item.get('Image') or item.get('image_src') or item.get('src') or ''
        if isinstance(img, list) and img:
            img = img[0]
        if isinstance(img, dict):
            img = img.get('src') or img.get('url') or ''
        if not img or not isinstance(img, str):
            img = '/og-image.jpg'

        category = assign_category(name)

        max_id += 1
        new_product = {
            "id": str(max_id),
            "name": name,
            "category": category,
            "description": f"Verified wholesale {name.lower()} for serious craft creators and manufacturers.",
            "price": final_price,
            "bulkDiscountAvailable": True,
            "maxDiscount": 20,
            "image": img,
            "inStock": True,
            "tiers": [
              { "minQuantity": 1, "discount": 0 },
              { "minQuantity": 12, "discount": 10 },
              { "minQuantity": 52, "discount": 20 }
            ],
            "tags": [
              "craft supplies",
              "wholesale raw materials",
              "silicone mold",
              "maker supplies"
            ],
            "isBlend": False
        }

        products.append(new_product)
        existing_titles.add(name.lower().strip())
        added_count += 1

print(f"\n📊 Summary:")
print(f"  • Total raw product objects scanned across all uploaded files: {total_raw}")
print(f"  • Skipped exact duplicates: {skipped_duplicate}")
print(f"  • New unique products imported: {added_count}")
print(f"  • Final Total Catalog Size: {len(products)} products")

with open(PRODUCTS_FILE, 'w', encoding='utf-8') as f:
    json.dump(products, f, indent=2, ensure_ascii=False)

print(f"\n✅ Saved complete catalog to {PRODUCTS_FILE}")
