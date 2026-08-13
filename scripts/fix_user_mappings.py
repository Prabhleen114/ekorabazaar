import json
import os
import shutil

PRODUCTS_JSON = 'src/lib/data/products.json'
EO_DIR = r'public\images\products\essential oils'
DUP_DIR = os.path.join(EO_DIR, 'duplicates')

with open(PRODUCTS_JSON, 'r', encoding='utf-8') as f:
    products = json.load(f)

mappings = [
    (['446'], 'ekora-bazaar-frangipani-essential-oil.webp'),
    (['489'], 'ekora-bazaar-rosemary-essential-oil.png'),
    (['797', '419'], 'ekora-bazaar-rosewood-essential-oil.png'),
    (['442'], 'Jasminum Grandiflorum.png'),
]

for pids, filename in mappings:
    # Check if file is in duplicates directory, move it back to main EO directory
    dup_path = os.path.join(DUP_DIR, filename)
    main_path = os.path.join(EO_DIR, filename)
    
    if os.path.exists(dup_path):
        shutil.move(dup_path, main_path)
        print(f"Moved {filename} from duplicates to essential oils root")
    
    image_url = f"/images/products/essential oils/{filename}"
    
    for pid in pids:
        for p in products:
            if str(p['id']) == str(pid):
                old_img = p.get('image')
                p['image'] = image_url
                print(f"Updated product {pid} ({p['name']}): {old_img} -> {image_url}")

with open(PRODUCTS_JSON, 'w', encoding='utf-8') as f:
    json.dump(products, f, indent=2, ensure_ascii=False)

print("Updates complete.")
