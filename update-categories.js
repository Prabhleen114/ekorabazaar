"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = __importDefault(require("pg"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: '.env' });
dotenv_1.default.config({ path: '.env.local' });
const connectionString = process.env.DIRECT_URL || process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL;
const pool = new pg_1.default.Pool({ connectionString });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
async function main() {
    console.log("Fetching products...");
    const products = await prisma.product.findMany({ select: { id: true, title: true, category: true } });
    console.log(`Found ${products.length} products. Categorizing...`);
    let updated = 0;
    // We'll update in batches for speed
    for (const p of products) {
        const t = p.title.toLowerCase();
        let newCategory = "General Silicone Moulds";
        if (t.includes("fondant") || t.includes("baking") || t.includes("cake") || t.includes("chocolate")) {
            newCategory = "Culinary & Fondant Moulds";
        }
        else if (t.includes("candle") || t.includes("pillar") || t.includes("wax")) {
            newCategory = "Candle & Pillar Moulds";
        }
        else if (t.includes("concrete") || t.includes("tray") || t.includes("coaster") || t.includes("dish") || t.includes("resin") || t.includes("jar") || t.includes("planter")) {
            newCategory = "Eco-Resin & Stone Moulds";
        }
        else if (t.includes("soap") || t.includes("bar")) {
            newCategory = "Soap & Bar Moulds";
        }
        if (p.category !== newCategory) {
            await prisma.product.update({
                where: { id: p.id },
                data: { category: newCategory }
            });
            updated++;
            if (updated % 500 === 0)
                console.log(`Updated ${updated} products...`);
        }
    }
    console.log(`Finished! Updated ${updated} products categories based on title mapping.`);
}
main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
