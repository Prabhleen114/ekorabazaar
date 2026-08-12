"""
Ekora Bazaar - Uploaded JSON Duplicates Inspector & Reviewer
============================================================
Inspects all uploaded JSON files, identifies identical product titles,
and outputs a clear report showing why titles matched.
"""

import json
import os
import re
from collections import defaultdict

UPLOAD_DIR = r'C:\Users\prabh\.gemini\antigravity\brain\80e0808b-3057-4517-a308-a2741bddb352\.user_uploaded'

# 10 JSON files from recent batch
json_files = [f for f in os.listdir(UPLOAD_DIR) if f.startswith('media_1786444') and f.endswith('.json')]

items_by_title = defaultdict(list)
total_scanned = 0

for fname in json_files:
    fpath = os.path.join(UPLOAD_DIR, fname)
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    try:
        data = json.loads(content)
        if isinstance(data, list):
            file_items = data
        elif isinstance(data, dict):
            file_items = [data]
    except Exception:
        objs = re.findall(r'\{[^{}]*\}', content)
        file_items = []
        for obj_str in objs:
            try:
                file_items.append(json.loads(obj_str))
            except:
                pass

    total_scanned += len(file_items)
    for item in file_items:
        raw_name = item.get('Product Name') or item.get('title') or item.get('name') or item.get('Title') or ''
        price = item.get('Regular Price') or item.get('price') or item.get('Price') or ''
        link = item.get('Product Link') or ''
        if raw_name:
            items_by_title[raw_name.strip()].append({
                'file': fname,
                'price': price,
                'link': link
            })

print(f"Total raw items scanned across {len(json_files)} files: {total_scanned}")
print(f"Unique product titles found: {len(items_by_title)}\n")

duplicates = {t: occurrences for t, occurrences in items_by_title.items() if len(occurrences) > 1}
print(f"Found {len(duplicates)} product titles that appear multiple times:\n")

for idx, (title, occurrences) in enumerate(duplicates.items(), 1):
    print(f"{idx}. Title: '{title}' (Appears {len(occurrences)} times)")
    for occ in occurrences:
        print(f"   • File: {occ['file']} | Price: {occ['price']}")
    print()
