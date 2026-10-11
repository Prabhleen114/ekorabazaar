# SEO_KEYWORD_MAP.md — Ekora Bazaar Route Keyword Map

Generated from `ALL_CATEGORIES` in `src/lib/categories.ts` + static routes.
All 31 wholesale category slugs verified against `generateStaticParams()` output.

## How Slugs Are Generated
`cat.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')`

---

## Static Routes

| Route | Primary Keyword | Secondary Keywords | Intent |
|-------|----------------|-------------------|--------|
| `/` | wholesale craft supplies India | B2B marketplace India, raw materials for makers | Navigational / Brand |
| `/shop` | buy raw materials online India | craft supplies bulk, wholesale candle soap resin | Commercial / Browse |
| `/blog` | candle making guide India | soap making tips, resin art tutorial | Informational |
| `/guides/[slug]` | how to choose [category] | [category] buying guide India, wholesale [category] tips | Informational |
| `/wholesale/[category]` | wholesale [category] India | bulk [category] price, [category] suppliers India | Commercial / Transactional |
| `/sell` | sell crafts online India | become a supplier India, wholesale marketplace | Navigational / Seller |
| `/classes` | craft classes India | candle making class, soap workshop India | Informational |

---

## Wholesale Category Pages (all 31 slugs)

| Route | Category Label | Primary Keyword | Secondary Keywords | Intent |
|-------|---------------|----------------|-------------------|--------|
| `/wholesale/candle-waxes-additives` | Candle Waxes & Additives | candle wax wholesale India | buy soy wax bulk, paraffin wax supplier India | Transactional |
| `/wholesale/artisan-soap-bases` | Artisan Soap Bases | melt and pour soap base wholesale | soap base bulk India, buy soap base | Transactional |
| `/wholesale/skincare-body-bases` | Skincare & Body Bases | skincare base wholesale India | cosmetic base bulk, lotion base supplier | Transactional |
| `/wholesale/body-facial-scrubs` | Body & Facial Scrubs | scrub base wholesale | body scrub bulk India, facial scrub base supplier | Transactional |
| `/wholesale/haircare-wash-bases` | Haircare & Wash Bases | shampoo base wholesale India | conditioner base bulk, haircare base supplier | Transactional |
| `/wholesale/raw-butters-carrier-oils` | Raw Butters & Carrier Oils | carrier oil wholesale India | shea butter bulk, raw butter supplier India | Transactional |
| `/wholesale/cosmetic-preservatives-chemicals` | Cosmetic Preservatives & Chemicals | cosmetic preservative wholesale | phenoxyethanol bulk India, cosmetic chemicals supplier | Transactional |
| `/wholesale/fragrance-oils` | Fragrance Oils | fragrance oil wholesale India | buy fragrance oil bulk, candle fragrance oil supplier | Transactional |
| `/wholesale/skin-safe-fragrances` | Skin Safe Fragrances | skin safe fragrance oil wholesale | cosmetic fragrance bulk India, soap fragrance oil | Transactional |
| `/wholesale/essential-oils` | Essential Oils | essential oil wholesale India | pure essential oil bulk, lavender oil supplier India | Transactional |
| `/wholesale/food-grade-flavor-oils` | Food-Grade Flavor Oils | food grade flavor oil wholesale | flavour oil bulk India, confectionery flavour supplier | Transactional |
| `/wholesale/hydrosols-floral-waters` | Hydrosols & Floral Waters | hydrosol wholesale India | floral water bulk, rose water supplier India | Transactional |
| `/wholesale/micas-pigments` | Micas & Pigments | mica powder wholesale India | cosmetic mica bulk, pigment supplier India | Transactional |
| `/wholesale/candle-pillar-moulds` | Candle & Pillar Moulds | candle mould wholesale India | pillar mould bulk, silicone candle mould supplier | Transactional |
| `/wholesale/soap-bar-moulds` | Soap & Bar Moulds | soap mould wholesale India | bar mould bulk, silicone soap mould supplier | Transactional |
| `/wholesale/eco-resin-stone-moulds` | Eco-Resin & Stone Moulds | resin mould wholesale India | Jesmonite mould bulk, stone casting mould supplier | Transactional |
| `/wholesale/culinary-fondant-moulds` | Culinary & Fondant Moulds | chocolate mould wholesale India | fondant mould bulk, silicone baking mould supplier | Transactional |
| `/wholesale/general-silicone-moulds` | General Silicone Moulds | silicone mould wholesale India | silicone mould bulk, resin art mould supplier | Transactional |
| `/wholesale/candle-jars-containers` | Candle Jars & Containers | candle jar wholesale India | glass candle container bulk, candle tin supplier | Transactional |
| `/wholesale/attar-perfume-bottles` | Attar & Perfume Bottles | attar bottle wholesale India | perfume vial bulk, roll-on bottle supplier India | Transactional |
| `/wholesale/diffuser-bottles-accessories` | Diffuser Bottles & Accessories | reed diffuser bottle wholesale | diffuser accessory bulk, reed stick supplier India | Transactional |
| `/wholesale/cosmetic-jars-bottles` | Cosmetic Jars & Bottles | cosmetic bottle wholesale India | cream jar bulk, airless pump bottle supplier | Transactional |
| `/wholesale/metal-containers-tins` | Metal Containers & Tins | metal tin wholesale India | candle tin bulk, lip balm tin supplier | Transactional |
| `/wholesale/packaging-boxes-mailers` | Packaging Boxes & Mailers | packaging box wholesale India | mailer box bulk, kraft box supplier India | Transactional |
| `/wholesale/lids-caps-closures` | Lids, Caps & Closures | bottle cap wholesale India | closure bulk, lid supplier India | Transactional |
| `/wholesale/gift-bags-pouches` | Gift Bags & Pouches | gift bag wholesale India | pouch bulk, organza bag supplier India | Transactional |
| `/wholesale/stickers-labels` | Stickers & Labels | product label wholesale India | sticker bulk, cosmetic label supplier India | Transactional |
| `/wholesale/wick-systems-hardware` | Wick Systems & Hardware | candle wick wholesale India | wick sustainer bulk, cotton wick supplier India | Transactional |
| `/wholesale/soap-making-tools` | Soap Making Tools | soap making tools wholesale | soap cutter bulk, stick blender supplier India | Transactional |
| `/wholesale/dried-botanicals-additives` | Dried Botanicals & Additives | dried flower wholesale India | botanical embed bulk, dried herbs supplier India | Transactional |
| `/wholesale/studio-equipment` | Studio Equipment | craft studio equipment wholesale | pouring pot bulk, thermometer supplier India | Transactional |

---

## Keyword Overlap Strategy: /guides vs /wholesale

**Problem:** Both `/guides/candle-waxes-additives` and `/wholesale/candle-waxes-additives`
could target the same search queries, causing internal cannibalization.

**Resolution:**
- `/wholesale/[category]` → **Transactional intent only**: "buy", "wholesale", "bulk", "price", "supplier"
- `/guides/[category]` → **Informational intent only**: "how to choose", "guide", "what is", "tips", "beginners"
- Each `/guides` page must have a distinct title like "How to Choose Candle Waxes: A Buying Guide"
  and self-canonical to `/guides/[slug]`, NOT to `/wholesale/[slug]`
- `/blog/[slug]` → **Educational + long-tail**: how-to articles, tutorials, use-case content
  with internal links → `/wholesale/[category]` as the transactional landing page

**No changes to existing /guides URLs.** The above is implemented via `generateGuideMetadata()`
in `src/lib/seo.ts` which already produces informational titles ("Buying Guide").
