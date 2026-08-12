"""
Parse newly uploaded 4 JSON files, apply pricing (+20%), clean SKU names,
assign category 'Eco-Resin & Stone Moulds', deduplicate, and merge into catalog.
"""
import json
import re
import os

UPLOAD_DIR = r'C:\Users\prabh\.gemini\antigravity\brain\80e0808b-3057-4517-a308-a2741bddb352\.user_uploaded'
TARGET_CAT = 'Eco-Resin & Stone Moulds'

file_names = [
    'media_1786444569807.json',
    'media_1786444569843.json',
    'media_1786444569845.json',
    'media_1786444569846.json'
]

raw_items = []

for fname in file_names:
    fpath = os.path.join(UPLOAD_DIR, fname)
    if os.path.exists(fpath):
        with open(fpath, 'r', encoding='utf-8') as f:
            try:
                data = json.load(f)
                if isinstance(data, list):
                    raw_items.extend(data)
                elif isinstance(data, dict):
                    raw_items.append(data)
            except Exception as e:
                # If json has extra data, parse bracketed lists/objects
                f.seek(0)
                text = f.read()
                decoder = json.JSONDecoder()
                pos = 0
                while pos < len(text):
                    text_sub = text[pos:].strip()
                    if not text_sub:
                        break
                    try:
                        obj, idx = decoder.raw_decode(text_sub)
                        if isinstance(obj, list):
                            raw_items.extend(obj)
                        elif isinstance(obj, dict):
                            raw_items.append(obj)
                        pos += idx
                        while pos < len(text) and text[pos] in ' \t\r\n,':
                            pos += 1
                    except Exception:
                        pos += 1

print(f"\nLoaded {len(raw_items)} raw items from 4 uploaded JSON files.")

def clean_title(title: str) -> str:
    if not title:
        return ""
    # Remove SKU trailing codes like | ARM526, JKB-3401, CODE 12, etc.
    title = re.sub(r'(?i)\s*[,\-–|]*\s*\b(ARM|JKB|CODE|SKU|NO|ITEM|REF)[\s\-_]*\d+[A-Z]?\b.*$', '', title)
    title = re.sub(r'(?i)\b(jindeal|vedini|lyba)\b', '', title)
    title = re.sub(r'\s+\d{3,6}\s*$', '', title)
    title = re.sub(r'\s*[,\-–|]\s*$', '', title)
    title = re.sub(r'\s{2,}', ' ', title)
    return title.strip(' ,-–|')

# Load existing products
PRODUCTS_FILE = 'src/lib/data/products.json'
with open(PRODUCTS_FILE, 'r', encoding='utf-8') as f:
    products = json.load(f)

existing_titles = set(p['name'].lower().strip() for p in products)
max_id = max([int(p['id']) for p in products if p['id'].isdigit()] or [2268])

added_count = 0
skipped_count = 0

for item in raw_items:
    raw_name = item.get('Product Name') or item.get('title') or item.get('name') or item.get('Title') or ''
    name = clean_title(raw_name)
    if not name:
        continue

    if name.lower().strip() in existing_titles:
        skipped_count += 1
        continue

    # Extract price (+20% markup)
    price_val = item.get('Regular Price') or item.get('price') or item.get('Price') or item.get('variant_price') or '0'
    try:
        # Match digits in price string e.g. "From Rs. 430.00" -> 430
        num_match = re.search(r'\d+(?:\.\d+)?', str(price_val).replace(',', ''))
        price_num = float(num_match.group(0)) if num_match else 299.0
    except Exception:
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

    max_id += 1
    new_product = {
        "id": str(max_id),
        "name": name,
        "category": TARGET_CAT,
        "description": "High-durability silicone mold for eco-resin, jesmonite, concrete, and plaster casting.",
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
          "eco-resin",
          "silicone mold",
          "jesmonite mold",
          "concrete tray",
          "craft supplies"
        ],
        "isBlend": False
    }

    products.append(new_product)
    existing_titles.add(name.lower().strip())
    added_count += 1
    if added_count <= 15:
        print(f"  ✨ ADDED [{max_id}]: '{name}' -> ₹{final_price} (Original: {price_val})")

print(f"\n✅ Successfully imported {added_count} products into '{TARGET_CAT}'!")
print(f"ℹ️ Skipped {skipped_count} duplicates.")
print(f"📊 Total catalog size now: {len(products)} products.")

with open(PRODUCTS_FILE, 'w', encoding='utf-8') as f:
    json.dump(products, f, indent=2, ensure_ascii=False)

print(f"Saved updated catalog to {PRODUCTS_FILE}")
