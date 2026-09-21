const { execSync } = require('child_process');

try {
  const diff = execSync('git show 9fb4b73 src/lib/data/products.json', { encoding: 'utf8' });
  console.log('=== git show 9fb4b73 src/lib/data/products.json ===\n', diff.slice(0, 4000));
} catch (e) {
  console.error(e.message);
}
