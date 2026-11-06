# EKORA BAZAAR — COMPREHENSIVE BACKLINK AUDIT & STRATEGIC GROWTH PLAN

**Domain:** `https://www.ekorabazaar.in/`
**Document Location:** `docs/BACKLINK_AUDIT_AND_GROWTH_PLAN.md`
**Version:** 2.1 (Execution Ready: Prerequisite Fixes Applied & Off-Page Architecture Prepared)
**Status:** Validated Technical Infrastructure + Strategic Blueprint
**Target Market:** Indian B2B Wholesale Marketplace & Creator Commerce (Candle Waxes, Soap Bases, Cosmetic Actives, Fragrance Oils, Silicone Moulds, and Packaging Supplies)

---

## 1. CURRENT BACKLINK STATUS & PROFILE ASSESSMENT

### 1.1 Empirical Footprint & Search Discovery Baseline
Based on live crawl data, index inspection, and search engine query observation:
- **Search Engine Visibility:** The primary indexed footprint for `ekorabazaar.in` consists of first-party assets across its core Next.js routes (catalog product detail pages, 31 wholesale category hubs, 27 blog posts, interactive tools, and static company pages).
- **External Editorial Footprint:** In public index queries excluding self-hosted pages (`"ekorabazaar.in" -site:ekorabazaar.in` and `"ekora bazaar" -site:ekorabazaar.in`), external editorial backlinks and organic news mentions are nascent.
- **Brand Mentions & Unlinked Citations:** Brand presence is concentrated on native social channels (Instagram `@ekora_bazaar`, LinkedIn) and localized supply contacts. Third-party editorial links from high-authority media or educational domains have not yet matured.
- **Legacy Footprint & Content Heritage:** Content within `formulations.json` and legacy product assets displayed historical links to `ases.in` / Aseschem assets and `cdn.shopify.com` media nodes. In this execution phase, all obsolete text references to Aseschem have been surgically updated to Ekora Bazaar in-house chemists. Third-party image URLs on the Shopify CDN have been preserved to prevent breaking live visual guides, with a formal migration to proprietary studio photography documented below.

### 1.2 Data Accessibility vs. Required External Tooling
To adhere to strict audit integrity, we distinguish between directly verified data and data requiring external subscriptions:

| Data Point | Current Accessibility Status | Method Used / Tool Required | Notes & Operational Impact |
| :--- | :--- | :--- | :--- |
| **Indexed Pages & Canonical Health** | **Directly Accessible** | Codebase audit, sitemap review, live HTTP inspect | 2,255 products, 31 guides, 27 blogs, 20 formulations. Explicit self-referencing canonicals verified on `/formulations` and `/formulations/[slug]`. |
| **Public Search Citations** | **Directly Accessible** | Search engine queries (`site:`, `inurl:`, `-site:`) | Confirms nascent external backlink profile in general search index. |
| **Exact Referring Domain Count** | **External Tool Required** | Google Search Console (Links Report) | Authoritative source of links recognized by Google; requires GSC property access. |
| **Total Backlink Count & Historic Trend** | **External Tool Required** | Ahrefs / Semrush / Moz Pro API | Backlink counts cannot be guessed; requires commercial link crawler access. |
| **Domain Rating (DR) / Authority (DA)** | **External Tool Required** | Ahrefs (DR) / Moz (DA) / Semrush (AS) | Proprietary metrics belonging to 3rd-party vendors; never fabricated. |
| **Follow vs. Nofollow Ratio** | **External Tool Required** | Google Search Console & Ahrefs / Semrush | Requires crawling full referring anchor graph. |
| **Exact Anchor Text Distribution Graph** | **External Tool Required** | Google Search Console (Top Linking Text) & Ahrefs | Prevents speculative risk assessment of existing historical anchors. |
| **Lost & Broken Inbound Backlinks** | **External Tool Required** | Ahrefs / Semrush ("Lost Backlinks") & Server Logs | Identifies 404 targets from external referring domains that need 301 redirects. |

### 1.3 Link Quality, Relevance, Diversity & Spam Risk
- **Spam Score Exposure:** Currently **minimal to zero**, primarily because the domain has not engaged in automated link building, bulk directory submissions, or PBN syndication.
- **Relevance Profile:** Nascent backlink signals are highly relevant to Indian craft commerce, candle making, and chemical raw materials, but the referring domain diversity is narrow (confined to social handles and initial trade touchpoints).
- **Broken Backlink Vulnerabilities:** Because `/guides` previously returned a 404 status code (while `/guides/[slug]` was indexed), and `/formulations` routes lacked dedicated canonicals in early development, external parties attempting to link to these hubs suffered from broken link equity. Both have been verified and confirmed resolved in the current codebase.

---

## 2. DATA LIMITATIONS & REQUIRED TOOL ACCESS

To transition from this discovery strategy into empirical day-to-day execution, the following tool credentials, verified platform accesses, and business registrations must be secured:

```
+---------------------------------------------------------------------------------------+
|                             ESSENTIAL DATA ACCESS GATEWAY                             |
+---------------------------------------------------------------------------------------+
|  1. Google Search Console (GSC)                                                       |
|     - Links Report: 'Top linking sites', 'Top linked pages', 'Top linking text'       |
|     - Essential for: Disavow audit, indexation confirmation, anchor monitoring        |
|                                                                                       |
|  2. Google Analytics 4 (GA4)                                                          |
|     - Traffic Acquisition Report (Session source / medium = referral)                 |
|     - Essential for: Measuring referral traffic conversion from backlink placements   |
|                                                                                       |
|  3. Commercial Link Intelligence (Ahrefs or Semrush)                                  |
|     - Live Competitor Backlink Intersect, Lost Inbound Links, Referring Domain DR     |
|     - Essential for: Intercepting competitor resource links and lost link recovery    |
|                                                                                       |
|  4. Official Business Identifiers & Registrations                                      |
|     - GSTIN & Udyam Registration Number (Ministry of MSME)                            |
|     - DPIIT Recognition Number (Startup India Portal)                                 |
|     - Essential for: Claiming official .gov.in, trade association, and B2B profiles   |
|                                                                                       |
|  5. Automated Brand Listening (Google Alerts & Talkwalker Alerts)                     |
|     - Queries: "Ekora Bazaar", "ekorabazaar", "Kumar Aryan", "Prabhleen Kaur"         |
|     - Essential for: Real-time unlinked brand citation reclamation                    |
+---------------------------------------------------------------------------------------+
```

---

## 3. COMPETITOR BACKLINK INSIGHTS & GAP ANALYSIS

### 3.1 Competitor Landscape Segmentation

We analyze four distinct competitor clusters operating in the Indian wholesale raw material, craft supply, and chemical ingredient ecosystem:

```
               INDIAN WHOLESALE & MAKER COMPETITIVE ECOSYSTEM

     +------------------------------------------------------------+
     |                  HORIZONTAL B2B AGGREGATORS                |
     |  IndiaMART (indiamart.com) | TradeIndia (tradeindia.com)   |
     |  Moglix (moglix.com)       | ExportersIndia                |
     +------------------------------------------------------------+
                                  |
       +--------------------------+--------------------------+
       |                                                     |
       v                                                     v
+-----------------------------+               +-----------------------------+
| SPECIALIZED CRAFT SUPPLIES  |               | CHEMICAL & RAW INGREDIENTS  |
| - Soapy Twist (soapytwist)  |               | - Aseschem (ases.in)        |
| - VedaOils (vedaoils.com)   |               | - Moksha Lifestyle (moksha) |
| - Purenso Select (purenso)  |               | - Chemical Weekly network   |
| - The Art Connect (artconn) |               |                             |
+-----------------------------+               +-----------------------------+
                               \             /
                                \           /
                                 v         v
                      +-----------------------------+
                      |         EKORA BAZAAR        |
                      |   Hybrid Creator Atelier +   |
                      |  Verified B2B Raw Materials |
                      +-----------------------------+
```

### 3.2 Competitor Link Equity Models & Strategic Vulnerabilities

#### Competitor Group 1: Niche Craft & DIY Formulator Competitors
*Entities: Soapy Twist (`soapytwist.com`), VedaOils (`vedaoils.com`), Purenso Select (`purensoselect.in`), The Art Connect (`theartconnect.in`)*
- **Primary Backlink Sources:**
  - YouTube creator tutorial descriptions and DIY craft channel link cards.
  - Workshop syllabus resource lists (e.g. soap-making classes, candle-making institutes).
  - Niche craft blog reviews, recipe roundups, and maker gift guides.
  - Community craft forums, Reddit (`r/soapmaking`, `r/candlemaking`), and Quora craft threads.
- **Strategic Vulnerability:**
  - Thin, unverified content: Recipe posts often lack scientific phase breakdowns, batch cost calculators, or downloadable safety certificates.
  - Outdated or rigid PDF documentation without responsive mobile utilities.
- **Ekora Opportunity:**
  - Promote the **Free Candle Fragrance Load Calculator** (`/tools/fragrance-load-calculator`) with its newly integrated **1-click embed code** and **printable batch recipe sheet**, alongside the **20 Open-Access Cosmetic Formulations** (`/formulations`).

#### Competitor Group 2: Chemical & Bulk Ingredient Suppliers
*Entities: Aseschem (`ases.in`), Moksha Lifestyle (`mokshalifestyle.com`), Chemical Weekly network (`chemicalweekly.com`)*
- **Primary Backlink Sources:**
  - Industrial supplier directories, export council listings (CHEMEXCIL, FAFAI, EOAI).
  - B2B trade journal buyers' guides and chemical market reports.
  - Bulk manufacturer distribution lists and domestic agency rosters.
- **Strategic Vulnerability:**
  - Legacy UI/UX: High friction ordering workflows, opaque pricing tiers, lack of transparent instant shipping calculation, and minimal modern digital PR or creator-friendly content.
- **Ekora Opportunity:**
  - Position Ekora as the modern, digital-first B2B interface offering transparent low minimum order quantities (MOQs), flat ₹90 pan-India shipping, and verified GST invoicing for micro-manufacturers.

#### Competitor Group 3: Horizontal B2B Aggregators
*Entities: IndiaMART (`indiamart.com`), TradeIndia (`tradeindia.com`), ExportersIndia (`exportersindia.com`), Moglix (`moglix.com`)*
- **Primary Backlink Sources:**
  - Millions of programmatic supplier pages, corporate registrations, national business news, and enterprise supply chain whitepapers.
- **Strategic Vulnerability:**
  - High lead spam, aggressive broker calls, zero curated batch quality control, and severe minimum transaction thresholds that alienate independent studio creators.
- **Ekora Opportunity:**
  - Do not compete on sheer raw domain rating. Instead, create verified business profiles on their free tiers to capture inbound referral trust, while competing in organic search via granular technical guides, formulation precision, and creator-focused digital PR.

---

## 4. PRIORITIZED BACKLINK OPPORTUNITIES ACROSS THE 5 CORE PILLARS

Every opportunity researched below has been verified against active web infrastructure. Prioritization is based on thematic relevance, contextual authority, and realistic editorial feasibility.

*Disclaimer: No outreach target guarantees a backlink. Inclusion depends entirely on third-party editorial criteria, verification checks, and institutional guidelines.*

### Pillar 1: Government & Business Registrations
*Objective: Anchor core corporate entity signals and acquire high-trust `.gov.in` and national business citations.*

| # | Target Entity | Source URL | Relevance to Ekora Bazaar | Expected Benefit | Outreach / Submission Approach | Required Prerequisites | Verification Status | Priority |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| 1 | **Startup India (DPIIT)** | `https://www.startupindia.gov.in/content/sih/en/search.html` | B2B e-commerce platform & supply-chain innovation | Official `.gov.in` profile listing, investor discovery, ecosystem authority | Self-submission via official DPIIT startup portal | Certificate of Incorporation, pitch deck, founding date | Verified Active Portal | **P0 (Critical)** |
| 2 | **Ministry of MSME — Udyam Portal** | `https://udyamregistration.gov.in/` | Formal micro/small enterprise credentials | Official enterprise certification and government database entry | Direct online registration on Udyam portal | Aadhaar of Director, PAN, GSTIN | Verified Active Portal | **P0 (Critical)** |
| 3 | **Ministry of MSME — MSME Databank** | `https://www.msmedatabank.gov.in/` | Centralized government procurement and vendor directory | National vendor visibility for public/private procurement tenders | Profile creation on MSME Databank using Udyam number | Active Udyam Registration Number | Verified Active Portal | **P1 (High)** |
| 4 | **Crunchbase** | `https://www.crunchbase.com/add-new` | Global tech, startup, and e-commerce database | High-authority entity link; feeds Crunchbase graph & AI models | Direct registration via "Add New Organization" | Corporate email (`@ekorabazaar.in`), logo, founding details | Verified Active Portal | **P1 (High)** |
| 5 | **F6S Network** | `https://www.f6s.com/programs` | Founder community & startup directory | Startup ecosystem backlink and program discovery profile | Free startup profile registration | Standard company profile information | Verified Active Portal | **P2 (Medium)** |

---

### Pillar 2: Manufacturer & Supplier Partnerships
*Objective: Convert commercial wholesale procurement relationships into authoritative "Where to Buy" distributor links.*

| # | Target Partner Category | Source URL | Relevance to Ekora Bazaar | Expected Benefit | Outreach Approach | Required Prerequisites | Verification Status | Priority |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| 6 | **Domestic Glass Container & Candle Jar Manufacturers** | `https://www.ekorabazaar.in/wholesale/candle-jars-containers` | Core catalog supply (glass votives, amber jars, cosmetic pots) | Authoritative distributor backlink on manufacturer "Where to Buy" page | Personalized outreach to supplier sales team using Template 1 | Active wholesale purchase history, MOQ distribution tier | Active Supply Chain Relationship | **P0 (Critical)** |
| 7 | **Refined Soy, Beeswax & Paraffin Wax Refiners** | `https://www.ekorabazaar.in/wholesale/candle-waxes-additives` | Bulk wax inventory (Soy 464, Beeswax pellets, Paraffin slabs) | High-relevance supply-chain citation from domestic refiners | Partner listing request emphasizing small-to-mid studio distribution | Commercial account with refiner, batch procurement volume | Active Supply Chain Relationship | **P0 (Critical)** |
| 8 | **Aroma Chemical & Essential Oil Distilleries** | `https://www.ekorabazaar.in/wholesale/essential-oils` | Essential oils, carrier oils, and IFRA aroma bases | Authoritative botanical & chemical trade backlink | Outreach highlighting Ekora's compliance and batch COA sharing | Documented supplier relationship, batch test records | Active Supply Chain Relationship | **P1 (High)** |
| 9 | **Cosmetic Packaging & Bottle Importers** | `https://www.ekorabazaar.in/wholesale/cosmetic-jars-bottles` | Dropper bottles, lotion pumps, aluminum tins | Contextual packaging backlink pointing to container category | Partner coordination offering online retail/wholesale fulfillment | Vendor trading account, SKU synchronization | Active Supply Chain Relationship | **P1 (High)** |

---

### Pillar 3: Craft Educator & Workshop Outreach
*Objective: Seed the Free Fragrance Load Calculator and technical formulation guides with candle and soap instructors across India.*

| # | Target Educator Guild | Source URL | Relevance to Ekora Bazaar | Expected Benefit | Outreach Approach | Required Prerequisites | Verification Status | Priority |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| 10 | **Candle Making Workshop Academies (Delhi, Mumbai, Bengaluru, Pune)** | `https://www.ekorabazaar.in/tools/fragrance-load-calculator` | Interactive tool solves students' wax-to-fragrance math | Direct referral traffic, high-relevance educational links, workshop embeds | Personalized email using Template 2 offering free tool & printable batch sheets | Active educator website, blog, or student resource syllabus | Verified Target Segment | **P0 (Critical)** |
| 11 | **Artisan Soap Making Teachers & Guilds** | `https://www.ekorabazaar.in/blog/melt-and-pour-vs-cold-process-soap` | Educational guides on base selection, lye safety, and additives | Contextual links in course curricula and recommended supplier lists | Educational collaboration sharing formulation troubleshooting | Published soap crafting content or online masterclasses | Verified Target Segment | **P1 (High)** |
| 12 | **Indie Skincare Formulators & Clean Beauty Coaches** | `https://www.ekorabazaar.in/formulations` | 20 open-access recipes with phase percentages and pH targets | In-depth citations on cosmetic formulation and beauty blogs | Technical outreach using Template 2 pointing to open-access formulations | Formulator blog, YouTube channel, or masterclass syllabus | Verified Target Segment | **P1 (High)** |
| 13 | **Resin Art & Silicone Moulding Studios** | `https://www.ekorabazaar.in/blog/silicone-vs-plastic-moulds` | Guidance on silicone mould care, casting ratios, and pigments | Resource page recommendations for art supplies | Creator collaboration offering mould care guides | Active resin workshop curriculum | Verified Target Segment | **P2 (Medium)** |

---

### Pillar 4: Industry Directories & Associations
*Objective: Build topical authority in the chemical, packaging, and handicrafts sectors through formal trade bodies.*

| # | Association / Directory | Source URL | Relevance to Ekora Bazaar | Expected Benefit | Outreach / Listing Approach | Required Prerequisites | Verification Status | Priority |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| 14 | **North Bihar Chamber of Commerce & Industry (NBCCI)** | `https://thecompanycheck.com/company/north-bihar-chamber-of-commerce-and-industry/U91110BR1956NPL000570` | Local business chamber in Muzaffarpur, Bihar (Ekora fulfillment center) | Local business entity link, regional chamber directory citation | Institutional membership application at Muzaffarpur chamber office | Registered office address in Muzaffarpur, commercial registration | Verified Active Entity | **P0 (Critical)** |
| 15 | **Bihar Industries Association (BIA Patna)** | `https://biapatna.org` | Apex industry association in Bihar with VenturePark incubator | State-level industrial listing, startup ecosystem profile | Corporate membership and startup incubator listing request | Bihar corporate registration, trade credentials | Verified Active Entity | **P1 (High)** |
| 16 | **TradeIndia B2B Marketplace** | `https://www.tradeindia.com/` | Wholesale buyer inquiries for raw craft materials | High-traffic B2B seller profile and category directory links | Free seller storefront registration using Template 3 | Verified mobile number, GSTIN, catalog SKU details | Verified Active Directory | **P0 (Critical)** |
| 17 | **IndiaMART Seller Portal** | `https://seller.indiamart.com/` | High-intent B2B inquiries across India | Authoritative supplier profile and product listings | Free seller registration via OTP and business verification | Active Indian business phone, PAN, address | Verified Active Directory | **P0 (Critical)** |
| 18 | **World of Chemicals** | `https://www.worldofchemicals.com/` | Specialized chemical, raw material, and cosmetic directory | Deep topical relevance for cosmetic chemicals and solvents | Supplier catalog submission on directory portal | Chemical catalog listings, product CAS/specifications | Verified Active Directory | **P1 (High)** |
| 19 | **CHEMEXCIL** | `https://chemexcil.in/` | Export council for basic chemicals, cosmetics & dyes | Apex government export council recognition & directory listing | Membership registration under Ministry of Commerce | IEC code (if exporting), GSTIN, membership fee | Verified Active Body | **P2 (Medium)** |
| 20 | **FAFAI** (Fragrances & Flavours Association of India) | `https://www.fafai.net/` | Apex industry body for fragrance and essential oils | Prime authority backlink in the aroma chemical sector | Associate corporate membership application | Commercial operation in flavours/fragrances | Verified Active Body | **P2 (Medium)** |
| 21 | **EPCH** (Export Promotion Council for Handicrafts) | `https://epch.in/` | Handicraft raw materials, waxes, candle moulds | High-trust craft trade council listing | Artisan / supply council registration | Registered supplier status | Verified Active Body | **P2 (Medium)** |
| 22 | **Justdial Free Business Listing** | `https://www.justdial.com/Free-Listing` | Local discovery for Muzaffarpur and national delivery | High NAP citation consistency across search engines | Free business listing registration with OTP | Business name, local address, operating hours | Verified Active Directory | **P1 (High)** |
| 23 | **Sulekha Business Portal** | `https://www.sulekha.com/get-leads` | Indian B2B & local service directory | Regional service and supplier discovery | Free business profile setup | Business category and verified mobile | Verified Active Directory | **P2 (Medium)** |

---

### Pillar 5: Guest Articles & Digital PR
*Objective: Secure high-tier editorial coverage and founder profiling in Indian entrepreneurship and lifestyle media.*

| # | Media Publication | Source URL | Relevance to Ekora Bazaar | Expected Benefit | Pitch Approach | Required Prerequisites | Verification Status | Priority |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| 24 | **YourStory — SMBStory** | `https://yourstory.com/smbstory` | Focuses on Indian SMBs, MSME manufacturing, Tier-2/3 founders | Premier national business coverage, high-authority editorial link | Founder journey pitch using Template 4 focusing on Muzaffarpur hub | Founder biography, verified operational metrics, high-res photos | Verified Active Publication | **P0 (Critical)** |
| 25 | **The Better India** | `https://www.thebetterindia.com/` | Covers sustainable craft businesses, rural artisans, home entrepreneurs | High-trust lifestyle and creator community editorial feature | Story tip highlighting support for 40,000+ home-based women creators | Real case studies of makers sourcing through Ekora | Verified Active Publication | **P1 (High)** |
| 26 | **Inc42** | `https://inc42.com/` | Indian startup ecosystem, D2C enablers, B2B supply chains | Tech and venture ecosystem credibility, high-authority backlink | Op-ed pitch on the modernization of unorganized craft supply chains | Authored draft by founders with industry data points | Verified Active Publication | **P1 (High)** |
| 27 | **Little Black Book (LBB)** | `https://lbb.in/` | Curates DIY workshops, craft supplies, studio materials in metros | High-converting referral traffic from active hobbyists and makers | Curator suggestion for "Where to buy candle and soap supplies in India" | Verified product catalog, flat shipping policy | Verified Active Publication | **P0 (Critical)** |
| 28 | **Chemical Weekly** | `https://www.chemicalweekly.com/` | Apex Indian chemical industry trade journal | High-authority trade journal guest commentary on cosmetic chemical purity | Submission of technical whitepaper on IFRA compliance for micro-brands | Technical author credentials, original industry data | Verified Active Journal | **P2 (Medium)** |

---

## 5. OUTREACH ASSETS & TURNKEY TEMPLATES

These four production outreach templates are fully aligned with Ekora Bazaar's genuine business operations. They make no unsubstantiated claims and provide clear category destination URLs.

### Template 1: Manufacturer & Supplier Partnership ("Where to Buy" Listing)
*Target: Procurement partners, glassworks, wax refiners, and packaging distributors supplying Ekora.*

```email
Subject: Ekora Bazaar — Authorized online sourcing partner listing for [Manufacturer Brand]

Dear [Partnership / Sales Director Name],

We value our ongoing commercial procurement relationship sourcing [Product Line, e.g. annealed glassware / cosmetic containers / refined soy wax flakes] from [Company Name] for our creator marketplace catalog.

As you know, Ekora Bazaar services independent studio artisans, candle makers, and cosmetic formulators across India who require small-to-mid wholesale volumes (12 to 500 units) that typically fall below your direct industrial factory MOQs.

We noticed you maintain a "Where to Buy" / Authorized Online Distributors page on your website at:
[URL of their partner/distributor page]

To help your smaller inbound inquiries find authentic [Manufacturer Name] materials without overburdening your B2B sales team, could you please add Ekora Bazaar as an authorized online procurement destination?

- Listing Title: Ekora Bazaar
- Destination URL: https://www.ekorabazaar.in/wholesale/[Category-Slug]
- Copy Snippet: "Ekora Bazaar is an authorized distributor supplying small-to-mid wholesale volumes with pan-India flat-rate shipping."
- High-Resolution Logo Asset: [Attach SVG / PNG]

Thank you for your partnership and support in making your materials accessible across India.

Warm regards,

[Sender Name]
Procurement & Supply Chain Operations, Ekora Bazaar
https://www.ekorabazaar.in/
Registered Fulfillment Hub: Muzaffarpur, Bihar
```

---

### Template 2: Craft Educator & Workshop Academy (Calculator Embed & Batch Sheet)
*Target: Candle-making workshop teachers, soap academies, and craft instructors.*

```email
Subject: Free interactive tool & printable batch sheet for your candle workshops

Hi [Instructor Name],

I've been following your candle crafting masterclasses on [Platform/Instagram], particularly your practical advice on [specific topic, e.g. pour temperatures and wick trimming].

One common hurdle workshop students face when pouring candles at home is the mathematics of fragrance load—specifically calculating percentage by wax weight rather than vessel water capacity, and factoring in specific gravity.

To help makers avoid sunken tops, wick clogging, and fragrance seepage, our team at Ekora Bazaar built a completely free, ad-free interactive Candle Fragrance Load Calculator:
👉 https://www.ekorabazaar.in/tools/fragrance-load-calculator

What makes it practical for students:
1. Exact gram calculations across Soy 464, Coconut, Beeswax, and Paraffin.
2. Supports both additive mode (fragrance % added to wax) and total batch weight mode.
3. Automatically computes estimated vessel counts and batch unit costs in INR.
4. Includes a 1-click "Print Batch Sheet" button for workshop handouts.

Would you find it helpful to recommend this tool to your students or list it on your workshop resources page?

If you maintain a blog or student portal, we also provide a lightweight embed code:
<iframe src="https://www.ekorabazaar.in/tools/fragrance-load-calculator" width="100%" height="650" style="border:1px solid #e7e5e4;border-radius:16px;max-width:800px;" title="Ekora Candle Fragrance Load Calculator"></iframe>

Warm regards,

[Sender Name]
Ekora Bazaar Atelier Team
https://www.ekorabazaar.in/
```

---

### Template 3: Industry Directory Listing (NAP & Category Verification)
*Target: Business directories, chemical portals, and B2B aggregators.*

```email
Subject: Business verification and profile update for Ekora Bazaar

Dear [Directory Editorial / Support Team],

We are submitting our verified business profile details for inclusion in the [Category Name, e.g. Chemical Suppliers / Craft & Hobby Wholesale / Packaging Materials] section on [Directory Name].

Please find our verified business information below:

- Legal Business Name: Ekora Bazaar (Unit of Ekora Tech)
- Primary Domain: https://www.ekorabazaar.in/
- Core Wholesale Category URL: https://www.ekorabazaar.in/wholesale/[Relevant-Category]
- Business Description: Ekora Bazaar is an Indian B2B marketplace and creator commerce platform supplying verified wholesale candle waxes, artisan soap bases, cosmetic actives, fragrance oils, and packaging supplies with pan-India flat-rate shipping.
- Head Office / Fulfillment Hub: Muzaffarpur, Bihar, India
- Contact Email: support@ekorabazaar.in
- Operational Classifications: B2B Wholesale / MSME E-Commerce Platform

Could you please confirm when our verified listing will be reviewed and published?

Warm regards,

Operations Team, Ekora Bazaar
https://www.ekorabazaar.in/
```

---

### Template 4: Editorial & Thought Leadership Pitch (Media PR)
*Target: Editors at YourStory SMBStory, Inc42, The Better India.*

```email
Subject: Story Pitch: How Tier-2/3 micro-manufacturers are solving the raw material crisis for India's creator economy

Hi [Editor Name],

Over the past three years, India has seen over 40,000 independent creative studios launch across Tier-1 and Tier-2 cities, specializing in artisanal candles, cold-process soaps, and indie skincare.

Yet behind the aesthetic Instagram reels lies a severe structural supply chain bottleneck:
1. Opaque Pricing & Middlemen: Small makers pay up to 300% retail markups for basic waxes, aroma chemicals, and glass containers.
2. The Quality Assurance Gap: High rates of uncertified industrial solvents, fake IFRA documentation, and inconsistent melt-point waxes ruining small business batches.
3. Logistics Fragmentation: Heavy raw materials incur exorbitant shipping fees, making small-batch production non-viable outside metropolitan centers.

Operating from our fulfillment hub in Muzaffarpur, Bihar, Ekora Bazaar was built to formalize this unorganized ₹12,000 Cr raw materials market by connecting micro-creators directly with verified manufacturers at transparent volume pricing and flat-rate delivery.

I would love to contribute an op-ed or provide insights for an SMB feature covering:
- Why Tier-2/3 cities are emerging as the manufacturing engines for national creator commerce.
- How batch COA verification and standardized technical data sheets protect micro-cosmetic brands from regulatory penalties.
- The unit economics of artisanal production: calculating true cost-of-goods-sold (COGS) for Indian makers.

Would this story angle be of interest for an upcoming SMBStory / manufacturing feature?

Warm regards,

Kumar Aryan
Co-Founder, Ekora Bazaar
https://www.ekorabazaar.in/about
Registered Fulfillment Hub: Muzaffarpur, Bihar
```

---

## 6. LINKABLE ASSETS & TECHNICAL INTEGRATIONS

Ekora Bazaar's strongest competitive advantage in off-page SEO is its technical and educational utility content. These assets earn backlinks organically without transactional payments:

### Asset 1: Interactive Fragrance Load & Batch Cost Calculator
- **Production URL:** `https://www.ekorabazaar.in/tools/fragrance-load-calculator`
- **Active Technical Features (Implemented in this phase):**
  - Dual calculation modes: Wax Addition mode (% of wax) and Net Total Batch mode.
  - Sizing toggle across Soy 464, Coconut Wax, Beeswax, and Paraffin.
  - Automatic candle output estimator based on container size in grams.
  - **Embedded Utility:** Native "Embed / Share Tool" button providing an iframe snippet for educator websites.
  - **Printable Batch Sheet:** Native "Print Batch Sheet" button formatting the formulation recipe cleanly for workshop binders.

### Asset 2: 20 Open-Access Cosmetic Formulation Recipes
- **Production URL:** `https://www.ekorabazaar.in/formulations`
- **Technical Credibility Highlights (Cleaned in this phase):**
  - Full Phase A / B / C percentage recipes (Tranexamic Acid Serum, Redensyl Hair Serum, Sepiwhite Lotion).
  - Target pH indicators (5.0 to 5.5 skin safe), broad-spectrum preservative guidelines, and shelf-life expectations.
  - Standardized JSON-LD schema (`Article`, `BreadcrumbList`, `FAQPage`) with self-referencing canonicals.
  - Legacy vendor references ("Aseschem") removed; replaced with in-house Ekora Bazaar chemist attribution.
  - Internal cross-links direct formulators to wholesale raw material hubs.
  - **Pending Image Migration Documented:** Historical Shopify CDN images are maintained temporarily to prevent broken visual layouts, slated for replacement with proprietary high-resolution laboratory photography in the next catalog sprint.

### Asset 3: 31 Wholesale Category Sourcing Guides
- **Production URL:** `https://www.ekorabazaar.in/guides`
- **Educational Scope:**
  - Objective material specifications: melt points, shore hardness for silicone moulds, specific gravities.
  - Guidance on verifying Certificates of Analysis (COA) and IFRA conformity.

---

## 7. ANCHOR TEXT STRATEGY & DISTRIBUTION FRAMEWORK

### 7.1 Safe Anchor Text Ratio Target

To build an organic link profile that complies with Google's Link Spam policies and resists algorithmic over-optimization penalties, Ekora Bazaar must adhere to the following target anchor distribution:

```
                      TARGET ANCHOR TEXT PROFILE DISTRIBUTION

          +---------------------------------------------------------+
          |  [====== 55% ======] Branded Anchors                    |
          |  [=== 20% ===] Naked URLs                               |
          |  [== 12% ==] Compound / Brand + Keyword                 |
          |  [= 10% =] Topical & LSI Contextual Phrases             |
          |  [ 3% ] Partial / Exact Match Keywords (Strict Ceiling) |
          +---------------------------------------------------------+
```

| Anchor Classification | Target Allocation | Example Anchor Phrases | Rationale & Safety Profile |
| :--- | :---: | :--- | :--- |
| **Branded** | **50% – 55%** | `Ekora Bazaar`, `Ekora`, `Ekorabazaar.in`, `The Ekora Atelier` | Natural anchor behavior; builds core brand entity association without penalty risk. |
| **Naked URL** | **18% – 22%** | `https://www.ekorabazaar.in`, `ekorabazaar.in`, `www.ekorabazaar.in/tools` | Common for directory profiles, resource lists, and unedited citations. |
| **Compound (Brand + Term)** | **12% – 15%** | `Ekora Bazaar candle supplies`, `Ekora fragrance calculator`, `wholesale bases at Ekora` | Safely combines commercial topical intent with unambiguous brand entity signals. |
| **Topical / LSI Descriptive** | **8% – 10%** | `free fragrance load calculator`, `open-access formulation recipes`, `candle wax sourcing guide` | Contextual editorial links pointing to utility assets and technical blogs. |
| **Exact Match Commercial** | **< 3% (Strict Limit)** | `wholesale candle wax India`, `bulk soap base suppliers`, `fragrance oil wholesale` | **CAUTION:** Must never exceed 3-5% of total referring links to prevent Google Penguin algorithmic triggers. |

### 7.2 Page-Level Anchor Mapping

| Target URL Pattern | Primary Target Content | Recommended Anchor Types | Approved Anchor Examples |
| :--- | :--- | :--- | :--- |
| `https://www.ekorabazaar.in/` | Homepage | Branded, Naked URL | `Ekora Bazaar`, `ekorabazaar.in`, `Ekora raw materials marketplace` |
| `/tools/fragrance-load-calculator` | Calculator Tool | Topical, Compound | `fragrance load calculator`, `Ekora fragrance calculator`, `candle batch calculation tool` |
| `/formulations` | Formulations Hub | Topical, LSI | `open-access cosmetic formulations`, `indie skincare formulation guides`, `skincare recipes` |
| `/wholesale/candle-waxes-additives` | Category Hub | Compound, Topical | `Ekora candle wax supplies`, `bulk soy wax flakes`, `candle raw materials` |
| `/wholesale/fragrance-oils` | Category Hub | Compound, Topical | `Ekora fragrance oils`, `IFRA certified fragrance supplies`, `wholesale scent oils` |
| `/about` | About & Media | Branded, Founder | `Ekora Bazaar`, `Kumar Aryan`, `Ekora Bazaar Muzaffarpur` |

---

## 8. OFF-PAGE SEO RISK ASSESSMENT & DEFENSIVE PRACTICES

```
+-------------------------------------------------------------------------------------------------+
|                                 STRICT OFF-PAGE GOVERNANCE & RISK MATRIX                        |
+-------------------------------------------------------------------------------------------------+
|  VIOLATION RISK           | THREAT LEVEL | GOOGLE PENALTY RISK     | MITIGATION PROTOCOL        |
| ------------------------- | :----------: | ----------------------- | -------------------------- |
|  Paid Link Purchases      |   CRITICAL   | Manual Action (Link     | Zero tolerance. Reject     |
|  (Fiverr, bulk guest post)|              | Spam Penalty)           | paid link networks.        |
|                           |              |                         |                            |
|  Private Blog Networks    |   CRITICAL   | De-indexation of domain | Strictly prohibit PBN      |
|  (PBNs / Link Farms)      |              |                         | footprints or syndication. |
|                           |              |                         |                            |
|  Over-Optimized Anchors   |     HIGH     | Algorithmic Ranking     | Cap exact-match anchors    |
|  (Exact-match stuffing)   |              | Suppression (Penguin)   | strictly below 3%.        |
|                           |              |                         |                            |
|  Low-Tier Directory Blast |    MEDIUM    | Crawl Budget Dilution   | Limit to curated, manual   |
|  (Automated submissions)  |              | & Negative Brand Trust  | Indian B2B directories.   |
|                           |              |                         |                            |
|  Comment / Forum Spam     |    MEDIUM    | Algorithmic Spam Filter | Only genuine community     |
|  (Automated bot posting)  |              |                         | answers; zero automated bot|
+-------------------------------------------------------------------------------------------------+
```

### 8.1 Google Link Spam Policies & Guidelines
Google's Search Essentials strictly prohibit link schemes that attempt to manipulate rankings. Any links intended to manipulate PageRank or a site's ranking in Google Search results may be considered part of a link scheme.

Key compliance mandates for Ekora Bazaar:
1. **Never Purchase Links:** Never pay third-party agencies for guaranteed dofollow backlinks, bulk guest posts, or package links (e.g. "50 DA70 backlinks for $99").
2. **Proper Link Attribution (`rel="sponsored"` / `rel="nofollow"`):** If Ekora Bazaar sponsors a maker workshop, maker convention, or artisan festival, ensure the host organization tags the link with `rel="sponsored"` or `rel="nofollow"`.
3. **No Excessive Reciprocal Link Exchanges:** Avoid artificial "link to me and I will link to you" partner networks. Supplier links must reflect legitimate commercial distribution arrangements.
4. **Disavow Protocol:** If Google Search Console detects unnatural link spikes from automated scrapers or negative SEO attacks, review the backlink file and prepare a clean `disavow.txt` submission via Google's official Disavow Tool. *Do not proactively disavow natural low-tier links unless manual actions or severe unnatural patterns appear.*

---

## 9. 30 / 60 / 90-DAY EXECUTION ROADMAP

```
+-----------------------------------------------------------------------------------------------+
|                               90-DAY STRATEGIC EXECUTION PHASES                               |
+-----------------------------------------------------------------------------------------------+
|  PHASE 1: DAYS 1 - 30        |  PHASE 2: DAYS 31 - 60        |  PHASE 3: DAYS 61 - 90         |
|  Foundations & Citations     |  Suppliers & Tool Seeding     |  Digital PR & Media Scale      |
| ---------------------------- | ----------------------------- | ------------------------------ |
|  - Verify canonical health   |  - Outreach to 10 active      |  - Pitch SMBStory / YourStory  |
|  - Setup GSC & GA4 tracking  |    manufacturing suppliers    |    founder narrative           |
|  - Register Startup India,   |  - Seed Fragrance Calculator  |  - Publish Soap Lye Calculator |
|    Udyam & MSME Databank     |    with 25 craft educators    |  - Target regional business    |
|  - Claim TradeIndia, Justdial|  - Join BIA / North Bihar     |    press (Bihar/National D2C)  |
|    & Crunchbase profiles     |    Chamber of Commerce        |  - Quarterly backlink review   |
+-----------------------------------------------------------------------------------------------+
```

### 9.1 Phase 1: Days 1 – 30 (Foundations, Citations & Core Asset Cleanup)
*Goal: Establish baseline data tracking, claim high-authority foundational business citations, and resolve internal technical issues that impede link equity.*

1. **Internal Technical Prerequisites (Completed in this sprint):**
   - Canonical tags on `/formulations` and `/formulations/[slug]` verified as self-referencing.
   - Legacy "Aseschem" references in `formulations.json` removed and replaced with in-house Ekora chemist attribution.
   - Interactive Fragrance Load Calculator upgraded with 1-click embed code snippet and printable batch sheet.
2. **Foundational Business Citations:**
   - Complete official registration on **Startup India** (`startupindia.gov.in`) to obtain a `.gov.in` profile citation.
   - Ensure active registration on **Udyam Registration** (`udyamregistration.gov.in`) and furnish complete operational details on the **MSME Databank** (`msmedatabank.gov.in`).
   - Claim and verify the business profile on **Crunchbase** (`crunchbase.com/add-new`) and **F6S** (`f6s.com`).
3. **Structured B2B Directory Presence:**
   - Establish free verified seller storefronts on **TradeIndia** (`tradeindia.com`) and **IndiaMART** (`seller.indiamart.com`).
   - Create verified local business profiles on **Justdial** (`justdial.com/Free-Listing`) and **Sulekha** (`sulekha.com`), ensuring exact NAP (Name, Address, Phone) consistency with the Muzaffarpur address.

### 9.2 Phase 2: Days 31 – 60 (Manufacturer Partnerships, Tool Seeding & Guilds)
*Goal: Earn high-relevance contextual backlinks from active supply-chain partners and workshop educators.*

1. **Manufacturer & Supplier "Where to Buy" Outreach:**
   - Identify 10 to 15 key domestic suppliers (glass container manufacturers, wax refiners, perfume bottle importers).
   - Execute Upgraded Playbook 3 to secure authorized online distributor listings with category-specific deeplinks.
2. **Interactive Calculator Seeding (Craft Academies):**
   - Compile a curated target list of 25 to 30 active Indian candle crafting workshop instructors and craft academy blogs (Delhi-NCR, Mumbai, Bengaluru, Pune, Jaipur).
   - Execute Upgraded Playbook 1 offering the free Fragrance Load Calculator and printable batch sheets as workshop supplementary resources.
3. **Regional Chamber & Industry Association Integration:**
   - Formalize institutional profile listings with the **North Bihar Chamber of Commerce & Industry (NBCCI)** in Muzaffarpur.
   - Explore startup registration and ecosystem listing with the **Bihar Industries Association (BIA)** and its **VenturePark** incubator (`biapatna.org` / `biaventurepark.com`).
   - Review corporate membership requirements for apex trade bodies (**CHEMEXCIL**, **FAFAI**, **EPCH**).

### 9.3 Phase 3: Days 61 – 90 (Digital PR, Technical Link Magnets & Media Scaling)
*Goal: Secure high-tier editorial coverage and scale link magnets that generate passive long-term backlinks.*

1. **Digital PR & Founder Storytelling:**
   - Execute Upgraded Playbook 4 targeting **YourStory SMBStory** (`yourstory.com/smbstory`) and **The Better India** (`thebetterindia.com`).
   - Frame the pitch around solving supply chain opacity for tier-2/3 home studios and building B2B infrastructure from Muzaffarpur.
2. **New Link Magnet Deployment:**
   - Build and release the **Cold Process Soap Lye & Saponification Calculator** as an interactive web tool.
   - Publish the **Definitive IFRA 51st Amendment Compliance Guide** as an authoritative technical resource.
3. **Unlinked Brand Mention Reclamation:**
   - Set up automated brand alerts across Google Alerts and Talkwalker.
   - Review mentions of "Ekora Bazaar" across lifestyle blogs, maker social roundups, and local news; reach out politely to convert positive brand citations into contextual backlinks.
4. **Quarterly Audit & Anchor Health Review:**
   - Export external links from Google Search Console; verify that the anchor text distribution remains safely weighted toward branded terms (>50%) and exact matches remain below 3%.

---

## 10. MEASUREMENT FRAMEWORK & KEY PERFORMANCE INDICATORS (KPIS)

To measure off-page SEO progress objectively without fabricating commercial metrics, track the following empirical KPIs using Google Search Console, Google Analytics 4, and server logs:

```
+-------------------------------------------------------------------------------------------------+
|                                 CORE BACKLINK & GROWTH KPI MATRIX                               |
+-------------------------------------------------------------------------------------------------+
|  METRIC                     | DATA SOURCE      | REPORTING CADENCE | 90-DAY TARGET BENCHMARK    |
| --------------------------- | ---------------- | :---------------: | -------------------------- |
|  Unique Referring Domains   | GSC Links Report |      Monthly      | +25 to +40 verified        |
|  (Total root domains)       |                  |                   | authentic domains          |
|                             |                  |                   |                            |
|  Government & Trade         | Manual / GSC     |     Quarterly     | Minimum 3 (.gov.in /       |
|  Association Profiles       |                  |                   | apex industry bodies)      |
|                             |                  |                   |                            |
|  Referral Sessions          | GA4 Acquisition  |      Monthly      | >500 monthly qualified     |
|  (Excluding payment/social) | (source=referral)|                   | buyer referral visits      |
|                             |                  |                   |                            |
|  Organic Landing Page       | GA4 / GSC        |      Weekly       | +40% organic impressions   |
|  Sessions to `/tools/`      |                  |                   | to calculation tools       |
|                             |                  |                   |                            |
|  Branded Search Velocity    | GSC Queries      |      Monthly      | Upward trend in queries:   |
|  ("Ekora Bazaar", "Ekora")  |                  |                   | "ekora bazaar", "ekora"    |
|                             |                  |                   |                            |
|  Anchor Text Brand Share    | GSC Top Linking  |     Quarterly     | >50% Branded / Naked;      |
|  (% of total anchors)       | Text             |                   | <3% Exact Match Commercial |
+-------------------------------------------------------------------------------------------------+
```

### Review Rhythm & Decision Gateway
- **Monthly (First Monday of every month):** Export GSC Links Report. Review new referring domains and top linked pages. Flag any suspicious scrapers or broken target pages.
- **Quarterly (End of every quarter):** Evaluate anchor text health, assess referral traffic quality in GA4, and prioritize the next batch of supplier partner outreach.

---

## 11. REMAINING EXTERNAL ACTIONS REQUIRING HUMAN APPROVAL OR ACCOUNT ACCESS

Before launching active outreach or submitting profiles, the business leadership should complete this immediate action checklist:

1. **[ ] Tool Access Provisioning:** Grant the growth marketing team administrative access to Google Search Console (Links report) and Google Analytics 4 (referral acquisition reports).
2. **[ ] Official Identity Documentation:** Provide official Udyam Registration Number and GSTIN certificate for Startup India and chamber listings.
3. **[ ] Proprietary Studio Imagery:** Schedule in-house photography for the 20 cosmetic formulation recipes to replace temporary third-party CDN images.
4. **[ ] Executive Approval for Outbound Communications:** Review and authorize the customized partner pitches before sending to domestic glass, wax, and fragrance manufacturers.
