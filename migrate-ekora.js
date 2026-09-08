"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = __importDefault(require("pg"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: '.env' });
dotenv_1.default.config({ path: '.env.local' });
const connectionString = process.env.DIRECT_URL || process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL;
const pool = new pg_1.default.Pool({ connectionString });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
async function main() {
    const email = 'admin@ekoratech.com';
    let user = await prisma.user.findUnique({ where: { email }, include: { seller: true } });
    if (!user) {
        const passwordHash = await bcrypt_1.default.hash('EkoraAdmin@123', 10);
        user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                role: client_1.Role.ADMIN,
            },
            include: { seller: true }
        });
    }
    let seller = await prisma.seller.findFirst({ where: { brandName: 'Ekora Technology' } });
    if (!seller) {
        seller = await prisma.seller.create({
            data: {
                id: 'EKO-TECH-0001',
                userId: user.id,
                brandName: 'Ekora Technology',
                accountStatus: client_1.SellerAccountStatus.ACTIVE,
                applicationStatus: client_1.SellerApplicationStatus.APPROVED,
            }
        });
    }
    const orphanedProducts = await prisma.product.findMany({
        where: {
            OR: [
                { sellerId: null },
                { sellerId: "" }
            ]
        }
    });
    console.log(`Found ${orphanedProducts.length} orphaned products.`);
    if (orphanedProducts.length > 0) {
        const res = await prisma.product.updateMany({
            where: {
                OR: [
                    { sellerId: null },
                    { sellerId: "" }
                ]
            },
            data: {
                sellerId: seller.id
            }
        });
        console.log(`Updated ${res.count} products to belong to Ekora Technology (${seller.id})`);
    }
    console.log(`Ekora Technology Seller ID: ${seller.id}`);
}
main()
    .catch(e => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
