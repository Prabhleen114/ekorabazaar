const fs = require('fs');
const path = require('path');
const Jimp = require('jimp');

const productsFile = path.join(__dirname, '../src/lib/data/products.json');
const baseImagePath = path.join(__dirname, '../public/images/base-bottle.png');
const outputDir = path.join(__dirname, '../public/images/products');

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

async function run() {
    let products = JSON.parse(fs.readFileSync(productsFile, 'utf8'));
    const fragranceOils = products.filter(p => p.category && p.category.toLowerCase().includes('fragrance oil'));
    
    console.log(`Found ${fragranceOils.length} fragrance oils.`);
    
    if (!fs.existsSync(baseImagePath)) {
        console.error('Base image not found at', baseImagePath);
        return;
    }

    const baseImage = await Jimp.read(baseImagePath);
    const fontLarge = await Jimp.loadFont(Jimp.FONT_SANS_64_BLACK);
    const fontMedium = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
    const fontSmall = await Jimp.loadFont(Jimp.FONT_SANS_16_BLACK);

    const width = baseImage.bitmap.width;
    const height = baseImage.bitmap.height;

    for (let i = 0; i < fragranceOils.length; i++) {
        const product = fragranceOils[i];
        
        // Clone the base image for each product
        const img = baseImage.clone();
        
        let displayName = product.name.split(' (')[0].replace('Fragrance Oil', '').trim();
        
        // Center text on the label. Assuming label is around center.
        // Y coords for 1024x1024
        img.print(fontMedium, 0, height / 2 - 80, {
            text: 'EKORA BAZAAR',
            alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER
        }, width);

        img.print(fontLarge, 0, height / 2, {
            text: displayName,
            alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER
        }, width);
        
        img.print(fontSmall, 0, height / 2 + 80, {
            text: 'PREMIUM FRAGRANCE OIL',
            alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER
        }, width);

        const fileName = `${product.id}.png`;
        const outputPath = path.join(outputDir, fileName);
        
        await img.writeAsync(outputPath);
        
        // Update product data
        product.image = `/images/products/${fileName}`;
        
        console.log(`Generated cover for ${displayName} (${i+1}/${fragranceOils.length})`);
    }
    
    fs.writeFileSync(productsFile, JSON.stringify(products, null, 2));
    console.log("Completed dynamic image generation and updated products.json!");
}

run().catch(console.error);
