const { execSync } = require('child_process');

try {
  const grepGit = execSync('git log -S "Sulfate Free Hand Wash Base Transparent" --oneline', { encoding: 'utf8' });
  console.log('Commits mentioning Sulfate Free Hand Wash Base Transparent:\n', grepGit);
} catch (e) {
  console.error(e.message);
}
