import sys
import os
import json
import re
import urllib.request
from bs4 import BeautifulSoup

def clean_brand_text(text):
    if not text:
        return ""
    # Case-insensitive replacement of Vedini, Jindeal, etc.
    t = re.sub(r'\bvedini\b', '', text, flags=re.IGNORECASE)
    t = re.sub(r'\bjindeal\b', '', t, flags=re.IGNORECASE)
    t = re.sub(r'\s+', ' ', t).strip(' -–—:|')
    return t

def format_size_label(raw_size):
    if not raw_size:
        return "Standard"
    s = raw_size.strip().lower()
    s = s.replace('-', ' ')
    # Normalize common patterns
    s = re.sub(r'(\d+)\s*gm\b', r'\1 g', s)
    s = re.sub(r'(\d+)\s*g\b', r'\1 g', s)
    s = re.sub(r'(\d+)\s*kg\b', r'\1 kg', s)
    s = re.sub(r'(\d+)\s*ml\b', r'\1 ml', s)
    s = re.sub(r'(\d+)\s*ltr\b', r'\1 L', s)
    s = re.sub(r'(\d+)\s*liter\b', r'\1 L', s)
    s = re.sub(r'(\d+)\s*liters\b', r'\1 L', s)
    return s.title() if ' ' in s else s.upper()

def generate_tiers(price):
    return [
        {"minQty": 1, "maxQty": 11, "price": price, "discountPct": 0},
        {"minQty": 12, "maxQty": 51, "price": round(price * 0.90), "discountPct": 10},
        {"minQty": 52, "maxQty": None, "price": round(price * 0.85), "discountPct": 15}
    ]

def scrape_product(url):
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
    except Exception as e:
        print(f"Error fetching {url}: {e}", file=sys.stderr)
        return None

    soup = BeautifulSoup(html, 'html.parser')

    # Title
    title_el = soup.find('h1', class_='product-title') or soup.find('h1')
    raw_title = title_el.get_text(strip=True) if title_el else ''
    title = clean_brand_text(raw_title)

    # Category determination
    is_wax = 'wax' in title.lower() or 'wax' in url.lower()
    category = "Candle Waxes & Additives" if is_wax else "Raw Butters & Carrier Oils"
    department = "Casting Mediums & Raw Bases"
    disciplines = ["candle-foundry"] if is_wax else ["skincare-apothecary", "soap-atelier"]

    # Description
    desc_el = soup.find('div', class_='product-short-description') or soup.find('div', id='tab-description')
    raw_desc = desc_el.get_text(" ", strip=True) if desc_el else ''
    desc = clean_brand_text(raw_desc)
    if not desc or len(desc) < 30:
        desc = f"Premium artisan-grade {title.lower()} carefully sourced for creators, ateliers, and candle makers. Pure, high performance, and batch-tested for superior blending, stability, and professional formulation reliability."

    # Image URL
    img_url = ""
    og_img = soup.find('meta', property='og:image')
    if og_img and og_img.get('content'):
        img_url = og_img['content']
    
    if not img_url:
        img_el = soup.find('div', class_='product-images')
        if img_el:
            im = img_el.find('img')
            if im:
                img_url = im.get('data-large_image') or im.get('data-src') or im.get('src') or ''

    # Variations
    variants = []
    form = soup.find('form', class_='variations_form')
    if form and 'data-product_variations' in form.attrs:
        try:
            var_data = json.loads(form['data-product_variations'])
            for v in var_data:
                # get size from attributes
                size_str = ""
                for k, val in v.get('attributes', {}).items():
                    size_str = val
                    break
                display_price = v.get('display_price', 0)
                if display_price > 0:
                    # Apply 20% formula
                    ekora_price = round(display_price * 1.20)
                    size_label = format_size_label(size_str)
                    variants.append({
                        "size": size_label,
                        "raw_price": display_price,
                        "price": ekora_price,
                        "tiers": generate_tiers(ekora_price)
                    })
                if not img_url and v.get('image', {}).get('url'):
                    img_url = v['image']['url']
        except Exception as e:
            print(f"Error parsing variations for {url}: {e}", file=sys.stderr)

    # Fallback to simple price if no variations
    if not variants:
        price_el = soup.find('p', class_='price') or soup.find('span', class_='price')
        price_text = price_el.get_text(strip=True) if price_el else ''
        # extract digits
        prices = [float(x.replace(',', '')) for x in re.findall(r'[\d,]+(?:\.\d+)?', price_text) if x]
        if prices:
            raw_p = min(prices)
            ekora_p = round(raw_p * 1.20)
            variants.append({
                "size": "1 Kg",
                "raw_price": raw_p,
                "price": ekora_p,
                "tiers": generate_tiers(ekora_p)
            })

    if not variants:
        return None

    # Base price is the first variant price
    base_price = variants[0]["price"]

    # Tags
    tag_words = set(re.findall(r'[a-zA-Z0-9]+', title.lower()))
    tag_words.update(["ekora", "ekora bazaar", "craft", "wholesale", "bulk", "supplies", "raw materials", "india", "premium", "artisan"])
    if is_wax:
        tag_words.update(["wax", "candle wax", "candle making", "soy wax", "beeswax"])
    else:
        tag_words.update(["butter", "body butter", "skincare", "cosmetic butter", "raw butter"])

    return {
        "title": title,
        "raw_title": raw_title,
        "url": url,
        "category": category,
        "department": department,
        "disciplines": disciplines,
        "description": desc,
        "image_url": img_url,
        "base_price": base_price,
        "variants": variants,
        "tags": sorted(list(tag_words))
    }

def main():
    if len(sys.argv) < 4:
        print("Usage: python scrape_batch.py <start_idx> <end_idx> <out_json>")
        sys.exit(1)

    start_idx = int(sys.argv[1])
    end_idx = int(sys.argv[2])
    out_file = sys.argv[3]

    with open('scratch/wb_items.json', 'r', encoding='utf-8') as f:
        items = json.load(f)

    unique_urls = []
    seen = set()
    for it in items:
        u = it['link']
        if u and u not in seen:
            seen.add(u)
            unique_urls.append(u)

    batch = unique_urls[start_idx:end_idx]
    print(f"Scraping batch {start_idx} to {end_idx} ({len(batch)} URLs)...")

    results = []
    for i, u in enumerate(batch, 1):
        print(f"[{i}/{len(batch)}] Fetching: {u}")
        p = scrape_product(u)
        if p:
            results.append(p)
            print(f"  -> SUCCESS: {p['title']} ({len(p['variants'])} variants, base Rs.{p['base_price']})")
        else:
            print(f"  -> FAILED: {u}")

    os.makedirs(os.path.dirname(out_file), exist_ok=True)
    with open(out_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    print(f"Batch completed! Successfully parsed {len(results)}/{len(batch)} products to {out_file}")

if __name__ == '__main__':
    main()
