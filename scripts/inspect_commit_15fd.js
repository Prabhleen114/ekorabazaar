const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  const commitInfo = execSync('git show --stat 15fd46b', { encoding: 'utf8' });
  console.log('Commit info 15fd46b:\n' + commitInfo);

  const commitMsg = execSync('git log -1 --pretty=full 15fd46b', { encoding: 'utf8' });
  console.log('Commit message:\n' + commitMsg);

  // Check how many products existed before 15fd46b
  const prevJson = execSync('git show 15fd46b~1:src/lib/data/products.json', { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
  const prevProducts = JSON.parse(prevJson);
  console.log(`Products in 15fd46b~1: ${prevProducts.length}`);

  // Check how many products existed in 15fd46b
  const currJson = execSync('git show 15fd46b:src/lib/data/products.json', { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
  const currProducts = JSON.parse(currJson);
  console.log(`Products in 15fd46b: ${currProducts.length}`);

  // Find products added in 15fd46b
  const prevIdSet = new Set(prevProducts.map(p => p.id));
  const added = currProducts.filter(p => !prevIdSet.has(p.id));
  console.log(`Newly added products count: ${added.length}`);
  console.log(`Newly added ID range: ${added[0]?.id} to ${added[added.length - 1]?.id}`);
  console.log('First 5 added:', added.slice(0, 5).map(p => ({ id: p.id, name: p.name, image: p.image })));

} catch (err) {
  console.error('Error:', err.message);
}
