
import { GoogleGenAI, Type } from "@google/genai";

const SYSTEM_INSTRUCTION = `
You are an expert Cisco AI assistant (Cisco CLI Expert).
Your role is to provide precise technical documentation for Cisco IOS, IOS XE, and IOS XR.

SPELL CHECK & SYNTAX CORRECTION:
- Detect typos in CLI commands. Provide the corrected version in the 'correction' field.

VISUAL ANALYSIS:
- If the user provides an image, analyze it for CLI output, error messages, or network topology.
- Incorporate visual findings into your reasoning and examples.

GROUNDING:
- If you use Google Search grounding, extract the source titles and URLs into the response.

FORMATTING RULES:
- IMPORTANT: In 'description', 'usageContext', 'options', and 'notes', you MUST wrap ALL CLI commands, keywords, parameters, and variables (e.g., \`vlan <id>\`, \`ip routing\`, \`no shutdown\`) in backticks (\`).
- Use **bold** for major emphasis only.
- 'options' should be a bulleted list where the command part is always in backticks.
- Syntax and examples must be pure text with standard CLI prompts (e.g., Switch#).
- Always return a JSON object.
`;

export const getCiscoCommandInfo = async (query: string, imageBase64?: string, model: string = 'gemini-3-pro-preview') => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const contents: any[] = [];
  const parts: any[] = [{ text: query }];
  
  if (imageBase64) {
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: imageBase64.split(',')[1] || imageBase64
      }
    });
  }
  
  contents.push({ parts });

  const isComplex = query.length > 100 || query.toLowerCase().includes('design') || query.toLowerCase().includes('troubleshoot');

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        tools: model.includes('pro') ? [{ googleSearch: {} }] : undefined,
        thinkingConfig: (model.includes('pro') || model.includes('flash')) && isComplex ? { thinkingBudget: 8000 } : undefined,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reasoning: { type: Type.STRING },
            deviceCategory: { type: Type.STRING },
            commandMode: { type: Type.STRING },
            syntax: { type: Type.STRING },
            description: { type: Type.STRING },
            usageContext: { type: Type.STRING },
            options: { type: Type.STRING },
            notes: { type: Type.STRING },
            examples: { type: Type.STRING },
            correction: { type: Type.STRING },
          },
          required: ["reasoning", "deviceCategory", "commandMode", "syntax", "description", "usageContext", "options", "notes", "examples"]
        }
      },
    });

    const result = JSON.parse(response.text);

    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      result.sources = chunks
        .filter(c => c.web)
        .map(c => ({ title: c.web.title, uri: c.web.uri }));
    }

    return result;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

/**
 * Generates 4 dynamic follow-up Cisco technical topics based on history.
 */
export const getDynamicSuggestions = async (history: string[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = history.length > 0 
    ? `Based on these recent Cisco CLI queries: [${history.join(', ')}], suggest 4 highly relevant, professional follow-up topics or commands. Keep them concise (under 30 chars).`
    : "Suggest 4 foundational Cisco CLI topics for a network engineer (e.g. VLANs, OSPF, BGP).";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        systemInstruction: "You are a network training assistant. Return only a JSON array of strings.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.warn("Failed to generate dynamic suggestions, using defaults.");
    return [
      'BGP neighbor configuration', 
      'OSPF areas on IOS XR', 
      'VLAN interface setup', 
      'Show spanning-tree details'
    ];
  }
};
