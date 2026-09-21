const { execSync } = require('child_process');

try {
  const log = execSync('git log -n 15 --oneline', { encoding: 'utf8' });
  console.log('=== git log ===\n', log);
} catch (e) {
  console.error(e.message);
}
