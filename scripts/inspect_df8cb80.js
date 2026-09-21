const { execSync } = require('child_process');

try {
  const commit = execSync('git show --stat df8cb80', { encoding: 'utf8' });
  console.log('Commit df8cb80 stat:\n', commit);
  const diff = execSync('git show df8cb80 src/lib/data/products.json', { encoding: 'utf8' });
  console.log('Diff for products.json in df8cb80:\n', diff.slice(0, 3000));
} catch (e) {
  console.error(e.message);
}
