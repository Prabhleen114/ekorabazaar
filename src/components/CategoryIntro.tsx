"use client";

import React from "react";
import Link from "next/link";

/**
 * CategoryIntro: 200-300 word descriptions for each wholesale category.
 * REVIEW_CLAIMS.md lists all claims flagged for human verification.
 * [VERIFY] comments are in code only — none rendered to users.
 */

interface CategoryIntroProps {
  categoryLabel: string;
}

export default function CategoryIntro({ categoryLabel }: CategoryIntroProps) {
  const content = INTROS[categoryLabel];
  if (!content) return null;

  return (
    <section className="mt-16 bg-white p-8 md:p-10 rounded-3xl border border-brand-linen prose prose-stone max-w-none">
      {content}
    </section>
  );
}

const INTROS: Record<string, React.ReactNode> = {

  "Candle Waxes & Additives": (
    <>
      <h2 className="text-2xl font-bold font-serif text-brand-charcoal mb-4">
        Choosing Candle Waxes & Additives for Your Studio
      </h2>
      <p className="mb-4">
        Wax selection is arguably the most consequential decision a candle maker makes.
        Different wax types behave differently in terms of melt point, fragrance load capacity,
        adhesion to glass, and surface finish, so matching the right wax to your product is
        essential before you scale. Paraffin wax has long been the industry standard for its
        consistent melt behaviour and compatibility with most fragrance oils, and it remains
        popular for pillar and taper candles. Soy-based waxes — derived from hydrogenated soybean
        oil — offer a lower melt point and are widely used for container candles.
        {/* [VERIFY]: natural/eco claims about soy wax — confirm with supplier COA */}
        Coconut wax and beeswax occupy premium segments valued for their distinct scent profiles and aesthetic finishes.
      </p>
      <p className="mb-4">
        Additives allow makers to fine-tune their formulation. Stearic acid is commonly added to
        paraffin to increase opacity and hardness. Vybar and other polymer additives can improve
        fragrance retention and reduce bleeding in pillar applications. When sourcing additives,
        request the technical data sheet (TDS) from the supplier to understand recommended usage
        rates — excess additive can negatively affect scent throw or cause surface cracking.
      </p>
      <p className="mb-4">
        For beginners, start with a single-wax, single-wick container candle and record every
        variable: pour temperature, fragrance load percentage, cure time, and ambient conditions.
        Reproducibility matters more than perfection on the first attempt. Once you have a stable
        baseline, introduce one change at a time.
      </p>
      <p className="text-sm text-brand-charcoal/60">
        Related categories:{" "}
        <Link href="/wholesale/wick-systems-hardware" className="underline hover:text-brand-orange">Wick Systems &amp; Hardware</Link>
        {" · "}
        <Link href="/wholesale/candle-jars-containers" className="underline hover:text-brand-orange">Candle Jars &amp; Containers</Link>
        {" · "}
        <Link href="/wholesale/fragrance-oils" className="underline hover:text-brand-orange">Fragrance Oils</Link>
      </p>
    </>
  ),

  "Artisan Soap Bases": (
    <>
      <h2 className="text-2xl font-bold font-serif text-brand-charcoal mb-4">
        Choosing the Right Soap Base for Your Product Line
      </h2>
      <p className="mb-4">
        Melt-and-pour (M&P) soap bases are pre-saponified and ready to melt, colour, scent, and
        mould, making them a practical entry point for artisan soap brands. The base determines
        the finished bar&apos;s lather quality, clarity, skin feel, and shelf stability, so
        selecting the right formulation before you scale production saves significant rework time.
      </p>
      <p className="mb-4">
        Glycerin-based transparent bases produce a jewel-like, clear bar that showcases embedded
        botanicals or mica swirls. Opaque white bases typically contain a higher proportion of
        oils such as coconut or palm, producing a denser lather. Goat milk and honey bases
        introduce additional compounds that affect texture and colour — always request a sample
        batch to assess consistency before placing a large wholesale order.
        {/* [VERIFY]: specific skin feel claims — these are widely documented but confirm with supplier's product spec */}
      </p>
      <p className="mb-4">
        When choosing a base for professional production, consider fragrance compatibility (some
        bases accelerate trace with certain synthetic fragrance notes), colourant uptake, and
        minimum pour temperature. If your market favours a particular positioning, look for bases
        where the supplier provides documentation of ingredients and applicable certifications.
      </p>
      <p className="mb-4">
        Storage is straightforward: keep bases in sealed packaging away from direct sunlight and
        high humidity to prevent glycerin from drawing ambient moisture and developing surface sweating.
      </p>
      <p className="text-sm text-brand-charcoal/60">
        Related categories:{" "}
        <Link href="/wholesale/skin-safe-fragrances" className="underline hover:text-brand-orange">Skin Safe Fragrances</Link>
        {" · "}
        <Link href="/wholesale/micas-pigments" className="underline hover:text-brand-orange">Micas &amp; Pigments</Link>
        {" · "}
        <Link href="/wholesale/soap-bar-moulds" className="underline hover:text-brand-orange">Soap &amp; Bar Moulds</Link>
      </p>
    </>
  ),

  "Skincare & Body Bases": (
    <>
      <h2 className="text-2xl font-bold font-serif text-brand-charcoal mb-4">
        Formulating with Skincare & Body Bases
      </h2>
      <p className="mb-4">
        Ready-to-formulate skincare bases — including lotions, creams, serums, and body butters —
        let small-batch brands move faster from concept to product without building a full
        formulation lab. These bases typically contain a pre-blended emulsifier system, humectants,
        and a preservative system, and are designed to accept active ingredient additions, fragrances,
        and colourants at defined percentages.
      </p>
      <p className="mb-4">
        Before selecting a base, identify your target product format and the actives you intend
        to incorporate. A lightweight serum base behaves very differently from a heavy cream base
        in terms of viscosity, pH window, and active compatibility. Always review the supplier&apos;s
        technical data sheet for recommended addition rates and incompatible ingredients.
        {/* [VERIFY]: claims about specific preservative systems — confirm with supplier TDS */}
      </p>
      <p className="mb-4">
        Regulatory compliance is the single most important consideration for skincare brands in
        India. Products marketed with cosmetic claims must comply with BIS or applicable standards,
        and any therapeutic claims require separate licensing. It is strongly advisable to work with
        a qualified cosmetic formulator or regulatory consultant when bringing a labelled skincare
        product to market.
      </p>
      <p className="text-sm text-brand-charcoal/60">
        Related categories:{" "}
        <Link href="/wholesale/raw-butters-carrier-oils" className="underline hover:text-brand-orange">Raw Butters &amp; Carrier Oils</Link>
        {" · "}
        <Link href="/wholesale/cosmetic-preservatives-chemicals" className="underline hover:text-brand-orange">Cosmetic Preservatives</Link>
        {" · "}
        <Link href="/wholesale/cosmetic-jars-bottles" className="underline hover:text-brand-orange">Cosmetic Jars &amp; Bottles</Link>
      </p>
    </>
  ),

  "Body & Facial Scrubs": (
    <>
      <h2 className="text-2xl font-bold font-serif text-brand-charcoal mb-4">
        Body & Facial Scrub Bases: What to Look For
      </h2>
      <p className="mb-4">
        Scrub bases come in two broad categories: oil-based and water-based (also called
        emulsified scrubs). Oil-based scrubs — typically a blend of sugar or salt in a carrier
        oil medium — have a longer shelf life but may require a water-resistant labelling statement.
        Emulsified scrub bases rinse cleaner from the skin and packaging, which makes them popular
        for retail gifting products.
      </p>
      <p className="mb-4">
        The exfoliant particle size and hardness determines how aggressive the product feels in
        use. Fine sugar granules are gentle enough for most facial applications. Medium salt
        crystals work well for body scrubs. Larger walnut shell or apricot kernel powders provide
        a more vigorous exfoliation suited to foot scrubs or body polishes.
        {/* [VERIFY]: skin sensitivity claims — particle size guidance is widely documented but consult a formulator for clinical claims */}
      </p>
      <p className="mb-4">
        For wholesale buyers, confirm the base&apos;s preservative system and water activity to
        understand shelf life. Products containing water require an effective preservative to
        prevent microbial growth. Request a challenge test or stability data from the supplier if
        you plan to sell under your own brand.
      </p>
      <p className="text-sm text-brand-charcoal/60">
        Related categories:{" "}
        <Link href="/wholesale/skincare-body-bases" className="underline hover:text-brand-orange">Skincare &amp; Body Bases</Link>
        {" · "}
        <Link href="/wholesale/raw-butters-carrier-oils" className="underline hover:text-brand-orange">Raw Butters &amp; Carrier Oils</Link>
        {" · "}
        <Link href="/wholesale/cosmetic-jars-bottles" className="underline hover:text-brand-orange">Cosmetic Jars &amp; Bottles</Link>
      </p>
    </>
  ),

  "Haircare & Wash Bases": (
    <>
      <h2 className="text-2xl font-bold font-serif text-brand-charcoal mb-4">
        Haircare & Wash Bases for Private Label Production
      </h2>
      <p className="mb-4">
        Shampoo, conditioner, and body wash bases are complex formulations that balance cleansing
        efficacy, foam profile, viscosity, and mildness. For brands that want to launch without
        a full cosmetic laboratory, starting with a professionally formulated base significantly
        reduces development time and risk.
      </p>
      <p className="mb-4">
        When evaluating a shampoo base, the surfactant system is the key variable. High-foaming
        systems built around sodium lauryl sulfate (SLS) produce copious lather but can be drying
        with frequent use. Sulfate-free systems use alternatives such as sodium cocoyl isethionate
        (SCI), decyl glucoside, or betaine-based blends to deliver a gentler cleanse.
        {/* [VERIFY]: specific surfactant dryness claims — well-documented in cosmetic literature but confirm with supplier */}
        Review the ingredient list and request the INCI nomenclature from the supplier to ensure
        your finished product labelling is accurate.
      </p>
      <p className="mb-4">
        Conditioner bases are generally emulsion systems containing cationic conditioning agents.
        They can be harder to customise than shampoo bases without affecting the electrostatic
        balance. Additions of heavy oils or butters at high rates may destabilise the emulsion.
        Always conduct small-scale stability tests before committing to full-batch production.
      </p>
      <p className="text-sm text-brand-charcoal/60">
        Related categories:{" "}
        <Link href="/wholesale/artisan-soap-bases" className="underline hover:text-brand-orange">Artisan Soap Bases</Link>
        {" · "}
        <Link href="/wholesale/raw-butters-carrier-oils" className="underline hover:text-brand-orange">Raw Butters &amp; Carrier Oils</Link>
        {" · "}
        <Link href="/wholesale/cosmetic-preservatives-chemicals" className="underline hover:text-brand-orange">Cosmetic Preservatives</Link>
      </p>
    </>
  ),

  "Raw Butters & Carrier Oils": (
    <>
      <h2 className="text-2xl font-bold font-serif text-brand-charcoal mb-4">
        Selecting Raw Butters & Carrier Oils for Your Formulations
      </h2>
      <p className="mb-4">
        Carrier oils and raw butters are the fatty phase in most cosmetic formulations — they
        carry active ingredients into the product, contribute to skin feel and occlusion, and
        affect oxidative stability. Choosing the right combination for your application requires
        understanding fatty acid composition, comedogenic rating, and oxidative stability.
      </p>
      <p className="mb-4">
        Lighter oils such as sweet almond, jojoba (technically a liquid wax), and grapeseed are
        absorbed quickly and are well-suited to face and body serums. Heavier oils such as
        castor and avocado have a slower absorption profile and a richer, more emollient texture.
        Butters — shea, cocoa, mango seed — are solid at room temperature and provide the
        occlusive, protective element in body butters and lip balms.
        {/* [VERIFY]: comedogenic ratings vary by source — do not publish exact comedogenic scores without citing reference */}
      </p>
      <p className="mb-4">
        For wholesale buyers, the most important documentation to request is a certificate of
        analysis (COA) confirming fatty acid profile and peroxide value (PV). A high peroxide
        value indicates oxidation has already begun, which will shorten the finished product&apos;s
        shelf life. Store all oils and butters in a cool, dark location and use within their
        indicated shelf life.
      </p>
      <p className="text-sm text-brand-charcoal/60">
        Related categories:{" "}
        <Link href="/wholesale/skincare-body-bases" className="underline hover:text-brand-orange">Skincare &amp; Body Bases</Link>
        {" · "}
        <Link href="/wholesale/essential-oils" className="underline hover:text-brand-orange">Essential Oils</Link>
        {" · "}
        <Link href="/wholesale/cosmetic-preservatives-chemicals" className="underline hover:text-brand-orange">Cosmetic Preservatives</Link>
      </p>
    </>
  ),

  "Cosmetic Preservatives & Chemicals": (
    <>
      <h2 className="text-2xl font-bold font-serif text-brand-charcoal mb-4">
        Understanding Cosmetic Preservatives & Functional Chemicals
      </h2>
      <p className="mb-4">
        Any cosmetic product that contains water — including emulsions, hydrosols, aloe vera gel,
        and shampoos — requires an effective preservative system to prevent microbial contamination.
        Choosing the right preservative is both a formulation and a regulatory decision.
      </p>
      <p className="mb-4">
        Broad-spectrum preservatives protect against bacteria, yeast, and mould simultaneously.
        Common systems include phenoxyethanol (often combined with ethylhexylglycerin), optiphen
        blends, and Leucidal (based on lactobacillus ferment). Usage rates and pH windows vary
        by system — always follow the supplier&apos;s technical guidance and conduct a challenge
        test (or commission one from a third-party lab) before finalising your formula.
        {/* [VERIFY]: specific preservative efficacy claims — confirmed by regulatory literature; always verify with your formulator */}
      </p>
      <p className="mb-4">
        Functional chemicals such as emulsifiers, thickeners (carbomer, xanthan, cetyl alcohol),
        and pH adjusters are equally important. These ingredients affect texture, stability, and
        performance, not just preservation. Sourcing these with accurate INCI documentation is
        essential for compliant labelling in India and for export markets.
      </p>
      <p className="text-sm text-brand-charcoal/60">
        Related categories:{" "}
        <Link href="/wholesale/skincare-body-bases" className="underline hover:text-brand-orange">Skincare &amp; Body Bases</Link>
        {" · "}
        <Link href="/wholesale/raw-butters-carrier-oils" className="underline hover:text-brand-orange">Raw Butters &amp; Carrier Oils</Link>
        {" · "}
        <Link href="/wholesale/haircare-wash-bases" className="underline hover:text-brand-orange">Haircare &amp; Wash Bases</Link>
      </p>
    </>
  ),

  "Fragrance Oils": (
    <>
      <h2 className="text-2xl font-bold font-serif text-brand-charcoal mb-4">
        Buying Fragrance Oils in Bulk: A Practical Guide
      </h2>
      <p className="mb-4">
        Fragrance oils are blended aroma compounds designed for use in candles, wax melts, reed
        diffusers, and other home fragrance products. Unlike essential oils, fragrance oils
        contain both natural and synthetic aroma molecules, which gives perfumers greater control
        over scent longevity, consistency, and cost.
      </p>
      <p className="mb-4">
        The single most important specification for candle fragrance oils is the recommended
        usage rate — the maximum percentage of fragrance oil relative to wax weight. Exceeding
        this rate does not necessarily improve scent throw; it can cause seepage, poor adhesion
        to the container, or wick performance issues. Most candle fragrance oils are dosed between
        6% and 10% by weight. Test at the lower end of the recommended range first.
      </p>
      <p className="mb-4">
        When evaluating fragrance oils for reed diffusers, check the carrier solvent compatibility.
        Diffuser fragrances typically require a thin carrier oil (such as dipropylene glycol, DPG)
        for optimal reed wicking. Some fragrance concentrations are formulated specifically for
        diffusers and should not be substituted directly into candle applications without separate
        testing.
      </p>
      <p className="mb-4">
        For any product category, ask suppliers for a safety data sheet (SDS) and confirm the
        fragrance is appropriate for your intended application.
      </p>
      <p className="text-sm text-brand-charcoal/60">
        Related categories:{" "}
        <Link href="/wholesale/skin-safe-fragrances" className="underline hover:text-brand-orange">Skin Safe Fragrances</Link>
        {" · "}
        <Link href="/wholesale/candle-waxes-additives" className="underline hover:text-brand-orange">Candle Waxes &amp; Additives</Link>
        {" · "}
        <Link href="/wholesale/diffuser-bottles-accessories" className="underline hover:text-brand-orange">Diffuser Bottles</Link>
      </p>
    </>
  ),

  "Skin Safe Fragrances": (
    <>
      <h2 className="text-2xl font-bold font-serif text-brand-charcoal mb-4">
        How to Source Skin-Safe Fragrances for Cosmetics
      </h2>
      <p className="mb-4">
        Skin-safe fragrance oils are formulated for use in products that come into direct or
        prolonged contact with skin — soaps, body lotions, bath products, and personal care items.
        The key distinction from standard candle fragrance oils is that skin-safe grades are
        formulated within usage limits suitable for leave-on or rinse-off cosmetic applications.
      </p>
      <p className="mb-4">
        When sourcing skin-safe fragrances for cosmetic use, always request the supplier&apos;s
        safety documentation. Usage rate guidance for cosmetic applications differs by product
        type — rinse-off products such as shampoo and soap allow higher fragrance concentrations
        than leave-on applications such as body lotion. Review the fragrance supplier&apos;s
        usage rate chart for each product category.
        {/* [VERIFY]: IFRA compliance — confirm each specific fragrance purchased has IFRA documentation before making marketing claims */}
      </p>
      <p className="mb-4">
        Fragrance allergens are regulated in many markets. If you sell in the EU or to customers
        with known sensitivities, review the fragrance&apos;s ingredient disclosure and check
        whether any listed allergens require on-label disclosure under applicable regulations.
        In India, current cosmetic regulations are less prescriptive on allergen labelling, but
        best practice is to follow international guidance.
      </p>
      <p className="text-sm text-brand-charcoal/60">
        Related categories:{" "}
        <Link href="/wholesale/fragrance-oils" className="underline hover:text-brand-orange">Fragrance Oils</Link>
        {" · "}
        <Link href="/wholesale/essential-oils" className="underline hover:text-brand-orange">Essential Oils</Link>
        {" · "}
        <Link href="/wholesale/artisan-soap-bases" className="underline hover:text-brand-orange">Artisan Soap Bases</Link>
      </p>
    </>
  ),

  "Essential Oils": (
    <>
      <h2 className="text-2xl font-bold font-serif text-brand-charcoal mb-4">
        Buying Essential Oils in Bulk: Quality, Storage & Use
      </h2>
      <p className="mb-4">
        Essential oils are concentrated aromatic extracts obtained from plant material through
        steam distillation, cold pressing, or CO₂ extraction. They are used in aromatherapy,
        cosmetics, candles, and personal care products, and their performance depends heavily
        on botanical origin, extraction method, and post-harvest processing.
      </p>
      <p className="mb-4">
        When purchasing essential oils at wholesale volume, the most reliable quality indicator
        is a gas chromatography/mass spectrometry (GC/MS) report, which shows the chemical
        composition of the oil and whether it has been adulterated with synthetic substitutes
        or cheaper carrier oils. Reputable bulk suppliers will provide GC/MS data on request
        or include it with the product documentation.
        {/* [VERIFY]: confirm GC/MS availability from specific suppliers on the platform before marketing this claim */}
      </p>
      <p className="mb-4">
        Storage significantly affects shelf life. Most essential oils should be kept in amber
        or dark glass, tightly sealed, in a cool space away from light and heat. Citrus oils in
        particular oxidise quickly and typically have a shelf life of 6–12 months once opened.
        Heavier, resinous oils such as patchouli, vetiver, and sandalwood generally have longer
        stability profiles.
      </p>
      <p className="mb-4">
        Essential oils are potent and should always be handled with appropriate care. For
        any cosmetic use, follow established dilution guidelines and conduct patch testing on
        small batches before large-scale production.
      </p>
      <p className="text-sm text-brand-charcoal/60">
        Related categories:{" "}
        <Link href="/wholesale/skin-safe-fragrances" className="underline hover:text-brand-orange">Skin Safe Fragrances</Link>
        {" · "}
        <Link href="/wholesale/raw-butters-carrier-oils" className="underline hover:text-brand-orange">Carrier Oils</Link>
        {" · "}
        <Link href="/wholesale/diffuser-bottles-accessories" className="underline hover:text-brand-orange">Diffuser Accessories</Link>
      </p>
    </>
  ),

  "Food-Grade Flavor Oils": (
    <>
      <h2 className="text-2xl font-bold font-serif text-brand-charcoal mb-4">
        Food-Grade Flavor Oils for Confectionery & Bakery
      </h2>
      <p className="mb-4">
        Food-grade flavour oils are concentrated oil-soluble flavour compounds approved for use
        in food applications such as chocolate, confectionery, baked goods, and beverages.
        They differ from cosmetic or candle fragrance oils in their regulatory status and
        ingredient specifications — the two categories are not interchangeable.
      </p>
      <p className="mb-4">
        Oil-soluble flavour oils are particularly suited to chocolate, hard candy, and fat-based
        applications where water-based flavours would cause seizing or texture issues.
        Usage rates in confectionery are typically very low — often between 0.5% and 2% by
        weight — because these concentrates are highly potent. Always start at the lower
        end of the recommended dosage range and adjust from there.
        {/* [VERIFY]: specific usage rate ranges — widely documented in flavour industry; confirm with your supplier's TDS for each SKU */}
      </p>
      <p className="mb-4">
        When sourcing food-grade flavours in bulk, request the supplier&apos;s certificate of
        conformity and safety documentation. For any product you intend to sell as food in India,
        compliance with FSSAI regulations is mandatory. Consult a food regulatory consultant
        to understand your labelling and licensing requirements.
      </p>
      <p className="text-sm text-brand-charcoal/60">
        Related categories:{" "}
        <Link href="/wholesale/culinary-fondant-moulds" className="underline hover:text-brand-orange">Culinary &amp; Fondant Moulds</Link>
        {" · "}
        <Link href="/wholesale/fragrance-oils" className="underline hover:text-brand-orange">Fragrance Oils</Link>
      </p>
    </>
  ),

  "Hydrosols & Floral Waters": (
    <>
      <h2 className="text-2xl font-bold font-serif text-brand-charcoal mb-4">
        Using Hydrosols & Floral Waters in Cosmetic Formulations
      </h2>
      <p className="mb-4">
        Hydrosols — also called floral waters or distillates — are the aqueous co-product of
        essential oil steam distillation. They contain a small percentage of dissolved aromatic
        compounds and offer a light, delicate aroma suited to applications where essential oil
        concentrations would be too intense or inappropriate.
      </p>
      <p className="mb-4">
        In cosmetic formulations, hydrosols can function as the water phase in emulsions,
        as standalone facial toners, or as a fragrant base for linen sprays and room mists.
        They are generally lower in active aroma compounds than essential oils and are typically
        used undiluted or at high percentages.
      </p>
      <p className="mb-4">
        Preservation is the main technical challenge. Because hydrosols are water-based with no
        inherent preservative barrier, they are susceptible to microbial contamination. Products
        containing hydrosols must include an effective broad-spectrum preservative unless they
        are produced and sold immediately under strictly controlled conditions. Store bulk hydrosols
        in a cool, dark environment and check for turbidity or off-odour before use.
        {/* [VERIFY]: specific preservation requirements — well-established in cosmetic literature; confirm with formulator */}
      </p>
      <p className="text-sm text-brand-charcoal/60">
        Related categories:{" "}
        <Link href="/wholesale/essential-oils" className="underline hover:text-brand-orange">Essential Oils</Link>
        {" · "}
        <Link href="/wholesale/skincare-body-bases" className="underline hover:text-brand-orange">Skincare &amp; Body Bases</Link>
        {" · "}
        <Link href="/wholesale/cosmetic-preservatives-chemicals" className="underline hover:text-brand-orange">Cosmetic Preservatives</Link>
      </p>
    </>
  ),

  "Micas & Pigments": (
    <>
      <h2 className="text-2xl font-bold font-serif text-brand-charcoal mb-4">
        Micas & Pigments: Selecting Colours for Soap, Wax & Resin
      </h2>
      <p className="mb-4">
        Cosmetic-grade micas are naturally occurring mineral pigments coated with titanium
        dioxide or iron oxides to produce pearlescent and metalite colours. They are widely
        used in soap, candles, resin art, and cosmetics, and their fine particle size allows
        them to disperse evenly in most media.
      </p>
      <p className="mb-4">
        When selecting micas for your application, check whether they are labelled for cosmetic
        use if you intend to use them in lip, eye, or face products. Cosmetic-grade micas carry
        a stricter regulatory specification than those sold for industrial applications such as
        resin or cement colouring. Using an incorrectly graded mica in a cosmetic product is a
        compliance risk.
      </p>
      <p className="mb-4">
        For soap applications, test whether the mica is "soap-stable" — some pigments shift
        colour in the high-pH environment of cold-process soap, which is irreversible. Candle
        pigments are a separate category from soap or cosmetic micas; candle dyes are designed
        for wax dispersion rather than water or oil-based systems. Using the wrong type will
        cause poor dispersion or clogged wicks. For resin art, alcohol inks, fluid pigments,
        and dry micas all offer different aesthetic effects — experiment with quantity and
        mixing technique on small test pours before committing to a large batch.
      </p>
      <p className="text-sm text-brand-charcoal/60">
        Related categories:{" "}
        <Link href="/wholesale/artisan-soap-bases" className="underline hover:text-brand-orange">Artisan Soap Bases</Link>
        {" · "}
        <Link href="/wholesale/eco-resin-stone-moulds" className="underline hover:text-brand-orange">Eco-Resin &amp; Stone Moulds</Link>
        {" · "}
        <Link href="/wholesale/candle-waxes-additives" className="underline hover:text-brand-orange">Candle Waxes &amp; Additives</Link>
      </p>
    </>
  ),

  "Candle & Pillar Moulds": (
    <>
      <h2 className="text-2xl font-bold font-serif text-brand-charcoal mb-4">
        Candle & Pillar Moulds: Silicone, Polycarbonate & Metal
      </h2>
      <p className="mb-4">
        The mould you choose determines the shape, surface quality, and dimensional consistency
        of your finished candle. Three main materials are commonly available: silicone, polycarbonate,
        and metal (aluminium or tin). Each has different performance characteristics at higher
        pour temperatures.
      </p>
      <p className="mb-4">
        Silicone moulds are flexible, which makes demoulding easy without seam lines on the
        finished candle. They are suitable for pillar candles and intricate sculptural shapes.
        However, silicone conducts heat slowly, which can affect how the wax contracts and sets
        around the wick. Higher-durometer silicone moulds hold fine surface detail better than
        soft-mould variants.
      </p>
      <p className="mb-4">
        Polycarbonate moulds are common for pillar candles and offer excellent surface clarity
        on the finished product, which is useful for translucent wax blends. They have defined
        temperature limits and should not be used above the manufacturer&apos;s recommended
        pour temperature. Metal moulds are the most durable option for production environments
        and handle repeated high-temperature pours well, but they require a mould release agent
        and produce a distinct seam line that must be finished.
      </p>
      <p className="text-sm text-brand-charcoal/60">
        Related categories:{" "}
        <Link href="/wholesale/candle-waxes-additives" className="underline hover:text-brand-orange">Candle Waxes &amp; Additives</Link>
        {" · "}
        <Link href="/wholesale/wick-systems-hardware" className="underline hover:text-brand-orange">Wick Systems &amp; Hardware</Link>
        {" · "}
        <Link href="/wholesale/general-silicone-moulds" className="underline hover:text-brand-orange">General Silicone Moulds</Link>
      </p>
    </>
  ),

  "Soap & Bar Moulds": (
    <>
      <h2 className="text-2xl font-bold font-serif text-brand-charcoal mb-4">
        Soap & Bar Moulds for M&P and Cold Process Production
      </h2>
      <p className="mb-4">
        Soap moulds are designed for two very different production methods that require different
        material properties. Melt-and-pour (M&P) soap sets at a much lower temperature than
        cold-process (CP) soap and generates no heat during saponification, so M&P moulds can
        be made of silicone, acrylic, or plastic. Cold-process soap generates significant heat
        during the gel phase, so mould material tolerance is important.
      </p>
      <p className="mb-4">
        Individual cavity silicone moulds are ideal for M&P production — they produce uniform
        bars and enable embedding botanicals or mica layers cleanly. Loaf moulds in silicone or
        wood-lined with freezer paper are the workhorses of small-batch CP production because
        they allow efficient cutting into consistent bars. For medium-scale production, multi-bar
        silicone slab moulds or acrylic log moulds with push-through cutters improve throughput.
      </p>
      <p className="mb-4">
        When selecting moulds for wholesale buying, consider cleaning ease, storage
        footprint, and durability over multiple production cycles. Flexible silicone moulds
        are easier to clean than rigid plastic but may distort if stored improperly over time.
        Acrylic moulds are dimensionally stable but require care to avoid cracking.
      </p>
      <p className="text-sm text-brand-charcoal/60">
        Related categories:{" "}
        <Link href="/wholesale/artisan-soap-bases" className="underline hover:text-brand-orange">Artisan Soap Bases</Link>
        {" · "}
        <Link href="/wholesale/micas-pigments" className="underline hover:text-brand-orange">Micas &amp; Pigments</Link>
        {" · "}
        <Link href="/wholesale/dried-botanicals-additives" className="underline hover:text-brand-orange">Dried Botanicals</Link>
      </p>
    </>
  ),

  "Eco-Resin & Stone Moulds": (
    <>
      <h2 className="text-2xl font-bold font-serif text-brand-charcoal mb-4">
        Eco-Resin & Stone Moulds for Art and Functional Casting
      </h2>
      <p className="mb-4">
        Moulds for eco-resin, Jesmonite, and gypsum casting are designed to hold fine surface
        detail over multiple pours without degrading. The two most common mould materials for
        these applications are silicone and plastic (ABS or polypropylene). Each offers a
        different balance of detail reproduction, longevity, and release performance.
      </p>
      <p className="mb-4">
        Silicone moulds are the default choice for resin art because their non-stick surface
        releases fully cured resin without a release agent, and they reproduce fine surface
        texture well. For production use, higher-durometer silicone (more rigid) retains
        dimensional accuracy longer than ultra-soft silicone, which can distort under the
        weight of a large pour.
      </p>
      <p className="mb-4">
        Plastic moulds are suitable for Jesmonite and gypsum but usually require a release
        agent such as a furniture polish or petroleum jelly. They are generally more rigid
        and dimensionally consistent than silicone, which is useful for flat-bottomed forms
        like coasters and trays that need to be perfectly level. Always cure in a level
        environment and mix your resin or mineral compound according to the manufacturer&apos;s
        exact ratios — incorrect ratios are the most common cause of soft or tacky finished pieces.
      </p>
      <p className="text-sm text-brand-charcoal/60">
        Related categories:{" "}
        <Link href="/wholesale/micas-pigments" className="underline hover:text-brand-orange">Micas &amp; Pigments</Link>
        {" · "}
        <Link href="/wholesale/general-silicone-moulds" className="underline hover:text-brand-orange">General Silicone Moulds</Link>
        {" · "}
        <Link href="/wholesale/candle-waxes-additives" className="underline hover:text-brand-orange">Candle Waxes</Link>
      </p>
    </>
  ),

  "Culinary & Fondant Moulds": (
    <>
      <h2 className="text-2xl font-bold font-serif text-brand-charcoal mb-4">
        Culinary & Fondant Moulds for Confectionery Production
      </h2>
      <p className="mb-4">
        Culinary moulds for chocolate, fondant, and confectionery come in two primary materials:
        polycarbonate and food-grade silicone. Each has specific performance characteristics
        that make it better suited to certain applications.
      </p>
      <p className="mb-4">
        Polycarbonate chocolate moulds are the professional standard for chocolate bars and
        bonbons. The hard, smooth surface allows tempered chocolate to release with a high-gloss
        finish that silicone cannot replicate. They require correct tempering technique and
        proper temperature management during filling and setting. Polycarbonate moulds must
        not be cleaned with abrasive materials or placed in a dishwasher, as scratches will
        damage the release surface and dull the finished chocolate.
      </p>
      <p className="mb-4">
        Silicone moulds are better suited to gummies, fondant, marzipan, and confectionery
        that does not require a high-gloss finish. Their flexibility allows easy demoulding
        without cracking or breaking delicate pieces. Food-grade silicone is heat-stable
        and can be used in oven applications for moulded baked goods as well as cold-set
        confectionery, which gives it versatility in a production kitchen.
        {/* [VERIFY]: specific temperature tolerance — confirm with supplier spec sheet for each mould */}
      </p>
      <p className="text-sm text-brand-charcoal/60">
        Related categories:{" "}
        <Link href="/wholesale/food-grade-flavor-oils" className="underline hover:text-brand-orange">Food-Grade Flavor Oils</Link>
        {" · "}
        <Link href="/wholesale/general-silicone-moulds" className="underline hover:text-brand-orange">General Silicone Moulds</Link>
      </p>
    </>
  ),

  "General Silicone Moulds": (
    <>
      <h2 className="text-2xl font-bold font-serif text-brand-charcoal mb-4">
        General-Purpose Silicone Moulds: A Buyer's Guide
      </h2>
      <p className="mb-4">
        General silicone moulds cover a broad range of shapes and sizes that don't fall into
        a single craft speciality — geometric forms, botanical embeds, abstract shapes, trays,
        and novelty designs. They are used across candle making, resin art, soap, wax melts,
        and even concrete casting, which makes them one of the more versatile categories on
        the platform.
      </p>
      <p className="mb-4">
        The most useful specification to check before buying is shore hardness (also called
        durometer). Softer silicone (lower shore A rating) is easier to flex for demoulding
        but may distort under the weight of a large pour or lose its shape over many production
        cycles. Firmer silicone holds detail well and lasts longer in high-volume production,
        but may require a slight bend to release complex shapes.
      </p>
      <p className="mb-4">
        For bulk buyers, consider mould footprint and stacking efficiency, since silicone
        moulds can be storage-intensive. Flat tray designs stack easily; individual novelty
        moulds require more care to avoid permanent deformation. Clean silicone moulds with
        warm water and a mild detergent only — solvents will degrade the silicone over time
        and affect the release performance of subsequent pours.
      </p>
      <p className="text-sm text-brand-charcoal/60">
        Related categories:{" "}
        <Link href="/wholesale/candle-pillar-moulds" className="underline hover:text-brand-orange">Candle &amp; Pillar Moulds</Link>
        {" · "}
        <Link href="/wholesale/soap-bar-moulds" className="underline hover:text-brand-orange">Soap &amp; Bar Moulds</Link>
        {" · "}
        <Link href="/wholesale/eco-resin-stone-moulds" className="underline hover:text-brand-orange">Eco-Resin &amp; Stone Moulds</Link>
      </p>
    </>
  ),

  "Candle Jars & Containers": (
    <>
      <h2 className="text-2xl font-bold font-serif text-brand-charcoal mb-4">
        Selecting Candle Jars & Containers for Your Brand
      </h2>
      <p className="mb-4">
        The jar is as much a part of your candle brand as the scent or the label. Customers
        often keep and repurpose quality containers, which means your vessel continues to
        represent your brand long after the candle is finished. The choice of material, size,
        and neck diameter affects both the functional performance of the candle and the
        perceived quality of the product.
      </p>
      <p className="mb-4">
        Glass is the dominant material for premium container candles because it withstands the
        heat cycle without off-gassing and showcases the wax colour and texture. Consider
        wall thickness when buying wholesale — thinner glass may not handle the full burn
        cycle without risk of thermal stress. For safety, always specify containers that have
        been tested for the intended candle application. Tin containers are a compact, spill-
        resistant alternative widely used for travel and gift candles.
      </p>
      <p className="mb-4">
        Neck diameter determines which wick sizes will work correctly — too narrow and the
        wax pool cannot form fully; too wide and a single wick may not produce enough heat to
        reach the container walls, leaving unburned wax on the sides. Match your container
        diameter to your wick selection charts and conduct full burn tests from the first light
        to the last.
      </p>
      <p className="text-sm text-brand-charcoal/60">
        Related categories:{" "}
        <Link href="/wholesale/candle-waxes-additives" className="underline hover:text-brand-orange">Candle Waxes &amp; Additives</Link>
        {" · "}
        <Link href="/wholesale/wick-systems-hardware" className="underline hover:text-brand-orange">Wick Systems &amp; Hardware</Link>
        {" · "}
        <Link href="/wholesale/lids-caps-closures" className="underline hover:text-brand-orange">Lids, Caps &amp; Closures</Link>
      </p>
    </>
  ),

  "Attar & Perfume Bottles": (
    <>
      <h2 className="text-2xl font-bold font-serif text-brand-charcoal mb-4">
        Attar & Perfume Bottles: Packaging Your Fragrance Brand
      </h2>
      <p className="mb-4">
        The perfume or attar bottle is the first physical touchpoint with your customer, and
        in a category where emotional connection drives purchase decisions, presentation matters
        enormously. Attar bottles — small, often ornate glass vials with a dauber or roll-on
        applicator — have a strong cultural association with traditional Indian perfumery and
        are well-suited to oil-based attars, concentrated perfume oils, and natural fragrance
        blends.
      </p>
      <p className="mb-4">
        When selecting bottles for wholesale, consider the compatibility between the bottle
        material, the cap/closure, and the fragrance formula. Alcohol-based perfumes can
        interact with certain plastic cap liners over time, causing odour contamination.
        Oil-based attars are less reactive but can deposit residue on glass threads, making
        a tight-fitting metal cap preferable for long shelf life.
      </p>
      <p className="mb-4">
        Roll-on vials are particularly practical for concentrated perfume oils and attars,
        allowing controlled application. The ball applicator material (usually stainless steel
        or glass) should be specified when ordering, as different materials offer different
        roll-on smoothness and are suitable for different viscosities.
      </p>
      <p className="text-sm text-brand-charcoal/60">
        Related categories:{" "}
        <Link href="/wholesale/fragrance-oils" className="underline hover:text-brand-orange">Fragrance Oils</Link>
        {" · "}
        <Link href="/wholesale/essential-oils" className="underline hover:text-brand-orange">Essential Oils</Link>
        {" · "}
        <Link href="/wholesale/lids-caps-closures" className="underline hover:text-brand-orange">Lids, Caps &amp; Closures</Link>
      </p>
    </>
  ),

  "Diffuser Bottles & Accessories": (
    <>
      <h2 className="text-2xl font-bold font-serif text-brand-charcoal mb-4">
        Reed Diffuser Bottles & Accessories: Setting Up Your Home Fragrance Range
      </h2>
      <p className="mb-4">
        Reed diffusers are a low-complexity entry point for home fragrance brands because they
        require no flame, no electricity, and minimal user interaction. A complete diffuser
        product consists of three components: the vessel, the fragrance and carrier blend,
        and the reed sticks. The performance of the product depends on all three working together.
      </p>
      <p className="mb-4">
        Vessel neck diameter directly controls diffusion rate — a wider neck allows more reeds
        and higher evaporation. For most room sizes, a medium-diameter bottle (approximately
        2–3 cm) with 6–8 reed sticks provides a balanced throw. Very wide-mouth vessels may
        evaporate the fragrance too quickly, increasing cost of use and requiring frequent refills.
      </p>
      <p className="mb-4">
        Reed quality affects fragrance release considerably. Rattan reeds are the industry
        standard and offer consistent wicking. Fibre reeds (synthetic alternatives) often wick
        more aggressively and may be better suited to thicker carrier blends. Bamboo skewers
        are occasionally sold as a lower-cost alternative but do not wick fragrance effectively
        and should be avoided. When sourcing accessories, buy a small sample batch of reeds
        and test them with your specific carrier blend before committing to a large order.
      </p>
      <p className="text-sm text-brand-charcoal/60">
        Related categories:{" "}
        <Link href="/wholesale/fragrance-oils" className="underline hover:text-brand-orange">Fragrance Oils</Link>
        {" · "}
        <Link href="/wholesale/attar-perfume-bottles" className="underline hover:text-brand-orange">Attar &amp; Perfume Bottles</Link>
        {" · "}
        <Link href="/wholesale/candle-jars-containers" className="underline hover:text-brand-orange">Candle Jars &amp; Containers</Link>
      </p>
    </>
  ),

  "Cosmetic Jars & Bottles": (
    <>
      <h2 className="text-2xl font-bold font-serif text-brand-charcoal mb-4">
        Cosmetic Jars & Bottles for Skincare and Beauty Products
      </h2>
      <p className="mb-4">
        Packaging for cosmetics serves two functions: protecting the product from contamination
        and oxidation, and communicating the brand positioning at the moment of purchase. The
        right cosmetic container depends on your product&apos;s viscosity, preservative system,
        and intended customer experience.
      </p>
      <p className="mb-4">
        Glass jars are well-suited to premium face creams and balms where material quality
        signals luxury. However, glass adds weight and breakage risk in shipping, which affects
        fulfillment costs. PET and HDPE plastic containers offer lighter, break-resistant
        alternatives and are compatible with most emulsified and oil-based cosmetic formulas.
        Always confirm compatibility between your formula and the container material — some
        essential oils and fragrance concentrates are aggressive against certain plastics.
      </p>
      <p className="mb-4">
        Airless pump bottles are particularly useful for serums and emulsions that contain
        actives sensitive to air oxidation, as they reduce the oxygen headspace above the
        product with each pump stroke. Disc-bottom pumps or vacuum airless systems are
        more expensive but can meaningfully extend the active stability of your formulation.
      </p>
      <p className="text-sm text-brand-charcoal/60">
        Related categories:{" "}
        <Link href="/wholesale/skincare-body-bases" className="underline hover:text-brand-orange">Skincare &amp; Body Bases</Link>
        {" · "}
        <Link href="/wholesale/lids-caps-closures" className="underline hover:text-brand-orange">Lids, Caps &amp; Closures</Link>
        {" · "}
        <Link href="/wholesale/packaging-boxes-mailers" className="underline hover:text-brand-orange">Packaging Boxes</Link>
      </p>
    </>
  ),

  "Metal Containers & Tins": (
    <>
      <h2 className="text-2xl font-bold font-serif text-brand-charcoal mb-4">
        Metal Tins & Containers for Candles, Balms & Gifting
      </h2>
      <p className="mb-4">
        Metal tins are a versatile packaging option used across candle making, lip balm
        production, solid perfume, and gift sets. Their durability and recyclability make
        them appealing for brands with sustainability messaging, and the printable lid
        surface offers branding flexibility without a separate label application step.
      </p>
      <p className="mb-4">
        For candle applications, tin containers must be rated for heat exposure at the
        temperatures generated by a burning candle wick. Most standard tinplate containers
        handle this without issue, but very thin-walled decorative tins may deform at
        the base if the wax pool is shallow and the flame burns close to the bottom.
        Always conduct a full burn test on a representative sample before going to production.
      </p>
      <p className="mb-4">
        Interior coating matters for product compatibility. Uncoated tinplate may react with
        certain acidic formulas over time. If you are filling tins with products that contain
        a significant water or acid content, check whether a food-grade or cosmetic-grade
        lacquer-lined interior is available. For dry products and solid wax formulas, plain
        tinplate is generally suitable.
      </p>
      <p className="text-sm text-brand-charcoal/60">
        Related categories:{" "}
        <Link href="/wholesale/candle-waxes-additives" className="underline hover:text-brand-orange">Candle Waxes &amp; Additives</Link>
        {" · "}
        <Link href="/wholesale/candle-jars-containers" className="underline hover:text-brand-orange">Candle Jars &amp; Containers</Link>
        {" · "}
        <Link href="/wholesale/lids-caps-closures" className="underline hover:text-brand-orange">Lids, Caps &amp; Closures</Link>
      </p>
    </>
  ),

  "Wick Systems & Hardware": (
    <>
      <h2 className="text-2xl font-bold font-serif text-brand-charcoal mb-4">
        Wick Systems & Hardware: Matching Wicks to Your Candle
      </h2>
      <p className="mb-4">
        Wick selection is one of the most technically demanding aspects of candle development.
        A correctly sized wick produces a full melt pool, minimal mushrooming, acceptable
        flame height, and complete wax consumption. An undersized wick will tunnel through
        the centre of the candle; an oversized wick produces excessive soot, a high flame,
        and possible container cracking.
      </p>
      <p className="mb-4">
        Wick sizing depends on four variables: container diameter, wax type, fragrance load
        percentage, and additive content. Most wick manufacturers publish sizing charts
        organised by container diameter and wax type. These are starting points, not
        definitive answers — your specific fragrance oil and formulation will affect
        performance, so multiple wick types and sizes should always be tested against the
        actual finished formula.
      </p>
      <p className="mb-4">
        Wick hardware — sustainers (metal tabs), wick centring bars, and wick stickers —
        are simple tools that improve production consistency. A properly crimped sustainer
        holds the wick upright at the exact bottom centre of the container throughout the
        pour and cooling cycle. Wick centring bars prevent wick drift in wide-diameter containers.
        Buying these as a bundled system from a single supplier simplifies inventory management.
      </p>
      <p className="text-sm text-brand-charcoal/60">
        Related categories:{" "}
        <Link href="/wholesale/candle-waxes-additives" className="underline hover:text-brand-orange">Candle Waxes &amp; Additives</Link>
        {" · "}
        <Link href="/wholesale/candle-jars-containers" className="underline hover:text-brand-orange">Candle Jars &amp; Containers</Link>
        {" · "}
        <Link href="/wholesale/candle-pillar-moulds" className="underline hover:text-brand-orange">Candle &amp; Pillar Moulds</Link>
      </p>
    </>
  ),

  "Soap Making Tools": (
    <>
      <h2 className="text-2xl font-bold font-serif text-brand-charcoal mb-4">
        Soap Making Tools for Consistent Batch Production
      </h2>
      <p className="mb-4">
        Consistent soap production at any scale depends on accurate measurement, controlled
        temperatures, and reliable mixing and cutting equipment. While soap making can begin
        with basic kitchen utensils, scaling to a production environment requires tools built
        for repeated use, easy cleaning, and dimensional accuracy.
      </p>
      <p className="mb-4">
        For cold-process soap, the most critical tool investments are a calibrated digital
        scale, a stick blender for emulsification, and a reliable thermometer for lye and
        oil temperatures. For melt-and-pour production, a pour pot with a handle and a
        pouring spout significantly reduces mess and improves accuracy when filling individual
        cavity moulds. Soap cutters — wire, mitre, or multi-bar guillotine types — produce
        bars with straight, consistent cuts and are essential for retail-quality presentation.
      </p>
      <p className="mb-4">
        Safety equipment is non-negotiable for cold-process production, which involves
        handling sodium hydroxide (NaOH). Gloves, goggles, and a dedicated lye mixing
        container are the minimum requirements. Never mix lye in aluminium containers,
        as the reaction will release hydrogen gas.
      </p>
      <p className="text-sm text-brand-charcoal/60">
        Related categories:{" "}
        <Link href="/wholesale/artisan-soap-bases" className="underline hover:text-brand-orange">Artisan Soap Bases</Link>
        {" · "}
        <Link href="/wholesale/soap-bar-moulds" className="underline hover:text-brand-orange">Soap &amp; Bar Moulds</Link>
        {" · "}
        <Link href="/wholesale/dried-botanicals-additives" className="underline hover:text-brand-orange">Dried Botanicals</Link>
      </p>
    </>
  ),

  "Dried Botanicals & Additives": (
    <>
      <h2 className="text-2xl font-bold font-serif text-brand-charcoal mb-4">
        Dried Botanicals & Additives for Soap, Candles & Retail Presentation
      </h2>
      <p className="mb-4">
        Dried botanicals — flowers, herbs, citrus slices, seed pods, and plant material —
        are used as embedded decorative elements in soaps and wax products, as surface
        garnishes, and as visual merchandising components in gift packaging. Their primary
        function in finished products is aesthetic.
      </p>
      <p className="mb-4">
        In soap applications, botanical embeds will eventually brown or discolour during
        the alkaline saponification process in cold-process soap, or oxidise over the
        product shelf life. This is an inherent characteristic of natural plant material
        in an alkaline environment and is not a defect. For melt-and-pour soap, the lower
        pH and short processing time preserves botanical colour better, though surface
        flowers should still be expected to fade over time.
      </p>
      <p className="mb-4">
        In candle applications, botanicals placed on the wax surface are a fire safety
        consideration. Only use non-combustible botanicals (coated or pressed herb fronds,
        dried citrus, crystals) and never embed botanicals deeply in the wax near the wick.
        Always conduct burn tests with botanicals in place and follow relevant fire safety
        guidelines for your market. For packaging and gifting applications, dried botanicals
        present no combustion risk and can be used freely.
      </p>
      <p className="text-sm text-brand-charcoal/60">
        Related categories:{" "}
        <Link href="/wholesale/artisan-soap-bases" className="underline hover:text-brand-orange">Artisan Soap Bases</Link>
        {" · "}
        <Link href="/wholesale/candle-waxes-additives" className="underline hover:text-brand-orange">Candle Waxes</Link>
        {" · "}
        <Link href="/wholesale/gift-bags-pouches" className="underline hover:text-brand-orange">Gift Bags &amp; Pouches</Link>
      </p>
    </>
  ),
};
