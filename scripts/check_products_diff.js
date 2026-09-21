const { execSync } = require('child_process');

try {
  const diffCommits = execSync('git log -n 5 --oneline src/lib/data/products.json', { encoding: 'utf8' });
  console.log('Recent commits touching products.json:\n', diffCommits);

  const stat = execSync('git diff 1bf9ef6~1 1bf9ef6 --stat src/lib/data/products.json', { encoding: 'utf8' });
  console.log('Stat for 1bf9ef6:\n', stat);
} catch (e) {
  console.error(e.message);
}
