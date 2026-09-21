const fs = require('fs');
const https = require('https');
const path = require('path');

const url = 'https://images.unsplash.com/photo-1605388043694-1b777a80b852?auto=format&fit=crop&q=80&w=800';
const dest = path.join(__dirname, 'test_unsplash.jpg');

const file = fs.createWriteStream(dest);
https.get(url, response => {
  response.pipe(file);
  file.on('finish', () => {
    file.close();
    console.log('Downloaded to test_unsplash.jpg, size:', fs.statSync(dest).size);
  });
}).on('error', err => {
  console.error('Error downloading:', err.message);
});
