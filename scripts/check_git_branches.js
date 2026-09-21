const { execSync } = require('child_process');

try {
  const branches = execSync('git branch -a', { encoding: 'utf8' });
  console.log('=== git branches ===\n', branches);

  const graph = execSync('git log --oneline -n 25', { encoding: 'utf8' });
  console.log('=== current branch log ===\n', graph);

  const contains = execSync('git branch --contains 9fb4b73', { encoding: 'utf8' });
  console.log('Branches containing 9fb4b73:\n', contains);
} catch (e) {
  console.error(e.message);
}
