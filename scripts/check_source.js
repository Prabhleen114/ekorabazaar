const { execSync } = require('child_process');

try {
  const log = execSync('git log --grep="clean_products" --oneline', { encoding: 'utf8' });
  console.log('Commits mentioning clean_products:\n' + log);
  
  const logPdf = execSync('git log --all -- "classes catalog.pdf"', { encoding: 'utf8' });
  console.log('Commits for classes catalog.pdf:\n' + logPdf);

  const allFiles = execSync('git log --name-status -n 5 15fd46b~1', { encoding: 'utf8' });
  console.log('Commits before 15fd46b:\n' + allFiles);
} catch (err) {
  console.error(err.message);
}
