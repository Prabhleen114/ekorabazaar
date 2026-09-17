import json

pfile = 'src/lib/data/products.json'
with open(pfile, 'r', encoding='utf-8') as f:
    ps = json.load(f)

clean_titles_map = {
    '21': 'Paraffin Wax Slab White Block for Candle Making, DIY Crafts, Wax Melts & Industrial Use (1 Kg)',
    '375': 'Mango Butter',
    '854': '464 Soy Wax Natural Soy Wax Granule for Candle Making',
    '857': 'Soy Butter Wax',
    '862': 'Soy Wax White Chunk AA+',
    '931': 'Avocado Butter',
    '932': 'Natural Coconut Wax',
    '944': 'Soy Wax White Flakes',
    '1262': 'Bees Wax Natural Yellow',
    '1264': 'Transparent Gel Wax for Candle Making',
    '1283': '100% Natural Pure Beeswax Pellets White',
    '1285': 'Raw Shea Butter (Organic Raw) From Africa'
}

for p in ps:
    pid = str(p.get('id'))
    if pid in clean_titles_map:
        p['name'] = clean_titles_map[pid]
        print(f"Set clean name for ID {pid}: {p['name']}")

with open(pfile, 'w', encoding='utf-8') as f:
    json.dump(ps, f, indent=2, ensure_ascii=False)

print("Saved clean titles to products.json successfully!")
