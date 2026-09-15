const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });

async function main() {
  const client = await pool.connect();
  try {
    // Check what sellers EKORA_OFFICIAL products are linked to
    const sellers = await client.query(`
      SELECT s.id, s."brandName", s."accountStatus", COUNT(p.id) as product_count
      FROM "Product" p
      JOIN "Seller" s ON s.id = p."sellerId"
      WHERE p.source = 'EKORA_OFFICIAL'
      GROUP BY s.id, s."brandName", s."accountStatus"
    `);
    console.log('=== Sellers linked to EKORA_OFFICIAL products ===');
    sellers.rows.forEach(r => console.log(`  Seller: "${r.brandName}" | Status: ${r.accountStatus} | Products: ${r.product_count} | ID: ${r.id}`));

    // Check total product count
    const total = await client.query('SELECT COUNT(*) FROM "Product"');
    console.log('\nTotal products:', total.rows[0].count);

    // Check if the API would show these (sellerId not null, PUBLISHED, seller ACTIVE)
    const apiVisible = await client.query(`
      SELECT COUNT(*) FROM "Product" p
      JOIN "Seller" s ON s.id = p."sellerId"
      WHERE p.status = 'PUBLISHED' AND s."accountStatus" = 'ACTIVE'
    `);
    console.log('Products visible via API (with active seller):', apiVisible.rows[0].count);

    const apiNotVisible = await client.query(`
      SELECT COUNT(*) FROM "Product" p
      JOIN "Seller" s ON s.id = p."sellerId"
      WHERE p.status = 'PUBLISHED' AND s."accountStatus" != 'ACTIVE'
    `);
    console.log('Products NOT visible (seller not ACTIVE):', apiNotVisible.rows[0].count);

    // Check orders on these products
    const ordersOnEkora = await client.query(`
      SELECT COUNT(*) FROM "OrderItem" oi
      JOIN "Product" p ON p.id = oi."productId"
      WHERE p.source = 'EKORA_OFFICIAL'
    `);
    console.log('\nOrderItems on EKORA_OFFICIAL products:', ordersOnEkora.rows[0].count);
  } finally {
    client.release();
    await pool.end();
  }
}
main().catch(e => { console.error(e.message); process.exit(1); });
