const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

async function scrape() {
  const baseUrl = 'https://ases.in';
  let currentPage = '/blogs/formulations';
  let allArticles = [];

  while (currentPage) {
    console.log(`Fetching ${baseUrl}${currentPage}...`);
    const res = await fetch(`${baseUrl}${currentPage}`);
    const html = await res.text();
    const $ = cheerio.load(html);

    // Find all article links on the page. Assuming they are inside the blog grid.
    const links = [];
    $('a').each((i, el) => {
      const href = $(el).attr('href');
      if (href && href.startsWith('/blogs/formulations/') && !links.includes(href)) {
        links.push(href);
      }
    });

    console.log(`Found ${links.length} articles on this page.`);

    for (const link of links) {
      console.log(`Fetching article: ${baseUrl}${link}`);
      const articleRes = await fetch(`${baseUrl}${link}`);
      const articleHtml = await articleRes.text();
      const $a = cheerio.load(articleHtml);

      // Extract title
      let title = $a('h1').first().text().trim();
      if (!title) {
          title = $a('title').text().trim().split('-')[0].trim();
      }
      
      // On shopify, article content is usually in .article__content or .rte
      let contentHtml = $a('.rte').html() || $a('article').html() || '';
      if (!contentHtml) {
        // Fallback
        contentHtml = $a('.main-content').html() || '';
      }
      
      // Attempt to extract featured image
      let imageUrl = $a('meta[property="og:image"]').attr('content') || '';
      if (imageUrl && !imageUrl.startsWith('http')) {
        imageUrl = `https:${imageUrl}`;
      }

      // Also extract text for a brief description
      let textContent = $a('.rte').text() || $a('article').text() || '';
      let excerpt = textContent.replace(/\s+/g, ' ').trim().substring(0, 200) + '...';

      if (title && !allArticles.find(a => a.title === title)) {
        allArticles.push({
          title,
          url: `${baseUrl}${link}`,
          imageUrl,
          excerpt,
          content: contentHtml
        });
      }
    }

    // Check for next page pagination
    const nextHref = $('span.next a').attr('href') || $('a.next').attr('href');
    if (nextHref) {
      currentPage = nextHref;
    } else {
      currentPage = null;
    }
  }

  console.log(`Total articles extracted: ${allArticles.length}`);
  
  const outPath = path.join(__dirname, 'src', 'lib', 'data', 'formulations.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(allArticles, null, 2));
  console.log(`Saved to ${outPath}`);
}

scrape().catch(console.error);
