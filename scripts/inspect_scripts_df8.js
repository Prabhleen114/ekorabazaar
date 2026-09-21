const { execSync } = require('child_process');

try {
  const content = execSync('git show df8cb80:generate-plan.js', { encoding: 'utf8' });
  console.log('=== generate-plan.js ===\n', content);

  const apply10 = execSync('git show df8cb80:apply-10-images.mjs', { encoding: 'utf8' });
  console.log('=== apply-10-images.mjs ===\n', apply10);
} catch (e) {
  console.error(e.message);
}
