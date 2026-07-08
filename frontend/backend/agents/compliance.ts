import { GoogleGenAI, Type } from '@google/genai';

export const runComplianceAgent = async (transcript: string, guidelineFile: { data: string, mimeType: string } | null) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY, vertexai: true });
  
  const complianceParts: any[] = [
    { 
      text: `Act as a Corporate Compliance Officer and SEO Strategist.
      
Video Transcript:
${transcript}

Task 1: Audit the transcript against the provided corporate guidelines. Flag any violations explicitly. If no guidelines were attached, use standard professional brand safety rules (no profanity, no competitor mentions).
Task 2: Generate 3 highly engaging, high-CTR YouTube video title options based on the transcript.` 
    }
  ];

  if (guidelineFile) {
    complianceParts.unshift({
      inlineData: {
        data: guidelineFile.data,
        mimeType: guidelineFile.mimeType
      }
    });
    complianceParts.unshift({
      text: "Please review the attached corporate guidelines document carefully."
    });
  } else {
    complianceParts.unshift({
      text: "No specific guidelines document was provided. Use default professional brand safety rules."
    });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      role: 'user',
      parts: complianceParts
    },
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          compliance_passed: { type: Type.BOOLEAN },
          violations_found: { type: Type.ARRAY, items: { type: Type.STRING } },
          seo_titles: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    }
  });

  return JSON.parse(response.text);
};
