const { execSync } = require('child_process');

try {
  // Search for any mention of clean_products or products.csv in all commits
  const grepLogs = execSync('git log --all --grep="csv" --oneline', { encoding: 'utf8' });
  console.log('Commits with "csv":\n', grepLogs);

  // Search commit 15fd46b parent commit log
  const parentLog = execSync('git log -n 10 --oneline 15fd46b', { encoding: 'utf8' });
  console.log('10 commits up to 15fd46b:\n', parentLog);

} catch (e) {
  console.error(e.message);
}
