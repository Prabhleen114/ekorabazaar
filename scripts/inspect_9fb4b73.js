const { execSync } = require('child_process');

try {
  const show = execSync('git show --stat 9fb4b73', { encoding: 'utf8' });
  console.log('=== git show --stat 9fb4b73 ===\n', show);

  const logMsg = execSync('git log -1 --pretty=fuller 9fb4b73', { encoding: 'utf8' });
  console.log('=== Commit message ===\n', logMsg);
} catch (e) {
  console.error(e.message);
}
