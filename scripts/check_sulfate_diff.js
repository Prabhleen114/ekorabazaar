const { execSync } = require('child_process');

try {
  const diff = execSync('git diff 1bf9ef6~1 1bf9ef6 -S "Sulfate Free Hand Wash Base Transparent"', { encoding: 'utf8' });
  console.log('=== git diff for Sulfate Free Hand Wash ===\n', diff.slice(0, 3000));
} catch (e) {
  console.error(e.message);
}
