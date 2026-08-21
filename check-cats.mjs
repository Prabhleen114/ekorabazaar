import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

const pool = new pg.Pool({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
  max: 1 // only 1 connection
});

async function main() {
  const { rows } = await pool.query('SELECT category, count(*) FROM "Product" GROUP BY category ORDER BY count DESC');
  console.log("DB Categories:", rows);
  pool.end();
}
main();
