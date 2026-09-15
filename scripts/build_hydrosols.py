import os
import json
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

def draw_botanical_icon(draw, icon_type, cx, cy, size, color):
    """Draws elegant minimalist botanical line art tailored to the plant species"""
    s = size / 2.0
    if icon_type == "lavender":
        # Lavender stem with florets
        draw.line([cx, cy - s, cx, cy + s], fill=color, width=2)
        for i in range(-3, 4):
            fy = cy + (i * s / 4.0)
            w = (4 - abs(i)) * 4.5
            # Leaf pairs / florets
            draw.ellipse([cx - w, fy - 4, cx + w, fy + 4], outline=color, width=2)
    elif icon_type == "rosemary":
        # Rosemary twig with needle clusters
        draw.line([cx, cy - s, cx, cy + s], fill=color, width=2)
        for i in range(-4, 5):
            fy = cy + (i * s / 5.0)
            draw.line([cx, fy, cx - 18, fy - 10], fill=color, width=2)
            draw.line([cx, fy, cx + 18, fy - 10], fill=color, width=2)
    elif icon_type in ["chamomile", "flower", "jasmine", "helichrysum", "neroli", "kewra", "ylang ylang"]:
        # Flower with center and petals
        draw.ellipse([cx - 8, cy - 8, cx + 8, cy + 8], outline=color, width=2)
        for angle in range(0, 360, 45):
            rad = math.radians(angle)
            px = cx + math.cos(rad) * (s * 0.7)
            py = cy + math.sin(rad) * (s * 0.7)
            draw.ellipse([px - 7, py - 7, px + 7, py + 7], outline=color, width=2)
        draw.line([cx, cy + 8, cx, cy + s + 10], fill=color, width=2)
    elif icon_type in ["mint", "spearmint", "patchouli", "grass", "palmarosa", "teatree"]:
        # Central stem with serrated / soft leaf pairs
        draw.line([cx, cy - s, cx, cy + s], fill=color, width=2)
        for i in [-2, 0, 2]:
            fy = cy + (i * s / 3.0)
            # Left leaf
            draw.arc([cx - 24, fy - 14, cx, fy + 14], 90, 270, fill=color, width=2)
            draw.line([cx - 24, fy, cx, fy], fill=color, width=1)
            # Right leaf
            draw.arc([cx, fy - 14, cx + 24, fy + 14], 270, 90, fill=color, width=2)
            draw.line([cx, fy, cx + 24, fy], fill=color, width=1)
    elif icon_type in ["citrus", "bergamot", "lime"]:
        # Citrus wheel / slice icon
        draw.ellipse([cx - s * 0.8, cy - s * 0.8, cx + s * 0.8, cy + s * 0.8], outline=color, width=2)
        draw.ellipse([cx - s * 0.65, cy - s * 0.65, cx + s * 0.65, cy + s * 0.65], outline=color, width=1)
        for angle in range(0, 360, 45):
            rad = math.radians(angle)
            px = cx + math.cos(rad) * (s * 0.65)
            py = cy + math.sin(rad) * (s * 0.65)
            draw.line([cx, cy, px, py], fill=color, width=1)
    elif icon_type in ["wood", "sandalwood", "cedarwood", "roots", "vetiver"]:
        # Wood rings / grain and branch icon
        draw.arc([cx - 22, cy - 22, cx + 22, cy + 22], 30, 330, fill=color, width=2)
        draw.arc([cx - 14, cy - 14, cx + 14, cy + 14], 50, 310, fill=color, width=1)
        draw.arc([cx - 6, cy - 6, cx + 6, cy + 6], 70, 290, fill=color, width=1)
        draw.line([cx + 18, cy, cx + s, cy + s * 0.6], fill=color, width=2)
    elif icon_type == "aloe":
        # Aloe vera spear leaves
        draw.arc([cx - 20, cy - s, cx + 10, cy + s], 270, 90, fill=color, width=2)
        draw.arc([cx - 10, cy - s, cx + 20, cy + s], 90, 270, fill=color, width=2)
        draw.line([cx, cy - s, cx, cy + s], fill=color, width=1)
    elif icon_type in ["clove", "cinnamon", "resin", "frankincense"]:
        # Botanical spice / quill icon
        draw.line([cx - 10, cy - s, cx - 10, cy + s], fill=color, width=2)
        draw.line([cx + 10, cy - s, cx + 10, cy + s], fill=color, width=2)
        draw.ellipse([cx - 15, cy - s - 4, cx + 15, cy - s + 10], outline=color, width=2)
    else:
        # Default elegant sprig
        draw.line([cx, cy - s, cx, cy + s], fill=color, width=2)
        draw.arc([cx - 18, cy - 10, cx + 18, cy + 10], 0, 360, fill=color, width=2)

def generate_all():
    os.makedirs('public/images/products/hydrosols', exist_ok=True)

    # 4x Super-Sampling scale for razor-sharp typography and vector graphics
    SCALE = 4
    
    # Label dimensions in 1024 space:
    # x in [518, 725], width = 207
    # y in [398, 852], height = 454
    BASE_LW = 208
    BASE_LH = 454

    LW = BASE_LW * SCALE
    LH = BASE_LH * SCALE

    # Load high-res fonts
    font_brand = ImageFont.truetype('C:/Windows/Fonts/georgia.ttf', 17 * SCALE)
    font_title_large = ImageFont.truetype('C:/Windows/Fonts/georgia.ttf', 20 * SCALE)
    font_title_medium = ImageFont.truetype('C:/Windows/Fonts/georgia.ttf', 17 * SCALE)
    font_sub_top = ImageFont.truetype('C:/Windows/Fonts/georgia.ttf', 10 * SCALE)
    font_sub_bot = ImageFont.truetype('C:/Windows/Fonts/georgia.ttf', 10 * SCALE)
    font_vol = ImageFont.truetype('C:/Windows/Fonts/georgia.ttf', 11 * SCALE)

    hydrosols = [
        {"id": "904", "name": "Sandalwood Natural Extracts Water Soluble 10 By", "element": "SANDALWOOD", "price": 382, "volume": "300 ml", "slug": "sandalwood-extracts", "icon": "sandalwood", "backdrop": "clove"},
        {"id": "905", "name": "Chamomile Natural Extracts Water Soluble 5.1 Ratio By", "element": "CHAMOMILE", "price": 313, "volume": "300 ml", "slug": "chamomile-extracts", "icon": "chamomile", "backdrop": "chamomile"},
        {"id": "906", "name": "Aloe Vera Natural Extracts Water Solubility By 5 1", "element": "ALOE VERA", "price": 439, "volume": "500 ml", "slug": "aloe-vera-extracts", "icon": "aloe", "backdrop": "rosemary"},
        {"id": "907", "name": "Ylang Ylang Hydrosol Water By Organic", "element": "YLANG YLANG", "price": 562, "volume": "500 ml", "slug": "ylang-ylang-hydrosol", "icon": "ylang ylang", "backdrop": "helichrysum"},
        {"id": "908", "name": "Spearmint Hydrosol Water By Organic", "element": "SPEARMINT", "price": 376, "volume": "300 ml", "slug": "spearmint-hydrosol", "icon": "spearmint", "backdrop": "rosemary"},
        {"id": "909", "name": "Rosemary Hydrosol Water By Organic", "element": "ROSEMARY", "price": 158, "volume": "100 ml", "slug": "rosemary-hydrosol", "icon": "rosemary", "backdrop": "rosemary"},
        {"id": "910", "name": "Patchouli Hydrosol Water By Organic", "element": "PATCHOULI", "price": 320, "volume": "300 ml", "slug": "patchouli-hydrosol", "icon": "patchouli", "backdrop": "rosemary"},
        {"id": "911", "name": "Palmarosa Hydrosol Water By Organic", "element": "PALMAROSA", "price": 260, "volume": "300 ml", "slug": "palmarosa-hydrosol", "icon": "palmarosa", "backdrop": "rosemary"},
        {"id": "912", "name": "Lime Hydrosol Water By Organic", "element": "LIME", "price": 331, "volume": "300 ml", "slug": "lime-hydrosol", "icon": "lime", "backdrop": "rosemary"},
        {"id": "913", "name": "Kewra Hydrosol Water By Organic", "element": "KEWRA", "price": 441, "volume": "500 ml", "slug": "kewra-hydrosol", "icon": "kewra", "backdrop": "helichrysum"},
        {"id": "914", "name": "Helichrysum Hydrosol Water By Organic", "element": "HELICHRYSUM", "price": 138, "volume": "100 ml", "slug": "helichrysum-hydrosol", "icon": "helichrysum", "backdrop": "helichrysum"},
        {"id": "915", "name": "Frankincense Hydrosol Water By Organic", "element": "FRANKINCENSE", "price": 354, "volume": "300 ml", "slug": "frankincense-hydrosol", "icon": "frankincense", "backdrop": "clove"},
        {"id": "916", "name": "Clove Bud Hydrosol Water By", "element": "CLOVE BUD", "price": 169, "volume": "100 ml", "slug": "clove-bud-hydrosol", "icon": "clove", "backdrop": "clove"},
        {"id": "917", "name": "Cinnamon Bark Hydrosol By", "element": "CINNAMON BARK", "price": 359, "volume": "300 ml", "slug": "cinnamon-bark-hydrosol", "icon": "cinnamon", "backdrop": "clove"},
        {"id": "918", "name": "Bergamot Hydrosol Water By Organic", "element": "BERGAMOT", "price": 116, "volume": "100 ml", "slug": "bergamot-hydrosol", "icon": "bergamot", "backdrop": "rosemary"},
        {"id": "919", "name": "Neroli Hydrosol By Organic", "element": "NEROLI", "price": 325, "volume": "300 ml", "slug": "neroli-hydrosol", "icon": "neroli", "backdrop": "helichrysum"},
        {"id": "923", "name": "Jasmine Hydrosol By Organic", "element": "JASMINE", "price": 247, "volume": "300 ml", "slug": "jasmine-hydrosol", "icon": "jasmine", "backdrop": "helichrysum"},
        {"id": "924", "name": "Cedarwood Hydrosol Water By Organic", "element": "CEDARWOOD", "price": 371, "volume": "300 ml", "slug": "cedarwood-hydrosol", "icon": "cedarwood", "backdrop": "clove"},
        {"id": "925", "name": "Lavender Hydrosol By Organic", "element": "LAVENDER", "price": 192, "volume": "100 ml", "slug": "lavender-hydrosol", "icon": "lavender", "backdrop": "lavender"},
        {"id": "926", "name": "Vetiver Hydrosol By", "element": "VETIVER", "price": 435, "volume": "500 ml", "slug": "vetiver-hydrosol", "icon": "vetiver", "backdrop": "clove"},
        {"id": "927", "name": "Sandalwood Hydrosol By Organic", "element": "SANDALWOOD", "price": 551, "volume": "500 ml", "slug": "sandalwood-organic-hydrosol", "icon": "sandalwood", "backdrop": "clove"},
        {"id": "928", "name": "Tea Tree Hydrosol By", "element": "TEA TREE", "price": 568, "volume": "500 ml", "slug": "tea-tree-hydrosol", "icon": "teatree", "backdrop": "rosemary"}
    ]

    backdrop_files = {
        "lavender": "C:/Users/prabh/.gemini/antigravity/brain/80e0808b-3057-4517-a308-a2741bddb352/ekora_hydrosol_lavender_1789468916723.jpg",
        "rosemary": "C:/Users/prabh/.gemini/antigravity/brain/80e0808b-3057-4517-a308-a2741bddb352/ekora_hydrosol_rosemary_1789468948612.jpg",
        "helichrysum": "C:/Users/prabh/.gemini/antigravity/brain/80e0808b-3057-4517-a308-a2741bddb352/ekora_hydrosol_helichrysum_1789468979231.jpg",
        "clove": "C:/Users/prabh/.gemini/antigravity/brain/80e0808b-3057-4517-a308-a2741bddb352/ekora_hydrosol_clove_bud_1789469008270.jpg",
        "chamomile": "C:/Users/prabh/.gemini/antigravity/brain/80e0808b-3057-4517-a308-a2741bddb352/hydrosol_chamomile_1789468866099.jpg"
    }

    created_images = {}

    for item in hydrosols:
        slug = item["slug"]
        element = item["element"]
        vol = item["volume"]
        icon_type = item["icon"]
        bd_key = item["backdrop"]
        bd_path = backdrop_files.get(bd_key, backdrop_files["rosemary"])

        # Load master linear studio backdrop
        base_img = Image.open(bd_path).convert("RGBA")

        # Create high-res 4x label canvas
        lbl = Image.new("RGBA", (LW, LH), (252, 250, 246, 255))
        d = ImageDraw.Draw(lbl)

        # Luxury Gold Border
        gold_border = (195, 155, 75, 240)
        gold_fine = (215, 180, 105, 160)
        pad = 8 * SCALE
        d.rectangle([pad, pad, LW - pad, LH - pad], outline=gold_border, width=2 * SCALE)
        d.rectangle([pad + 3 * SCALE, pad + 3 * SCALE, LW - pad - 3 * SCALE, LH - pad - 3 * SCALE], outline=gold_fine, width=1 * SCALE)

        # Top Brand Title: EKORA BAZAAR
        brand_str = "EKORA BAZAAR"
        bb_b = d.textbbox((0, 0), brand_str, font=font_brand)
        bw = bb_b[2] - bb_b[0]
        d.text(((LW - bw) / 2, 34 * SCALE), brand_str, fill=(40, 30, 20, 255), font=font_brand)

        # Draw Botanical Icon
        icon_cx = LW / 2
        icon_cy = 120 * SCALE
        draw_botanical_icon(d, icon_type, icon_cx, icon_cy, 36 * SCALE, gold_border)

        # Title: [ELEMENT] HYDROSOL
        # Decide font size based on element length
        font_elem = font_title_large if len(element) <= 10 else font_title_medium
        words = element.split(" ")

        if len(words) > 1 and len(element) > 10:
            # Multi-line element title
            y_cursor = 185 * SCALE
            for w in words:
                bb_w = d.textbbox((0, 0), w, font=font_elem)
                ww = bb_w[2] - bb_w[0]
                d.text(((LW - ww) / 2, y_cursor), w, fill=(30, 20, 10, 255), font=font_elem)
                y_cursor += 24 * SCALE
            
            # HYDROSOL
            bb_h = d.textbbox((0, 0), "HYDROSOL", font=font_title_large)
            hw = bb_h[2] - bb_h[0]
            d.text(((LW - hw) / 2, y_cursor + 2 * SCALE), "HYDROSOL", fill=(30, 20, 10, 255), font=font_title_large)
            sub_y = y_cursor + 38 * SCALE
        else:
            bb_e = d.textbbox((0, 0), element, font=font_title_large)
            ew = bb_e[2] - bb_e[0]
            d.text(((LW - ew) / 2, 195 * SCALE), element, fill=(30, 20, 10, 255), font=font_title_large)

            bb_h = d.textbbox((0, 0), "HYDROSOL", font=font_title_large)
            hw = bb_h[2] - bb_h[0]
            d.text(((LW - hw) / 2, 224 * SCALE), "HYDROSOL", fill=(30, 20, 10, 255), font=font_title_large)
            sub_y = 265 * SCALE

        # Subtitle: 100% Pure Steam Distilled / Botanical Water
        s1 = "100% Pure Steam Distilled"
        s2 = "Botanical Water"
        bb_s1 = d.textbbox((0, 0), s1, font=font_sub_top)
        d.text(((LW - (bb_s1[2] - bb_s1[0])) / 2, sub_y), s1, fill=(90, 75, 60, 230), font=font_sub_top)

        bb_s2 = d.textbbox((0, 0), s2, font=font_sub_bot)
        d.text(((LW - (bb_s2[2] - bb_s2[0])) / 2, sub_y + 16 * SCALE), s2, fill=(90, 75, 60, 230), font=font_sub_bot)

        # Thin gold divider line
        d.line([32 * SCALE, LH - 48 * SCALE, LW - 32 * SCALE, LH - 48 * SCALE], fill=gold_fine, width=1 * SCALE)

        # Net Volume
        v_str = f"Net Volume: {vol}"
        bb_v = d.textbbox((0, 0), v_str, font=font_vol)
        vw = bb_v[2] - bb_v[0]
        d.text(((LW - vw) / 2, LH - 36 * SCALE), v_str, fill=(80, 65, 50, 255), font=font_vol)

        # Downsample label with Lanczos antialiasing for maximum print-quality sharpness
        lbl_resized = lbl.resize((BASE_LW, BASE_LH), Image.Resampling.LANCZOS)

        # Apply subtle cylindrical shading mask across the width
        shading = Image.new("RGBA", (BASE_LW, BASE_LH), (0, 0, 0, 0))
        sd = ImageDraw.Draw(shading)
        for x in range(BASE_LW):
            # Normalised position from left (0) to right (1)
            nx = x / float(BASE_LW)
            # Subtle curvature highlight and edge shadow
            if nx < 0.12:
                alpha = int((1.0 - (nx / 0.12)) * 30)
                sd.line([x, 0, x, BASE_LH], fill=(0, 0, 0, alpha))
            elif nx > 0.88:
                alpha = int(((nx - 0.88) / 0.12) * 20)
                sd.line([x, 0, x, BASE_LH], fill=(0, 0, 0, alpha))
        
        lbl_shaded = Image.alpha_composite(lbl_resized, shading)

        # Paste onto the bottle at exact label coordinates [x=518, y=398]
        base_img.paste(lbl_shaded, (518, 398), lbl_shaded)

        # Save to public/images/products/hydrosols/[slug].webp
        out_path = f"public/images/products/hydrosols/{slug}.webp"
        final_rgb = base_img.convert("RGB")
        final_rgb.save(out_path, "WEBP", quality=94)

        created_images[item["id"]] = f"/images/products/hydrosols/{slug}.webp"
        print(f"[{item['id']}] Generated: {element} ({vol}) -> {out_path}")

    # Update products.json with the generated image paths
    with open('src/lib/data/products.json', 'r', encoding='utf-8') as f:
        products = json.load(f)

    updated_count = 0
    for p in products:
        p_id = str(p.get("id"))
        if p_id in created_images:
            p["image"] = created_images[p_id]
            p["imageUrl"] = created_images[p_id]
            updated_count += 1

    with open('src/lib/data/products.json', 'w', encoding='utf-8') as f:
        json.dump(products, f, indent=2, ensure_ascii=False)

    print(f"\nCompleted! {updated_count} / {len(hydrosols)} hydrosol products updated in products.json.")

if __name__ == '__main__':
    generate_all()
