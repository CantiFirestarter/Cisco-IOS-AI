
import { GoogleGenAI, Type } from "@google/genai";

const SYSTEM_INSTRUCTION = `
You are an expert Cisco AI assistant with comprehensive knowledge of Cisco IOS, IOS XE, and IOS XR commands.
Your role is to provide precise technical documentation for networking engineers.

SPELL CHECK & SYNTAX CORRECTION:
- Closely analyze the user's input for typos in CLI commands, keywords, or parameters.
- If you detect a likely typo (e.g., 'ip int bief' instead of 'ip int brief'), provide the corrected version in the 'correction' field.
- If the command is perfectly spelled, leave the 'correction' field empty or null.

Provide a detailed response for the requested command or task, including:
- reasoning: Your brief analysis of the command.
- deviceCategory: Classify if this command is primarily for 'Switch', 'Router', or 'Universal' (works on both).
- commandMode: The specific CLI mode required (e.g., "Global Configuration", "Privileged EXEC", "Interface Configuration").
- syntax: The full command syntax.
- description: What the command does.
- usageContext: Where and when to use it (platforms, modes).
- options: Explanation of parameters and flags.
- notes: Important caveats or best practices.
- examples: Practical CLI examples.

FORMATTING RULES:
1. Use **bold** for keywords and \`code\` for variables in 'description', 'options', 'notes', and 'usageContext'.
2. NEVER use markdown formatting (like **bold**, *italics*, or \`code\`) inside the 'syntax' or 'examples' fields. These fields must be pure text.
3. PLATFORM-SPECIFIC PROMPTS: The hostname in the prompt MUST reflect the 'deviceCategory'.
   - If 'Switch': Use 'Switch>' or 'Switch#' or 'Switch(config)#'
   - If 'Router': Use 'Router>' or 'Router#' or 'Router(config)#'
   - If 'Universal': Use 'Device>' or 'Device#' or 'Device(config)#'
4. COMMAND MODES: For every command listed in 'syntax' and 'examples', you MUST prefix the command with the standard prompt:
   - User EXEC: '>' 
   - Privileged EXEC: '#' 
   - Global Configuration: '(config)#'
   - Interface Configuration: '(config-if)#'
   - Router Configuration: '(config-router)#'
5. In 'examples', each step of the process MUST be on its own new line.
6. ALWAYS return the response as a JSON object.
`;

export const getCiscoCommandInfo = async (query: string, model: string = 'gemini-3-pro-preview') => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: [{ parts: [{ text: query }] }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reasoning: { type: Type.STRING },
            deviceCategory: { 
              type: Type.STRING, 
              description: "Must be one of: 'Switch', 'Router', or 'Universal'" 
            },
            commandMode: { type: Type.STRING },
            syntax: { type: Type.STRING },
            description: { type: Type.STRING },
            usageContext: { type: Type.STRING },
            options: { type: Type.STRING },
            notes: { type: Type.STRING },
            examples: { type: Type.STRING },
            correction: { 
              type: Type.STRING, 
              description: "The corrected syntax if a typo was detected in the input, otherwise null." 
            },
          },
          required: ["reasoning", "deviceCategory", "commandMode", "syntax", "description", "usageContext", "options", "notes", "examples"]
        }
      },
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
