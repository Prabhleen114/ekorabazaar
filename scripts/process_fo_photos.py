"""
Process photos from needs_review folder (FRAGRANCE OILS ONLY):
1. Read pre-identified label mappings (from visual inspection)
2. Fuzzy-match label text to products in products.json (Constrained to Fragrance Oils)
3. Generate a review report
"""
import json
import re
from difflib import SequenceMatcher

IMAGE_LABELS = {
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
    "Gemini_Generated_Image_g8r1scg8r1scg8r1 (1).png": "Strawberry Lush",
    "Gemini_Generated_Image_ipa9qcipa9qcipa9 (1).png": "Midnight Blue Citrus",
    "Gemini_Generated_Image_jcl12gjcl12gjcl1 (1).png": "Jasmine Knight",
    "Gemini_Generated_Image_szsfjpszsfjpszsf (1).png": "Jasminum Grandiflorum",
}

with open('src/lib/data/products.json', 'r', encoding='utf-8') as f:
    all_products = json.load(f)

# ONLY keep fragrance oils
products = [p for p in all_products if p.get('category') == 'Fragrance Oils' or ' f o' in p['name'].lower()]

def normalize(text):
    text = text.lower().strip()
    for suffix in [' f o', ' fo', ' fragrance oil', ' candle & cosmetic', ' candle and cosmetic', ' pure', ' premium quality']:
        text = text.replace(suffix, '')
    text = re.sub(r'[^a-z0-9\s]', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    # Handle some specific mapping edge cases for FO
    if 'bois de bois' in text: text = text.replace('bois de bois', 'bois de rose')
    if 'cinnamon leaf' in text: text = text.replace('cinnamon leaf', 'cinnamon')
    if 'clove leaf' in text: text = text.replace('clove leaf', 'clove')
    if 'turmeric root' in text: text = text.replace('turmeric root', 'turmeric')
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

def find_best_product_match(label_text):
    best_score = 0
    best_product = None
    all_matches = []
    for product in products:
        score = fuzzy_score(label_text, product['name'])
        if score > 0.5:
            all_matches.append((score, product))
        if score > best_score:
            best_score = score
            best_product = product
    all_matches.sort(key=lambda x: x[0], reverse=True)
    return best_product, best_score, all_matches[:3]

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

actions = []
unmatched = []

print("=" * 100)
print("FRAGRANCE OIL MATCHING REPORT")
print("=" * 100)
for filename, label in sorted(IMAGE_LABELS.items(), key=lambda x: x[1]):
    if filename in duplicates_to_skip: continue
    
    best_product, score, top_matches = find_best_product_match(label)
    
    if score >= 0.7 and best_product:
        clean_name = label.strip().title()
        clean_name = re.sub(r'[^A-Za-z0-9\s&]', '', clean_name)
        new_filename = f"{clean_name}.png"
        image_path = f"/images/products/{new_filename}"
        
        has_custom = best_product.get('image', '') and 'unsplash' not in best_product.get('image', '')
        
        actions.append({
            'filename': filename, 'label': label,
            'product_id': best_product['id'], 'product_name': best_product['name'],
            'new_filename': new_filename, 'target_dir': 'public/images/products',
            'image_path': image_path
        })
        status = "✓ MATCH" if not has_custom else "⚠ OVERWRITE"
        print(f"  {label:<25} {best_product['name'][:50]:<52} {score:<5.2f} {status}")
    else:
        unmatched.append((filename, label, score, best_product, top_matches))
        print(f"  {label:<25} {'???':<52} {score:<5.2f} ✗ UNMATCHED")

with open('scripts/fo_photo_plan.json', 'w', encoding='utf-8') as f:
    json.dump({'actions': actions}, f, indent=2)

if unmatched:
    print("\n--- UNMATCHED ---")
    for filename, label, score, best, top in unmatched:
        print(f"\nLabel: {label}")
        if top:
            for s, p in top: print(f"  - {p['name']} ({s:.2f})")
