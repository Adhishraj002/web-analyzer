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


// test route
app.get("/", (req,res)=>{
    res.send("Server is running!");
});

app.post("/analyze", async (req,res)=>{
try {

    const userId = req.headers.userid;
    if(!userId) return res.status(401).send("Unauthorized");

    const { url } = req.body;

    // ========= MAIN PAGE =========
    const result = await analyzeWebsite(url);

    const missingAlt = (result.images || [])
      .filter(alt => !alt || alt.trim() === "")
      .length;

    // ========= CATEGORY SCORES =========
    let performance = 100;
    if(result.loadTime > 2000) performance -= 20;
    if(result.loadTime > 4000) performance -= 20;
    if(result.brokenLinks > 0) performance -= 10;

    let accessibility = 100;
    accessibility -= missingAlt * 5;
    if(result.inputsWithoutLabel > 0) accessibility -= 15;

    let seo = 100;
    if(!result.title) seo -= 20;
    if(!result.metaDescription) seo -= 20;
    if(!result.viewport) seo -= 20;

    let bestPractices = 100;
    if(result.brokenLinks > 0) bestPractices -= 15;
    if(result.loadTime > 3000) bestPractices -= 10;

    performance=Math.max(performance,0);
    accessibility=Math.max(accessibility,0);
    seo=Math.max(seo,0);
    bestPractices=Math.max(bestPractices,0);

    let score=Math.round(
        (performance+accessibility+seo+bestPractices)/4
    );

    // ========= ISSUES =========
    let issues=[];

    if(!result.title) issues.push("Missing page title");
    if(!result.metaDescription) issues.push("Missing meta description");
    if(result.brokenLinks>0) issues.push(`${result.brokenLinks} broken links`);
    if(result.loadTime>3000) issues.push("Slow load time");

    // ========= SUGGESTIONS =========
    let suggestions=[];
    if(!result.title) suggestions.push("Add meaningful title");
    if(!result.metaDescription) suggestions.push("Add meta description");
    if(result.loadTime>3000) suggestions.push("Optimize load speed");

    // ========= AUTO SITE CRAWL =========
    const pages = await crawlSite(url,5);

    let siteScore = 0;
    let best = null;
    let worst = null;

    if(pages.length > 0){
      siteScore = Math.round(
        pages.reduce((a,b)=>a+b.score,0)/pages.length
      );
      best = pages.reduce((a,b)=>a.score>b.score?a:b);
      worst = pages.reduce((a,b)=>a.score<b.score?a:b);
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
    let aiReport="";
    try{
        aiReport=await getAISuggestions({result,issues,score});
    }catch{}

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

        crawl:{
            siteScore,
            pages,
            best,
            worst
        }
    });

}catch(e){
    console.error("ANALYZE ERROR:", e);
    res.status(500).send(e.message || "Analyze Failed");
}
});

app.post("/crawl", async(req,res)=>{
    try{

        const userId = req.headers.userid;
        if(!userId)
            return res.status(401).send("Unauthorized");

        const { url } = req.body;

        const pages = await crawlSite(url,5);

        // Compute site stats
        const avgScore = Math.round(
            pages.reduce((a,b)=>a+b.score,0) / pages.length
        );

        const best = pages.reduce((a,b)=> a.score>b.score?a:b);
        const worst = pages.reduce((a,b)=> a.score<b.score?a:b);

        res.json({
            siteScore:avgScore,
            pages,
            best,
            worst
        });

    }catch(e){
        console.log(e);
        res.status(500).send("Crawl failed");
    }
});

app.post("/ai-chat", async (req,res)=>{
  try {

    const { scanData, question } = req.body;

    if(!scanData || !question)
      return res.status(400).send("Missing data");

    const reply = await websiteChat(scanData, question);

    res.json({ reply });

  } catch(err){
    console.log(err);
    res.status(500).send("AI chat failed");
  }
});

app.post("/save-comparison", async (req,res)=>{

  const { userId,url1,url2,score1,score2 } = req.body;

  await pool.query(
    `INSERT INTO comparisons(user_id,url1,url2,score1,score2)
     VALUES($1,$2,$3,$4,$5)`,
    [userId,url1,url2,score1,score2]
  );

  res.send("Saved");
});

app.get("/get-comparisons", async(req,res)=>{
  const userId = req.headers.userid;

  const data = await pool.query(
    `SELECT * FROM comparisons
     WHERE user_id=$1
     ORDER BY created_at DESC`,
    [userId]
  );

  res.json(data.rows);
});

app.post("/competitors", async(req,res)=>{
try{

  const { url } = req.body;

  const competitors = await findCompetitors(url);

  const results = [];

  for(const c of competitors){

      const full = c.startsWith("http")
        ? c
        : "https://" + c;

      try{
        const data = await analyzeWebsite(full);

        const score = Math.max(
          0,
          100
          - data.loadTime/40
          - data.brokenLinks*5
          - data.inputsWithoutLabel*3
        );

        results.push({
          url: full,
          score
        });

      }catch(err){
        console.log("Skip competitor:", full);
      }
  }

  res.json(results);

}catch(e){
  console.log(e);
  res.status(500).send("Competitor analysis failed");
}
});



app.get("/history", async (req,res)=>{

    const userId = req.headers.userid;

    if(!userId) 
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

app.listen(5000, ()=>{    
    console.log("Server started on port 5000");
});
