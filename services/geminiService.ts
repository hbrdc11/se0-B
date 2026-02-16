import { GoogleGenAI } from "@google/genai";

// Initialize the client with the API Key from the environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates a short, romantic poem or message based on a topic or mood.
 */
export const generateLoveNote = async (topic: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Şu konu hakkında çok kısa, samimi ve romantik bir aşk notu yaz (maksimum 3 cümle): ${topic}. Sevgiliden sevgiliye yazılmış gibi olsun. "Sen" dili kullan, resmiyetten uzak dur, içten ve duygusal olsun. Emojileri kullanma. Türkçe yaz.`,
      config: {
        thinkingConfig: { thinkingBudget: 0 }, // Minimize latency for this simple task
        temperature: 0.7,
      }
    });

    return response.text || "Sana olan sevgimi anlatmaya kelimeler yetmez.";
  } catch (error) {
    console.error("Error generating love note:", error);
    return "Teknoloji bazen teklese de, kalbim her zaman senin için atıyor.";
  }
};