# EKORA BAZAAR — CATALOG QUALITY PROFILE

**Audit Execution Date:** 2026-10-16
**Audited Data Source:** `src/lib/data/products.json`
**Total Active Catalog SKUs Analyzed:** 2255

---

## 1. CATALOG IDENTITY & ID HEALTH

| Metric | Measured Count | Status | Notes |
| :--- | :--- | :--- | :--- |
| **Total SKUs in JSON** | 2255 | Baseline | Primary static catalog source |
| **Duplicate IDs** | 0 | CLEAN | All JSON product IDs are unique strings |
| **Exact Name Collisions** | 7 | Investigated | Includes the 8 confirmed identical pairs (16 SKUs) |
| **Normalized Name Collisions** | 11 | Investigated | Collisions across punctuation and case variations |

### Confirmed Duplicate Name Pairs (Handled via 301 Redirects)
- **"Mango Butter"**: IDs [375, 399]
- **"464 Soy Wax Natural Soy Wax Granule for Candle Making"**: IDs [854, 2383]
- **"Soy Butter Wax"**: IDs [857, 2385]
- **"Soy Wax White Chunk AA+"**: IDs [862, 2390]
- **"Bees Wax Natural Yellow"**: IDs [1262, 2401]
- **"100% Natural Pure Beeswax Pellets White"**: IDs [1283, 2399]
- **"Raw Shea Butter (Organic Raw) From Africa"**: IDs [1285, 2403]

---

## 2. PRODUCT DESCRIPTION & CONTENT QUALITY

| Metric | Measured Count | % of Catalog | Status |
| :--- | :--- | :--- | :--- |
| **Missing Descriptions** | 0 | 0.0% | CLEAN |
| **Boilerplate Template Descriptions** | 1771 | 78.5% | HIGH PRIORITY |
| **Thin Descriptions (< 25 words)** | 1163 | 51.6% | ENRICHMENT TARGET |

### Identified Description Boilerplate Pattern:
> *"Premium quality [Product Name] sourced directly for creators. Perfect for your next creative project with batch-tested reliability."*

This boilerplate pattern is repeated across **1771 SKUs** (78.5% of the catalog), creating algorithmic thin-content risk.

---

## 3. PRODUCT IMAGE HOSTING & DEPENDENCY ANALYSIS

| Image Host / Location | SKU Count | Share | Status / Risk |
| :--- | :--- | :--- | :--- |
| **Local / First-Party (`/images/...`)** | 535 | 23.7% | Low Risk (Controlled) |
| **jindeal.com** | 1470 | 65.2% | EXTERNAL HOTLINK (MIGRATION REQUIRED) |
| **matinimpex.com** | 225 | 10.0% | EXTERNAL HOTLINK (MIGRATION REQUIRED) |
| **cdn.shopify.com** | 20 | 0.9% | Third-Party Host |
| **soapytwist.com** | 3 | 0.1% | Third-Party Host |
| **5.imimg.com** | 2 | 0.1% | Third-Party Host |
| **Missing Images** | 0 | 0.0% | CLEAN |

### Key Risk Finding:
- **jindeal.com hotlinks:** 1470 images depend on third-party competitor hosting.
- **matinimpex.com hotlinks:** 225 images depend on external wholesale hosting.
- **Next.js image optimization:** `images.unoptimized: true` was set in `next.config.ts` to prevent edge transformation quota exhaustion across the 1,600+ external hotlinked images.

---

## 4. PRICING & COMMERCIAL READINESS

| Metric | Count | Details |
| :--- | :--- | :--- |
| **Products with Valid Price (> ₹0)** | 2213 | Direct B2B checkout eligible |
| **Zero Price SKUs** | 42 | Require custom quotation or price update |
| **Missing Price Field** | 0 | Clean |
| **Quote-Only SKUs** | 72 | B2B lead generation / RFQ workflow |

---

## 5. TOP CATEGORIES BY SKU VOLUME

1. **Eco-Resin & Stone Moulds**: 570 SKUs (25.3%)
2. **Culinary & Fondant Moulds**: 348 SKUs (15.4%)
3. **General Silicone Moulds**: 258 SKUs (11.4%)
4. **Fragrance Oils**: 242 SKUs (10.7%)
5. **Candle & Pillar Moulds**: 221 SKUs (9.8%)
6. **Essential Oils**: 93 SKUs (4.1%)
7. **Soap & Bar Moulds**: 73 SKUs (3.2%)
8. **Candle Jars & Containers**: 70 SKUs (3.1%)
9. **Skin Safe Fragrances**: 52 SKUs (2.3%)
10. **Packaging Boxes & Mailers**: 33 SKUs (1.5%)

---

## 6. PRIORITIZED REMEDIATION ACTIONS

1. **Category Description Enrichment (Controlled Batch):** Replace generic boilerplate on the top 5 craft categories (Candle Waxes, Raw Butters, Silicone Moulds, Fragrance Oils, Essential Oils) with material-specific attributes (Grade, Melt Point/Shore Hardness, Applications, Storage).
2. **Search Synonym Separation:** Decouple plant butters and candle waxes in `src/lib/search.ts` so queries remain specific.
3. **Image Strategy:** Maintain local WebP rewrites for first-party images; document external image hotlink migration plan for business owner cloud storage provisioning.
