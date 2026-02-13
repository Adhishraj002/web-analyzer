const puppeteer = require("puppeteer");

async function analyzeWebsite(url) {

    const browser = await puppeteer.launch({
        headless: "new",
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu'
        ]
    });

    const page = await browser.newPage();

    const start = Date.now();

    try{
        await page.goto(url,{
            waitUntil:"networkidle2",
            timeout:30000
        });
    }catch(e){
        await browser.close();
        throw new Error("Invalid or unreachable URL");
    }

    const loadTime = Date.now() - start;

    // Screenshot
    const screenshot = await page.screenshot({
        encoding:"base64",
        fullPage:true
    });

    // DOM Analysis
    const data = await page.evaluate(async ()=>{

        const images = [...document.images].map(img=>img.alt);
        const buttons = document.querySelectorAll("button").length;
        const links = [...document.links].map(l=>l.href);
        const headings = document.querySelectorAll("h1,h2,h3").length;

        const title = document.title;

        const metaDescription =
            document.querySelector('meta[name="description"]')?.content || null;

        const viewport =
            document.querySelector('meta[name="viewport"]') !== null;

        const inputsWithoutLabel =
        [...document.querySelectorAll("input")]
        .filter(i => !i.labels || i.labels.length === 0)
        .length;

        // Broken link check (safe)
        let brokenLinks = 0;

        for(const link of links.slice(0,10)){
            try{
                const res = await fetch(link,{method:"HEAD"});
                if(!res.ok) brokenLinks++;
            }catch{
                brokenLinks++;
            }
        }

        return {
            images,
            buttons,
            links,
            headings,
            title,
            metaDescription,
            viewport,
            inputsWithoutLabel,
            brokenLinks
        };
    });

    await browser.close();

    return {
        ...data,
        screenshot,
        loadTime
    };
}

module.exports = analyzeWebsite;
