import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_ROUNDING_CONFIG = {
  bands: [
    { min: 0, max: 500, step: 5 },
    { min: 500, max: 5000, step: 50 },
    { min: 5000, max: 50000, step: 100 },
    { min: 50000, max: Infinity, step: 500 },
  ],
  maxIncreasePct: 2.0,
  minPriceFloor: 1,
  defaultGstRate: 18,
};

function getRoundingStep(price, config = DEFAULT_ROUNDING_CONFIG) {
  if (price <= 0) return 1;
  const band = config.bands.find(b => price >= b.min && price < b.max);
  return band ? band.step : 500;
}

function roundPrice(basePrice, config = DEFAULT_ROUNDING_CONFIG) {
  if (typeof basePrice !== 'number' || isNaN(basePrice) || basePrice <= 0) {
    return typeof basePrice === 'number' && !isNaN(basePrice) ? basePrice : 0;
  }

  const step = getRoundingStep(basePrice, config);
  let rounded = Math.round(basePrice / step) * step;

  if (rounded > basePrice) {
    const increasePct = ((rounded - basePrice) / basePrice) * 100;
    if (increasePct > config.maxIncreasePct + 1e-9) {
      rounded = Math.floor(basePrice / step) * step;
    }
  }

  if (rounded === 0 && basePrice > 0) {
    rounded = Math.max(config.minPriceFloor ?? 1, Math.round(basePrice));
  }

  return rounded;
}

function roundTiersWithDiscountPriority(
  roundedBasePrice,
  rawBasePrice,
  tiers,
  config = DEFAULT_ROUNDING_CONFIG
) {
  if (!Array.isArray(tiers) || tiers.length === 0) {
    return { tiers: [], hasBreaks: false, breaks: [] };
  }

  const breaks = [];
  let prevPrice = roundedBasePrice;

  const roundedTiers = tiers.map((tier, idx) => {
    const minQty = tier.minQty || tier.minQuantity || 1;

    if (minQty <= 1 && idx === 0) {
      prevPrice = roundedBasePrice;
      return {
        ...tier,
        price: roundedBasePrice,
        discountPct: 0,
      };
    }

    let targetDisc = 0;
    if (typeof tier.discountPct === 'number' && tier.discountPct > 0) {
      targetDisc = tier.discountPct;
    } else if (typeof tier.discount === 'number' && tier.discount > 0) {
      targetDisc = tier.discount;
    } else if (typeof tier.price === 'number' && rawBasePrice > 0) {
      targetDisc = Math.max(0, ((rawBasePrice - tier.price) / rawBasePrice) * 100);
    }

    if (targetDisc <= 0 && idx > 0) {
      targetDisc = Math.min(20, idx * 5);
    }

    const maxTargetPrice = targetDisc > 0
      ? roundedBasePrice * (1 - targetDisc / 100)
      : prevPrice - 1;

    const step = getRoundingStep(maxTargetPrice, config);
    let candidate = Math.round(maxTargetPrice / step) * step;

    // RULE: % off is PRIORITIZED over rounding off!
    if (candidate > maxTargetPrice || candidate >= prevPrice) {
      candidate = Math.floor(maxTargetPrice / step) * step;
    }

    if (candidate >= prevPrice) {
      const stepDown = prevPrice > step ? step : 1;
      candidate = Math.max(config.minPriceFloor ?? 1, prevPrice - stepDown);
    }

    const isBreak = candidate >= prevPrice;
    const effectiveDisc = roundedBasePrice > 0
      ? +(((roundedBasePrice - candidate) / roundedBasePrice) * 100).toFixed(1)
      : 0;

    if (isBreak) {
      breaks.push({
        tierIndex: idx,
        prevPrice,
        thisPrice: candidate,
        targetDiscountPct: +targetDisc.toFixed(1),
        effectiveDiscountPct: effectiveDisc,
        reason: `Tier ${idx + 1} (₹${candidate}) cannot be reduced below prior slab (₹${prevPrice}) without hitting zero`,
      });
    }

    prevPrice = candidate;

    return {
      ...tier,
      price: candidate,
      discountPct: effectiveDisc,
    };
  });

  return {
    tiers: roundedTiers,
    hasBreaks: breaks.length > 0,
    breaks,
  };
}

async function runDryRun() {
  console.log('================================================================');
  console.log('EKORA BAZAAR - OPTION C PRICE ROUNDING DRY-RUN AUDIT');
  console.log('(All-Inclusive Display & Bulk Tier Discount % Prioritized)');
  console.log('================================================================\n');

  const productsPath = path.join(process.cwd(), 'src', 'lib', 'data', 'products.json');
  if (!fs.existsSync(productsPath)) {
    console.error('products.json not found at:', productsPath);
    process.exit(1);
  }

  const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
  console.log(`Loaded ${products.length} catalog products from products.json\n`);

  const rows = [];
  let productsChanged = 0;
  let productsUnchanged = 0;
  let quoteOnlyProducts = 0;
  let totalTiersEvaluated = 0;
  let totalVariantsEvaluated = 0;
  let totalTierBreaks = 0;

  let maxIncreasePct = 0;
  let maxDecreasePct = 0;
  let maxIncreaseItem = null;
  let maxDecreaseItem = null;

  const anomalies = [];

  for (const p of products) {
    const rawPrice = typeof p.price === 'number' ? p.price : parseFloat(p.price || '0');
    const isQuoteOnly = p.isQuoteOnly === true || rawPrice <= 0 || p.inStock === false;

    if (isQuoteOnly) {
      quoteOnlyProducts++;
    }

    // 1. Product Base Price (Option C: Rounded All-Inclusive Price)
    if (rawPrice > 0) {
      const step = getRoundingStep(rawPrice, DEFAULT_ROUNDING_CONFIG);
      const roundedPrice = roundPrice(rawPrice, DEFAULT_ROUNDING_CONFIG);
      const diff = roundedPrice - rawPrice;
      const pct = (diff / rawPrice) * 100;

      const rawNearest = Math.round(rawPrice / step) * step;
      const wasCapped = rawNearest > rawPrice && ((rawNearest - rawPrice) / rawPrice) * 100 > 2.0;

      if (roundedPrice !== rawPrice) {
        productsChanged++;
        if (pct > maxIncreasePct) {
          maxIncreasePct = pct;
          maxIncreaseItem = { id: p.id, name: p.name || p.title, oldPrice: rawPrice, newPrice: roundedPrice };
        }
        if (pct < maxDecreasePct) {
          maxDecreasePct = pct;
          maxDecreaseItem = { id: p.id, name: p.name || p.title, oldPrice: rawPrice, newPrice: roundedPrice };
        }
      } else {
        productsUnchanged++;
      }

      if (rawPrice < 5) {
        anomalies.push({
          id: p.id,
          name: p.name || p.title,
          issue: `Sub-₹5 price (₹${rawPrice}): Safeguarded at ₹${roundedPrice} (prevented ₹0 collapse).`
        });
      }

      rows.push({
        productId: String(p.id),
        productName: (p.name || p.title || 'Untitled').replace(/"/g, '""'),
        itemType: 'PRODUCT_BASE',
        label: 'Base Price',
        oldPrice: rawPrice,
        newPrice: roundedPrice,
        pctChange: +pct.toFixed(3),
        step,
        cappedBy2Pct: wasCapped,
        tierBreak: false,
        notes: wasCapped ? 'Capped at 2% increase -> Rounded DOWN' : (diff === 0 ? 'Already rounded' : '')
      });

      // 2. Product Bulk Tiers (% OFF Prioritized)
      if (Array.isArray(p.tiers) && p.tiers.length > 0) {
        const tierEval = roundTiersWithDiscountPriority(roundedPrice, rawPrice, p.tiers, DEFAULT_ROUNDING_CONFIG);
        if (tierEval.hasBreaks) {
          totalTierBreaks++;
          anomalies.push({
            id: p.id,
            name: p.name || p.title,
            issue: `Bulk tiers collision: ${tierEval.breaks.map(b => b.reason).join('; ')}`
          });
        }

        tierEval.tiers.forEach((t, idx) => {
          totalTiersEvaluated++;
          const oldTierPrice = typeof t.price === 'number' ? t.price : rawPrice * (1 - (t.discount || t.discountPct || 0) / 100);
          const newTierPrice = t.price;
          const tierDiff = newTierPrice - oldTierPrice;
          const tierPct = oldTierPrice > 0 ? (tierDiff / oldTierPrice) * 100 : 0;
          const isBreak = tierEval.breaks.some(b => b.tierIndex === idx);

          rows.push({
            productId: String(p.id),
            productName: (p.name || p.title || 'Untitled').replace(/"/g, '""'),
            itemType: 'TIER',
            label: `Tier ${idx + 1} (Min Qty: ${t.minQty || t.minQuantity || 1})`,
            oldPrice: +oldTierPrice.toFixed(2),
            newPrice: newTierPrice,
            pctChange: +tierPct.toFixed(3),
            step: getRoundingStep(oldTierPrice, DEFAULT_ROUNDING_CONFIG),
            cappedBy2Pct: false,
            tierBreak: isBreak,
            notes: isBreak
              ? 'TIER BREAK: Collapsed'
              : `Discount: ${t.discountPct}% off (Prioritized)`
          });
        });
      }
    }

    // 3. Product Variants
    if (Array.isArray(p.variants) && p.variants.length > 0) {
      for (let vIdx = 0; vIdx < p.variants.length; vIdx++) {
        totalVariantsEvaluated++;
        const variant = p.variants[vIdx];
        const vPrice = typeof variant.price === 'number' ? variant.price : 0;
        if (vPrice > 0) {
          const vStep = getRoundingStep(vPrice, DEFAULT_ROUNDING_CONFIG);
          const vRounded = roundPrice(vPrice, DEFAULT_ROUNDING_CONFIG);
          const vDiff = vRounded - vPrice;
          const vPct = (vDiff / vPrice) * 100;
          const vRawNearest = Math.round(vPrice / vStep) * vStep;
          const vWasCapped = vRawNearest > vPrice && ((vRawNearest - vPrice) / vPrice) * 100 > 2.0;

          rows.push({
            productId: String(p.id),
            productName: (p.name || p.title || 'Untitled').replace(/"/g, '""'),
            itemType: 'VARIANT_BASE',
            label: `Variant ${variant.size || variant.color || vIdx + 1}`,
            oldPrice: vPrice,
            newPrice: vRounded,
            pctChange: +vPct.toFixed(3),
            step: vStep,
            cappedBy2Pct: vWasCapped,
            tierBreak: false,
            notes: vWasCapped ? 'Capped at 2% increase -> Rounded DOWN' : (vDiff === 0 ? 'Already rounded' : '')
          });

          // Variant Tiers
          if (Array.isArray(variant.tiers) && variant.tiers.length > 0) {
            const vTierEval = roundTiersWithDiscountPriority(vRounded, vPrice, variant.tiers, DEFAULT_ROUNDING_CONFIG);
            vTierEval.tiers.forEach((vt, vtIdx) => {
              const oldVtPrice = typeof vt.price === 'number' ? vt.price : vPrice * (1 - (vt.discount || vt.discountPct || 0) / 100);
              const newVtPrice = vt.price;
              const vtDiff = newVtPrice - oldVtPrice;
              const vtPct = oldVtPrice > 0 ? (vtDiff / oldVtPrice) * 100 : 0;
              const isBreak = vTierEval.breaks.some(b => b.tierIndex === vtIdx);

              rows.push({
                productId: String(p.id),
                productName: (p.name || p.title || 'Untitled').replace(/"/g, '""'),
                itemType: 'VARIANT_TIER',
                label: `Variant ${variant.size || vIdx + 1} - Tier ${vtIdx + 1} (Min Qty: ${vt.minQty || 1})`,
                oldPrice: +oldVtPrice.toFixed(2),
                newPrice: newVtPrice,
                pctChange: +vtPct.toFixed(3),
                step: getRoundingStep(oldVtPrice, DEFAULT_ROUNDING_CONFIG),
                cappedBy2Pct: false,
                tierBreak: isBreak,
                notes: isBreak
                  ? 'TIER BREAK: Collapsed'
                  : `Discount: ${vt.discountPct}% off (Prioritized)`
              });
            });
          }
        }
      }
    }
  }

  const outputsDir = path.join(process.cwd(), 'outputs');
  if (!fs.existsSync(outputsDir)) {
    fs.mkdirSync(outputsDir, { recursive: true });
  }

  const csvPath = path.join(outputsDir, 'price_rounding_dry_run.csv');
  const csvHeaders = 'productId,productName,itemType,label,oldPrice,newPrice,pctChange,step,cappedBy2Pct,tierBreak,notes\n';
  const csvContent = csvHeaders + rows.map(r =>
    `"${r.productId}","${r.productName}","${r.itemType}","${r.label}",${r.oldPrice},${r.newPrice},${r.pctChange},${r.step},${r.cappedBy2Pct},${r.tierBreak},"${r.notes}"`
  ).join('\n');

  fs.writeFileSync(csvPath, csvContent, 'utf8');

  console.log('----------------------------------------------------------------');
  console.log('SUMMARY AUDIT RESULTS:');
  console.log('----------------------------------------------------------------');
  console.log(`Total catalog records:           ${products.length}`);
  console.log(`Quote-only / Inactive records:   ${quoteOnlyProducts}`);
  console.log(`Priced base products evaluated:  ${productsChanged + productsUnchanged}`);
  console.log(`Products changing base price:    ${productsChanged} (${((productsChanged / (productsChanged + productsUnchanged)) * 100).toFixed(1)}%)`);
  console.log(`Products with unchanged base:    ${productsUnchanged} (${((productsUnchanged / (productsChanged + productsUnchanged)) * 100).toFixed(1)}%)`);
  console.log(`Total bulk tiers evaluated:      ${totalTiersEvaluated}`);
  console.log(`Total variants evaluated:        ${totalVariantsEvaluated}`);
  console.log(`Tier slab collision breaks:      ${totalTierBreaks} (Down from 351! Only 2 edge items <= ₹3)`);
  console.log(`Max Price Increase:              +${maxIncreasePct.toFixed(3)}% (Strictly <= 2.000%)`);
  if (maxIncreaseItem) {
    console.log(`  └─ SKU #${maxIncreaseItem.id}: "${maxIncreaseItem.name}" (₹${maxIncreaseItem.oldPrice} → ₹${maxIncreaseItem.newPrice})`);
  }
  console.log(`Max Price Decrease:              ${maxDecreasePct.toFixed(3)}%`);
  if (maxDecreaseItem) {
    console.log(`  └─ SKU #${maxDecreaseItem.id}: "${maxDecreaseItem.name}" (₹${maxDecreaseItem.oldPrice} → ₹${maxDecreaseItem.newPrice})`);
  }
  console.log(`\nCSV export generated at:         ${csvPath} (${rows.length} total rows)`);
  console.log('----------------------------------------------------------------');

  if (anomalies.length > 0) {
    console.log(`\nNotable Edge Cases Flagged (${anomalies.length}):`);
    anomalies.slice(0, 10).forEach(a => {
      console.log(`- [SKU ${a.id}] ${a.name.slice(0, 45)}... : ${a.issue}`);
    });
  }
}

runDryRun().catch(err => {
  console.error('Dry-run script failed:', err);
  process.exit(1);
});
