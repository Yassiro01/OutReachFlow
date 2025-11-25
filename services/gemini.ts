import { GoogleGenAI } from "@google/genai";

export const generateEmailContent = async (topic: string, tone: string): Promise<{ subject: string; body: string }> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key not configured");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    You are an expert cold email copywriter. 
    Write a high-converting cold email for a SaaS outreach campaign.
    
    Topic: ${topic}
    Tone: ${tone}
    
    Format the response as a JSON object with keys: "subject" and "body".
    The body should use basic HTML line breaks (<br>) for formatting.
    Do not use markdown in the output, just raw JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Error:", error);
    throw new Error("Failed to generate content");
  }
};