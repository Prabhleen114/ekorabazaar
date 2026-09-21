import json

pfile = 'src/lib/data/products.json'
with open(pfile, 'r', encoding='utf-8') as f:
    products = json.load(f)

for p in products:
    if str(p.get('id')) == '790':
        p['name'] = "Perfume Base Liquid (99% Ethanol Perfumer's Alcohol) - Professional Grade for Long Lasting EDP & EDT Making (1 Kg)"
        p['price'] = 400
        p['tiers'] = [
            {'minQty': 1, 'maxQty': 11, 'price': 400, 'discountPct': 0},
            {'minQty': 12, 'maxQty': 51, 'price': 360, 'discountPct': 10},
            {'minQty': 52, 'maxQty': None, 'price': 340, 'discountPct': 15}
        ]
        p['description'] = "Premium grade Perfumer's Alcohol (99% Pure Denatured Ethanol) specifically engineered for creating high-performance, long-lasting Eau de Parfum (EDP) and Eau de Toilette (EDT). Formulated to flawlessly dissolve fragrance oils, aroma compounds, and essential oils without cloudiness, delivering rapid and clean evaporation that allows top, heart, and base notes to bloom with maximum sillage. High purity, heavy metal tested, and batch-tested for professional perfumers and fragrance ateliers. Packaged per 1 Kg container."
        tags = set(p.get('tags', []))
        tags.update(['99% ethanol', "perfumer's alcohol", 'ethanol', 'perfumery', 'perfume base', '1kg', 'edp', 'edt'])
        p['tags'] = sorted(list(tags))
        print('Successfully updated product 790!')
        print('Name:', p['name'])
        print('Price:', p['price'])
        break

with open(pfile, 'w', encoding='utf-8') as f:
    json.dump(products, f, indent=2)
