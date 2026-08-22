import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });
const p = new pg.Pool({connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL});
async function f() {
  const res = await p.query('SELECT id, title, "imageUrl" FROM "Product" WHERE "imageUrl" = \'/og-image.jpg\' OR "imageUrl" IS NULL LIMIT 25');
  console.log(JSON.stringify(res.rows, null, 2));
  p.end();
}
f();
