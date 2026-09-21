const { execSync } = require('child_process');

try {
  const commit = execSync('git log -S "Sulfate Free Hand Wash Base Transparent" -p -n 1', { encoding: 'utf8' });
  console.log('=== git log -S Sulfate Free Hand Wash ===\n', commit.slice(0, 3000));
} catch (e) {
  console.error(e.message);
}
