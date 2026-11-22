import { describe, it, expect } from 'vitest';
import {
  calculateItemPrice,
  calculateItemPricePaise,
  inrToPaise,
  paiseToINR,
  normalizeTierPriceToPaise,
  normalizeTierPriceToRupees,
  normalizeTierPriceToINR,
  normalizeProductBasePriceToINR,
  TEMP_FLAT_SHIPPING_CHARGE,
} from '@/lib/pricing';

describe('Product Pricing Consistency Suite', () => {
  describe('Unit Normalization: normalizeTierPriceToPaise & normalizeTierPriceToRupees', () => {
    it('correctly converts Rupee-denominated tiers to Paise and Rupees', () => {
      // Product 2408 (NEEM TULSI SOAP BASE): Base = 24000 paise (₹240)
      const basePaise = 24000;
      
      // Tier 1: 240 (rupees)
      expect(normalizeTierPriceToPaise(240, basePaise)).toBe(24000);
      expect(normalizeTierPriceToRupees(240, basePaise)).toBe(240);

      // Tier 2: 155 (rupees)
      expect(normalizeTierPriceToPaise(155, basePaise)).toBe(15500);
      expect(normalizeTierPriceToRupees(155, basePaise)).toBe(155);

      // Tier 3: 140 (rupees)
      expect(normalizeTierPriceToPaise(140, basePaise)).toBe(14000);
      expect(normalizeTierPriceToRupees(140, basePaise)).toBe(140);
    });

    it('correctly handles Paise-denominated tiers without double-converting', () => {
      // Product 574 (Neem & Tulsi Fragrance Oil): Base = 11000 paise (₹110)
      const basePaise = 11000;

      // Tier 1: 11000 (paise)
      expect(normalizeTierPriceToPaise(11000, basePaise)).toBe(11000);
      expect(normalizeTierPriceToRupees(11000, basePaise)).toBe(110);

      // Tier 2: 10400 (paise)
      expect(normalizeTierPriceToPaise(10400, basePaise)).toBe(10400);
      expect(normalizeTierPriceToRupees(10400, basePaise)).toBe(104);

      // Tier 3: 9900 (paise)
      expect(normalizeTierPriceToPaise(9900, basePaise)).toBe(9900);
      expect(normalizeTierPriceToRupees(9900, basePaise)).toBe(99);
    });

    it('handles low-cost products accurately (e.g. ₹5 base price)', () => {
      // Base = 500 paise (₹5)
      const basePaise = 500;

      // Tier in rupees: 4
      expect(normalizeTierPriceToPaise(4, basePaise)).toBe(400);
      expect(normalizeTierPriceToRupees(4, basePaise)).toBe(4);

      // Tier in paise: 400
      expect(normalizeTierPriceToPaise(400, basePaise)).toBe(400);
      expect(normalizeTierPriceToRupees(400, basePaise)).toBe(4);
    });

    it('safely handles zero, negative, and null values', () => {
      expect(normalizeTierPriceToPaise(0, 24000)).toBe(0);
      expect(normalizeTierPriceToPaise(-50, 24000)).toBe(0);
      expect(normalizeTierPriceToPaise(NaN, 24000)).toBe(0);
      expect(normalizeTierPriceToRupees(0, 24000)).toBe(0);
    });
  });

  describe('Product 2408 (NEEM TULSI SOAP BASE) End-to-End Consistency', () => {
    // Database product record representation (stored in paise in DB)
    const product2408 = {
      id: '2408',
      title: 'NEEM TULSI SOAP BASE',
      source: 'CATALOG',
      price: 24000, // 24000 paise = ₹240.00
      customerPrice: 24000,
      wholesaleTiers: [
        { minQty: 1, maxQty: 24, price: 240, discountPct: 0 },
        { minQty: 25, maxQty: 49, price: 155, discountPct: 35.4 },
        { minQty: 50, maxQty: null, price: 140, discountPct: 41.7 },
      ],
    };

    it('verifies base price normalizes to ₹240 INR', () => {
      expect(normalizeProductBasePriceToINR(product2408)).toBe(240);
    });

    it('verifies Qty 1 displayed price on product detail page equals ₹240 (never ₹2.40 or ₹2)', () => {
      const basePriceINR = normalizeProductBasePriceToINR(product2408);
      const detailTiers = product2408.wholesaleTiers.map(t => ({
        ...t,
        price: normalizeTierPriceToINR(Number(t.price), basePriceINR),
      }));

      // At Qty 1, tier 1 is selected
      const qty1Tier = detailTiers.find(t => 1 >= t.minQty && (t.maxQty === null || 1 <= t.maxQty));
      expect(qty1Tier).toBeDefined();
      expect(qty1Tier?.price).toBe(240); // Must be ₹240, NOT ₹2.40
    });

    it('verifies cart unit price equals ₹240 INR for Qty 1', () => {
      const unitPriceINR = calculateItemPrice(product2408, 1);
      expect(unitPriceINR).toBe(240); // ₹240.00, NOT ₹2.40
      expect(inrToPaise(unitPriceINR)).toBe(24000);
    });

    it('verifies cart subtotal for Qty 1 is ₹240 INR', () => {
      const qty = 1;
      const unitPriceINR = calculateItemPrice(product2408, qty);
      const subtotalINR = unitPriceINR * qty;
      expect(subtotalINR).toBe(240);
      expect(inrToPaise(subtotalINR)).toBe(24000);
    });

    it('activates tier 2 bulk pricing (₹155) ONLY at quantity >= 25', () => {
      // Boundary test: Qty 24 should still be ₹240
      expect(calculateItemPrice(product2408, 24)).toBe(240);

      // Boundary test: Qty 25 activates ₹155 tier
      expect(calculateItemPrice(product2408, 25)).toBe(155);

      // Boundary test: Qty 49 is ₹155
      expect(calculateItemPrice(product2408, 49)).toBe(155);
    });

    it('activates tier 3 bulk pricing (₹140) ONLY at quantity >= 50', () => {
      // Boundary test: Qty 50 activates ₹140 tier
      expect(calculateItemPrice(product2408, 50)).toBe(140);

      // Qty 100 remains in tier 3
      expect(calculateItemPrice(product2408, 100)).toBe(140);
    });

    it('verifies checkout payable and Razorpay amount consistency', () => {
      const qty = 1;
      const unitPriceINR = calculateItemPrice(product2408, qty);
      const subtotalINR = unitPriceINR * qty;
      const shippingINR = TEMP_FLAT_SHIPPING_CHARGE; // ₹90

      const checkoutPayableINR = subtotalINR + shippingINR;
      expect(checkoutPayableINR).toBe(330); // ₹330.00

      // Razorpay order creation options.amount strictly equals checkout payable amount in integer paise
      const razorpayAmount = inrToPaise(checkoutPayableINR);
      expect(razorpayAmount).toBe(33000);
      expect(razorpayAmount).toBe((240 + TEMP_FLAT_SHIPPING_CHARGE) * 100);
    });
  });

  describe('Paise-Tier Products (e.g. Product 574) Consistency', () => {
    const product574 = {
      id: '574',
      title: 'Neem & Tulsi Fragrance Oil',
      source: 'CATALOG',
      price: 11000, // ₹110
      customerPrice: 11000,
      wholesaleTiers: [
        { minQty: 1, maxQty: 9, price: 11000, discountPct: 0 },
        { minQty: 10, maxQty: 49, price: 10400, discountPct: 5 },
        { minQty: 50, maxQty: null, price: 9900, discountPct: 10 },
      ],
    };

    it('correctly calculates prices in INR across all tiers', () => {
      expect(calculateItemPrice(product574, 1)).toBe(110);
      expect(inrToPaise(calculateItemPrice(product574, 1))).toBe(11000);

      expect(calculateItemPrice(product574, 9)).toBe(110);
      expect(calculateItemPrice(product574, 10)).toBe(104);
      expect(inrToPaise(calculateItemPrice(product574, 10))).toBe(10400);

      expect(calculateItemPrice(product574, 50)).toBe(99);
      expect(inrToPaise(calculateItemPrice(product574, 50))).toBe(9900);
    });
  });

  describe('Products with Tiers Starting at minQty > 1', () => {
    const productNoTier1 = {
      id: '9999',
      title: 'Bulk Only Product',
      source: 'CATALOG',
      price: 20000, // ₹200 base price in paise
      customerPrice: 20000,
      wholesaleTiers: [
        { minQty: 10, maxQty: 49, price: 180, discountPct: 10 },
        { minQty: 50, maxQty: null, price: 150, discountPct: 25 },
      ],
    };

    it('strictly charges base price (₹200) when quantity is less than the lowest tier (minQty: 10)', () => {
      expect(calculateItemPrice(productNoTier1, 1)).toBe(200);
      expect(calculateItemPrice(productNoTier1, 9)).toBe(200);

      // Activates at 10
      expect(calculateItemPrice(productNoTier1, 10)).toBe(180);
    });
  });

  describe('Safeguard Against Zero-Price Tiers', () => {
    const productWithCorruptTier = {
      id: '8888',
      title: 'Corrupt Tier Product',
      source: 'CATALOG',
      price: 50000, // ₹500
      customerPrice: 50000,
      wholesaleTiers: [
        { minQty: 1, maxQty: 9, price: 0, discountPct: 0 }, // Corrupt 0-price tier
        { minQty: 10, maxQty: 49, price: 450, discountPct: 10 },
      ],
    };

    it('ignores 0-price tiers and preserves base price', () => {
      // Qty 1 should ignore the 0 tier and fall back to base price ₹500
      expect(calculateItemPrice(productWithCorruptTier, 1)).toBe(500);

      // Qty 10 should correctly use the valid tier ₹450
      expect(calculateItemPrice(productWithCorruptTier, 10)).toBe(450);
    });
  });

  describe('CRITICAL P0: Incident Verification & Safeguard Suite', () => {
    const product49 = {
      id: '2629',
      title: 'Soy Wax Flakes 100g (Sample Pack)',
      source: 'SCRAPER',
      price: 49, // Stored in rupees
      customerPrice: 49,
      wholesaleTiers: [],
    };

    const product91 = {
      id: '2668',
      title: 'Cotton Candle Wicks (Pack of 50)',
      source: 'SCRAPER',
      price: 91, // Stored in rupees
      customerPrice: 91,
      wholesaleTiers: [],
    };

    const product20 = {
      id: '2933',
      title: 'Safety Warning Stickers (Sheet of 10)',
      source: 'SCRAPER',
      price: 20, // Stored in rupees
      customerPrice: 20,
      wholesaleTiers: [],
    };

    it('guarantees ₹49 = ₹49 (never ₹0.49)', () => {
      expect(calculateItemPrice(product49, 1)).toBe(49);
      expect(normalizeProductBasePriceToINR(product49)).toBe(49);
    });

    it('guarantees ₹91 = ₹91 (never ₹0.91)', () => {
      expect(calculateItemPrice(product91, 1)).toBe(91);
      expect(normalizeProductBasePriceToINR(product91)).toBe(91);
    });

    it('guarantees ₹20 = ₹20 (never ₹0.20)', () => {
      expect(calculateItemPrice(product20, 1)).toBe(20);
      expect(normalizeProductBasePriceToINR(product20)).toBe(20);
    });

    it('guarantees 10 × ₹49 = ₹490', () => {
      const unit = calculateItemPrice(product49, 10);
      expect(unit).toBe(49);
      expect(unit * 10).toBe(490);
    });

    it('guarantees ₹49 INR = 4900 paise at Razorpay boundary', () => {
      const priceINR = calculateItemPrice(product49, 1);
      const razorpayPaise = inrToPaise(priceINR);
      expect(razorpayPaise).toBe(4900);
    });

    it('guarantees ₹91 INR = 9100 paise and ₹20 INR = 2000 paise at Razorpay boundary', () => {
      expect(inrToPaise(calculateItemPrice(product91, 1))).toBe(9100);
      expect(inrToPaise(calculateItemPrice(product20, 1))).toBe(2000);
    });
  });

  describe('Seller and Official Products Real-World Accuracy', () => {
    // Real SELLER mould products (stored in Rupees in DB)
    const sellerWCM579 = {
      id: 'aa7e2263-b203-41f9-89b7-ba8f1a7f7bdf',
      title: 'Yellow Angel Girl Mold | WCM579 - 1',
      source: 'SELLER',
      price: 358,
      customerPrice: null,
      wholesaleTiers: [
        { price: 358, minQty: 1, maxQty: 9, discountPct: 0 },
        { price: 340, minQty: 10, maxQty: 49, discountPct: 5 },
        { price: 322, minQty: 50, maxQty: null, discountPct: 10 },
      ],
    };

    const sellerWCM850 = {
      id: 'wcm850-big',
      title: 'Turtle Silicone Mould | WCM850 - BIG',
      source: 'SELLER',
      price: 377,
      customerPrice: null,
      wholesaleTiers: [
        { price: 377, minQty: 1, maxQty: 9, discountPct: 0 },
        { price: 358, minQty: 10, maxQty: 49, discountPct: 5 },
      ],
    };

    const sellerWCM444 = {
      id: 'wcm444-1',
      title: 'Teddy On Plum | WCM444 - 1',
      source: 'SELLER',
      price: 532,
      customerPrice: null,
      wholesaleTiers: [
        { price: 532, minQty: 1, maxQty: 9, discountPct: 0 },
        { price: 505, minQty: 10, maxQty: 49, discountPct: 5 },
      ],
    };

    // Real EKORA_OFFICIAL products (stored in paise in DB)
    const officialGardenia304 = {
      id: '304',
      title: '3D GARDENIA JASMINE SILICONE MOLD',
      source: 'EKORA_OFFICIAL',
      price: 28000,
      customerPrice: 28000,
      wholesaleTiers: [
        { price: 28000, minQty: 1, maxQty: 9, discountPct: 0 },
        { price: 26500, minQty: 10, maxQty: 49, discountPct: 5 },
        { price: 25100, minQty: 50, maxQty: null, discountPct: 10 },
      ],
    };

    const officialSoyWax854 = {
      id: '854',
      title: '464 Soy Wax Natural Soy Wax Granule for Candle Making',
      source: 'EKORA_OFFICIAL',
      price: 38000,
      customerPrice: 38000,
      wholesaleTiers: [
        { price: 38000, minQty: 1, maxQty: 11, discountPct: 0 },
        { price: 34200, minQty: 12, maxQty: 51, discountPct: 10 },
        { price: 32300, minQty: 52, maxQty: null, discountPct: 15 },
      ],
    };

    it('normalizes SELLER moulds to exact Rupee prices (never ₹3.58, ₹3.77, or ₹5.32)', () => {
      expect(normalizeProductBasePriceToINR(sellerWCM579)).toBe(358);
      expect(normalizeProductBasePriceToINR(sellerWCM850)).toBe(377);
      expect(normalizeProductBasePriceToINR(sellerWCM444)).toBe(532);

      expect(calculateItemPrice(sellerWCM579, 1)).toBe(358);
      expect(calculateItemPrice(sellerWCM579, 10)).toBe(340);
      expect(calculateItemPrice(sellerWCM579, 50)).toBe(322);

      expect(calculateItemPrice(sellerWCM850, 1)).toBe(377);
      expect(calculateItemPrice(sellerWCM444, 1)).toBe(532);
    });

    it('normalizes EKORA_OFFICIAL products from paise to Rupees (never ₹28,000 or ₹38,000)', () => {
      expect(normalizeProductBasePriceToINR(officialGardenia304)).toBe(280);
      expect(normalizeProductBasePriceToINR(officialSoyWax854)).toBe(380);

      expect(calculateItemPrice(officialGardenia304, 1)).toBe(280);
      expect(calculateItemPrice(officialGardenia304, 10)).toBe(265);
      expect(calculateItemPrice(officialGardenia304, 50)).toBe(251);

      expect(calculateItemPrice(officialSoyWax854, 1)).toBe(380);
      expect(calculateItemPrice(officialSoyWax854, 12)).toBe(342);
      expect(calculateItemPrice(officialSoyWax854, 52)).toBe(323);
    });
  });

  describe('Live Screenshot Reported Products Exact Reproduction & Safeguard Suite', () => {
    // 1. Goat Milk Soap Base (Product 2406 / CATALOG: 22500 paise = ₹225)
    const goatMilkSoapBase = {
      id: '2406',
      title: 'GOAT MILK SOAP BASE',
      source: 'CATALOG',
      price: 22500,
      customerPrice: 22500,
      wholesaleTiers: [
        { minQty: 1, maxQty: 24, price: 225, discountPct: 0 },
        { minQty: 25, maxQty: 49, price: 210, discountPct: 6.7 },
        { minQty: 50, maxQty: null, price: 195, discountPct: 13.3 },
      ],
    };

    // 2. Aloe Vera Soap Base (Product 2410 / CATALOG: 24000 paise = ₹240)
    const aloeVeraSoapBase = {
      id: '2410',
      title: 'ALOE VERA SOAP BASE',
      source: 'CATALOG',
      price: 24000,
      customerPrice: 24000,
      wholesaleTiers: [
        { minQty: 1, maxQty: 24, price: 240, discountPct: 0 },
        { minQty: 25, maxQty: null, price: 220, discountPct: 8.3 },
      ],
    };

    // 3. Charcoal Soap Base (Product 2409 / CATALOG: 24000 paise = ₹240)
    const charcoalSoapBase = {
      id: '2409',
      title: 'CHARCOAL SOAP BASE',
      source: 'CATALOG',
      price: 24000,
      customerPrice: 24000,
      wholesaleTiers: [
        { minQty: 1, maxQty: 24, price: 240, discountPct: 0 },
        { minQty: 25, maxQty: null, price: 220, discountPct: 8.3 },
      ],
    };

    // 4. Tuberose Fragrance Oil (Product 575 / CATALOG: 11000 paise = ₹110)
    const tuberoseFragranceOil = {
      id: '575',
      title: 'Tuberose Fragrance Oil',
      source: 'CATALOG',
      price: 11000,
      customerPrice: 11000,
      wholesaleTiers: [
        { minQty: 1, maxQty: 9, price: 11000, discountPct: 0 },
        { minQty: 10, maxQty: 49, price: 10400, discountPct: 5.5 },
      ],
    };

    // 5. Triple Butter Soap Base (Product 2414 / CATALOG: 34600 paise or ₹346)
    const tripleButterSoapBase = {
      id: '2414',
      title: 'TRIPLE BUTTER SOAP BASE',
      source: 'CATALOG',
      price: 34600,
      customerPrice: 34600,
      wholesaleTiers: [
        { minQty: 1, maxQty: 24, price: 346, discountPct: 0 },
        { minQty: 25, maxQty: null, price: 320, discountPct: 7.5 },
      ],
    };

    // 6. Honey And Milk Fragrance Oil (Product 572 / CATALOG: 11000 paise = ₹110)
    const honeyAndMilkFragranceOil = {
      id: '572',
      title: 'Honey And Milk Fragrance Oil',
      source: 'CATALOG',
      price: 11000,
      customerPrice: 11000,
      wholesaleTiers: [
        { minQty: 1, maxQty: 9, price: 110, discountPct: 0 },
      ],
    };

    // 7. Saffron Cedar Fragrance Oil (Product 578 / CATALOG: 11000 paise = ₹110)
    const saffronCedarFragranceOil = {
      id: '578',
      title: 'Saffron Cedar Fragrance Oil',
      source: 'CATALOG',
      price: 11000,
      customerPrice: 11000,
      wholesaleTiers: [],
    };

    // 8. Gili Mitti Fragrance Oil (Product 582 / CATALOG: 13000 paise = ₹130)
    const giliMittiFragranceOil = {
      id: '582',
      title: 'Gili Mitti Fragrance Oil',
      source: 'CATALOG',
      price: 13000,
      customerPrice: 13000,
      wholesaleTiers: [],
    };

    // 9. Masala Chai Fragrance Oil (Product 585 / CATALOG: 11000 paise = ₹110)
    const masalaChaiFragranceOil = {
      id: '585',
      title: 'Masala Chai Fragrance Oil',
      source: 'CATALOG',
      price: 11000,
      customerPrice: 11000,
      wholesaleTiers: [],
    };

    // 10. Soy Pillar Blended Wax (Product 859 / EKORA_OFFICIAL: 33500 paise = ₹335)
    const soyPillarBlendedWax = {
      id: '859',
      title: 'Soy Pillar Blended Wax',
      source: 'EKORA_OFFICIAL',
      price: 33500,
      customerPrice: 33500,
      wholesaleTiers: [
        { minQty: 1, maxQty: 4, price: 33500, discountPct: 0 },
        { minQty: 5, maxQty: 19, price: 33500, discountPct: 0 },
        { minQty: 20, maxQty: null, price: 31000, discountPct: 7.5 },
      ],
    };

    // 11. Low cost item (₹60 item)
    const lowCostItem60 = {
      id: '3001',
      title: 'Small Measuring Spoon Set',
      source: 'SCRAPER',
      price: 60,
      customerPrice: 60,
      wholesaleTiers: [],
    };

    it('reproduces and prevents Goat Milk Soap Base ₹2.25 bug -> verifies ₹225', () => {
      expect(normalizeProductBasePriceToINR(goatMilkSoapBase)).toBe(225);
      expect(calculateItemPrice(goatMilkSoapBase, 1)).toBe(225);
      expect(inrToPaise(calculateItemPrice(goatMilkSoapBase, 1))).toBe(22500);
      expect(calculateItemPrice(goatMilkSoapBase, 1)).not.toBe(2.25);
    });

    it('reproduces and prevents Aloe Vera Soap Base ₹2.40 bug -> verifies ₹240', () => {
      expect(normalizeProductBasePriceToINR(aloeVeraSoapBase)).toBe(240);
      expect(calculateItemPrice(aloeVeraSoapBase, 1)).toBe(240);
      expect(inrToPaise(calculateItemPrice(aloeVeraSoapBase, 1))).toBe(24000);
      expect(calculateItemPrice(aloeVeraSoapBase, 1)).not.toBe(2.40);
    });

    it('reproduces and prevents Charcoal Soap Base ₹2.40 bug -> verifies ₹240', () => {
      expect(normalizeProductBasePriceToINR(charcoalSoapBase)).toBe(240);
      expect(calculateItemPrice(charcoalSoapBase, 1)).toBe(240);
      expect(inrToPaise(calculateItemPrice(charcoalSoapBase, 1))).toBe(24000);
      expect(calculateItemPrice(charcoalSoapBase, 1)).not.toBe(2.40);
    });

    it('reproduces and prevents Tuberose Fragrance Oil ₹1.10 bug -> verifies ₹110', () => {
      expect(normalizeProductBasePriceToINR(tuberoseFragranceOil)).toBe(110);
      expect(calculateItemPrice(tuberoseFragranceOil, 1)).toBe(110);
      expect(inrToPaise(calculateItemPrice(tuberoseFragranceOil, 1))).toBe(11000);
      expect(calculateItemPrice(tuberoseFragranceOil, 1)).not.toBe(1.10);
    });

    it('reproduces and prevents Triple Butter Soap Base ₹3.46 bug -> verifies ₹346', () => {
      expect(normalizeProductBasePriceToINR(tripleButterSoapBase)).toBe(346);
      expect(calculateItemPrice(tripleButterSoapBase, 1)).toBe(346);
      expect(inrToPaise(calculateItemPrice(tripleButterSoapBase, 1))).toBe(34600);
      expect(calculateItemPrice(tripleButterSoapBase, 1)).not.toBe(3.46);
    });

    it('reproduces and prevents Honey & Milk Fragrance Oil ₹1.10 bug -> verifies ₹110', () => {
      expect(normalizeProductBasePriceToINR(honeyAndMilkFragranceOil)).toBe(110);
      expect(calculateItemPrice(honeyAndMilkFragranceOil, 1)).toBe(110);
      expect(inrToPaise(calculateItemPrice(honeyAndMilkFragranceOil, 1))).toBe(11000);
      expect(calculateItemPrice(honeyAndMilkFragranceOil, 1)).not.toBe(1.10);
    });

    it('reproduces and prevents Saffron Cedar Fragrance Oil ₹1.10 bug -> verifies ₹110', () => {
      expect(normalizeProductBasePriceToINR(saffronCedarFragranceOil)).toBe(110);
      expect(calculateItemPrice(saffronCedarFragranceOil, 1)).toBe(110);
      expect(inrToPaise(calculateItemPrice(saffronCedarFragranceOil, 1))).toBe(11000);
      expect(calculateItemPrice(saffronCedarFragranceOil, 1)).not.toBe(1.10);
    });

    it('reproduces and prevents Gili Mitti Fragrance Oil ₹1.30 bug -> verifies ₹130', () => {
      expect(normalizeProductBasePriceToINR(giliMittiFragranceOil)).toBe(130);
      expect(calculateItemPrice(giliMittiFragranceOil, 1)).toBe(130);
      expect(inrToPaise(calculateItemPrice(giliMittiFragranceOil, 1))).toBe(13000);
      expect(calculateItemPrice(giliMittiFragranceOil, 1)).not.toBe(1.30);
    });

    it('reproduces and prevents Masala Chai Fragrance Oil ₹1.10 bug -> verifies ₹110', () => {
      expect(normalizeProductBasePriceToINR(masalaChaiFragranceOil)).toBe(110);
      expect(calculateItemPrice(masalaChaiFragranceOil, 1)).toBe(110);
      expect(inrToPaise(calculateItemPrice(masalaChaiFragranceOil, 1))).toBe(11000);
      expect(calculateItemPrice(masalaChaiFragranceOil, 1)).not.toBe(1.10);
    });

    it('reproduces and prevents Soy Pillar Blended Wax ₹16.75 for 5 units -> verifies ₹335/unit and ₹1,675 total', () => {
      const unitPrice = calculateItemPrice(soyPillarBlendedWax, 5);
      expect(unitPrice).toBe(335); // ₹335, NEVER ₹3.35
      expect(unitPrice * 5).toBe(1675); // ₹1,675, NEVER ₹16.75
      expect(inrToPaise(unitPrice * 5)).toBe(167500); // 167,500 paise, NEVER 1675 paise
    });

    it('verifies low cost ₹60 item normalizes to ₹60 (never ₹0.60)', () => {
      expect(normalizeProductBasePriceToINR(lowCostItem60)).toBe(60);
      expect(calculateItemPrice(lowCostItem60, 1)).toBe(60);
      expect(inrToPaise(calculateItemPrice(lowCostItem60, 1))).toBe(6000);
    });
  });
});
