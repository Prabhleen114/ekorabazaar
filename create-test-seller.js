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
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres';
const pool = new pg_1.default.Pool({ connectionString });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
async function main() {
    const email = 'seller.test@ekorabazaar.in';
    const password = 'TestSeller@123';
    // Clean up if it already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        await prisma.sellerBusiness.deleteMany({ where: { seller: { userId: existingUser.id } } });
        await prisma.product.deleteMany({ where: { seller: { userId: existingUser.id } } });
        await prisma.seller.deleteMany({ where: { userId: existingUser.id } });
        await prisma.user.delete({ where: { id: existingUser.id } });
    }
    const passwordHash = await bcrypt_1.default.hash(password, 10);
    const user = await prisma.user.create({
        data: {
            email,
            passwordHash,
            role: client_1.Role.SELLER,
            seller: {
                create: {
                    id: 'EKO-TEST-' + Date.now(),
                    brandName: 'Test Seller Brand',
                    accountStatus: client_1.SellerAccountStatus.ACTIVE,
                    applicationStatus: client_1.SellerApplicationStatus.APPROVED,
                    businessDetails: {
                        create: {
                            legalName: 'Test Seller Business Ltd',
                            businessType: 'SOLE_PROPRIETORSHIP',
                            address: '123 Test Street, Test City',
                            gstin: '22AAAAA0000A1Z5'
                        }
                    }
                }
            }
        },
        include: {
            seller: true
        }
    });
    console.log(`Successfully created test seller account: ${user.email} with Seller ID: ${user.seller?.id}`);
}
main()
    .catch(e => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
