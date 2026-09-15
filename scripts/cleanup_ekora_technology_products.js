/**
 * Deletes the 9,712 stale "Ekora Technology" seller products from the DB.
 * These were bulk-imported with old category names, polluting the shop filter results.
 * The 10 products with OrderItems are preserved (they'll be archived/hidden instead).
 * 
 * The live catalog is served from src/lib/data/products.json — the DB EKORA_OFFICIAL
 * imports are redundant and should not exist.
 */
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });
const STALE_SELLER_ID = 'EKO-SELL-000001';

async function main() {
  const client = await pool.connect();
  try {
    console.log('=== CLEANUP: Stale Ekora Technology bulk import products ===\n');

    // Count total for this seller
    const total = await client.query('SELECT COUNT(*) FROM "Product" WHERE "sellerId" = $1', [STALE_SELLER_ID]);
    console.log(`Total products from "${STALE_SELLER_ID}": ${total.rows[0].count}`);

    // Find the ~10 that have OrderItems — keep these (set to DRAFT to hide, don't delete)
    const hasOrders = await client.query(`
      SELECT DISTINCT p.id FROM "Product" p
      JOIN "OrderItem" oi ON oi."productId" = p.id
      WHERE p."sellerId" = $1
    `, [STALE_SELLER_ID]);
    const preservedIds = hasOrders.rows.map(r => r.id);
    console.log(`Products with OrderItems (will be archived, not deleted): ${preservedIds.length}`);
    if (preservedIds.length > 0) {
      // Archive them (set to DRAFT so they don't show in shop)
      await client.query(`
        UPDATE "Product" SET status = 'DRAFT' WHERE id = ANY($1)
      `, [preservedIds]);
      console.log(`  Archived ${preservedIds.length} products with order history.`);
    }

    // Delete all others in batches
    let totalDeleted = 0;
    let batch = 0;
    const excludeList = preservedIds.length > 0 ? `AND id != ALL($2)` : '';
    const params = preservedIds.length > 0 ? [STALE_SELLER_ID, preservedIds] : [STALE_SELLER_ID];

    while (true) {
      const result = await client.query(`
        DELETE FROM "Product"
        WHERE id IN (
          SELECT id FROM "Product"
          WHERE "sellerId" = $1 ${excludeList}
          LIMIT 1000
        )
      `, params);
      totalDeleted += result.rowCount;
      batch++;
      console.log(`  Batch ${batch}: deleted ${result.rowCount} rows (total: ${totalDeleted})`);
      if (result.rowCount < 1000) break;
    }

    // Final state
    const remaining = await client.query('SELECT COUNT(*) FROM "Product"');
    console.log(`\n✅ Done.`);
    console.log(`  Deleted: ${totalDeleted} products`);
    console.log(`  Archived (has orders): ${preservedIds.length} products`);
    console.log(`  Total remaining in DB: ${remaining.rows[0].count}`);
  } finally {
    client.release();
    await pool.end();
  }
}
main().catch(e => { console.error(e.message); process.exit(1); });
