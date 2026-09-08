const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  const log = execSync('git log -n 25 --oneline dfefbb3~1 src/lib/data/products.json', { encoding: 'utf8' });
  console.log('Git log before dfefbb3:\n' + log);
  fs.writeFileSync(path.join(__dirname, 'git_earlier.txt'), log);
} catch (err) {
  console.error('Error running git log:', err.message);
}
