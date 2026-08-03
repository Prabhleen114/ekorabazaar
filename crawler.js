const { spawn } = require('child_process');
const http = require('http');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const PORT = 3001;
const BASE_URL = `http://localhost:${PORT}`;

async function waitForServer() {
  for (let i = 0; i < 30; i++) {
    try {
      await fetch(`${BASE_URL}/`);
      console.log('Server is ready.');
      return;
    } catch (e) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  throw new Error('Server did not start in time');
}

async function runCrawl() {
  console.log('Starting Next.js server...');
  const server = spawn('npm', ['run', 'start', '--', '-p', PORT], { stdio: 'ignore', shell: true });
  
  try {
    await waitForServer();
    
    // 1. Fetch Sitemap
    console.log('Fetching sitemap...');
    const sitemapRes = await fetch(`${BASE_URL}/sitemap.xml`);
    const sitemapText = await sitemapRes.text();
    const $sitemap = cheerio.load(sitemapText, { xmlMode: true });
    
    const urls = [];
    $sitemap('loc').each((_, el) => {
      const url = $sitemap(el).text();
      // Replace production domain with localhost for crawling
      urls.push(url.replace('https://www.ekorabazaar.in', BASE_URL));
    });
    
    console.log(`Found ${urls.length} URLs in sitemap.`);
    
    const results = [];
    const titles = new Set();
    const descriptions = new Set();
    const allLinks = new Set();
    
    // 2. Crawl Each URL
    for (const url of urls) {
      console.log(`Crawling ${url}...`);
      const res = await fetch(url);
      const status = res.status;
      const html = await res.text();
      
      if (status !== 200) {
        results.push({ url, status, error: 'Non-200 status' });
        continue;
      }
      
      const $ = cheerio.load(html);
      
      const title = $('title').text();
      const h1s = $('h1').map((_, el) => $(el).text()).get();
      const metaDesc = $('meta[name="description"]').attr('content');
      const canonical = $('link[rel="canonical"]').attr('href');
      const ogTitle = $('meta[property="og:title"]').attr('content');
      const twitterCard = $('meta[name="twitter:card"]').attr('content');
      
      const hasSchema = $('script[type="application/ld+json"]').length > 0;
      
      // Images alt check
      const images = $('img').map((_, el) => ({
        src: $(el).attr('src'),
        alt: $(el).attr('alt')
      })).get();
      const missingAltImages = images.filter(img => !img.alt && img.alt !== ""); // "" is valid for decorative
      
      // Links
      $('a').each((_, el) => {
        const href = $(el).attr('href');
        if (href && href.startsWith('/')) {
          allLinks.add(BASE_URL + href);
        }
      });
      
      let titleIssue = null;
      if (titles.has(title)) titleIssue = 'Duplicate Title';
      titles.add(title);
      
      let descIssue = null;
      if (metaDesc && descriptions.has(metaDesc)) descIssue = 'Duplicate Description';
      if (metaDesc) descriptions.add(metaDesc);
      
      results.push({
        url,
        status,
        title,
        titleIssue,
        metaDesc,
        descIssue,
        h1Count: h1s.length,
        h1s,
        canonical,
        hasSchema,
        hasOG: !!ogTitle,
        hasTwitter: !!twitterCard,
        missingAltImages: missingAltImages.length,
        wordCount: $('body').text().split(/\s+/).length
      });
    }
    
    const reportPath = 'C:\\Users\\krary\\.gemini\\antigravity\\brain\\f6c1e214-c9a1-4546-bade-20e8d72820c7\\scratch\\crawl_results.json';
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`Crawl complete. Report saved to ${reportPath}`);
    
  } finally {
    console.log('Shutting down server...');
    server.kill();
  }
}

runCrawl().catch(console.error);
