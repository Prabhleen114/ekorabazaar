const fs = require('fs');
const https = require('https');
const path = require('path');

const url = 'https://images.unsplash.com/photo-1608528577891-eb055944f2e7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
const dest = path.join(__dirname, 'test_eb055.jpg');

const file = fs.createWriteStream(dest);
https.get(url, response => {
  response.pipe(file);
  file.on('finish', () => {
    file.close();
    console.log('Downloaded to test_eb055.jpg, size:', fs.statSync(dest).size);
  });
}).on('error', err => {
  console.error('Error downloading:', err.message);
});
