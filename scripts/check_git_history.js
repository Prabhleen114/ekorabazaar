const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  const log = execSync('git log -n 25 --oneline src/lib/data/products.json', { encoding: 'utf8' });
  console.log('Git log for products.json:\n' + log);
  fs.writeFileSync(path.join(__dirname, 'git_history.txt'), log);
} catch (err) {
  console.error('Error running git log:', err.message);
}
