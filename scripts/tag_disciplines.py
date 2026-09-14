import json

PRODUCTS_JSON = 'src/lib/data/products.json'

def classify_product_8_studios(p):
    name = (p.get("name") or "").upper()
    cat = p.get("category") or ""
    dept = p.get("department") or ""
    desc = (p.get("description") or "").upper()
    full_text = f"{name} {cat} {desc}"

    disciplines = set()

    # --- 1. PERFUMERY & ATTAR STUDIO (perfumery-attar) ---
    if cat == "Attar & Perfume Bottles":
        disciplines.add("perfumery-attar")

    if cat == "Cosmetic Jars & Bottles" and any(k in full_text for k in ["DROPPER", "PERFUME", "ATTAR", "SPRAY", "VIAL", "ATOMIZER"]):
        disciplines.add("perfumery-attar")

    # --- 2. HOME FRAGRANCE & DIFFUSER STUDIO (home-fragrance) ---
    if cat == "Diffuser Bottles & Accessories":
        disciplines.add("home-fragrance")

    if cat == "Lids, Caps & Closures" and "DIFFUSER" in full_text:
        disciplines.add("home-fragrance")

    # --- 3. CHOCOLATE & CONFECTIONERY STUDIO (culinary-chocolatier) ---
    if cat == "Culinary & Fondant Moulds":
        disciplines.add("culinary-chocolatier")
        if any(k in full_text for k in ["SOAP", "CANDLE", "RESIN", "DIY KIT"]):
            if "SOAP" in full_text: disciplines.add("soap-atelier")
            if "CANDLE" in full_text or "WAX" in full_text: disciplines.add("candle-studio")
            if "RESIN" in full_text: disciplines.add("resin-lab")

    if cat == "Food-Grade Flavor Oils":
        disciplines.add("culinary-chocolatier")
        disciplines.add("skincare-apothecary")

    # --- 4. HAIRCARE & COSMETIC APOTHECARY (skincare-apothecary) ---
    if cat in [
        "Haircare & Wash Bases",
        "Skincare & Body Bases",
        "Raw Butters & Carrier Oils",
        "Hydrosols & Floral Waters",
        "Cosmetic Preservatives & Chemicals"
    ]:
        disciplines.add("skincare-apothecary")

    if cat == "Cosmetic Jars & Bottles":
        disciplines.add("skincare-apothecary")

    # --- 5. CANDLE STUDIO CORE (candle-studio) ---
    if cat in ["Candle Waxes & Additives", "Wick Systems & Hardware"]:
        disciplines.add("candle-studio")

    if cat == "Candle Jars & Containers":
        if "CASTING POWDER" in name or "JESMONITE" in name or "GYPSUM" in name or "WHITE CEMENT" in name:
            disciplines.add("stone-studio")
        else:
            disciplines.add("candle-studio")
            if "DIFFUSER" in full_text:
                disciplines.add("home-fragrance")

    if cat == "Metal Containers & Tins":
        if any(k in full_text for k in ["CANDLE", "URLI", "BOWL", "WAX", "TIN"]):
            disciplines.add("candle-studio")
        else:
            disciplines.add("skincare-apothecary")

    if cat == "Stickers & Labels":
        if "CANDLE" in full_text or "WARNING" in full_text or "SAFETY" in full_text:
            disciplines.add("candle-studio")

    if cat == "Lids, Caps & Closures":
        if "CANDLE" in full_text:
            disciplines.add("candle-studio")

    # --- 6. SOAP & BATH ATELIER (soap-atelier) ---
    if cat in ["Artisan Soap Bases", "Soap Making Tools"]:
        disciplines.add("soap-atelier")

    if cat == "Soap & Bar Moulds":
        disciplines.add("soap-atelier")
        if any(k in full_text for k in ["RESIN", "PLASTER", "STONE", "CONCRETE", "JESMONITE"]):
            disciplines.add("stone-studio")
            disciplines.add("resin-lab")

    # --- 7. SCENTS & ESSENTIAL OILS (Cross-studio) ---
    if cat in ["Fragrance Oils", "Essential Oils"]:
        disciplines.add("candle-studio")
        disciplines.add("soap-atelier")
        disciplines.add("home-fragrance")
        disciplines.add("perfumery-attar")
        disciplines.add("skincare-apothecary")

    # --- 8. COLOR & PIGMENTS ---
    if cat == "Micas & Pigments":
        if any(k in name for k in ["CONCRETE", "JESMONITE", "GYPSUM", "PLASTER", "CEMENT"]):
            disciplines.add("stone-studio")
            disciplines.add("resin-lab")
        elif "ALCOHOL INK" in name or "UV RESIN" in name:
            disciplines.add("resin-lab")
        elif "CANDLE DYE" in name or "WAX DYE" in name or "CANDLE PIGMENT" in name:
            disciplines.add("candle-studio")
        else:
            disciplines.add("candle-studio")
            disciplines.add("soap-atelier")
            disciplines.add("stone-studio")
            disciplines.add("resin-lab")
            disciplines.add("skincare-apothecary")

    # --- 9. DRIED BOTANICALS ---
    if cat == "Dried Botanicals & Additives":
        disciplines.add("candle-studio")
        disciplines.add("soap-atelier")
        disciplines.add("resin-lab")
        disciplines.add("skincare-apothecary")

    # --- 10. STUDIO EQUIPMENT ---
    if cat == "Studio Equipment":
        if any(k in name for k in ["BEAKER", "MEASURING CUP", "SILICONE MAT", "STIRRER", "SCALE", "PIPETTE"]):
            disciplines.add("candle-studio")
            disciplines.add("soap-atelier")
            disciplines.add("stone-studio")
            disciplines.add("resin-lab")
            disciplines.add("skincare-apothecary")
            disciplines.add("perfumery-attar")
            disciplines.add("culinary-chocolatier")
        elif any(k in name for k in ["WAX", "MELTER", "POURING PITCHER", "THERMOMETER"]):
            disciplines.add("candle-studio")
        elif any(k in name for k in ["HEAT GUN", "BUBBLE", "UV LAMP"]):
            disciplines.add("resin-lab")
        elif "SOAP" in name or "CUTTER" in name:
            disciplines.add("soap-atelier")

    # --- 11. RAW CASTING MEDIUMS & SILICONE CHEMICALS ---
    if "LIQUID SILICONE RUBBER" in name or "MOLD MAKING" in name or "SHORE A" in name:
        disciplines.add("candle-studio")
        disciplines.add("soap-atelier")
        disciplines.add("stone-studio")
        disciplines.add("resin-lab")
        disciplines.add("culinary-chocolatier")

    if "CASTING POWDER" in name or "JESMONITE" in name or "GYPSUM" in name or "WHITE CEMENT" in name or "AC100" in name:
        disciplines.add("stone-studio")

    if "BEAKER" in name or "MEASURING CUP" in name or "MEASURE CUP" in name:
        disciplines.add("candle-studio")
        disciplines.add("soap-atelier")
        disciplines.add("stone-studio")
        disciplines.add("resin-lab")
        disciplines.add("skincare-apothecary")

    # --- 12. MOULDS (Candle & Pillar, Stone, Resin, Culinary) ---
    if cat not in ["Culinary & Fondant Moulds"]:
        is_stone_mould = any(k in name for k in [
            "TRAY", "COASTER", "PLANTER", "POT MOULD", "POT MOLD", "FLOWER POT",
            "CONCRETE", "GYPSUM", "JESMONITE", "CEMENT", "STORAGE BOX", "STORAGE DISH",
            "JEWELRY DISH", "TRINKET", "VASE", "WATER RIPPLE", "TERRAZZO", "ARCH TRAY",
            "OVAL TRAY", "ROUND TRAY", "HEXAGON TRAY", "SOAP DISH", "ASHTRAY", "BOOKEND",
            "INCENSE HOLDER", "PEN HOLDER", "BRUSH HOLDER", "SUCCULENT", "CANDLE JAR MOULD",
            "CANDLE VESSEL MOULD", "CANDLE HOLDER MOLD", "CANDLE HOLDER MOULD", "WALL CLOCK",
            "PICTURE FRAME", "TISSUE BOX"
        ])

        is_candle_mould = any(k in name for k in [
            "CANDLE MOLD", "CANDLE MOULD", "PILLAR CANDLE", "TAPER CANDLE", "BUBBLE CANDLE",
            "RIB CANDLE", "RIBBED CANDLE", "STRIPED CYLINDER", "CYLINDER CANDLE", "POLYCARBONATE",
            "SPIRAL CANDLE", "TWIST CANDLE", "ARCH CANDLE", "BALL CANDLE", "VOTIVE", "TEALIGHT",
            "WAX MELT", "WICK PIN", "CANDLE MAKING MOLD", "KNOT CANDLE", "PEONY CANDLE",
            "BODY CANDLE", "TORSO CANDLE", "FEMALE BODY", "MALE BODY", "PYRAMID CANDLE",
            "GEOMETRIC CANDLE", "TALL CANDLE", "CANDLESTICK", "CANDLE CUP"
        ]) or cat == "Candle & Pillar Moulds"

        is_resin_mould = any(k in name for k in [
            "RESIN", "EPOXY", "UV RESIN", "JEWELRY", "EARRING", "PENDANT", "KEYCHAIN",
            "BOOKMARK", "GEODE", "PYRAMID", "SHAKER", "ALPHABET", "LETTER", "NUMBER",
            "CRYSTAL", "AGATE", "GLUE DROPPING", "DOMINO", "CHESS", "COMB", "HAIR PIN",
            "RULER", "RUNES", "TAROT"
        ])

        is_soap_mould = any(k in name for k in [
            "SOAP MOLD", "SOAP MOULD", "LOAF MOLD", "LOAF MOULD", "MASSAGE BAR",
            "RECTANGLE SOAP", "OVAL SOAP", "COLD PROCESS SOAP", "MELT AND POUR SOAP",
            "SOAP MAKING", "SOAP BASE"
        ]) or cat == "Soap & Bar Moulds"

        if is_stone_mould:
            disciplines.add("stone-studio")
            disciplines.add("resin-lab")

        if is_candle_mould:
            disciplines.add("candle-studio")
            if any(k in name for k in ["ROSE", "FLOWER", "HEART", "BEAR", "ANGEL", "LION", "BUDDHA", "MINI", "PEONY"]):
                disciplines.add("soap-atelier")
                disciplines.add("resin-lab")

        if is_soap_mould:
            disciplines.add("soap-atelier")

        if is_resin_mould:
            disciplines.add("resin-lab")

        if cat == "Eco-Resin & Stone Moulds" and len(disciplines) == 0:
            disciplines.add("stone-studio")
            disciplines.add("resin-lab")

        if cat == "General Silicone Moulds" and len(disciplines) == 0:
            disciplines.add("candle-studio")
            disciplines.add("soap-atelier")
            disciplines.add("resin-lab")
            disciplines.add("culinary-chocolatier")

    if cat in ["Packaging Boxes & Mailers", "Gift Bags & Pouches"]:
        return []

    return sorted(list(disciplines))

with open(PRODUCTS_JSON, 'r', encoding='utf-8') as f:
    products = json.load(f)

stats = {}
for p in products:
    discs = classify_product_8_studios(p)
    p['disciplines'] = discs
    for d in discs:
        stats[d] = stats.get(d, 0) + 1
    if len(discs) == 0:
        stats["unassigned_packaging"] = stats.get("unassigned_packaging", 0) + 1

with open(PRODUCTS_JSON, 'w', encoding='utf-8') as f:
    json.dump(products, f, indent=2, ensure_ascii=False)

print(f"Updated {len(products)} products in {PRODUCTS_JSON}")
print("Discipline counts:")
for d, c in sorted(stats.items(), key=lambda x: x[1], reverse=True):
    print(f"  {d}: {c}")
