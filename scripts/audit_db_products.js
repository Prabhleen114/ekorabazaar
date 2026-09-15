const { Pool } = require('pg');

// Load env from .env file
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
});

async function main() {
  const client = await pool.connect();
  try {
    const total = await client.query('SELECT COUNT(*) FROM "Product"');
    const published = await client.query('SELECT COUNT(*) FROM "Product" WHERE status = \'PUBLISHED\'');
    const bySrc = await client.query('SELECT source, COUNT(*) as cnt FROM "Product" GROUP BY source ORDER BY cnt DESC');
    const byCat = await client.query('SELECT category, COUNT(*) as cnt FROM "Product" GROUP BY category ORDER BY cnt DESC LIMIT 35');
    const noSeller = await client.query('SELECT COUNT(*) FROM "Product" WHERE "sellerId" IS NULL');
    const drafts = await client.query('SELECT COUNT(*) FROM "Product" WHERE status = \'DRAFT\'');
    const pending = await client.query('SELECT COUNT(*) FROM "Product" WHERE status = \'PENDING_APPROVAL\'');
    const rejected = await client.query('SELECT COUNT(*) FROM "Product" WHERE status = \'REJECTED\'');

    console.log('=== DB PRODUCT AUDIT ===');
    console.log('Total in DB:', total.rows[0].count);
    console.log('PUBLISHED:', published.rows[0].count);
    console.log('DRAFT:', drafts.rows[0].count);
    console.log('PENDING_APPROVAL:', pending.rows[0].count);
    console.log('REJECTED:', rejected.rows[0].count);
    console.log('No sellerId (admin/catalog):', noSeller.rows[0].count);

    console.log('\nBy source:');
    bySrc.rows.forEach(r => console.log(`  ${r.source || 'NULL'}: ${r.cnt}`));

    console.log('\nTop 35 categories in DB:');
    byCat.rows.forEach(r => console.log(`  "${r.category || 'NULL'}": ${r.cnt}`));
  } finally {
    client.release();
    await pool.end();
  }
}
main().catch(e => { console.error(e.message); process.exit(1); });
