const { execSync } = require('child_process');

try {
  const show = execSync('git show 1c8a453', { encoding: 'utf8' });
  console.log('=== git show 1c8a453 ===\n', show);
} catch (e) {
  console.error(e.message);
}
