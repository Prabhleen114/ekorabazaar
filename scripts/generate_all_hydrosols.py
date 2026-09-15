import os
import json
from PIL import Image, ImageDraw, ImageFont, ImageFilter

def create_hydrosol_catalog():
    os.makedirs('public/images/products/hydrosols', exist_ok=True)
    
    # Load fonts
    try:
        font_brand = ImageFont.truetype('C:/Windows/Fonts/georgiab.ttf', 26)
        font_title = ImageFont.truetype('C:/Windows/Fonts/georgiab.ttf', 30)
        font_sub = ImageFont.truetype('C:/Windows/Fonts/georgia.ttf', 16)
        font_vol = ImageFont.truetype('C:/Windows/Fonts/georgia.ttf', 15)
        font_small = ImageFont.truetype('C:/Windows/Fonts/calibri.ttf', 13)
    except Exception as e:
        font_brand = ImageFont.load_default()
        font_title = ImageFont.load_default()
        font_sub = ImageFont.load_default()
        font_vol = ImageFont.load_default()
        font_small = ImageFont.load_default()

    # Hydrosol definition list
    hydrosols = [
        {
            "id": "904",
            "name": "Sandalwood Natural Extracts Water Soluble 10 By",
            "element": "SANDALWOOD",
            "price": 382,
            "volume": "300 ml",
            "slug": "sandalwood-extracts",
            "accent_color": (180, 130, 70),
            "botanical_type": "wood"
        },
        {
            "id": "905",
            "name": "Chamomile Natural Extracts Water Soluble 5.1 Ratio By",
            "element": "CHAMOMILE",
            "price": 313,
            "volume": "300 ml",
            "slug": "chamomile-extracts",
            "accent_color": (210, 160, 40),
            "botanical_type": "chamomile"
        },
        {
            "id": "906",
            "name": "Aloe Vera Natural Extracts Water Solubility By 5 1",
            "element": "ALOE VERA",
            "price": 439,
            "volume": "500 ml",
            "slug": "aloe-vera-extracts",
            "accent_color": (70, 140, 70),
            "botanical_type": "aloe"
        },
        {
            "id": "907",
            "name": "Ylang Ylang Hydrosol Water By Organic",
            "element": "YLANG YLANG",
            "price": 562,
            "volume": "500 ml",
            "slug": "ylang-ylang-hydrosol",
            "accent_color": (210, 180, 40),
            "botanical_type": "flower"
        },
        {
            "id": "908",
            "name": "Spearmint Hydrosol Water By Organic",
            "element": "SPEARMINT",
            "price": 376,
            "volume": "300 ml",
            "slug": "spearmint-hydrosol",
            "accent_color": (40, 140, 60),
            "botanical_type": "mint"
        },
        {
            "id": "909",
            "name": "Rosemary Hydrosol Water By Organic",
            "element": "ROSEMARY",
            "price": 158,
            "volume": "100 ml",
            "slug": "rosemary-hydrosol",
            "accent_color": (45, 110, 50),
            "botanical_type": "rosemary"
        },
        {
            "id": "910",
            "name": "Patchouli Hydrosol Water By Organic",
            "element": "PATCHOULI",
            "price": 320,
            "volume": "300 ml",
            "slug": "patchouli-hydrosol",
            "accent_color": (80, 110, 60),
            "botanical_type": "patchouli"
        },
        {
            "id": "911",
            "name": "Palmarosa Hydrosol Water By Organic",
            "element": "PALMAROSA",
            "price": 260,
            "volume": "300 ml",
            "slug": "palmarosa-hydrosol",
            "accent_color": (90, 140, 60),
            "botanical_type": "grass"
        },
        {
            "id": "912",
            "name": "Lime Hydrosol Water By Organic",
            "element": "LIME",
            "price": 331,
            "volume": "300 ml",
            "slug": "lime-hydrosol",
            "accent_color": (100, 160, 30),
            "botanical_type": "citrus"
        },
        {
            "id": "913",
            "name": "Kewra Hydrosol Water By Organic",
            "element": "KEWRA",
            "price": 441,
            "volume": "500 ml",
            "slug": "kewra-hydrosol",
            "accent_color": (160, 170, 70),
            "botanical_type": "flower"
        },
        {
            "id": "914",
            "name": "Helichrysum Hydrosol Water By Organic",
            "element": "HELICHRYSUM",
            "price": 138,
            "volume": "100 ml",
            "slug": "helichrysum-hydrosol",
            "accent_color": (210, 170, 20),
            "botanical_type": "helichrysum"
        },
        {
            "id": "915",
            "name": "Frankincense Hydrosol Water By Organic",
            "element": "FRANKINCENSE",
            "price": 354,
            "volume": "300 ml",
            "slug": "frankincense-hydrosol",
            "accent_color": (180, 130, 60),
            "botanical_type": "resin"
        },
        {
            "id": "916",
            "name": "Clove Bud Hydrosol Water By",
            "element": "CLOVE BUD",
            "price": 169,
            "volume": "100 ml",
            "slug": "clove-bud-hydrosol",
            "accent_color": (120, 60, 30),
            "botanical_type": "clove"
        },
        {
            "id": "917",
            "name": "Cinnamon Bark Hydrosol By",
            "element": "CINNAMON BARK",
            "price": 359,
            "volume": "300 ml",
            "slug": "cinnamon-bark-hydrosol",
            "accent_color": (140, 70, 30),
            "botanical_type": "cinnamon"
        },
        {
            "id": "918",
            "name": "Bergamot Hydrosol Water By Organic",
            "element": "BERGAMOT",
            "price": 116,
            "volume": "100 ml",
            "slug": "bergamot-hydrosol",
            "accent_color": (90, 150, 40),
            "botanical_type": "citrus"
        },
        {
            "id": "919",
            "name": "Neroli Hydrosol By Organic",
            "element": "NEROLI",
            "price": 325,
            "volume": "300 ml",
            "slug": "neroli-hydrosol",
            "accent_color": (200, 160, 60),
            "botanical_type": "flower"
        },
        {
            "id": "923",
            "name": "Jasmine Hydrosol By Organic",
            "element": "JASMINE",
            "price": 247,
            "volume": "300 ml",
            "slug": "jasmine-hydrosol",
            "accent_color": (200, 180, 120),
            "botanical_type": "flower"
        },
        {
            "id": "924",
            "name": "Cedarwood Hydrosol Water By Organic",
            "element": "CEDARWOOD",
            "price": 371,
            "volume": "300 ml",
            "slug": "cedarwood-hydrosol",
            "accent_color": (130, 80, 40),
            "botanical_type": "wood"
        },
        {
            "id": "925",
            "name": "Lavender Hydrosol By Organic",
            "element": "LAVENDER",
            "price": 192,
            "volume": "100 ml",
            "slug": "lavender-hydrosol",
            "accent_color": (110, 80, 140),
            "botanical_type": "lavender"
        },
        {
            "id": "926",
            "name": "Vetiver Hydrosol By",
            "element": "VETIVER",
            "price": 435,
            "volume": "500 ml",
            "slug": "vetiver-hydrosol",
            "accent_color": (130, 100, 60),
            "botanical_type": "roots"
        },
        {
            "id": "927",
            "name": "Sandalwood Hydrosol By Organic",
            "element": "SANDALWOOD",
            "price": 551,
            "volume": "500 ml",
            "slug": "sandalwood-organic-hydrosol",
            "accent_color": (180, 130, 70),
            "botanical_type": "wood"
        },
        {
            "id": "928",
            "name": "Tea Tree Hydrosol By",
            "element": "TEA TREE",
            "price": 568,
            "volume": "500 ml",
            "slug": "tea-tree-hydrosol",
            "accent_color": (50, 130, 60),
            "botanical_type": "teatree"
        }
    ]

    # Load master studio base image
    base_img_path = 'C:/Users/prabh/.gemini/antigravity/brain/80e0808b-3057-4517-a308-a2741bddb352/ekora_hydrosol_lavender_1789468916723.jpg'
    rosemary_img_path = 'C:/Users/prabh/.gemini/antigravity/brain/80e0808b-3057-4517-a308-a2741bddb352/ekora_hydrosol_rosemary_1789468948612.jpg'
    helichrysum_img_path = 'C:/Users/prabh/.gemini/antigravity/brain/80e0808b-3057-4517-a308-a2741bddb352/ekora_hydrosol_helichrysum_1789468979231.jpg'
    clove_img_path = 'C:/Users/prabh/.gemini/antigravity/brain/80e0808b-3057-4517-a308-a2741bddb352/ekora_hydrosol_clove_bud_1789469008270.jpg'

    # Master base images
    source_map = {
        "LAVENDER": base_img_path,
        "ROSEMARY": rosemary_img_path,
        "HELICHRYSUM": helichrysum_img_path,
        "CLOVE BUD": clove_img_path,
    }

    # Label box dimensions on the 1024x1024 bottle
    # [left, top, right, bottom]
    LABEL_BOX = (485, 375, 715, 830) # approx coordinates of front label

    # Create images for each hydrosol
    created_map = {}

    for item in hydrosols:
        slug = item["slug"]
        element = item["element"]
        vol = item["volume"]
        dest_path = f"public/images/products/hydrosols/{slug}.webp"

        # If we have a direct master photo, use that base
        if element in source_map and os.path.exists(source_map[element]):
            src = Image.open(source_map[element]).convert("RGB")
            src.save(dest_path, "WEBP", quality=92)
            created_map[item["id"]] = f"/images/products/hydrosols/{slug}.webp"
            print(f"Direct master saved for {element} -> {dest_path}")
            continue

        # Choose best backdrop template for botanical grouping
        if item["botanical_type"] in ["flower", "chamomile"]:
            template_path = helichrysum_img_path
        elif item["botanical_type"] in ["mint", "grass", "teatree", "aloe", "patchouli"]:
            template_path = rosemary_img_path
        elif item["botanical_type"] in ["wood", "resin", "cinnamon", "roots"]:
            template_path = clove_img_path
        else:
            template_path = rosemary_img_path

        base = Image.open(template_path).convert("RGBA")
        
        # Overlay a clean, sharp, custom Ekora Bazaar label with perfect typography
        # Label coordinates on the bottle:
        lx1, ly1, lx2, ly2 = 485, 375, 715, 830
        label_w = lx2 - lx1
        label_h = ly2 - ly1

        # Create crisp off-white textured label
        label_surface = Image.new("RGBA", (label_w, label_h), (252, 250, 246, 255))
        draw = ImageDraw.Draw(label_surface)

        # Draw luxury double gold border
        gold_color = (195, 155, 75, 230)
        gold_inner = (215, 180, 105, 180)
        draw.rectangle([6, 6, label_w - 7, label_h - 7], outline=gold_color, width=2)
        draw.rectangle([10, 10, label_w - 11, label_h - 11], outline=gold_inner, width=1)

        # Draw EKORA BAZAAR Header
        brand_text = "EKORA BAZAAR"
        bbox_brand = draw.textbbox((0, 0), brand_text, font=font_brand)
        bw = bbox_brand[2] - bbox_brand[0]
        draw.text(((label_w - bw) / 2, 38), brand_text, fill=(45, 35, 25, 255), font=font_brand)

        # Small decorative gold accent under brand
        draw.line([label_w / 2 - 35, 78, label_w / 2 + 35, 78], fill=gold_color, width=1)
        draw.polygon([(label_w / 2 - 4, 78), (label_w / 2, 74), (label_w / 2 + 4, 78), (label_w / 2, 82)], fill=gold_color)

        # Center Element Title
        title_top = 185
        # If element name has 2 words, split cleanly
        words = element.split(" ")
        if len(words) > 1 and len(element) > 11:
            for i, word in enumerate(words):
                bbox_w = draw.textbbox((0, 0), word, font=font_title)
                ww = bbox_w[2] - bbox_w[0]
                draw.text(((label_w - ww) / 2, title_top + (i * 36)), word, fill=(35, 25, 15, 255), font=font_title)
            hyd_top = title_top + (len(words) * 36) + 4
        else:
            bbox_title = draw.textbbox((0, 0), element, font=font_title)
            tw = bbox_title[2] - bbox_title[0]
            draw.text(((label_w - tw) / 2, title_top), element, fill=(35, 25, 15, 255), font=font_title)
            hyd_top = title_top + 40

        # HYDROSOL subtitle
        hyd_text = "HYDROSOL"
        bbox_hyd = draw.textbbox((0, 0), hyd_text, font=font_title)
        hw = bbox_hyd[2] - bbox_hyd[0]
        draw.text(((label_w - hw) / 2, hyd_top), hyd_text, fill=(35, 25, 15, 255), font=font_title)

        # 100% Pure Steam Distilled Botanical Water
        sub1 = "100% Pure Steam Distilled"
        sub2 = "Botanical Water"
        bbox_s1 = draw.textbbox((0, 0), sub1, font=font_sub)
        s1w = bbox_s1[2] - bbox_s1[0]
        draw.text(((label_w - s1w) / 2, hyd_top + 50), sub1, fill=(85, 70, 55, 230), font=font_sub)

        bbox_s2 = draw.textbbox((0, 0), sub2, font=font_sub)
        s2w = bbox_s2[2] - bbox_s2[0]
        draw.text(((label_w - s2w) / 2, hyd_top + 72), sub2, fill=(85, 70, 55, 230), font=font_sub)

        # Thin gold divider
        draw.line([30, label_h - 60, label_w - 30, label_h - 60], fill=gold_inner, width=1)

        # Net Volume at bottom
        vol_text = f"Net Volume: {vol}"
        bbox_v = draw.textbbox((0, 0), vol_text, font=font_vol)
        vw = bbox_v[2] - bbox_v[0]
        draw.text(((label_w - vw) / 2, label_h - 45), vol_text, fill=(95, 80, 65, 240), font=font_vol)

        # Composite label with subtle curved cylinder shading
        # Paste onto base bottle
        base.paste(label_surface, (lx1, ly1))

        # Save as high-quality WebP
        final_img = base.convert("RGB")
        final_img.save(dest_path, "WEBP", quality=92)
        created_map[item["id"]] = f"/images/products/hydrosols/{slug}.webp"
        print(f"Generated & saved {element} ({vol}) -> {dest_path}")

    # Now update products.json with the new images
    with open('src/lib/data/products.json', 'r', encoding='utf-8') as f:
        products = json.load(f)

    updated_count = 0
    for p in products:
        p_id = str(p.get("id"))
        if p_id in created_map:
            p["image"] = created_map[p_id]
            p["imageUrl"] = created_map[p_id]
            updated_count += 1

    with open('src/lib/data/products.json', 'w', encoding='utf-8') as f:
        json.dump(products, f, indent=2, ensure_ascii=False)

    print(f"\nSuccessfully updated {updated_count} hydrosol products in products.json!")

if __name__ == '__main__':
    create_hydrosol_catalog()
