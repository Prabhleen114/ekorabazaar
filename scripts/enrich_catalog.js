const fs = require('fs');
const path = require('path');

const PRODUCTS_FILE = path.join(__dirname, '../src/lib/data/products.json');

const FLORAL = ['rose', 'jasmine', 'frangipani', 'neroli', 'lavender', 'geranium', 'chamomile', 'ylang', 'lotus'];
const CITRUS = ['lemon', 'orange', 'bergamot', 'lime', 'grapefruit', 'mandarin', 'citronella', 'tangerine'];
const WOODY = ['cedarwood', 'sandalwood', 'pine', 'rosewood', 'patchouli', 'vetiver', 'cypress', 'fir'];
const SPICY = ['clove', 'cinnamon', 'pepper', 'nutmeg', 'cardamom', 'ginger', 'anise', 'coriander'];
const AQUATIC = ['sea', 'ocean', 'water', 'rain', 'breeze', 'aqua'];
const HERBACEOUS = ['tea tree', 'eucalyptus', 'thyme', 'oregano', 'basil', 'mint', 'peppermint', 'spearmint', 'rosemary', 'sage', 'lemongrass'];

function categorize(name) {
    name = name.toLowerCase();
    
    // Determine Scent Family
    let family = "Other";
    if (FLORAL.some(w => name.includes(w))) family = "Floral";
    else if (CITRUS.some(w => name.includes(w))) family = "Citrus";
    else if (WOODY.some(w => name.includes(w))) family = "Woody";
    else if (SPICY.some(w => name.includes(w))) family = "Spicy";
    else if (AQUATIC.some(w => name.includes(w))) family = "Aquatic";
    else if (HERBACEOUS.some(w => name.includes(w))) family = "Herbaceous";

    // Determine Note Level
    let note = "Heart/Middle Note";
    if (family === "Citrus" || name.includes("mint")) note = "Top Note";
    if (family === "Woody" || name.includes("vanilla") || name.includes("resin") || name.includes("frankincense") || name.includes("myrrh")) note = "Base Note";

    // Determine Collection
    let collection = null;
    if (family === "Floral" || family === "Citrus") collection = "The Botanical Garden";
    if (family === "Herbaceous" || family === "Spicy") collection = "The Apothecary";
    if (family === "Woody" || name.includes("resin") || name.includes("frankincense")) collection = "The Woods & Resins";

    // Determine Blends
    const isBlend = name.includes("&") || name.includes("blend") || name.includes("and");

    // Default applications
    const applications = ["Cold Process Soap", "Soy Candles", "Reed Diffusers"];
    if (name.includes("lip") || name.includes("vanilla") || family === "Citrus" || family === "Floral") {
        applications.push("Lip Balms");
    }

    return { family, note, collection, isBlend, applications };
}

function main() {
    console.log("Reading products.json...");
    const data = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf8'));

    let updatedCount = 0;

    data.forEach(p => {
        const cat = (p.category || "").toLowerCase();
        if (cat.includes("essential oil") || cat.includes("fragrance") || cat.includes("flavor") || p.name.toLowerCase().includes("oil")) {
            const meta = categorize(p.name);
            p.scentFamily = meta.family;
            p.noteLevel = meta.note;
            p.isBlend = meta.isBlend;
            p.applications = meta.applications;
            if (meta.collection) {
                p.scentCollection = meta.collection;
            }
            updatedCount++;
        }
    });

    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(data, null, 2));
    console.log(`Successfully enriched ${updatedCount} products with faceted metadata.`);
}

main();
