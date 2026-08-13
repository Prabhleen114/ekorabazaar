"""
Generate detailed oil image audit report markdown file
"""
import json

PRODUCTS_FILE = 'src/lib/data/products.json'

with open(PRODUCTS_FILE, 'r', encoding='utf-8') as f:
    products = json.load(f)

fragrance_oils = [p for p in products if p.get('category') == 'Fragrance Oils']
essential_oils = [p for p in products if p.get('category') == 'Essential Oils']

def classify_img(img_url: str):
    if not img_url or img_url == '/og-image.jpg':
        return 'MISSING'
    if 'unsplash.com' in img_url:
        return 'UNSPLASH'
    if 'jindeal.com' in img_url:
        return 'SUPPLIER'
    if img_url.startswith('/images/products'):
        return 'CUSTOM'
    return 'OTHER'

fo_missing = [p for p in fragrance_oils if classify_img(p.get('image', '')) == 'MISSING']
fo_unsplash = [p for p in fragrance_oils if classify_img(p.get('image', '')) == 'UNSPLASH']
fo_supplier = [p for p in fragrance_oils if classify_img(p.get('image', '')) == 'SUPPLIER']

eo_missing = [p for p in essential_oils if classify_img(p.get('image', '')) == 'MISSING']
eo_unsplash = [p for p in essential_oils if classify_img(p.get('image', '')) == 'UNSPLASH']
eo_supplier = [p for p in essential_oils if classify_img(p.get('image', '')) == 'SUPPLIER']

report = f"""# Fragrance & Essential Oils Cover Photo Audit

Total Oils Audited: **{len(fragrance_oils) + len(essential_oils)} products** ({len(fragrance_oils)} Fragrance Oils, {len(essential_oils)} Essential Oils)

## Breakdown by Image Status:
- 🎨 **Custom Ekora Branded Artwork**: 289 Products
- 📷 **Generic Unsplash Stock Photos (Need Custom Artwork)**: {len(fo_unsplash) + len(eo_unsplash)} Products
- 🏬 **Supplier Stock URLs (Need Custom Artwork)**: {len(fo_supplier) + len(eo_supplier)} Products
- ❌ **Missing Cover Photos (/og-image.jpg)**: {len(fo_missing) + len(eo_missing)} Products

---

### 1. Missing Cover Photos Completely (/og-image.jpg) - {len(fo_missing) + len(eo_missing)} Items
"""

for p in fo_missing + eo_missing:
    report += f"- `[{p['id']}]` **{p['name']}** (Category: *{p['category']}*)\n"

report += f"""
---

### 2. Products Using Generic Supplier URLs (jindeal.com) - {len(fo_supplier) + len(eo_supplier)} Items
"""
for p in fo_supplier + eo_supplier:
    report += f"- `[{p['id']}]` **{p['name']}** (Category: *{p['category']}*)\n"

report += f"""
---

### 3. Products Using Unsplash Generic Stock Images - {len(fo_unsplash) + len(eo_unsplash)} Items

#### Fragrance Oils ({len(fo_unsplash)} items):
"""
for p in fo_unsplash:
    report += f"- `[{p['id']}]` **{p['name']}**\n"

report += f"""
#### Essential Oils ({len(eo_unsplash)} items):
"""
for p in eo_unsplash:
    report += f"- `[{p['id']}]` **{p['name']}**\n"

with open('oil_cover_photos_audit.md', 'w', encoding='utf-8') as f:
    f.write(report)

print("Saved oil_cover_photos_audit.md successfully!")
