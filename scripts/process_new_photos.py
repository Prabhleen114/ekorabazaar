"""
Process photos from needs_review folder:
1. Read pre-identified label mappings (from visual inspection)
2. Fuzzy-match label text to products in products.json
3. Rename and move files to public/images/products/
4. Update products.json with new image paths
5. Generate a review report before making changes
"""
import json
import os
import shutil
import re
from difflib import SequenceMatcher

# ============================================================
# STEP 1: Image label mappings (extracted by reading each image)
# ============================================================
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
    # Duplicates (copies) - skip these, same as originals
    "Gemini_Generated_Image_g8r1scg8r1scg8r1 (1).png": "Strawberry Lush",
    "Gemini_Generated_Image_ipa9qcipa9qcipa9 (1).png": "Midnight Blue Citrus",
    "Gemini_Generated_Image_jcl12gjcl12gjcl1 (1).png": "Jasmine Knight",
    "Gemini_Generated_Image_szsfjpszsfjpszsf (1).png": "Jasminum Grandiflorum",
}

# ============================================================
# STEP 2: Load products and build matching index
# ============================================================
PRODUCTS_JSON = 'src/lib/data/products.json'
NEEDS_REVIEW_DIR = 'public/images/needs_review'
PRODUCTS_IMG_DIR = 'public/images/products'
EO_IMG_DIR = 'public/images/products/essential oils'

with open(PRODUCTS_JSON, 'r', encoding='utf-8') as f:
    products = json.load(f)

def normalize(text):
    """Normalize text for fuzzy matching."""
    text = text.lower().strip()
    # Remove common suffixes
    for suffix in [' f o', ' fo', ' e o', ' eo', ' essential oil', ' fragrance oil',
                   ' candle & cosmetic', ' candle and cosmetic', ' premium quality',
                   ' pure']:
        text = text.replace(suffix, '')
    # Remove special chars
    text = re.sub(r'[^a-z0-9\s]', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def fuzzy_score(label, product_name):
    """Calculate match score between image label and product name."""
    norm_label = normalize(label)
    norm_product = normalize(product_name)
    
    # Exact match after normalization
    if norm_label == norm_product:
        return 1.0
    
    # One contains the other
    if norm_label in norm_product or norm_product in norm_label:
        return 0.95
    
    # SequenceMatcher ratio
    return SequenceMatcher(None, norm_label, norm_product).ratio()

def find_best_product_match(label_text):
    """Find the best matching product for a given label text."""
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
    return best_product, best_score, all_matches[:5]

def generate_seo_filename(label_text, product):
    """Generate SEO-friendly filename."""
    category = product.get('category', '')
    is_eo = 'essential oil' in product['name'].lower() or category == 'Essential Oils'
    is_fo = 'fragrance oil' in product['name'].lower() or 'f o' in product['name'].lower() or category == 'Fragrance Oils'
    
    # Clean the label text for filename
    clean_name = label_text.strip().title()
    clean_name = re.sub(r'[^A-Za-z0-9\s&]', '', clean_name)
    
    if is_eo:
        if 'essential oil' not in clean_name.lower():
            clean_name += ' Essential Oil'
        filename = f"ekora-bazaar-{clean_name.lower().replace(' ', '-').replace('&', 'and')}.png"
        return filename, EO_IMG_DIR
    elif is_fo:
        filename = f"{clean_name}.png"
        return filename, PRODUCTS_IMG_DIR
    else:
        filename = f"{clean_name}.png"
        return filename, PRODUCTS_IMG_DIR

# ============================================================
# STEP 3: Generate review report
# ============================================================
print("=" * 100)
print("PHOTO PROCESSING REVIEW REPORT")
print("=" * 100)

# Track duplicates (same label = same product, pick the non-(1) version)
seen_labels = {}
duplicates_to_skip = []

for filename, label in IMAGE_LABELS.items():
    norm = normalize(label)
    if norm in seen_labels:
        # This is a duplicate - skip the (1) copy if possible
        if '(1)' in filename:
            duplicates_to_skip.append(filename)
        else:
            # The original is a duplicate of something already seen
            # Keep whichever doesn't have (1)
            if '(1)' in seen_labels[norm]:
                duplicates_to_skip.append(seen_labels[norm])
                seen_labels[norm] = filename
            else:
                duplicates_to_skip.append(filename)
    else:
        seen_labels[norm] = filename

print(f"\nDuplicate files to skip: {len(duplicates_to_skip)}")
for f in duplicates_to_skip:
    print(f"  SKIP: {f} (duplicate of another image)")

# Process unique images
actions = []
unmatched = []

print(f"\n{'─' * 100}")
print(f"{'IMAGE LABEL':<30} {'MATCHED PRODUCT':<55} {'SCORE':<8} {'STATUS'}")
print(f"{'─' * 100}")

for filename, label in sorted(IMAGE_LABELS.items(), key=lambda x: x[1]):
    if filename in duplicates_to_skip:
        continue
    
    best_product, score, top_matches = find_best_product_match(label)
    
    if score >= 0.7:
        new_filename, target_dir = generate_seo_filename(label, best_product)
        image_path = f"/images/products/{new_filename}" if target_dir == PRODUCTS_IMG_DIR else f"/images/products/essential oils/{new_filename}"
        
        # Check if product already has a custom image
        existing_img = best_product.get('image', '')
        has_custom = existing_img and 'unsplash' not in existing_img
        
        status = "✓ MATCH" if not has_custom else "⚠ ALREADY HAS IMAGE"
        
        actions.append({
            'filename': filename,
            'label': label,
            'product_id': best_product['id'],
            'product_name': best_product['name'],
            'product_category': best_product.get('category', ''),
            'score': score,
            'new_filename': new_filename,
            'target_dir': target_dir,
            'image_path': image_path,
            'has_existing_custom': has_custom,
            'existing_image': existing_img,
        })
        
        print(f"  {label:<28} {best_product['name'][:53]:<55} {score:<8.2f} {status}")
    else:
        unmatched.append((filename, label, score, best_product, top_matches))
        print(f"  {label:<28} {'??? ' + (best_product['name'][:49] if best_product else 'NONE'):<55} {score:<8.2f} ✗ LOW MATCH")

print(f"\n{'=' * 100}")
print(f"SUMMARY")
print(f"{'=' * 100}")
print(f"  Total images: {len(IMAGE_LABELS)}")
print(f"  Duplicates skipped: {len(duplicates_to_skip)}")
print(f"  Unique images: {len(IMAGE_LABELS) - len(duplicates_to_skip)}")
print(f"  Matched (score >= 0.7): {len(actions)}")
print(f"  Unmatched: {len(unmatched)}")
print(f"  Will overwrite existing: {sum(1 for a in actions if a['has_existing_custom'])}")

if unmatched:
    print(f"\n{'─' * 100}")
    print("UNMATCHED IMAGES - Need manual review:")
    for filename, label, score, best, top_matches in unmatched:
        print(f"\n  Image: {filename}")
        print(f"  Label: {label}")
        print(f"  Best guess (score {score:.2f}): {best['name'] if best else 'NONE'}")
        if top_matches:
            print(f"  Top candidates:")
            for s, p in top_matches[:3]:
                print(f"    - {p['name']} (score: {s:.2f}, cat: {p.get('category','')})")

# Show actions for products that already have images
overwrites = [a for a in actions if a['has_existing_custom']]
if overwrites:
    print(f"\n{'─' * 100}")
    print("PRODUCTS THAT ALREADY HAVE CUSTOM IMAGES (will be updated):")
    for a in overwrites:
        print(f"  ID:{a['product_id']} {a['product_name']}")
        print(f"    Current: {a['existing_image']}")
        print(f"    New:     {a['image_path']}")

# Save the action plan to a JSON for the apply script
with open('scripts/photo_processing_plan.json', 'w', encoding='utf-8') as f:
    json.dump({
        'actions': actions,
        'unmatched': [(fn, label) for fn, label, _, _, _ in unmatched],
        'duplicates_skipped': duplicates_to_skip,
    }, f, indent=2)

print(f"\n✓ Action plan saved to scripts/photo_processing_plan.json")
print(f"  Run 'python scripts/apply_photo_processing.py' to execute the plan.")
