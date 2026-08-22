import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });
const p = new pg.Pool({connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL});
async function f() {
  await p.query('UPDATE "Product" SET "imageUrl" = $1 WHERE id = $2', ['/images/products/roll_on_perfume_bottle_1787344440347.jpg', '16af5c1f-7eb9-49ff-a132-d0b2adf77e42']); 
  await p.query('UPDATE "Product" SET "imageUrl" = $1 WHERE id = $2', ['/images/products/hanging_car_diffuser_1787344449886.jpg', '41086984-7971-423d-b37d-af97d2e7f8b0']); 
  await p.query('UPDATE "Product" SET "imageUrl" = $1 WHERE id = $2', ['/images/products/lip_balm_tube_1787344464719.jpg', '313d2365-6d72-4801-aad0-368e4301482c']); 
  p.end();
}
f();
