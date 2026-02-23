require("dotenv").config();

const express = require("express");
const cors = require("cors");

const analyzeWebsite = require("./analyzer");
const crawlSite = require("./crawler");
const pool = require("./db");
const getAISuggestions = require("./aiAdvisor");
const websiteChat = require("./aiChat");
const findCompetitors = require("./competitorAI");

const app = express();

app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ limit: "5mb", extended: true }));


// ========= DIAGNOSTICS ENGINE =========
function buildDiagnostics(result, scores) {
  const diag = [];

  // ── SEO checks ──────────────────────────────────────────────────
  if (!result.title) {
    diag.push({
      id: "title",
      category: "SEO",
      status: "down",
      issue: "Missing page title (<title> tag)",
      impact: "High",
      fixes: [
        {
          rank: 1, label: "Best Method",
          method: "Add a descriptive <title> tag inside your <head> element with your brand + keyword.",
          code: "<head>\n  <title>Your Brand – Short Page Description</title>\n</head>"
        },
        {
          rank: 2, label: "CMS (WordPress / Shopify)",
          method: "In WordPress go to Settings → General → Site Title. In Shopify go to Online Store → Preferences → Homepage title.",
          code: null
        },
        {
          rank: 3, label: "Framework (React / Next.js)",
          method: "Use react-helmet or Next.js <Head> component to set the title dynamically.",
          code: "import Head from 'next/head';\n// ...\n<Head><title>My Page</title></Head>"
        }
      ]
    });
  } else {
    diag.push({ id: "title", category: "SEO", status: "good", issue: "Page title is present", impact: "High", fixes: [] });
  }

  if (!result.metaDescription) {
    diag.push({
      id: "meta-desc",
      category: "SEO",
      status: "down",
      issue: "Missing meta description",
      impact: "High",
      fixes: [
        {
          rank: 1, label: "Best Method",
          method: "Add a <meta name='description'> tag (120-160 characters) summarising the page content.",
          code: '<meta name="description" content="A clear, keyword-rich description under 160 characters.">'
        },
        {
          rank: 2, label: "CMS",
          method: "In WordPress use Yoast SEO or Rank Math plugins — they add a dedicated 'Meta Description' field per page.",
          code: null
        },
        {
          rank: 3, label: "Basic",
          method: "Ask your developer to add the meta tag to every page template's <head> section.",
          code: null
        }
      ]
    });
  } else {
    diag.push({ id: "meta-desc", category: "SEO", status: "good", issue: "Meta description is set", impact: "High", fixes: [] });
  }

  if (!result.viewport) {
    diag.push({
      id: "viewport",
      category: "SEO",
      status: "down",
      issue: "Missing viewport meta tag (mobile-unfriendly)",
      impact: "High",
      fixes: [
        {
          rank: 1, label: "Best Method",
          method: "Add the standard viewport meta tag — essential for mobile SEO and Core Web Vitals.",
          code: '<meta name="viewport" content="width=device-width, initial-scale=1.0">'
        },
        {
          rank: 2, label: "Framework",
          method: "In Next.js add it to _document.js. In React add it directly to public/index.html.",
          code: null
        }
      ]
    });
  } else {
    diag.push({ id: "viewport", category: "SEO", status: "good", issue: "Viewport meta tag present (mobile-ready)", impact: "High", fixes: [] });
  }

  // ── Performance checks ──────────────────────────────────────────
  if (result.loadTime > 3000) {
    diag.push({
      id: "load-time",
      category: "Performance",
      status: "down",
      issue: `Slow page load: ${(result.loadTime / 1000).toFixed(1)}s (target < 2s)`,
      impact: "High",
      fixes: [
        {
          rank: 1, label: "Best Method",
          method: "Compress & convert all images to WebP/AVIF format — images are almost always the #1 cause of slow load times.",
          code: "# Convert with ffmpeg or use Squoosh / TinyPNG\nffmpeg -i photo.jpg -c:v libwebp photo.webp"
        },
        {
          rank: 2, label: "Lazy Loading",
          method: "Add loading='lazy' on all <img> tags below the fold to defer offscreen images.",
          code: '<img src="hero.webp" alt="Hero" loading="lazy">'
        },
        {
          rank: 3, label: "CDN & Caching",
          method: "Serve assets from a CDN (Cloudflare, Vercel Edge, or AWS CloudFront) and enable browser caching with long cache-control headers.",
          code: "Cache-Control: public, max-age=31536000, immutable"
        },
        {
          rank: 4, label: "Code Minification",
          method: "Minify JS/CSS bundles. Use Vite or Webpack with production mode enabled — bundle size directly affects load time.",
          code: "# Vite production build\nnpm run build"
        }
      ]
    });
  } else if (result.loadTime > 2000) {
    diag.push({
      id: "load-time",
      category: "Performance",
      status: "warning",
      issue: `Moderate load time: ${(result.loadTime / 1000).toFixed(1)}s (target < 2s)`,
      impact: "Medium",
      fixes: [
        {
          rank: 1, label: "Best Method",
          method: "Optimise images with WebP format and lazy loading to shave off 0.5–1s easily.",
          code: '<img src="photo.webp" loading="lazy" alt="...">'
        },
        {
          rank: 2, label: "CDN",
          method: "Use a CDN to serve static assets closer to the user. Cloudflare Free plan works great.",
          code: null
        }
      ]
    });
  } else {
    diag.push({ id: "load-time", category: "Performance", status: "good", issue: `Fast load time: ${(result.loadTime / 1000).toFixed(1)}s`, impact: "High", fixes: [] });
  }

  // ── Broken links ────────────────────────────────────────────────
  if (result.brokenLinks > 0) {
    diag.push({
      id: "broken-links",
      category: "Best Practices",
      status: result.brokenLinks > 3 ? "down" : "warning",
      issue: `${result.brokenLinks} broken link${result.brokenLinks > 1 ? "s" : ""} found`,
      impact: result.brokenLinks > 3 ? "High" : "Medium",
      fixes: [
        {
          rank: 1, label: "Best Method",
          method: "Run a full broken-link audit using Screaming Frog or Ahrefs Site Audit. Fix or redirect each 404 with a 301 permanent redirect.",
          code: "# In your server (Express / Nginx)\napp.get('/old-path', (req, res) => res.redirect(301, '/new-path'));"
        },
        {
          rank: 2, label: "Manual Fix",
          method: "Open each broken URL in your browser, identify the correct destination, and update the <a href='...'> tag in your HTML or CMS.",
          code: null
        },
        {
          rank: 3, label: "Custom 404 Page",
          method: "While fixing, add a helpful custom 404 page that guides users back to your homepage.",
          code: null
        }
      ]
    });
  } else {
    diag.push({ id: "broken-links", category: "Best Practices", status: "good", issue: "No broken links detected", impact: "High", fixes: [] });
  }

  // ── Accessibility checks ────────────────────────────────────────
  const missingAlt = (result.images || []).filter(a => !a || a.trim() === "").length;
  if (missingAlt > 0) {
    diag.push({
      id: "img-alt",
      category: "Accessibility",
      status: "warning",
      issue: `${missingAlt} image${missingAlt > 1 ? "s" : ""} missing alt text`,
      impact: "Medium",
      fixes: [
        {
          rank: 1, label: "Best Method",
          method: "Add descriptive alt text to every <img>. For decorative images use alt='' (empty string) to hide from screen readers.",
          code: '<img src="team.jpg" alt="Our team at the 2024 company retreat">\n<img src="divider.png" alt=""> <!-- decorative -->'
        },
        {
          rank: 2, label: "CMS",
          method: "In WordPress: Media Library → click image → fill in 'Alternative Text'. Shopify: Products → click image → Alt text field.",
          code: null
        }
      ]
    });
  } else if ((result.images || []).length > 0) {
    diag.push({ id: "img-alt", category: "Accessibility", status: "good", issue: "All images have alt text", impact: "Medium", fixes: [] });
  }

  if (result.inputsWithoutLabel > 0) {
    diag.push({
      id: "input-labels",
      category: "Accessibility",
      status: "warning",
      issue: `${result.inputsWithoutLabel} form input${result.inputsWithoutLabel > 1 ? "s" : ""} missing labels`,
      impact: "Medium",
      fixes: [
        {
          rank: 1, label: "Best Method",
          method: "Associate every <input> with a <label> using the 'for' + 'id' attribute pair. This is critical for screen reader users.",
          code: '<label for="email">Email Address</label>\n<input type="email" id="email" name="email">'
        },
        {
          rank: 2, label: "Aria Label",
          method: "If a visible label isn't possible, use aria-label or aria-labelledby to provide an accessible name.",
          code: '<input type="search" aria-label="Search products">'
        }
      ]
    });
  } else {
    diag.push({ id: "input-labels", category: "Accessibility", status: "good", issue: "All form inputs have labels", impact: "Medium", fixes: [] });
  }

  // ── Protocol check ──────────────────────────────────────────────
  try {
    const parsed = new URL(result.url || "https://example.com");
    if (parsed.protocol === "https:") {
      diag.push({ id: "https", category: "Best Practices", status: "good", issue: "Site is secured with HTTPS", impact: "High", fixes: [] });
    } else {
      diag.push({
        id: "https",
        category: "Best Practices",
        status: "down",
        issue: "Site not using HTTPS (insecure)",
        impact: "High",
        fixes: [
          {
            rank: 1, label: "Best Method",
            method: "Install a free SSL certificate via Let's Encrypt. Most hosts (Cloudflare, Vercel, Netlify) provide HTTPS automatically.",
            code: "# Using Certbot on Ubuntu\nsudo certbot --nginx -d yourdomain.com"
          },
          {
            rank: 2, label: "Hosting Panel",
            method: "In cPanel go to SSL/TLS → 'AutoSSL'. In Cloudflare go to SSL/TLS tab and set mode to 'Full (strict)'.",
            code: null
          }
        ]
      });
    }
  } catch { /* skip */ }

  // ── Headings check ──────────────────────────────────────────────
  if (result.headings > 0) {
    diag.push({ id: "headings", category: "SEO", status: "good", issue: `${result.headings} heading tag${result.headings > 1 ? "s" : ""} found (good structure)`, impact: "Medium", fixes: [] });
  } else {
    diag.push({
      id: "headings",
      category: "SEO",
      status: "warning",
      issue: "No heading tags (H1/H2/H3) detected",
      impact: "Medium",
      fixes: [
        {
          rank: 1, label: "Best Method",
          method: "Add exactly one <h1> per page (your main topic), then use <h2>/<h3> for sub-sections. This structures content for both users and Google.",
          code: "<h1>Main Page Topic</h1>\n<h2>Section Title</h2>\n<h3>Sub-section</h3>"
        }
      ]
    });
  }

  return diag;
}

// test route
app.get("/", (req, res) => {
  res.send("Server is running!");
});

app.post("/analyze", async (req, res) => {
  try {

    const userId = req.headers.userid;
    if (!userId) return res.status(401).send("Unauthorized");

    const { url } = req.body;

    // ========= MAIN PAGE =========
    const result = await analyzeWebsite(url);

    const missingAlt = (result.images || [])
      .filter(alt => !alt || alt.trim() === "")
      .length;

    // ========= CATEGORY SCORES =========
    let performance = 100;
    if (result.loadTime > 2000) performance -= 20;
    if (result.loadTime > 4000) performance -= 20;
    if (result.brokenLinks > 0) performance -= 10;

    let accessibility = 100;
    accessibility -= missingAlt * 5;
    if (result.inputsWithoutLabel > 0) accessibility -= 15;

    let seo = 100;
    if (!result.title) seo -= 20;
    if (!result.metaDescription) seo -= 20;
    if (!result.viewport) seo -= 20;

    let bestPractices = 100;
    if (result.brokenLinks > 0) bestPractices -= 15;
    if (result.loadTime > 3000) bestPractices -= 10;

    performance = Math.max(performance, 0);
    accessibility = Math.max(accessibility, 0);
    seo = Math.max(seo, 0);
    bestPractices = Math.max(bestPractices, 0);

    let score = Math.round(
      (performance + accessibility + seo + bestPractices) / 4
    );

    // ========= ISSUES =========
    let issues = [];

    if (!result.title) issues.push("Missing page title");
    if (!result.metaDescription) issues.push("Missing meta description");
    if (result.brokenLinks > 0) issues.push(`${result.brokenLinks} broken links`);
    if (result.loadTime > 3000) issues.push("Slow load time");

    // ========= SUGGESTIONS =========
    let suggestions = [];
    if (!result.title) suggestions.push("Add meaningful title");
    if (!result.metaDescription) suggestions.push("Add meta description");
    if (result.loadTime > 3000) suggestions.push("Optimize load speed");

    // ========= AUTO SITE CRAWL =========
    const pages = await crawlSite(url, 5);

    let siteScore = 0;
    let best = null;
    let worst = null;

    if (pages.length > 0) {
      siteScore = Math.round(
        pages.reduce((a, b) => a + b.score, 0) / pages.length
      );
      best = pages.reduce((a, b) => a.score > b.score ? a : b);
      worst = pages.reduce((a, b) => a.score < b.score ? a : b);
    }

    // ========= SAVE HISTORY =========
    await pool.query(
      `INSERT INTO scans(url,score,issues,suggestions,user_id)
         VALUES($1,$2,$3,$4,$5)`,
      [
        url,
        score,
        JSON.stringify(issues),
        JSON.stringify(suggestions),
        userId
      ]
    );

    // ========= AI REPORT =========
    let aiReport = "";
    try {
      aiReport = await getAISuggestions({ result, issues, score });
    } catch { }

    // ========= DIAGNOSTICS =========
    const resultWithUrl = { ...result, url };
    const diagnostics = buildDiagnostics(resultWithUrl, { performance, accessibility, seo, bestPractices });

    // ========= FINAL RESPONSE =========
    res.json({
      rawData: result,
      score,
      performance,
      accessibility,
      seo,
      bestPractices,
      issues,
      suggestions,
      aiReport,
      diagnostics,

      crawl: {
        siteScore,
        pages,
        best,
        worst
      }
    });

  } catch (e) {
    console.error("ANALYZE ERROR:", e);
    res.status(500).send(e.message || "Analyze Failed");
  }
});

app.post("/crawl", async (req, res) => {
  try {

    const userId = req.headers.userid;
    if (!userId)
      return res.status(401).send("Unauthorized");

    const { url } = req.body;

    const pages = await crawlSite(url, 5);

    // Compute site stats
    const avgScore = Math.round(
      pages.reduce((a, b) => a + b.score, 0) / pages.length
    );

    const best = pages.reduce((a, b) => a.score > b.score ? a : b);
    const worst = pages.reduce((a, b) => a.score < b.score ? a : b);

    res.json({
      siteScore: avgScore,
      pages,
      best,
      worst
    });

  } catch (e) {
    console.log(e);
    res.status(500).send("Crawl failed");
  }
});

app.post("/ai-chat", async (req, res) => {
  try {

    const { scanData, question } = req.body;

    if (!scanData || !question)
      return res.status(400).send("Missing data");

    const reply = await websiteChat(scanData, question);

    res.json({ reply });

  } catch (err) {
    console.log(err);
    res.status(500).send("AI chat failed");
  }
});

app.post("/save-comparison", async (req, res) => {

  const { userId, url1, url2, score1, score2 } = req.body;

  await pool.query(
    `INSERT INTO comparisons(user_id,url1,url2,score1,score2)
     VALUES($1,$2,$3,$4,$5)`,
    [userId, url1, url2, score1, score2]
  );

  res.send("Saved");
});

app.get("/get-comparisons", async (req, res) => {
  const userId = req.headers.userid;

  const data = await pool.query(
    `SELECT * FROM comparisons
     WHERE user_id=$1
     ORDER BY created_at DESC`,
    [userId]
  );

  res.json(data.rows);
});

app.post("/competitors", async (req, res) => {
  try {

    const { url } = req.body;

    const competitors = await findCompetitors(url);

    const results = [];

    for (const c of competitors) {

      const full = c.startsWith("http")
        ? c
        : "https://" + c;

      try {
        const data = await analyzeWebsite(full);

        const score = Math.max(
          0,
          100
          - data.loadTime / 40
          - data.brokenLinks * 5
          - data.inputsWithoutLabel * 3
        );

        results.push({
          url: full,
          score
        });

      } catch (err) {
        console.log("Skip competitor:", full);
      }
    }

    res.json(results);

  } catch (e) {
    console.log(e);
    res.status(500).send("Competitor analysis failed");
  }
});



app.get("/history", async (req, res) => {

  const userId = req.headers.userid;

  if (!userId)
    return res.status(401).send("Unauthorized");

  const result = await pool.query(
    `SELECT * FROM scans
        WHERE user_id=$1
        ORDER BY created_at DESC
        LIMIT 10`,
    [userId]
  );

  res.json(result.rows);
});

app.listen(5000, () => {
  console.log("Server started on port 5000");
});
