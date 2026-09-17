import json
import os
import re

pfile = 'src/lib/data/products.json'
with open(pfile, 'r', encoding='utf-8') as f:
    ps = json.load(f)

waxes_dir = r'c:\Users\prabh\Documents\code projects\ekorabazaar\public\images\products\waxes'
butters_dir = r'c:\Users\prabh\Documents\code projects\ekorabazaar\public\images\products\butters'
w_files = os.listdir(waxes_dir)
b_files = os.listdir(butters_dir)

print(f'Actual wax images on disk: {len(w_files)}')
print(f'Actual butter images on disk: {len(b_files)}')

fixed = 0
for p in ps:
    img = p.get('image', '')
    if any(pattern in img for pattern in ['-a-r-a-', '-o-s-e-', '-o-y-', '-u-t-t-e-r']):
        is_wax = 'wax' in p.get('category', '').lower()
        candidates = w_files if is_wax else b_files
        folder = 'waxes' if is_wax else 'butters'

        name_clean = re.sub(r'[^a-zA-Z0-9]', '', p.get('name', '').lower())
        matched_file = None
        for f in candidates:
            f_clean = re.sub(r'[^a-zA-Z0-9]', '', f.lower())
            if f_clean[:8] in name_clean or name_clean[:8] in f_clean:
                matched_file = f
                break

        if matched_file:
            p['image'] = f'/images/products/{folder}/{matched_file}'
            fixed += 1
            print(f"Fixed ID {p['id']} ({p['name'][:30]}) -> {p['image']}")

print(f'Total fixed: {fixed}')
with open(pfile, 'w', encoding='utf-8') as f:
    json.dump(ps, f, indent=2, ensure_ascii=False)
