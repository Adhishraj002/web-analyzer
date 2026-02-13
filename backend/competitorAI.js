require("dotenv").config();
const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1"
});

async function findCompetitors(url){

  const prompt = `
Return ONLY a JSON array.
No explanation.
No text.

Find 3 competitor domains similar to:
${url}

Example output:
["example.com","example2.com","example3.com"]
`;

  const res = await client.chat.completions.create({
    model:"llama-3.1-8b-instant",
    messages:[{role:"user",content:prompt}],
    temperature:0
  });

  let text = res.choices[0].message.content;

  // ⭐ CLEAN RESPONSE
  text = text.replace(/```json|```/g,"").trim();

  try{
    return JSON.parse(text);
  }catch(e){
    console.log("Parse fail:", text);
    return [];
  }
}

module.exports = findCompetitors;
