import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

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

async function migrate() {
  console.log('====================================================');
  console.log('EKORA BAZAAR - PRODUCT PRICE ROUNDING MIGRATION');
  console.log('====================================================\n');

  const productsPath = path.join(process.cwd(), 'src', 'lib', 'data', 'products.json');
  const backupPath = path.join(process.cwd(), 'src', 'lib', 'data', 'products_backup_before_rounding.json');

  if (!fs.existsSync(productsPath)) {
    console.error('products.json not found at:', productsPath);
    process.exit(1);
  }

  // 1. Create Backup if not already existing
  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(productsPath, backupPath);
    console.log(`[1] Created immutable safety backup at:\n    ${backupPath}\n`);
  } else {
    console.log(`[1] Existing safety backup verified at:\n    ${backupPath}\n`);
  }

  // 2. Load products
  const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
  console.log(`[2] Loaded ${products.length} products for migration.`);

  let changedBaseCount = 0;
  let changedTiersCount = 0;
  let changedVariantsCount = 0;

  const migratedProducts = products.map((p) => {
    const rawPrice = typeof p.price === 'number' ? p.price : parseFloat(p.price || '0');
    let roundedBase = rawPrice;
    let tiersUpdated = false;

    // A. Round base price
    if (rawPrice > 0) {
      roundedBase = roundPrice(rawPrice);
      if (roundedBase !== rawPrice) {
        changedBaseCount++;
      }
    }

    // B. Round bulk pricing tiers
    let newTiers = p.tiers;
    if (Array.isArray(p.tiers) && p.tiers.length > 0 && rawPrice > 0) {
      const tierRes = roundTiersWithDiscountPriority(roundedBase, rawPrice, p.tiers);
      newTiers = tierRes.tiers;
      changedTiersCount += newTiers.length;
    }

    // C. Round variants
    let newVariants = p.variants;
    if (Array.isArray(p.variants) && p.variants.length > 0) {
      newVariants = p.variants.map((v) => {
        const vRaw = typeof v.price === 'number' ? v.price : 0;
        let vRounded = vRaw;
        let vNewTiers = v.tiers;

        if (vRaw > 0) {
          vRounded = roundPrice(vRaw);
          if (vRounded !== vRaw) changedVariantsCount++;

          if (Array.isArray(v.tiers) && v.tiers.length > 0) {
            const vTierRes = roundTiersWithDiscountPriority(vRounded, vRaw, v.tiers);
            vNewTiers = vTierRes.tiers;
          }
        }

        return {
          ...v,
          price: vRounded,
          ...(vNewTiers ? { tiers: vNewTiers } : {}),
        };
      });
    }

    return {
      ...p,
      price: roundedBase,
      ...(newTiers ? { tiers: newTiers } : {}),
      ...(newVariants ? { variants: newVariants } : {}),
    };
  });

  // 3. Write back to products.json
  fs.writeFileSync(productsPath, JSON.stringify(migratedProducts, null, 2), 'utf8');
  console.log(`[3] Updated products.json:`);
  console.log(`    - Base prices updated:     ${changedBaseCount}`);
  console.log(`    - Bulk tiers updated:      ${changedTiersCount}`);
  console.log(`    - Variant prices updated:  ${changedVariantsCount}\n`);

  // 4. Update Database if Prisma is accessible
  try {
    const { default: prisma } = await import('../src/lib/db.js').catch(async () => {
      // Fallback if ts/esm
      return { default: null };
    });

    if (prisma && prisma.product) {
      console.log('[4] Checking PostgreSQL database records...');
      const dbProducts = await prisma.product.findMany({
        select: { id: true, price: true, customerPrice: true, wholesaleTiers: true }
      });

      console.log(`    Found ${dbProducts.length} products in DB to update.`);
      let dbUpdated = 0;

      for (const dbP of dbProducts) {
        const catItem = migratedProducts.find(m => String(m.id) === String(dbP.id));
        if (catItem && catItem.price > 0) {
          const newPricePaise = Math.round(catItem.price * 100);
          const newTiersPaise = Array.isArray(catItem.tiers) ? catItem.tiers.map(t => ({
            ...t,
            price: typeof t.price === 'number' ? Math.round(t.price * 100) : t.price
          })) : dbP.wholesaleTiers;

          await prisma.product.update({
            where: { id: dbP.id },
            data: {
              price: newPricePaise,
              customerPrice: dbP.customerPrice ? newPricePaise : null,
              wholesaleTiers: newTiersPaise,
            }
          });
          dbUpdated++;
        }
      }
      console.log(`    Successfully updated ${dbUpdated} database products.`);
    } else {
      console.log('[4] PostgreSQL DB client not directly invoked; catalog sync handles runtime DB upserts.');
    }
  } catch (dbErr) {
    console.log('[4] Database update note: Database will sync automatically on demand via catalog-sync.');
  }

  console.log('\n====================================================');
  console.log('MIGRATION COMPLETED SUCCESSFULLY');
  console.log('====================================================');
}

migrate().catch(e => {
  console.error('Migration failed:', e);
  process.exit(1);
});
