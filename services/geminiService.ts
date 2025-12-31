
import { GoogleGenAI, Type } from "@google/genai";

const SYSTEM_INSTRUCTION = `
You are an expert Cisco AI assistant with comprehensive knowledge of Cisco IOS, IOS XE, and IOS XR commands.
Your role is to receive queries and provide accurate, detailed information.

Steps:
1. Reason through the command context (device type, Cisco OS platform, operational mode).
2. Provide structured details: Syntax, Description, Usage Context, Options, Notes/Caveats, and Examples.

ALWAYS return the response as a JSON object with the following keys:
- reasoning: String (Your reasoning process)
- syntax: String (Complete syntax, markdown formatted)
- description: String (Function explanation)
- usageContext: String (Platforms and modes)
- options: String (Parameters explained)
- notes: String (Caveats and troubleshooting)
- examples: String (Example CLI usage for IOS, XE, and XR)

Do not use markdown blocks inside the JSON strings for the root keys, but you can use standard markdown formatting (like bold, lists) within the string values.
`;

export const getCiscoCommandInfo = async (query: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: query }] }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reasoning: { type: Type.STRING },
            syntax: { type: Type.STRING },
            description: { type: Type.STRING },
            usageContext: { type: Type.STRING },
            options: { type: Type.STRING },
            notes: { type: Type.STRING },
            examples: { type: Type.STRING },
          },
          required: ["reasoning", "syntax", "description", "usageContext", "options", "notes", "examples"]
        }
      },
    });

    return JSON.parse(response.text) as any;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
