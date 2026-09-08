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
    console.log("=== SELLER STATUS ===");
    const seller = await prisma.seller.findUnique({ where: { id: 'EKO-SELL-000001' } });
    console.log(seller);
    console.log("\n=== PRODUCTS SUMMARY ===");
    const totalProducts = await prisma.product.count();
    const publishedProducts = await prisma.product.count({ where: { status: 'PUBLISHED' } });
    const publishedByEkora = await prisma.product.count({ where: { status: 'PUBLISHED', sellerId: 'EKO-SELL-000001' } });
    console.log(`Total Products: ${totalProducts}`);
    console.log(`Published Products: ${publishedProducts}`);
    console.log(`Published by Ekora Technology: ${publishedByEkora}`);
    console.log("\n=== PRODUCT SAMPLE ===");
    const sampleProducts = await prisma.product.findMany({ take: 5, orderBy: { createdAt: 'desc' } });
    for (const p of sampleProducts) {
        console.log(`[${p.id}] ${p.title} | status:${p.status} | sellerId:${p.sellerId} | stock:${p.stock} | price:${p.price} | custPrice:${p.customerPrice}`);
        // I need to check if there's a category field! 
        console.log(`Category field value:`, p.category);
    }
}
main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
