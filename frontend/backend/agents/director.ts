import { GoogleGenAI, Type } from '@google/genai';

export const runDirectorAgent = async (base64Data: string, mimeType: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY, vertexai: true });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      role: 'user',
      parts: [
        { inlineData: { data: base64Data, mimeType } },
        { text: 'Act as an expert Video Production Director. Analyze this video. Extract a high-fidelity verbatim text transcript, map chronological structural video chapters, and pinpoint exactly three high-energy visual or verbal "hooks" suitable for short-form repurposing.' }
      ]
    },
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          transcript: { type: Type.STRING },
          chapters: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                timestamp: { type: Type.STRING },
                title: { type: Type.STRING },
                summary: { type: Type.STRING }
              }
            }
          },
          hooks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                start_time: { type: Type.STRING },
                end_time: { type: Type.STRING },
                justification: { type: Type.STRING }
              }
            }
          }
        }
      }
    }
  });

  return JSON.parse(response.text);
};
