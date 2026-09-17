import json
import os
import re

def normalize_text(t):
    if not t:
        return ""
    # remove spaces between single letters if spaced
    if re.search(r'\b[A-Za-z] [A-Za-z] [A-Za-z]\b', t):
        t = re.sub(r'(?<=\b[A-Za-z]) (?=[A-Za-z]\b)', '', t)
        # do multiple passes
        for _ in range(5):
            t = re.sub(r'([A-Za-z]) ([A-Za-z])', r'\1\2', t)
    t = re.sub(r'\bvedini\b', '', t, flags=re.IGNORECASE)
    t = re.sub(r'\bjindeal\b', '', t, flags=re.IGNORECASE)
    t = t.replace('\ufffd', ' ')
    t = re.sub(r'\s+', ' ', t).strip(' -–—:|')
    return t

def slugify(text):
    text = re.sub(r'[^a-zA-Z0-9\s-]', '', text).strip().lower()
    return re.sub(r'[\s_-]+', '-', text)

def main():
    pfile = 'src/lib/data/products.json'
    with open(pfile, 'r', encoding='utf-8') as f:
        catalog = json.load(f)

    # 1. Load the 30 processed products from batches
    batches = []
    for b in [1, 2, 3]:
        with open(f"scratch/batch_{b}.json", "r", encoding="utf-8") as f:
            batches.extend(json.load(f))

    print(f"Loaded {len(batches)} source items from batches.")

    # Clean catalog: fix any spaced names first
    for p in catalog:
        if p.get('category') in ['Candle Waxes & Additives', 'Raw Butters & Carrier Oils']:
            name = p.get('name', '')
            if ' ' in name:
                # check if spaced single chars
                words = name.split()
                if len(words) > 10 and sum(len(w) == 1 for w in words) > len(words) * 0.5:
                    p['name'] = ''.join(words)
                    print(f"Fixed spaced name for ID {p['id']}: {p['name']}")

    # Build map of the 30 products
    processed_30 = {}
    for item in batches:
        clean_n = normalize_text(item["title"])
        is_wax = item["category"] == "Candle Waxes & Additives"
        rel_folder = "waxes" if is_wax else "butters"
        slug = slugify(clean_n)
        if len(slug) > 50:
            slug = slug[:50].rstrip('-')
        webp_rel = f"/images/products/{rel_folder}/{slug}.webp"

        variants = item.get("variants", [])
        variants.sort(key=lambda x: x["price"])
        base_p = variants[0]["price"] if variants else 100
        tiers = variants[0]["tiers"] if variants else []

        processed_30[clean_n.lower()] = {
            "name": clean_n,
            "category": item["category"],
            "department": item["department"],
            "disciplines": item["disciplines"],
            "description": normalize_text(item["description"]),
            "image": webp_rel,
            "price": base_p,
            "tiers": tiers,
            "variants": variants,
            "tags": item.get("tags", [])
        }

    # Dedup and update catalog:
    # First, collect all products not in (2375-2403) and not duplicate
    final_catalog = []
    seen_30_matched = set()

    for p in catalog:
        pid = str(p.get("id"))
        p_name = normalize_text(p.get("name", "")).lower()

        # Check if this matches one of our 30 items
        match_key = None
        for k in processed_30:
            if k in p_name or p_name in k or (len(k) > 15 and k[:15] in p_name):
                match_key = k
                break

        if match_key:
            if match_key not in seen_30_matched:
                data = processed_30[match_key]
                p["name"] = data["name"]
                p["category"] = data["category"]
                p["department"] = data["department"]
                p["disciplines"] = data["disciplines"]
                p["description"] = data["description"]
                p["image"] = data["image"]
                p["price"] = data["price"]
                p["tiers"] = data["tiers"]
                p["variants"] = data["variants"]
                p["bulkDiscountAvailable"] = True
                p["maxDiscount"] = 15
                p["moq"] = 1
                p["inStock"] = True
                p["isQuoteOnly"] = False
                
                tags = set(p.get("tags", []))
                tags.update(data["tags"])
                p["tags"] = sorted(list(tags))

                final_catalog.append(p)
                seen_30_matched.add(match_key)
                print(f"Preserved & updated catalog ID {p['id']}: {data['name']}")
            else:
                # Duplicate item, drop it
                print(f"Dropping duplicate product ID {p['id']}: {p.get('name')}")
        else:
            final_catalog.append(p)

    # For any of the 30 items that weren't matched in existing catalog, add them
    existing_numeric = [int(p["id"]) for p in final_catalog if str(p.get("id")).isdigit()]
    next_id = max(existing_numeric) + 1 if existing_numeric else 2500

    for k, data in processed_30.items():
        if k not in seen_30_matched:
            new_p = {
                "id": str(next_id),
                "name": data["name"],
                "category": data["category"],
                "department": data["department"],
                "disciplines": data["disciplines"],
                "description": data["description"],
                "image": data["image"],
                "price": data["price"],
                "tiers": data["tiers"],
                "variants": data["variants"],
                "bulkDiscountAvailable": True,
                "maxDiscount": 15,
                "moq": 1,
                "inStock": True,
                "isQuoteOnly": False,
                "tags": data["tags"]
            }
            final_catalog.append(new_p)
            seen_30_matched.add(k)
            next_id += 1
            print(f"Added new product ID {new_p['id']}: {data['name']}")

    with open(pfile, "w", encoding="utf-8") as f:
        json.dump(final_catalog, f, indent=2, ensure_ascii=False)

    print(f"\nFinal catalog size: {len(final_catalog)}")
    print(f"Matched & guaranteed all 30 Waxes & Butters: {len(seen_30_matched)}/30")

if __name__ == '__main__':
    main()
