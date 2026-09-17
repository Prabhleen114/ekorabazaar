import os
import sys
import json
import re
import urllib.request
from PIL import Image

def slugify(text):
    text = re.sub(r'[^a-zA-Z0-9\s-]', '', text).strip().lower()
    return re.sub(r'[\s_-]+', '-', text)

def clean_title(title):
    if not title:
        return ""
    t = re.sub(r'\bvedini\b', '', title, flags=re.IGNORECASE)
    t = re.sub(r'\bjindeal\b', '', t, flags=re.IGNORECASE)
    t = t.replace('\ufffd', ' ')
    t = re.sub(r'\s+', ' ', t).strip(' -–—:|')
    return t

def main():
    waxes_dir = r"c:\Users\prabh\Documents\code projects\ekorabazaar\public\images\products\waxes"
    butters_dir = r"c:\Users\prabh\Documents\code projects\ekorabazaar\public\images\products\butters"
    os.makedirs(waxes_dir, exist_ok=True)
    os.makedirs(butters_dir, exist_ok=True)

    # 1. Combine batches
    all_scraped = []
    for b in [1, 2, 3]:
        with open(f"scratch/batch_{b}.json", "r", encoding="utf-8") as f:
            all_scraped.extend(json.load(f))

    print(f"Loaded {len(all_scraped)} scraped items from batches.")

    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
    processed_items = []

    for i, item in enumerate(all_scraped, 1):
        raw_name = clean_title(item["title"])
        is_wax = item["category"] == "Candle Waxes & Additives"
        target_dir = waxes_dir if is_wax else butters_dir
        rel_folder = "waxes" if is_wax else "butters"
        
        slug = slugify(raw_name)
        if len(slug) > 50:
            slug = slug[:50].rstrip('-')
        webp_filename = f"{slug}.webp"
        webp_path = os.path.join(target_dir, webp_filename)
        rel_image_path = f"/images/products/{rel_folder}/{webp_filename}"

        img_url = item.get("image_url")
        if img_url and not os.path.exists(webp_path):
            try:
                req = urllib.request.Request(img_url, headers=headers)
                temp_file = os.path.join(target_dir, f"temp_{i}.jpg")
                with urllib.request.urlopen(req, timeout=15) as resp, open(temp_file, "wb") as f_out:
                    f_out.write(resp.read())
                with Image.open(temp_file) as im:
                    im.convert("RGB").save(webp_path, "WEBP", quality=90)
                if os.path.exists(temp_file):
                    os.remove(temp_file)
                print(f"[{i}/30] Downloaded & saved {rel_image_path}")
            except Exception as e:
                print(f"[{i}/30] Warning: Failed to download image from {img_url}: {e}")
                rel_image_path = img_url
        else:
            print(f"[{i}/30] Using cached/fallback: {rel_image_path}")

        # Sort variants by price ascending
        variants = item.get("variants", [])
        variants.sort(key=lambda x: x["price"])

        base_price = variants[0]["price"] if variants else item.get("base_price", 100)
        tiers = variants[0]["tiers"] if variants else [
            {"minQty": 1, "maxQty": 11, "price": base_price, "discountPct": 0},
            {"minQty": 12, "maxQty": 51, "price": round(base_price * 0.90), "discountPct": 10},
            {"minQty": 52, "maxQty": None, "price": round(base_price * 0.85), "discountPct": 15}
        ]

        item["clean_title"] = raw_name
        item["image"] = rel_image_path
        item["base_price"] = base_price
        item["tiers"] = tiers
        item["variants"] = variants
        processed_items.append(item)

    # 3. Update products.json
    products_file = r"c:\Users\prabh\Documents\code projects\ekorabazaar\src\lib\data\products.json"
    with open(products_file, "r", encoding="utf-8") as f:
        catalog = json.load(f)

    # Remove the spaced temporary new products (IDs >= 2375) to re-add cleanly
    catalog = [p for p in catalog if not (str(p.get("id")).isdigit() and int(p.get("id")) >= 2375)]

    existing_numeric_ids = []
    for p in catalog:
        try:
            existing_numeric_ids.append(int(p.get("id")))
        except (ValueError, TypeError):
            pass
    next_id = max(existing_numeric_ids) + 1 if existing_numeric_ids else 1000

    by_name = {clean_title(p.get("name", "")).lower(): p for p in catalog}
    
    updated_count = 0
    added_count = 0

    for item in processed_items:
        key = item["clean_title"].lower()
        existing = by_name.get(key)
        if not existing:
            for ckey, cp in by_name.items():
                if len(key) > 10 and (key in ckey or ckey in key):
                    existing = cp
                    break

        if existing:
            existing["name"] = item["clean_title"]
            existing["category"] = item["category"]
            existing["department"] = item["department"]
            existing["disciplines"] = item["disciplines"]
            existing["description"] = clean_title(item["description"])
            existing["image"] = item["image"]
            existing["price"] = item["base_price"]
            existing["tiers"] = item["tiers"]
            existing["variants"] = item["variants"]
            existing["bulkDiscountAvailable"] = True
            existing["maxDiscount"] = 15
            existing["moq"] = 1
            existing["inStock"] = True
            existing["isQuoteOnly"] = False
            
            tags = set(existing.get("tags", []))
            tags.update(item.get("tags", []))
            existing["tags"] = sorted(list(tags))
            updated_count += 1
            print(f"Updated existing product ID {existing['id']}: {item['clean_title']}")
        else:
            new_prod = {
                "id": str(next_id),
                "name": item["clean_title"],
                "category": item["category"],
                "department": item["department"],
                "disciplines": item["disciplines"],
                "description": clean_title(item["description"]),
                "image": item["image"],
                "price": item["base_price"],
                "tiers": item["tiers"],
                "variants": item["variants"],
                "bulkDiscountAvailable": True,
                "maxDiscount": 15,
                "moq": 1,
                "inStock": True,
                "isQuoteOnly": False,
                "tags": item.get("tags", [])
            }
            catalog.append(new_prod)
            by_name[key] = new_prod
            next_id += 1
            added_count += 1
            print(f"Added new product ID {new_prod['id']}: {item['clean_title']}")

    with open(products_file, "w", encoding="utf-8") as f:
        json.dump(catalog, f, indent=2, ensure_ascii=False)

    print(f"\n==========================================")
    print(f"Total catalog products: {len(catalog)}")
    print(f"Waxes & Butters Updated: {updated_count}")
    print(f"Waxes & Butters Added:   {added_count}")
    print(f"Total Processed:         {updated_count + added_count}")
    print(f"==========================================")

if __name__ == '__main__':
    main()
