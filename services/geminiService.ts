
import { GoogleGenAI, Type, Modality } from "@google/genai";

const SYSTEM_INSTRUCTION = `
You are an expert Cisco AI assistant (Cisco CLI Expert).
Your role is to provide precise, consistent, and deterministic technical documentation for Cisco IOS, IOS XE, and IOS XR.

DETERMINISM ENFORCEMENT:
- You are a technical reference manual, not a creative writer.
- For identical commands, always provide the exact same definitions, syntax, and guidelines.
- Do not vary phrasing for variety. Use the most technically accurate and concise standard phrasing.
- If a command's function is "Enables BGP routing," always use that exact phrase.

SCOPE ENFORCEMENT:
- You are strictly limited to Cisco networking, CLI commands, network design, and troubleshooting.
- If a query is NOT related to networking, infrastructure, or Cisco technology, set 'isOutOfScope' to true.

RESEARCH PROTOCOL:
- If a user asks about a specific command and there is ambiguity, you MUST use the googleSearch tool.

FORMATTING RULES (CRITICAL):
1. Wrap ALL CLI commands, keywords, and variables in backticks (\`), EXCEPT within the 'examples' field.
2. Use angle brackets for variables and placeholders (e.g., <vlan-id>).
3. If a variable contains choices, use a pipe (|) separator: <in|out>.
4. NEVER use single quotes or parentheses around commands.
5. For 'options', use: \`- \`command\` : description\`.
6. Bold important concepts with double asterisks.
7. Examples MUST use raw terminal text. NO backticks (\`) allowed in the 'examples' field.
8. Always return a JSON object.

CONTENT SPECIFICS:
- 'usageGuidelines': Provide operational best practices, performance impact warnings, or deployment recommendations.
`;

export const getCiscoCommandInfo = async (
  query: string, 
  fileData?: { data: string, mimeType: string }, 
  model: string = 'gemini-3-pro-preview', 
  forceSearch: boolean = false,
  voiceInput: boolean = false
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const contents: any[] = [];
  const promptText = forceSearch 
    ? `STRICT TECHNICAL SEARCH REQUIRED: Deep dive into Cisco documentation for syntax, security hardening, and troubleshooting: ${query}` 
    : query;
    
  const parts: any[] = [{ text: promptText }];
  
  if (fileData) {
    parts.push({
      inlineData: {
        mimeType: fileData.mimeType,
        data: fileData.data.split(',')[1] || fileData.data
      }
    });
  }
  
  contents.push({ parts });

  const isComplex = forceSearch || query.length > 80 || query.toLowerCase().includes('design') || query.toLowerCase().includes('troubleshoot');

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        // DETERMINISM CONFIGURATION
        temperature: 0.1, // Near-zero for deterministic output
        seed: 42,        // Fixed seed for reproducibility
        tools: (model.includes('pro') || forceSearch) ? [{ googleSearch: {} }] : undefined,
        thinkingConfig: (model.includes('pro') || model.includes('flash')) && isComplex ? { thinkingBudget: 12000 } : undefined,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reasoning: { type: Type.STRING },
            isOutOfScope: { type: Type.BOOLEAN },
            deviceCategory: { type: Type.STRING },
            commandMode: { type: Type.STRING },
            syntax: { type: Type.STRING },
            description: { type: Type.STRING },
            usageContext: { type: Type.STRING },
            usageGuidelines: { type: Type.STRING },
            checklist: { type: Type.STRING },
            options: { type: Type.STRING },
            troubleshooting: { type: Type.STRING },
            security: { type: Type.STRING },
            notes: { type: Type.STRING },
            examples: { type: Type.STRING },
            correction: { type: Type.STRING },
          },
          // Fixed property ordering ensures the model generates fields in a consistent logical flow
          propertyOrdering: ["reasoning", "isOutOfScope", "deviceCategory", "commandMode", "syntax", "description", "usageContext", "usageGuidelines", "checklist", "options", "troubleshooting", "security", "notes", "examples", "correction"],
          required: ["reasoning", "isOutOfScope", "deviceCategory", "commandMode", "syntax", "description", "usageContext", "usageGuidelines", "checklist", "options", "troubleshooting", "security", "notes", "examples"]
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

export const getDynamicSuggestions = async (history: string[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = history.length > 0 
    ? `Based on recent queries: [${history.join(', ')}], suggest 4 professional Cisco follow-ups.`
    : "Suggest 4 foundational Cisco CLI topics.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        systemInstruction: "Return only a JSON array of strings. Be technically specific.",
        responseMimeType: "application/json",
        temperature: 0.1,
        seed: 42,
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    return ['BGP neighbor config', 'OSPF XR setup', 'VLAN interface', 'Show spanning-tree'];
  }
};

function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const synthesizeSpeech = async (text: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Say in a professional, technical voice: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });
  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("No audio data received");
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  
  if (audioCtx.state === 'suspended') {
    await audioCtx.resume();
  }
  
  const audioBuffer = await decodeAudioData(decodeBase64(base64Audio), audioCtx, 24000, 1);
  return { audioBuffer, audioCtx };
};
