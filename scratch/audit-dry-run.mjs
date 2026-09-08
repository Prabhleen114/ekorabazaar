import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

const pool = new pg.Pool({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL, max: 1 });

function classifyProduct(title) {
  const t = title.toLowerCase();
  
  const isContainer = /\b(empty|bottle|bottles|jar|jars|container|containers|tin|tins|vial|vials|packaging|box|boxes)\b/.test(t);
  const isMould = /\b(mould|mold|moulds|molds)\b/.test(t);

  // 1. Explicit Containers
  if (isContainer && !isMould) {
    if (/\b(empty)\b/.test(t) || /(bottle|jar|tin|container|box|vial)s?$/.test(t.trim())) {
      return { category: "Containers & Packaging", confidence: "HIGH", reason: "Explicitly a container (contains 'empty' or ends with container noun)." };
    }
  }

  // 2. Moulds
  if (isMould) {
    if (/\b(soap|bar|bath bomb|massage bar)\b/.test(t)) {
      return { category: "Soap & Bar Moulds", confidence: "HIGH", reason: "Mould + soap/bar keywords." };
    }
    if (/\b(fondant|chocolate|cake|baking|culinary)\b/.test(t)) {
      return { category: "Culinary & Fondant Moulds", confidence: "HIGH", reason: "Mould + culinary/baking keywords." };
    }
    if (/\b(candle|pillar|torso|wax)\b/.test(t)) {
      return { category: "Candle & Pillar Moulds", confidence: "HIGH", reason: "Mould + candle keywords." };
    }
    if (/\b(resin|eco-resin|concrete|tray|coaster|planter|jesmonite|dish|ashtray|pot)\b/.test(t)) {
      return { category: "Eco-Resin & Stone Moulds", confidence: "HIGH", reason: "Mould + resin/stone keywords." };
    }
    return { category: "General Silicone Moulds", confidence: "MEDIUM", reason: "Mould keyword, but no specific sub-type detected." };
  }

  // 3. Accessories
  if (/\b(wick|wicks|sustainer|sustainers|thermometer|pitcher|trimmer|snuffer|dipper|warning label|sticker)\b/.test(t)) {
    return { category: "Candle Making Accessories", confidence: "HIGH", reason: "Candle accessory keyword detected." };
  }

  // 4. Waxes & Bases
  if (/\b(wax|paraffin|beeswax|stearic acid|soap base|melt and pour|melt & pour)\b/.test(t)) {
    return { category: "Premium Bases & Waxes", confidence: "HIGH", reason: "Wax or base keyword detected." };
  }

  // 5. Colors
  if (/\b(pigment|pigments|mica|dye|dyes|colorant|colorants|colourant|color paste)\b/.test(t)) {
    return { category: "Pigments & Colors", confidence: "HIGH", reason: "Pigment/color keyword detected." };
  }

  // 6. Oils & Botanicals
  if (/\b(essential oil|essential oils)\b/.test(t)) {
    return { category: "Essential Oils", confidence: "HIGH", reason: "Essential oil keyword detected." };
  }
  if (/\b(flavour oil|flavor oil|edible flavour|edible flavor)\b/.test(t)) {
    return { category: "Food Safe Flavour Oil", confidence: "HIGH", reason: "Flavour oil keyword detected." };
  }
  if (/\b(fragrance oil|fragrance oils|aroma oil|perfume oil|perfume|aroma diffuser)\b/.test(t)) {
    if (isContainer) {
      return { category: "Containers & Packaging", confidence: "HIGH", reason: "Fragrance keyword present, but container keyword takes priority." };
    }
    return { category: "Fragrance Oils", confidence: "HIGH", reason: "Fragrance oil keyword detected." };
  }
  if (/\b(hydrosol|floral water|rose water)\b/.test(t)) {
    return { category: "Hydrosols", confidence: "HIGH", reason: "Hydrosol keyword detected." };
  }
  if (/\b(dry flower|dried flower|botanical|dried petal)\b/.test(t)) {
    return { category: "DRY FLOWERS", confidence: "HIGH", reason: "Botanical keyword detected." };
  }

  // 7. Fallback Container Check
  if (isContainer) {
    return { category: "Containers & Packaging", confidence: "MEDIUM", reason: "Container keyword detected but not explicitly 'empty'." };
  }

  // 8. Default
  return { category: "General Silicone Moulds", confidence: "LOW", reason: "No strong keywords matched. Defaulting." };
}

function auditImage(imageUrl) {
  if (!imageUrl || imageUrl.trim() === '' || imageUrl.includes('og-image.jpg')) {
    return { state: 'MISSING', reason: 'Null, empty, or fallback og-image' };
  }
  
  if (imageUrl.startsWith('/')) {
    const publicPath = path.join(process.cwd(), 'public', imageUrl);
    if (fs.existsSync(publicPath)) {
      return { state: 'LOCAL_VALID', reason: 'Local file exists' };
    } else {
      return { state: 'BROKEN', reason: 'Local file missing from /public' };
    }
  }

  if (imageUrl.includes('unsplash.com')) {
    return { state: 'SUSPICIOUS', reason: 'Unsplash mock data' };
  }

  // We assume other URLs (jindeal, matinimpex, etc) are VALID for the dry run. 
  // In a real run, we'd do a HEAD request. But doing 8000 HEAD requests takes too long for this diagnostic.
  return { state: 'VALID', reason: 'External URL assumed valid for dry run' };
}

async function main() {
  console.log("Fetching products...");
  const { rows: products } = await pool.query('SELECT id, title, category, "imageUrl" FROM "Product"');
  
  const report = {
    total: products.length,
    categories: {},
    images: {
      VALID: 0,
      MISSING: 0,
      BROKEN: 0,
      SUSPICIOUS: 0,
      LOCAL_VALID: 0
    },
    changedCount: 0,
    lowConfidence: [],
    imageSamples: {
      MISSING: [],
      SUSPICIOUS: [],
      BROKEN: []
    }
  };

  for (const p of products) {
    // 1. Classify
    const classification = classifyProduct(p.title);
    
    if (!report.categories[classification.category]) {
      report.categories[classification.category] = { count: 0, samples: [] };
    }
    report.categories[classification.category].count++;
    
    if (report.categories[classification.category].samples.length < 5) {
      report.categories[classification.category].samples.push({ title: p.title, oldCategory: p.category });
    }

    if (classification.category !== p.category) {
      report.changedCount++;
    }

    if (classification.confidence === "LOW") {
      report.lowConfidence.push({ id: p.id, title: p.title, proposed: classification.category, reason: classification.reason });
    }

    // 2. Audit Image
    const imgAudit = auditImage(p.imageUrl);
    report.images[imgAudit.state]++;
    
    if (['MISSING', 'SUSPICIOUS', 'BROKEN'].includes(imgAudit.state)) {
      if (report.imageSamples[imgAudit.state].length < 20) {
        report.imageSamples[imgAudit.state].push({ id: p.id, title: p.title, url: p.imageUrl, reason: imgAudit.reason, proposedCategory: classification.category });
      }
    }
  }

  fs.writeFileSync(path.join(process.cwd(), 'scratch', 'audit-results.json'), JSON.stringify(report, null, 2));
  console.log("Audit complete. Results saved to scratch/audit-results.json");
  pool.end();
}

main().catch(console.error);
