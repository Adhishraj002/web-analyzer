const analyzeWebsite = require("./analyzer");

async function crawlSite(baseUrl, limit = 5) {

  const visited = new Set();
  const results = [];

  async function crawl(url) {
    if (visited.has(url) || results.length >= limit) return;

    visited.add(url);

    try {
      const data = await analyzeWebsite(url);

      // 🔥 BETTER SCORE CALCULATION
      let score = 100;

      // Performance penalty
      if (data.loadTime > 2000) score -= 10;
      if (data.loadTime > 4000) score -= 15;
      if (data.loadTime > 7000) score -= 20;

      // Broken links penalty
      score -= data.brokenLinks * 5;

      // Accessibility penalty
      score -= data.inputsWithoutLabel * 3;

      score = Math.max(score, 0);

      results.push({
        url,
        score
      });

      // Crawl internal links
      for (const link of data.links.slice(0, 5)) {
        if (link.startsWith(new URL(baseUrl).origin)) {
          await crawl(link);
        }
      }

    } catch (err) {
      console.log("Crawl skip:", url);
    }
  }

  await crawl(baseUrl);

  return results;
}

module.exports = crawlSite;
