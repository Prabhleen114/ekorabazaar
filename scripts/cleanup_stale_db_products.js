/**
 * CLEANUP SCRIPT: Deletes all 9,717 stale EKORA_OFFICIAL products from the DB
 * that were imported previously but are not used (website reads from products.json).
 * These have no sellerId and no associated orders/cart items.
 * 
 * Safe to run: the website catalog is served from src/lib/data/products.json, NOT from the DB.
 * Only 3rd-party seller products (sellerId != null) are read from the DB.
 */
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
});

async function main() {
  const client = await pool.connect();
  try {
    // Safety check: confirm counts before deleting
    const check = await client.query(`
      SELECT COUNT(*) as total,
             COUNT(CASE WHEN "sellerId" IS NULL AND source = 'EKORA_OFFICIAL' THEN 1 END) as stale
      FROM "Product"
    `);
    console.log('Total products in DB:', check.rows[0].total);
    console.log('Stale EKORA_OFFICIAL (no sellerId) to delete:', check.rows[0].stale);

    // Check none have order items or cart items
    const orderCheck = await client.query(`
      SELECT COUNT(*) as cnt FROM "OrderItem" oi
      JOIN "Product" p ON p.id = oi."productId"
      WHERE p."sellerId" IS NULL AND p.source = 'EKORA_OFFICIAL'
    `);
    console.log('OrderItems linked to stale products:', orderCheck.rows[0].cnt);

    const cartCheck = await client.query(`
      SELECT COUNT(*) as cnt FROM "CartItem" ci
      JOIN "Product" p ON p.id = ci."productId"
      WHERE p."sellerId" IS NULL AND p.source = 'EKORA_OFFICIAL'
    `);
    console.log('CartItems linked to stale products:', cartCheck.rows[0].cnt);

    if (parseInt(orderCheck.rows[0].cnt) > 0 || parseInt(cartCheck.rows[0].cnt) > 0) {
      console.log('⚠️  ABORT: Some stale products have order/cart items. Manual review needed.');
      return;
    }

    // Delete in batches of 1000 to avoid timeout
    console.log('\nDeleting stale products in batches...');
    let totalDeleted = 0;
    let batch = 0;
    while (true) {
      const result = await client.query(`
        DELETE FROM "Product"
        WHERE id IN (
          SELECT id FROM "Product"
          WHERE "sellerId" IS NULL AND source = 'EKORA_OFFICIAL'
          LIMIT 1000
        )
      `);
      totalDeleted += result.rowCount;
      batch++;
      console.log(`  Batch ${batch}: deleted ${result.rowCount} rows (total so far: ${totalDeleted})`);
      if (result.rowCount < 1000) break;
    }

    // Final count
    const final = await client.query('SELECT COUNT(*) FROM "Product"');
    console.log(`\n✅ Done. Deleted ${totalDeleted} stale products.`);
    console.log(`Remaining products in DB: ${final.rows[0].count}`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(e => { console.error(e.message); process.exit(1); });
