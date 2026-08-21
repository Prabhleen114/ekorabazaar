import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

const pool = new pg.Pool({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL, max: 1 });

async function main() {
  const { rows } = await pool.query(`
    SELECT id, title, category 
    FROM "Product" 
    WHERE title ILIKE '%fragrance%' 
       OR title ILIKE '%oil%' 
       OR title ILIKE '%aroma%' 
       OR title ILIKE '%perfume%' 
       OR title ILIKE '%essential%'
  `);
  console.log("Potential Oils/Fragrances:", rows.length);
  if (rows.length > 0) {
    console.log(rows.slice(0, 20));
  }
  pool.end();
}
main();
