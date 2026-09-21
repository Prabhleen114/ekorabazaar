const { execSync } = require('child_process');

try {
  const log = execSync('git log 15fd46b..HEAD --oneline -- src/lib/data/products.json', { encoding: 'utf8' });
  console.log('Commits between 15fd46b and HEAD touching products.json:\n', log);
} catch (e) {
  console.error(e.message);
}
