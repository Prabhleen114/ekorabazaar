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
| mica-pigment-guide.md | Micas & Pigments | "ultramarine stability in high-pH soap" | Confirm supplier stability chart for specific violet and blue ultramarines before formulating cold process soap |
| candle-jar-selection.md | Candle Jars & Containers | "ASTM F2179 thermal shock standards" | Verify specific ASTM F2179 thermal shock certification with container manufacturers |
| silicone-mould-types.md | Candle & Pillar Moulds | "ASTM D412 tensile & tear benchmarks" | Verify tensile and tear resistance specifications with silicone elastomer technical datasheets |
| soap-mould-guide.md | Soap & Bar Moulds | "loaf insulation thermal coefficients" | Verify thermal retention data between birch and pine loaf boxes |
| essential-oils-in-candles.md | Essential Oils | "terpene retention times in soy wax" | Verify gas chromatography retention data for citrus monoterpenes in hydrogenated soy wax |
| carrier-oils-for-skincare.md | Raw Butters & Carrier Oils | "rosehip fatty acid GC profile" | Check supplier lot COA for exact linoleic and linolenic acid ratios |
| skin-safe-fragrances-soap.md | Skin Safe Fragrances | "IFRA 51st Amendment categories" | Verify latest IFRA 51st Amendment quantitative limits against specific fragrance oil certificates |
| botanicals-in-soap.md | Dried Botanicals & Additives | "water activity thresholds" | Confirm microbial water activity threshold (Aw < 0.60) for dried surface botanicals |
| resin-art-mould-selection.md | Eco-Resin & Stone Moulds | "deep-pour epoxy peak exotherm" | Verify manufacturer maximum single-pour depth guidelines for specific epoxy systems |
| cosmetic-preservatives-guide.md | Cosmetic Preservatives | "USP 51 challenge test parameters" | Verify USP 51 / ISO 11930 antimicrobial efficacy protocol with accredited lab |
| skincare-base-formulation.md | Skincare & Body Bases | "additive load thresholds" | Confirm maximum additive capacity (3-5%) with base manufacturer TDS |
| epoxy-resin-ratio-guide.md | Eco-Resin & Stone Moulds | "Shore D hardness & exotherm temperatures" | Confirm Shore D hardness ratings (78–82D) and exotherm temperature curves with resin manufacturer TDS |
| fixing-candle-frosting-wet-spots-sinkholes.md | Candle Waxes & Additives | "Polymorphic beta-prime crystallization" | Confirm cooling kinetics and pour temperature windows (50–55°C) with soy wax manufacturer TDS |
| what-ifra-certified-means.md | Fragrance Oils | "IFRA 51st Amendment category limits" | Verify latest IFRA 51st Amendment Certificate and QRA2 concentration thresholds with fragrance houses |
| pricing-handmade-candles-and-soaps.md | Platform Guides | "GST thresholds (₹40L/₹20L) & composition rates" | Verify latest CBIC notifications regarding state GST turnover thresholds and e-commerce mandatory GST registration rules |
| starting-candle-business-in-india.md | Platform Guides | "BIS 4363 wax specifications & Fire NOC requirements" | Verify local municipality fire safety thresholds and current BIS standards for paraffin/soy candle formulations |
| storing-wax-resin-and-oils.md | Fragrance Oils / Wax | "Flash point storage classifications" | Verify petroleum/solvent safety act flash point categories (<60°C vs >93°C) with local fire safety officer |
| soap-colorants-natural-vs-synthetic.md | Micas & Pigments | "BIS IS 4707 cosmetic colorant CI compliance" | Verify colour index numbers match Schedule Q of Drugs and Cosmetics Rules for skin-contact rinse-off products |
| making-perfume-at-home.md | Fragrance Oils | "State excise denatured ethanol licensing" | Verify state-specific excise department license requirements for procuring and compounding with 96% denatured ethanol |

## Process
1. Assign the above items to a qualified person (formulator, regulatory consultant, or supplier contact).
2. Once verified, remove the `[VERIFY]` comment from the code or replace with confirmed, sourced copy.
3. Delete the row from this table once actioned.

