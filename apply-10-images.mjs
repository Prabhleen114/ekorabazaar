import fs from 'fs';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

const pool = new pg.Pool({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL, max: 1 });

const artifactsDir = "C:\\Users\\krary\\.gemini\\antigravity\\brain\\f6c1e214-c9a1-4546-bade-20e8d72820c7";
const publicImagesDir = "d:\\ekora tech\\ekorabazaar\\public\\images\\products";

// Manual mapping from the 10 tasks to product IDs
const mappings = [
  { id: "552a0904-c46e-45c8-bb10-382e846cf17e", prefix: "plumeria_flower_mould" },
  { id: "305c4bf4-ced8-4481-8ec4-f401ee44f642", prefix: "concrete_gem_candy_jar_mould" },
  { id: "46d2dfcd-d470-4514-8191-27ee678ed521", prefix: "snowflake_gingerbread_mould" },
  { id: "d863cd76-5995-4332-91c9-12ec398d15af", prefix: "oval_soap_mould" },
  { id: "139567f6-8b15-44ab-9d32-bcaa126ed0bb", prefix: "superman_symbol_soap_mould" },
  { id: "94c6f3b0-80e4-4125-adb5-18548fc2dd7d", prefix: "easter_eggs_mould" },
  { id: "99d9e9be-d3c6-4854-90d5-1ab63071ab97", prefix: "ballpoint_pen_resin_mould" },
  { id: "d25c56b3-990d-4625-8fdd-3641f6d263b8", prefix: "batman_soap_mould" },
  { id: "933b0f20-9ccc-4d7f-a3d0-b421813212fc", prefix: "christmas_bell_mould" },
  { id: "d1b9919b-adc9-4c43-98c9-3e367f6a67f7", prefix: "spiral_cylindrical_mould" },
];

async function main() {
  const files = fs.readdirSync(artifactsDir);
  
  for (const map of mappings) {
    const filename = files.find(f => f.startsWith(map.prefix) && f.endsWith('.jpg'));
    if (!filename) {
      console.log(`Could not find generated image for ${map.prefix}`);
      continue;
    }
    
    const src = path.join(artifactsDir, filename);
    const dest = path.join(publicImagesDir, filename);
    const dbPath = `/images/products/${filename}`;
    
    // Copy the file over
    fs.copyFileSync(src, dest);
    
    // Update DB
    await pool.query('UPDATE "Product" SET "imageUrl" = $1 WHERE id = $2', [dbPath, map.id]);
    console.log(`Updated ${map.prefix} -> ${dbPath}`);
  }
  
  pool.end();
}

main().catch(console.error);
