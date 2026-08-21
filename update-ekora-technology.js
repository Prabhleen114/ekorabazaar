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
    const seller = await prisma.seller.update({
        where: { id: 'EKO-SELL-000001' },
        data: { brandName: 'Ekora Technology' }
    });
    // Also check if EKO-TECH-0001 was created and if so, delete it if it has 0 products
    try {
        const techSeller = await prisma.seller.findUnique({ where: { id: 'EKO-TECH-0001' }, include: { products: true } });
        if (techSeller && techSeller.products.length === 0) {
            await prisma.seller.delete({ where: { id: 'EKO-TECH-0001' } });
            console.log("Deleted unused EKO-TECH-0001 mock seller");
        }
    }
    catch (e) { }
    console.log("Updated seller EKO-SELL-000001 brandName to:", seller.brandName);
}
main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
