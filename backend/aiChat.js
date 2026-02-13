require("dotenv").config();
const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1"
});

async function websiteChat(scanData, question){

  // ✅ Compact data sent from frontend
  const compact = {
    score: scanData.score,
    issues: scanData.issues,
    suggestions: scanData.suggestions,
    loadTime: scanData.loadTime,
    brokenLinks: scanData.brokenLinks,
    inputsWithoutLabel: scanData.inputsWithoutLabel
  };

  const prompt = `
You are an expert website consultant.

Scan Summary:
${JSON.stringify(compact)}

User Question:
${question}

Explain simply and clearly.
`;

  try {

    const completion = await client.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role:"user", content: prompt }],
      temperature: 0.6,
      max_tokens: 400
    });

    return completion.choices[0].message.content;

  } catch(e){
    console.log("AI Chat Error:", e.message);
    return "AI temporarily unavailable — try again.";
  }
}

module.exports = websiteChat;
