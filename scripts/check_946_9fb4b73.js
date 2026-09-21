const { execSync } = require('child_process');

try {
  const diff946 = execSync('git show 9fb4b73 -S "Sulfate Free Hand Wash Base Transparent"', { encoding: 'utf8' });
  console.log('=== git show 9fb4b73 for 946 ===\n', diff946.slice(0, 3000));
} catch (e) {
  console.error(e.message);
}
