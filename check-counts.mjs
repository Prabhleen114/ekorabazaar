import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

const pool = new pg.Pool({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });

async function main() {
  const all = await pool.query('SELECT count(*) FROM "Product"');
  const pub = await pool.query('SELECT count(*) FROM "Product" WHERE status = \'PUBLISHED\'');
  const pending = await pool.query('SELECT count(*) FROM "Product" WHERE status = \'PENDING_APPROVAL\'');
  
  console.log('Total Products:', all.rows[0].count);
  console.log('PUBLISHED:', pub.rows[0].count);
  console.log('PENDING_APPROVAL:', pending.rows[0].count);
  
  pool.end();
}
main().catch(console.error);
