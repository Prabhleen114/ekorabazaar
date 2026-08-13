import json
import os

with open('src/lib/data/products.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

ids = ['418', '822', '820', '417', '815']
for p in products:
    if str(p['id']) in ids:
        print(f"ID: {p['id']}, Name: {p['name']}, Category: {p.get('category')}, Image: {p.get('image')}")
