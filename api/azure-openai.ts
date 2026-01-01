import { OpenAIClient, AzureKeyCredential } from "@azure/openai";
import { Buffer } from 'node:buffer';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const SYSTEM_INSTRUCTION = `
You are an expert Cisco AI assistant (Cisco CLI Expert).
Your role is to provide precise technical documentation for Cisco IOS, IOS XE, and IOS XR.

RESEARCH PROTOCOL:
- Pay extremely close attention to version-specific differences between IOS XE and IOS XR.

CONFIGURATION CHECKLIST:
- You MUST provide a 'checklist' section.
- This should be a step-by-step bulleted list of:
  1. Prerequisites (e.g., 'ip routing' must be enabled).
  2. Mandatory preceding commands.
  3. Post-configuration verification.

SECURITY PROTOCOL (MANDATORY):
- You MUST provide a 'security' section for every query.
- Identify if the command is deprecated or insecure (e.g., Telnet, HTTP, clear-text SNMP).
- Suggest hardening steps (e.g., using 'secret' instead of 'password', access-lists to restrict management access).
- Mention any impact on Control Plane Policing (CoPP) or CPU impact for debug commands.

TROUBLESHOOTING & VERIFICATION:
- You MUST provide a 'troubleshooting' section.
- This section should include common error messages and a bulleted list of 'show' and 'debug' commands.

SPELL CHECK & SYNTAX CORRECTION:
- Detect typos in CLI commands. Provide the corrected version in the 'correction' field.

FORMATTING RULES:
- IMPORTANT: In 'description', 'usageContext', 'checklist', 'options', 'notes', 'troubleshooting', and 'security', you MUST wrap ALL CLI commands, keywords, and variables in backticks (\x60).
- 'checklist', 'options', 'troubleshooting', and 'security' should be bulleted lists where commands are in backticks.
- Syntax and examples must be pure text with standard CLI prompts.
- Always return a JSON object with the specified fields.
`;

function escapeXml(input: string) {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, imageBase64, model = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o-mini', forceSearch = false, action, text } = req.body;

    if (!process.env.AZURE_OPENAI_ENDPOINT || !process.env.AZURE_OPENAI_API_KEY) {
      return res.status(500).json({ error: 'AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY must be set' });
    }

    const client = new OpenAIClient(
      process.env.AZURE_OPENAI_ENDPOINT,
      new AzureKeyCredential(process.env.AZURE_OPENAI_API_KEY)
    );

    // Handle text-to-speech via Azure Speech
    if (action === 'tts') {
      if (!text) {
        return res.status(400).json({ error: 'Text is required for TTS' });
      }

      if (!process.env.AZURE_SPEECH_KEY || !process.env.AZURE_SPEECH_REGION) {
        return res.status(500).json({ error: 'AZURE_SPEECH_KEY and AZURE_SPEECH_REGION must be set for TTS' });
      }

      const voice = process.env.AZURE_SPEECH_VOICE || 'en-US-JennyNeural';
      const speechEndpoint = `https://${process.env.AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`;

      const ssml = `<speak version="1.0" xml:lang="en-US"><voice name="${voice}">${escapeXml(text)}</voice></speak>`;

      const ttsResp = await fetch(speechEndpoint, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': process.env.AZURE_SPEECH_KEY,
          'Ocp-Apim-Subscription-Region': process.env.AZURE_SPEECH_REGION,
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': 'raw-24khz-16bit-mono-pcm'
        },
        body: ssml
      });

      if (!ttsResp.ok) {
        const errorText = await ttsResp.text().catch(() => '');
        return res.status(ttsResp.status).json({ error: 'Azure Speech request failed', message: errorText });
      }

      const audioBuffer = Buffer.from(await ttsResp.arrayBuffer());
      const audioBase64 = audioBuffer.toString('base64');

      return res.status(200).json({ audioBase64, sampleRate: 24000, channels: 1 });
    }

    // Handle suggestions
    if (action === 'suggestions') {
      const messages = [
        { role: 'system', content: 'Return a JSON array of 4 concise Cisco CLI follow-up topics.' },
        { role: 'user', content: query || 'general Cisco networking' }
      ];

      const completion = await client.getChatCompletions(model, messages, {
        temperature: 0.2,
        maxTokens: 256
      });

      const textContent = completion.choices?.[0]?.message?.content?.trim() || '[]';
      let suggestions: string[] = [];
      try {
        suggestions = JSON.parse(textContent);
      } catch {
        suggestions = [textContent].filter(Boolean);
      }
      return res.status(200).json({ suggestions });
    }

    // Handle command info
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const userPrompt = forceSearch
      ? `STRICT TECHNICAL SEARCH REQUIRED: Deep dive into Cisco documentation for syntax, security hardening, and troubleshooting: ${query}`
      : query;

    const messages = [
      { role: 'system', content: SYSTEM_INSTRUCTION },
      { role: 'user', content: userPrompt }
    ];

    const completion = await client.getChatCompletions(model, messages, {
      temperature: 0.2,
      maxTokens: 1200
    });

    const textContent = completion.choices?.[0]?.message?.content?.trim();
    if (!textContent) {
      return res.status(500).json({ error: 'Empty response from Azure OpenAI' });
    }

    let data: any = {};
    try {
      data = JSON.parse(textContent);
    } catch {
      data = { reasoning: textContent };
    }

    return res.status(200).json(data);

  } catch (error: any) {
    console.error('Azure OpenAI API Error:', error);
    return res.status(500).json({
      error: 'Failed to process request',
      message: error.message || 'Unknown error'
    });
  }
}
