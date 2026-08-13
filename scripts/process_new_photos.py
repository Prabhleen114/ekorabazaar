import json
import os
import shutil
import re
from difflib import SequenceMatcher

IMAGE_LABELS = {
    "media_1786603557620.png": "Bubble Gum",
    "media_1786603559373.png": "Turmeric Root",
    "media_1786603559847.png": "Cinnamon Leaf",
    "media_1786603560992.png": "Palmarosa",
    "media_1786603561803.png": "Clove Leaf",
    "media_1786603562487.png": "Aqua Fresh",
    "media_1786603927126.png": "Rose",
    "media_1786603928497.png": "Vanilla Planifolia",
    "media_1786603929434.png": "Orchid Bloom",
    "media_1786603929914.png": "Sweet Basil"
}

def normalize(text):
    text = text.lower().strip()
    for suffix in [' f o', ' fo', ' fragrance oil', ' candle & cosmetic', ' candle and cosmetic', ' pure', ' premium quality', ' essential oil', ' essential oils']:
        text = text.replace(suffix, '')
    text = re.sub(r'[^a-z0-9\s]', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    if 'bois de bois' in text: text = text.replace('bois de bois', 'bois de rose')
    if 'cinnamon leaf' in text: text = text.replace('cinnamon leaf', 'cinnamon')
    if 'jasminum grandiflorum' in text: text = text.replace('jasminum grandiflorum', 'jasmine')
    if 'vanilla planifolia' in text: text = text.replace('vanilla planifolia', 'vanilla')
    if 'orchid bloom' in text: text = text.replace('orchid bloom', 'orchid bouquet')
    if 'sweet basil' in text: text = text.replace('sweet basil', 'basil')
    if 'turmeric root' in text: text = text.replace('turmeric root', 'turmeric leaf root')
    if 'clove leaf' in text: text = text.replace('clove leaf', 'clove bud leaf')
    return text

def fuzzy_score(label, product_name):
    norm_label = normalize(label)
    norm_product = normalize(product_name)
    if norm_label == norm_product: return 1.0
    if norm_label in norm_product or norm_product in norm_label: return 0.95
    return SequenceMatcher(None, norm_label, norm_product).ratio()

PRODUCTS_JSON = 'src/lib/data/products.json'
NEEDS_REVIEW_DIR = 'public/images/needs_review'
PRODUCTS_IMG_DIR = 'public/images/products'
EO_IMG_DIR = 'public/images/products/essential oils'

with open(PRODUCTS_JSON, 'r', encoding='utf-8') as f:
    all_products = json.load(f)

products = [p for p in all_products if p.get('category') in ['Fragrance Oils', 'Essential Oils', 'Food Safe Flavour Oil'] or ' f o' in p['name'].lower() or 'essential oil' in p['name'].lower() or 'flavour' in p['name'].lower()]

processed = 0
for filename, label in IMAGE_LABELS.items():
    best_score = 0
    best_product = None
    for product in products:
        score = fuzzy_score(label, product['name'])
        if score > best_score:
            best_score = score
            best_product = product
            
    if best_score >= 0.7:
        is_eo = 'essential oil' in best_product['name'].lower() or best_product.get('category') == 'Essential Oils'
        clean_name = label.strip().title()
        clean_name = re.sub(r'[^A-Za-z0-9\s&]', '', clean_name)
        
        if is_eo:
            if 'essential oil' not in clean_name.lower():
                clean_name += ' Essential Oil'
            new_filename = f"ekora-bazaar-{clean_name.lower().replace(' ', '-').replace('&', 'and')}.png"
            target_dir = EO_IMG_DIR
        else:
            new_filename = f"{clean_name}.png"
            target_dir = PRODUCTS_IMG_DIR
            
        target_path = os.path.join(target_dir, new_filename)
        source_path = os.path.join(NEEDS_REVIEW_DIR, filename)
        
        if os.path.exists(source_path):
            shutil.move(source_path, target_path)
            image_url = f"/images/products/{new_filename}" if not is_eo else f"/images/products/essential oils/{new_filename}"
            for p in all_products:
                if p['id'] == best_product['id']:
                    p['image'] = image_url
                    break
            processed += 1
            print(f"Matched {label} -> {best_product['name']} (Score: {best_score:.2f})")
        else:
            print(f"Source file {source_path} not found for {label}")
    else:
        print(f"NO MATCH FOR: {label} (Best Score: {best_score:.2f} with {best_product['name'] if best_product else 'None'})")

with open(PRODUCTS_JSON, 'w', encoding='utf-8') as f:
    json.dump(all_products, f, indent=2, ensure_ascii=False)

print(f"Done. Processed {processed} files.")
