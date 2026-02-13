require("dotenv").config();
const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1"
});

async function getAISuggestions(data) {

  // ✅ ONLY send small useful info
  const compactData = {
    score: data.score,
    issues: data.issues,
    loadTime: data.result.loadTime,
    brokenLinks: data.result.brokenLinks,
    inputsWithoutLabel: data.result.inputsWithoutLabel,
    hasViewport: data.result.viewport,
    hasMetaDescription: data.result.metaDescription !== null
  };

  const prompt = `
You are an expert website auditor.

Give short professional analysis based on:

1. Problem explanation
2. Accessibility improvements
3. SEO suggestions
4. Performance optimization
5. Priority ranking

Scan Summary:
${JSON.stringify(compactData)}
`;

  const completion = await client.chat.completions.create({
    model: "llama-3.1-8b-instant",   // ⭐ IMPORTANT — lightweight model
    messages: [
      { role: "user", content: prompt }
    ],
    temperature: 0.5,
    max_tokens: 500   // ⭐ Prevent overflow
  });

  return completion.choices[0].message.content;
}

module.exports = getAISuggestions;
