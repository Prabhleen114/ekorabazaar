const fs = require('fs');
const path = require('path');
const Groq = require('groq-sdk');

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

const productsFile = path.join(__dirname, '../src/lib/data/products.json');

const usageLevels = {
  "Candles (Soy & Paraffin)": "6% – 10%",
  "Wax Melts & Tarts": "8% – 12%",
  "Fine Perfume (EDP)": "15% – 20%",
  "Reed Diffusers": "15% – 25%",
  "Cold Process Soap": "2% – 5%",
  "Melt & Pour Soap": "1% – 3%",
  "Lotions & Creams": "0.5% – 1.5%",
  "Room Sprays": "2% – 5%"
};

async function generateData(productName) {
    const prompt = `You are an expert luxury product copywriter for a brand called "Ekora Bazaar".
Generate a luxury product description and fragrance notes for: "${productName}".

Output ONLY valid JSON with no markdown wrapping, no explanation, in this exact format:
{
  "description": "<p>Paragraph 1: Sensory storytelling about the aroma and feeling.</p><p>Paragraph 2: Mentioning its high-end applications like luxury artisan candles, fine perfume, or bespoke personal care products, emphasizing premium quality and strong scent throw.</p>",
  "fragranceNotes": {
    "top": "A vibrant introduction of...",
    "heart": "A refined core featuring...",
    "base": "A warm foundation of..."
  }
}`;

    try {
        const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.7,
            response_format: { type: 'json_object' }
        });

        return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
        console.error(`Error generating for ${productName}:`, error.message);
        return null;
    }
}

async function run() {
    console.log("Loading products.json...");
    let products = JSON.parse(fs.readFileSync(productsFile, 'utf8'));
    
    // Find all fragrance oils
    const fragranceOils = products.filter(p => p.category && p.category.toLowerCase().includes('fragrance oil'));
    console.log(`Found ${fragranceOils.length} fragrance oils to process.`);
    
    let processedCount = 0;
    const BATCH_SIZE = 5;
    
    for (let i = 0; i < fragranceOils.length; i += BATCH_SIZE) {
        const batch = fragranceOils.slice(i, i + BATCH_SIZE);
        console.log(`Processing batch ${i / BATCH_SIZE + 1} of ${Math.ceil(fragranceOils.length / BATCH_SIZE)}...`);
        
        const promises = batch.map(async (product) => {
            console.log(`Generating for: ${product.name}`);
            const data = await generateData(product.name);
            
            if (data) {
                product.description = data.description;
                product.fragranceNotes = data.fragranceNotes;
                product.usageLevels = usageLevels;
            }
        });
        
        await Promise.all(promises);
        processedCount += batch.length;
        
        // Save progress every batch
        fs.writeFileSync(productsFile, JSON.stringify(products, null, 2));
        console.log(`Saved progress. Processed ${processedCount}/${fragranceOils.length}`);
        
        // Wait 3 seconds between batches to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    console.log("Completed updating all fragrance oils!");
}

run().catch(console.error);
