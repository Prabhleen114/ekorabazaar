const { execSync } = require('child_process');

try {
  const diff = execSync('git diff 7475548~1 7475548 -S "Sulfate Free Hand Wash Base Transparent" -- src/lib/data/products.json', { encoding: 'utf8' });
  console.log('Diff in products.json at 7475548:\n', diff.slice(0, 3000));
} catch (e) {
  console.error(e.message);
}
