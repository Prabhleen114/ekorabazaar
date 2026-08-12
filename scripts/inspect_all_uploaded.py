import json
import os
import re

UPLOAD_DIR = r'C:\Users\prabh\.gemini\antigravity\brain\80e0808b-3057-4517-a308-a2741bddb352\.user_uploaded'

files = [f for f in os.listdir(UPLOAD_DIR) if f.endswith('.json')]
print(f"Found {len(files)} JSON files in user_uploaded directory:\n")

total_parsed = 0
all_products = []

for fname in files:
    fpath = os.path.join(UPLOAD_DIR, fname)
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Try parsing
    file_items = []
    try:
        data = json.loads(content)
        if isinstance(data, list):
            file_items = data
        elif isinstance(data, dict):
            file_items = [data]
    except Exception as e:
        # Regex extract all JSON object blocks
        objs = re.findall(r'\{[^{}]*\}', content)
        for obj_str in objs:
            try:
                obj = json.loads(obj_str)
                file_items.append(obj)
            except:
                pass
    
    print(f"File: {fname} | Size: {len(content)} bytes | Extracted Items: {len(file_items)}")
    total_parsed += len(file_items)
    all_products.extend(file_items)

print(f"\nTOTAL EXTRACTED PRODUCTS ACROSS ALL JSON FILES: {total_parsed}")
