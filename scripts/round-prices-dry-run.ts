import fs from 'fs';
import path from 'path';
import {
  roundPrice,
  getRoundingStep,
  roundAndValidateTiers,
  DEFAULT_ROUNDING_CONFIG,
} from '../src/lib/pricing-rounding';

interface DryRunRow {
  productId: string;
  productName: string;
  itemType: 'PRODUCT_BASE' | 'TIER' | 'VARIANT_BASE' | 'VARIANT_TIER';
  label: string;
  oldPrice: number;
  newPrice: number;
  pctChange: number;
  step: number;
  cappedBy2Pct: boolean;
  tierBreak: boolean;
  notes: string;
}

async function runDryRun() {
  console.log('=====================================================');
  console.log('EKORA BAZAAR - PRODUCT PRICE ROUNDING DRY-RUN REPORT');
  console.log('=====================================================\n');

  const productsPath = path.join(process.cwd(), 'src', 'lib', 'data', 'products.json');
  if (!fs.existsSync(productsPath)) {
    console.error('products.json not found at:', productsPath);
    process.exit(1);
  }

  const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
  console.log(`Loaded ${products.length} catalog products from products.json\n`);

  const rows: DryRunRow[] = [];
  let productsChanged = 0;
  let productsUnchanged = 0;
  let quoteOnlyProducts = 0;
  let totalTiersEvaluated = 0;
  let totalVariantsEvaluated = 0;
  let totalTierBreaks = 0;

  let maxIncreasePct = 0;
  let maxDecreasePct = 0;
  let maxIncreaseItem: any = null;
  let maxDecreaseItem: any = null;

  const anomalies: Array<{ id: string; name: string; issue: string }> = [];

  for (const p of products) {
    const rawPrice = typeof p.price === 'number' ? p.price : parseFloat(p.price || '0');
    const isQuoteOnly = p.isQuoteOnly === true || rawPrice <= 0 || p.inStock === false;

    if (isQuoteOnly) {
      quoteOnlyProducts++;
    }

    // 1. Product Base Price
    if (rawPrice > 0) {
      const step = getRoundingStep(rawPrice, DEFAULT_ROUNDING_CONFIG);
      const roundedPrice = roundPrice(rawPrice, DEFAULT_ROUNDING_CONFIG);
      const diff = roundedPrice - rawPrice;
      const pct = (diff / rawPrice) * 100;

      // Check if capped
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
          issue: `Sub-₹5 price (₹${rawPrice}): Rounded to ₹${roundedPrice} using floor safeguard (step was ₹5).`
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

      // 2. Product Bulk Tiers
      if (Array.isArray(p.tiers) && p.tiers.length > 0) {
        const tierEval = roundAndValidateTiers(roundedPrice, rawPrice, p.tiers, DEFAULT_ROUNDING_CONFIG);
        if (tierEval.hasBreaks) {
          totalTierBreaks++;
          anomalies.push({
            id: p.id,
            name: p.name || p.title,
            issue: `Bulk tiers collapsed: ${tierEval.breaks.map((b: any) => b.reason).join('; ')}`
          });
        }

        tierEval.tiers.forEach((t: any, idx: number) => {
          totalTiersEvaluated++;
          const oldTierPrice = typeof t.price === 'number' ? t.price : rawPrice * (1 - (t.discount || t.discountPct || 0) / 100);
          const newTierPrice = t.price;
          const tierDiff = newTierPrice - oldTierPrice;
          const tierPct = oldTierPrice > 0 ? (tierDiff / oldTierPrice) * 100 : 0;
          const isBreak = tierEval.breaks.some((b: any) => b.tierIndex === idx);

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
            notes: isBreak ? 'TIER BREAK: Collapsed to same or higher price than prior slab' : ''
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
            const vTierEval = roundAndValidateTiers(vRounded, vPrice, variant.tiers, DEFAULT_ROUNDING_CONFIG);
            vTierEval.tiers.forEach((vt: any, vtIdx: number) => {
              const oldVtPrice = typeof vt.price === 'number' ? vt.price : vPrice * (1 - (vt.discount || vt.discountPct || 0) / 100);
              const newVtPrice = vt.price;
              const vtDiff = newVtPrice - oldVtPrice;
              const vtPct = oldVtPrice > 0 ? (vtDiff / oldVtPrice) * 100 : 0;
              const isBreak = vTierEval.breaks.some((b: any) => b.tierIndex === vtIdx);

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
                notes: isBreak ? 'TIER BREAK: Collapsed' : ''
              });
            });
          }
        }
      }
    }
  }

  // Ensure outputs directory exists
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

  console.log('-----------------------------------------------------');
  console.log('SUMMARY STATISTICS:');
  console.log('-----------------------------------------------------');
  console.log(`Total catalog records:           ${products.length}`);
  console.log(`Quote-only / Inactive records:   ${quoteOnlyProducts}`);
  console.log(`Priced base products evaluated:  ${productsChanged + productsUnchanged}`);
  console.log(`Products changing price:         ${productsChanged} (${((productsChanged / (productsChanged + productsUnchanged)) * 100).toFixed(1)}%)`);
  console.log(`Products unchanged:              ${productsUnchanged} (${((productsUnchanged / (productsChanged + productsUnchanged)) * 100).toFixed(1)}%)`);
  console.log(`Total bulk tiers evaluated:      ${totalTiersEvaluated}`);
  console.log(`Total variants evaluated:        ${totalVariantsEvaluated}`);
  console.log(`Products with tier slab breaks:  ${totalTierBreaks}`);
  console.log(`Max Price Increase:              +${maxIncreasePct.toFixed(3)}% (Cap: +2.000%)`);
  if (maxIncreaseItem) {
    console.log(`  └─ SKU #${maxIncreaseItem.id}: "${maxIncreaseItem.name}" (₹${maxIncreaseItem.oldPrice} → ₹${maxIncreaseItem.newPrice})`);
  }
  console.log(`Max Price Decrease:              ${maxDecreasePct.toFixed(3)}%`);
  if (maxDecreaseItem) {
    console.log(`  └─ SKU #${maxDecreaseItem.id}: "${maxDecreaseItem.name}" (₹${maxDecreaseItem.oldPrice} → ₹${maxDecreaseItem.newPrice})`);
  }
  console.log(`\nCSV export generated at:         ${csvPath} (${rows.length} total rows)`);
  console.log('-----------------------------------------------------');

  if (anomalies.length > 0) {
    console.log(`\nNotable Anomalies Flagged (${anomalies.length}):`);
    anomalies.slice(0, 10).forEach(a => {
      console.log(`- [SKU ${a.id}] ${a.name.slice(0, 45)}... : ${a.issue}`);
    });
    if (anomalies.length > 10) {
      console.log(`  ... and ${anomalies.length - 10} more in CSV report.`);
    }
  }
}

runDryRun().catch(err => {
  console.error('Dry-run script failed:', err);
  process.exit(1);
});
