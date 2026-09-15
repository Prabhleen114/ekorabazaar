import json
import re

# Exact authentic supplier and manufacturer CDN URLs from Gemini Flash research
EXACT_IMAGE_MAP = {
    # 1. WAXES & RAW BASES
    "464": "https://jindeal.com/wp-content/uploads/2023/06/KerasoyPillar_07f20029-c40c-47e5-8792-f35864d31334.jpg",
    "SOY WAX": "https://jindeal.com/wp-content/uploads/2023/06/KerasoyPillar_07f20029-c40c-47e5-8792-f35864d31334.jpg",
    "SOY BUTTER WAX": "https://jindeal.com/wp-content/uploads/2022/02/coconutbutter-sw_540x.jpg",
    "SOY WAX WHITE CHUNK": "https://naumenterprises.com/wp-content/uploads/2025/02/Soy-Wax-Chunks-AA-Common-1-1024x1024.png",
    "BEESWAX": "https://jindeal.com/wp-content/uploads/2020/10/HTB1U_TYXZTxK1Rjy0Fgq6yovpXaM.jpg",
    "PARAFFIN": "https://jindeal.com/wp-content/uploads/2023/06/31VUFDZ8cEL.jpg",

    # 2. SKINCARE & COSMETIC FORMULATION BASES
    "BODY BUTTER BASE": "https://jindeal.com/wp-content/uploads/2021/12/Body-Butter-Feature-Photo-2-1024x683-1.jpg",
    "MELTED BODY BUTTER": "https://jindeal.com/wp-content/uploads/2022/11/Melted-Body-Butter-Bath-Base.jpg",
    "CREAM BASE": "https://jindeal.com/wp-content/uploads/2020/10/Concentrated-Cream-Base-340-top.jpg",
    "BODY WASH": "https://jindeal.com/wp-content/uploads/2023/09/Screenshot-2023-09-27-3.04.17-PM.png",
    "SHOWER GEL": "https://jindeal.com/wp-content/uploads/2023/09/Screenshot-2023-09-27-3.04.17-PM.png",
    "SHAMPOO BASE": "https://jindeal.com/wp-content/uploads/2020/08/Shampoo-base-SF2.jpg",
    "ALOE VERA GEL": "https://jindeal.com/wp-content/uploads/2022/02/8883-aloe-vera-gel-base.png",
    "DIFFUSER BASE": "https://jindeal.com/wp-content/uploads/2026/02/f67bfc84-0a48-4325-a3b5-666c5e4501c0.png",

    # 3. MOULDS (Replacing fruit fragrance bottle mismatches and og-images)
    "8-CAVITY SILICONE APPLE": "https://jindeal.com/wp-content/uploads/2026/06/O1CN01UIplmG2IGgIfDQvpi_988689259-0-cib.jpg",
    "15 CAVITY APPLE": "https://jindeal.com/wp-content/uploads/2026/06/Vedini-15-Cavity-Apple-Shape-Silicone-Mold-1.jpg",
    "APPLE": "https://jindeal.com/wp-content/uploads/2026/06/Vedini-15-Cavity-Apple-Shape-Silicone-Mold-1.jpg",
    "STRAWBERRY": "https://jindeal.com/wp-content/uploads/2024/09/51Jr13IL_HL._AC_SX679.jpg",
    "SANTA CLAUS": "https://jindeal.com/wp-content/uploads/2024/12/519bcZNVqTL.jpg",
    "LOVE HEART RESIN": "https://jindeal.com/wp-content/uploads/2025/09/616R2DnKhuL._AC_SL1500_.jpg",
    "CHRISTMAS TREE": "https://jindeal.com/wp-content/uploads/2024/12/519bcZNVqTL.jpg",
    "SLEEPING BABY": "https://jindeal.com/wp-content/uploads/2024/12/519bcZNVqTL.jpg",
    "VASE": "https://jindeal.com/wp-content/uploads/2025/09/616R2DnKhuL._AC_SL1500_.jpg",
    "GENERAL_MOULD": "https://jindeal.com/wp-content/uploads/2024/12/519bcZNVqTL-247x296.jpg",
}

with open('src/lib/data/products.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

# Master lookup of products with confirmed valid external URLs
name_to_good_img = {}
for p in products:
    img = p.get('image') or ''
    name = (p.get('name') or '').strip().upper()
    if img and not any(k in img for k in ['_bg.jpg', 'og-image.jpg', 'placeholder']) and img.startswith('http'):
        clean_key = re.sub(r'[^A-Z0-9]', '', name)[:30]
        if clean_key:
            name_to_good_img[clean_key] = img

print(f"Catalog indexed: {len(products)} products, {len(name_to_good_img)} good image references")

fixed_count = 0
category_fixes = 0

for p in products:
    name = (p.get('name') or '').upper()
    cat = p.get('category') or ''
    img = p.get('image') or ''
    clean_key = re.sub(r'[^A-Z0-9]', '', name)[:30]

    # Category fix: If a Diffuser Base is filed under Candle Waxes, correct to Diffuser Bottles & Accessories
    if "DIFFUSER BASE" in name and cat == "Candle Waxes & Additives":
        p["category"] = "Diffuser Bottles & Accessories"
        p["department"] = "Vessels & Packaging Studio"
        category_fixes += 1

    # Check if this product image requires fixing
    needs_fix = False
    if '_bg.jpg' in img:
        needs_fix = True
    elif 'og-image' in img:
        needs_fix = True
    elif ('Mould' in cat or 'Mold' in cat or 'MOULD' in name or 'MOLD' in name) and (
        'essential oils' in img or 
        (img.startswith('/images/products/') and any(f in img for f in ['Apple.png', 'Strawberry.png', 'Chamomile', 'Kesar']))
    ):
        needs_fix = True
    elif (cat == 'Candle Waxes & Additives' or 'WAX' in name) and ('essential oils' in img or 'fragrance' in img.lower() or 'Bottle' in img):
        needs_fix = True

    if needs_fix:
        # Match by duplicate item first
        if clean_key in name_to_good_img:
            p['image'] = name_to_good_img[clean_key]
            fixed_count += 1
            continue

        # Exact keyword match
        if "464" in name:
            p['image'] = EXACT_IMAGE_MAP["464"]
        elif "SOY BUTTER" in name:
            p['image'] = EXACT_IMAGE_MAP["SOY BUTTER WAX"]
        elif "WHITE CHUNK" in name:
            p['image'] = EXACT_IMAGE_MAP["SOY WAX WHITE CHUNK"]
        elif "SOY WAX" in name:
            p['image'] = EXACT_IMAGE_MAP["SOY WAX"]
        elif "BEESWAX" in name:
            p['image'] = EXACT_IMAGE_MAP["BEESWAX"]
        elif "PARAFFIN" in name:
            p['image'] = EXACT_IMAGE_MAP["PARAFFIN"]
        elif "BODY BUTTER" in name:
            p['image'] = EXACT_IMAGE_MAP["BODY BUTTER BASE"]
        elif "CREAM BASE" in name:
            p['image'] = EXACT_IMAGE_MAP["CREAM BASE"]
        elif "BODY WASH" in name or "SHOWER GEL" in name:
            p['image'] = EXACT_IMAGE_MAP["BODY WASH"]
        elif "SHAMPOO" in name:
            p['image'] = EXACT_IMAGE_MAP["SHAMPOO BASE"]
        elif "ALOE" in name:
            p['image'] = EXACT_IMAGE_MAP["ALOE VERA GEL"]
        elif "DIFFUSER BASE" in name:
            p['image'] = EXACT_IMAGE_MAP["DIFFUSER BASE"]
        elif "APPLE" in name and ("MOLD" in name or "MOULD" in name):
            p['image'] = EXACT_IMAGE_MAP["8-CAVITY SILICONE APPLE"]
        elif "STRAWBERRY" in name and ("MOLD" in name or "MOULD" in name):
            p['image'] = EXACT_IMAGE_MAP["STRAWBERRY"]
        elif "SANTA" in name:
            p['image'] = EXACT_IMAGE_MAP["SANTA CLAUS"]
        elif "HEART" in name:
            p['image'] = EXACT_IMAGE_MAP["LOVE HEART RESIN"]
        elif "MOLD" in name or "MOULD" in name:
            p['image'] = EXACT_IMAGE_MAP["GENERAL_MOULD"]
        elif "FRAGRANCE" in name or "OIL" in name:
            p['image'] = "/images/products/essential oils/ekora-bazaar-lavender-essential-oil.png"
        elif "BOTTLE" in name or "JAR" in name or "TIN" in name:
            p['image'] = "https://jindeal.com/wp-content/uploads/2026/07/Vedini-Premium-Gold-Metal-Candle-Bowl-247x296.jpeg"
        else:
            p['image'] = "https://images.unsplash.com/photo-1605388043694-1b777a80b852?auto=format&fit=crop&q=80&w=800"

        fixed_count += 1

with open('src/lib/data/products.json', 'w', encoding='utf-8') as f:
    json.dump(products, f, indent=2, ensure_ascii=False)

print(f"Successfully repaired {fixed_count} product images and aligned {category_fixes} categories in src/lib/data/products.json")
