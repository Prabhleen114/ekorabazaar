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
    const seller = await prisma.seller.findUnique({
        where: { id: 'EKO-SELL-000001' },
        include: { user: true }
    });
    if (!seller) {
        console.log("Seller EKO-SELL-000001 not found!");
        return;
    }
    if (!seller.user) {
        console.log("Seller EKO-SELL-000001 has no associated user!");
        return;
    }
    const email = seller.user.email;
    const newPassword = 'EkoraTech@123';
    const newPasswordHash = await bcrypt_1.default.hash(newPassword, 10);
    await prisma.user.update({
        where: { id: seller.user.id },
        data: { passwordHash: newPasswordHash, role: client_1.Role.SELLER }
    });
    console.log("--- CREDENTIALS ---");
    console.log(`Seller Name: ${seller.brandName}`);
    console.log(`Seller ID: ${seller.id}`);
    console.log(`Login Email: ${email}`);
    console.log(`Login Password: ${newPassword}`);
}
main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
