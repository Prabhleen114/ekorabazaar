# REVIEW_CLAIMS.md — Claims Flagged for Human Verification

These claims are in code comments (`{/* [VERIFY]: ... */}`) only.
None are rendered to users. A human must verify each before publishing
the corresponding article or promoting the copy as a selling point.

| File | Category | Claim | Action Needed |
|------|----------|-------|---------------|
| CategoryIntro.tsx | Candle Waxes & Additives | "natural/eco claims about soy wax" | Confirm with supplier COA that soy wax is hydrogenated soybean oil; avoid "natural" or "eco" until confirmed |
| CategoryIntro.tsx | Artisan Soap Bases | "specific skin feel claims about oils" | Well-documented in cosmetic literature; confirm with supplier's product spec before marketing |
| CategoryIntro.tsx | Skincare & Body Bases | "preservative system claims" | Confirm with supplier TDS what preservative system is used in each specific base SKU |
| CategoryIntro.tsx | Body & Facial Scrubs | "skin sensitivity / particle size guidance" | Widely documented; consult a formulator before making clinical or sensitivity claims in marketing |
| CategoryIntro.tsx | Haircare & Wash Bases | "SLS dryness claims" | Well-established in cosmetic literature; confirm with supplier and do not make clinical claims without formulator sign-off |
| CategoryIntro.tsx | Raw Butters & Carrier Oils | "comedogenic rating" | Do not publish exact comedogenic scores without citing a peer-reviewed reference; scores vary by source |
| CategoryIntro.tsx | Cosmetic Preservatives | "preservative efficacy claims" | Confirmed by regulatory literature; always verify with your specific formulator and conduct a challenge test |
| CategoryIntro.tsx | Skin Safe Fragrances | "IFRA compliance" | Confirm each specific fragrance purchased has IFRA documentation **before** making IFRA compliance claims in product marketing |
| CategoryIntro.tsx | Essential Oils | "GC/MS availability from platform suppliers" | Confirm GC/MS data is actually available from suppliers listed on Ekora Bazaar before marketing this as a platform benefit |
| CategoryIntro.tsx | Food-Grade Flavor Oils | "usage rate ranges (0.5–2%)" | Widely documented in flavour industry; confirm with each supplier's TDS for specific SKUs |
| CategoryIntro.tsx | Hydrosols & Floral Waters | "preservation requirements" | Well-established; confirm with a cosmetic formulator for any specific product claims |
| CategoryIntro.tsx | Culinary & Fondant Moulds | "temperature tolerance of silicone" | Confirm with supplier spec sheet for each mould SKU; do not make blanket temperature claims |

## Process
1. Assign the above items to a qualified person (formulator, regulatory consultant, or supplier contact).
2. Once verified, remove the `[VERIFY]` comment from the code or replace with confirmed, sourced copy.
3. Delete the row from this table once actioned.
