const { execSync } = require('child_process');

try {
  const log = execSync('git log -S "Sulfate Free Hand Wash Base Transparent" --oneline -- src/lib/data/products.json', { encoding: 'utf8' });
  console.log('Commits with Sulfate Free Hand Wash in products.json:\n', log);
} catch (e) {
  console.error(e.message);
}
