import json
import os
import shutil
import re
from difflib import SequenceMatcher

IMAGE_LABELS = {
    # Batch 1
    "Gemini_Generated_Image_18t5fp18t5fp18t5.png": "Cherry Blossom",
    "Gemini_Generated_Image_2cj6w92cj6w92cj6.png": "Temple Fragrance",
    "Gemini_Generated_Image_2jlmv52jlmv52jlm.png": "Bubble Gum",
    "Gemini_Generated_Image_2umpv82umpv82ump.png": "Rose",
    "Gemini_Generated_Image_36tp5f36tp5f36tp.png": "Golden Women",
    "Gemini_Generated_Image_47l3k47l3k47l3k4.png": "Lavender",
    "Gemini_Generated_Image_4cdjgh4cdjgh4cdj.png": "Orange & Cinnamon",
    "Gemini_Generated_Image_4jkp4h4jkp4h4jkp.png": "Butterfly Fragrance",
    "Gemini_Generated_Image_5dt0sz5dt0sz5dt0.png": "Turmeric Root",
    "Gemini_Generated_Image_6ag6aw6ag6aw6ag6.png": "Cactus Bloom",
    "Gemini_Generated_Image_6rxpl86rxpl86rxp.png": "Geranium",
    "Gemini_Generated_Image_8mtt8y8mtt8y8mtt.png": "Mulberry Vanilla",
    "Gemini_Generated_Image_br6rb4br6rb4br6r.png": "Fresh Oudh",
    "Gemini_Generated_Image_d2ggo6d2ggo6d2gg.png": "Spearmint",
    "Gemini_Generated_Image_d5ex75d5ex75d5ex.png": "Iris Lime",
    "Gemini_Generated_Image_dwn263dwn263dwn2.png": "Vanilla",
    # Batch 2
    "Gemini_Generated_Image_f859y7f859y7f859.png": "Bois De Bois",
    "Gemini_Generated_Image_g3d9i9g3d9i9g3d9.png": "Ylang Ylang",
    "Gemini_Generated_Image_g8r1scg8r1scg8r1.png": "Strawberry Lush",
    "Gemini_Generated_Image_gkra35gkra35gkra.png": "Rose Geranium",
    "Gemini_Generated_Image_gxx50sgxx50sgxx5.png": "Roasted Coffee",
    "Gemini_Generated_Image_h7zlxuh7zlxuh7zl.png": "Garlic",
    "Gemini_Generated_Image_hgvs4fhgvs4fhgvs.png": "Vanilla Planifolia",
    "Gemini_Generated_Image_hh2bk8hh2bk8hh2b.png": "Pure Anise",
    "Gemini_Generated_Image_i2f8k8i2f8k8i2f8.png": "Lavender Florence",
    "Gemini_Generated_Image_ipa9qcipa9qcipa9.png": "Midnight Blue Citrus",
    "Gemini_Generated_Image_jbq09ajbq09ajbq0.png": "Clean Ocean",
    "Gemini_Generated_Image_jcl12gjcl12gjcl1.png": "Jasmine Knight",
    "Gemini_Generated_Image_k6t0zak6t0zak6t0.png": "Ajwain",
    "Gemini_Generated_Image_kgad3qkgad3qkgad.png": "Sweet Basil",
    "Gemini_Generated_Image_lou5s2lou5s2lou5.png": "Cinnamon Leaf",
    "Gemini_Generated_Image_n26mwsn26mwsn26m.png": "Palmarosa",
    # Batch 3
    "Gemini_Generated_Image_nzs8m6nzs8m6nzs8.png": "Musk Gold",
    "Gemini_Generated_Image_qxls50qxls50qxls.png": "Aqua Fresh",
    "Gemini_Generated_Image_rsxdfjrsxdfjrsxd.png": "Clove Leaf",
    "Gemini_Generated_Image_svbe57svbe57svbe.png": "Orchid Bloom",
    "Gemini_Generated_Image_szsfjpszsfjpszsf.png": "Jasminum Grandiflorum",
    "Gemini_Generated_Image_tuyy3wtuyy3wtuyy.png": "Aqua Fresh",
    "Gemini_Generated_Image_u1gmvau1gmvau1gm.png": "Pure Rosewood",
    "Gemini_Generated_Image_w0n1rlw0n1rlw0n1.png": "Lemon",
    "Gemini_Generated_Image_yh4720yh4720yh47.png": "Clean Ocean",
    "Gemini_Generated_Image_yiiyqbyiiyqbyiiy.png": "Diced Pineapple",
    "Gemini_Generated_Image_yiqmfyyiqmfyyiqm.png": "Saffron",
    # Duplicates
    "Gemini_Generated_Image_g8r1scg8r1scg8r1 (1).png": "Strawberry Lush",
    "Gemini_Generated_Image_ipa9qcipa9qcipa9 (1).png": "Midnight Blue Citrus",
    "Gemini_Generated_Image_jcl12gjcl12gjcl1 (1).png": "Jasmine Knight",
    "Gemini_Generated_Image_szsfjpszsfjpszsf (1).png": "Jasminum Grandiflorum",
}

def normalize(text):
    text = text.lower().strip()
    for suffix in [' f o', ' fo', ' fragrance oil', ' candle & cosmetic', ' candle and cosmetic', ' pure', ' premium quality', ' essential oil', ' essential oils']:
        text = text.replace(suffix, '')
    text = re.sub(r'[^a-z0-9\s]', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    # Handle aliases
    if 'bois de bois' in text: text = text.replace('bois de bois', 'bois de rose')
    if 'cinnamon leaf' in text: text = text.replace('cinnamon leaf', 'cinnamon')
    if 'jasminum grandiflorum' in text: text = text.replace('jasminum grandiflorum', 'jasmine')
    if 'vanilla planifolia' in text: text = text.replace('vanilla planifolia', 'vanilla')
    if 'orchid bloom' in text: text = text.replace('orchid bloom', 'orchid bouquet')
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

# ONLY match against Oils (to avoid matching Rose with a mold)
products = [p for p in all_products if p.get('category') in ['Fragrance Oils', 'Essential Oils'] or ' f o' in p['name'].lower() or 'essential oil' in p['name'].lower()]

# Build deduplicated list of images
seen_labels = {}
duplicates_to_skip = []
for filename, label in IMAGE_LABELS.items():
    norm = normalize(label)
    if norm in seen_labels:
        if '(1)' in filename: duplicates_to_skip.append(filename)
        else:
            if '(1)' in seen_labels[norm]:
                duplicates_to_skip.append(seen_labels[norm])
                seen_labels[norm] = filename
            else:
                duplicates_to_skip.append(filename)
    else:
        seen_labels[norm] = filename

processed_count = 0
unmatched_count = 0

for filename, label in IMAGE_LABELS.items():
    if filename in duplicates_to_skip: continue
    
    # Find match
    best_score = 0
    best_product = None
    for product in products:
        score = fuzzy_score(label, product['name'])
        if score > best_score:
            best_score = score
            best_product = product
    
    if best_score >= 0.7:
        # Determine path
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
        
        # Move file
        print(f"Moving {filename} -> {new_filename}")
        shutil.move(source_path, target_path)
        
        # Update product JSON
        image_url = f"/images/products/{new_filename}" if not is_eo else f"/images/products/essential oils/{new_filename}"
        
        # We need to update the actual product in all_products
        for p in all_products:
            if p['id'] == best_product['id']:
                p['image'] = image_url
                break
                
        processed_count += 1
    else:
        print(f"NO MATCH FOR: {label} (Score: {best_score:.2f}, Guess: {best_product['name'] if best_product else 'None'})")
        unmatched_count += 1

# Delete the skipped duplicate files so the folder is clean
for filename in duplicates_to_skip:
    source_path = os.path.join(NEEDS_REVIEW_DIR, filename)
    if os.path.exists(source_path):
        os.remove(source_path)
        print(f"Deleted duplicate: {filename}")

# Save JSON
with open(PRODUCTS_JSON, 'w', encoding='utf-8') as f:
    json.dump(all_products, f, indent=2, ensure_ascii=False)

print(f"\nSUCCESS! Processed {processed_count} images, {unmatched_count} unmatched, {len(duplicates_to_skip)} duplicates deleted.")
print("Updated products.json.")
