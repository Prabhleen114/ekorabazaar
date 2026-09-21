const { execSync } = require('child_process');

try {
  const status = execSync('git status', { encoding: 'utf8' });
  console.log('=== git status ===\n', status);
  const branch = execSync('git branch -v', { encoding: 'utf8' });
  console.log('=== git branch ===\n', branch);
  const head = execSync('git log -1 --oneline', { encoding: 'utf8' });
  console.log('=== HEAD commit ===\n', head);
} catch (e) {
  console.error(e.message);
}
