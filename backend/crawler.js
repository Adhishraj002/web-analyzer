const analyzeWebsite = require("./analyzer");

async function crawlSite(startUrl, maxPages = 5){

    const visited = new Set();
    const queue = [startUrl];
    const results = [];

    const baseDomain = new URL(startUrl).hostname;

    while(queue.length && visited.size < maxPages){

        const url = queue.shift();

        if(visited.has(url)) continue;
        visited.add(url);

        try{
            const data = await analyzeWebsite(url);

            results.push({
                url,
                score: Math.max(0,
                    100
                    - (data.loadTime/40)
                    - (data.brokenLinks * 5)
                    - (data.inputsWithoutLabel * 3)
                ),
                issues:data.brokenLinks,
                raw:data
            });

            // Collect internal links
            for(const link of data.links){
                try{
                    const host = new URL(link).hostname;
                    if(host === baseDomain && !visited.has(link)){
                        queue.push(link);
                    }
                }catch{}
            }

        }catch(e){
            console.log("Skip:",url);
        }
    }

    return results;
}

module.exports = crawlSite;
