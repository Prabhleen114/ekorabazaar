const fs = require('fs');
const path = require('path');

const productsFile = path.join(__dirname, '../src/lib/data/products.json');
const outputDir = path.join(__dirname, '../output_images');
const targetDir = path.join(__dirname, '../public/images/products');

if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

function run() {
    let products = JSON.parse(fs.readFileSync(productsFile, 'utf8'));
    let linkedCount = 0;

    products.forEach(product => {
        if (product.category && product.category.toLowerCase().includes('fragrance oil')) {
            const displayName = product.name.split(' (')[0].replace('Fragrance Oil', '').trim();
            
            // Match generate_covers.py naming:
            // safe_name = "".join([c for c in display_name if c.isalpha() or c.isdigit() or c==' ']).rstrip()
            let safeName = displayName.split('').filter(c => /[a-zA-Z0-9 ]/.test(c)).join('').trim();
            
            const fileName = `${safeName}.png`;
            const sourcePath = path.join(outputDir, fileName);
            const destPath = path.join(targetDir, fileName);

            if (fs.existsSync(sourcePath)) {
                // Copy file
                fs.copyFileSync(sourcePath, destPath);
                
                // Update products.json path
                product.image = `/images/products/${fileName}`;
                linkedCount++;
            } else {
                console.log(`Warning: Image not found for ${displayName} at ${sourcePath}`);
            }
        }
    });

    fs.writeFileSync(productsFile, JSON.stringify(products, null, 2));
    console.log(`Successfully linked and copied ${linkedCount} images in products.json!`);
}

run();
