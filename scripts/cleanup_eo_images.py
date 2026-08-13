import json
import os
import shutil
import re
from difflib import SequenceMatcher

PRODUCTS_JSON = 'src/lib/data/products.json'
EO_DIR = r'public\images\products\essential oils'
DUP_DIR = os.path.join(EO_DIR, 'duplicates')

if not os.path.exists(DUP_DIR):
    os.makedirs(DUP_DIR)

with open(PRODUCTS_JSON, 'r', encoding='utf-8') as f:
    products = json.load(f)

# Collect all referenced images
referenced_images = set()
for p in products:
    img = p.get('image')
    if img and img.startswith('/images/products/essential oils/'):
        filename = img.split('/')[-1]
        referenced_images.add(filename)

# Find unreferenced images
files_in_dir = set(f for f in os.listdir(EO_DIR) if f.endswith(('.png', '.jpg', '.webp')))
unreferenced = list(files_in_dir - referenced_images)

print(f"Found {len(unreferenced)} unreferenced image(s).")

# Clean image filename function
def clean_image_name(filename):
    name = filename.lower().replace('ekora-bazaar-', '').replace('-essential-oil', '').replace('.png', '').replace('.jpg', '').replace('.webp', '')
    name = name.replace('-', ' ')
    return name.strip()

def clean_prod_name(pname):
    name = pname.lower().replace('essential oil', '').replace('100 pure', '').replace('100% pure', '').replace('natural', '').replace('oil', '').replace('pure', '')
    name = re.sub(r'[^a-z\s]', '', name)
    return name.strip()

mapped = 0
for f in unreferenced:
    img_name = clean_image_name(f)
    best_prod = None
    best_score = 0
    
    # Try to find a missing-image product first
    for p in products:
        # Check if product belongs to EO
        if p.get('category') == 'Essential Oils' or 'essential oil' in p['name'].lower():
            # If product lacks a proper custom image
            if not p.get('image') or not p.get('image').startswith('/images/products/'):
                p_name = clean_prod_name(p['name'])
                if img_name in p_name and p_name in img_name: # strict match
                    best_prod = p
                    break
    
    if best_prod:
        # Assign image
        best_prod['image'] = f"/images/products/essential oils/{f}"
        print(f"Mapped missing product {best_prod['id']} ({best_prod['name']}) to {f}")
        mapped += 1
    else:
        # Move to duplicates
        src = os.path.join(EO_DIR, f)
        dst = os.path.join(DUP_DIR, f)
        shutil.move(src, dst)
        print(f"Moved {f} to duplicates folder.")

with open(PRODUCTS_JSON, 'w', encoding='utf-8') as f:
    json.dump(products, f, indent=2, ensure_ascii=False)

print(f"Done. Mapped {mapped} files and moved {len(unreferenced) - mapped} to duplicates.")
