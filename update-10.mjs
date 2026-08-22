import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });
const p = new pg.Pool({connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL});

const updates = [
  ['/images/products/10ml_roll_on_glass_perfume_bottle_1787346531236.jpg', 'dfff5ba7-dd50-4370-939b-d1055f1ad90e'],
  ['/images/products/rhombus_glass_dessert_cup_1787346545746.jpg', '7c669542-e638-4759-b72e-3f78f9a12fc1'],
  ['/images/products/glass_candy_jar_1787346557756.jpg', 'f5aea259-6e00-4e9f-a7fc-95b4dac8850c'],
  ['/images/products/250ml_glass_candy_jar_1787346568543.jpg', '81e830d0-f078-471b-ba12-600c23409c5f'],
  ['/images/products/amber_glass_cream_jar_1787346581993.jpg', 'bb077199-bbad-4336-a8a3-46ccf21ec5a0'],
  ['/images/products/8ml_square_glass_spray_bottle_1787346590580.jpg', '0d2db580-e677-4c5e-a956-c333f241c596'],
  ['/images/products/hanging_car_diffuser_bottle_1787346600254.jpg', '507e8c57-53fc-4544-b65f-fa8bba1405bd'],
  ['/images/products/metal_eyelet_buckle_1787346611959.jpg', '0845b088-ac70-460e-ac47-1a077c225ca2'],
  ['/images/products/bear_jar_silicone_mold_1787346623044.jpg', '3de27029-2f7b-478a-86e1-f5edda050de5'],
  ['/images/products/round_bow_coaster_mold_1787346639376.jpg', 'b2dc3ce7-c167-44b9-be89-c4ed76b096fc']
];

async function f() {
  for (const u of updates) {
    await p.query('UPDATE "Product" SET "imageUrl" = $1 WHERE id = $2', [u[0], u[1]]);
  }
  p.end();
}
f();
