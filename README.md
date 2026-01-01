<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Cisco IOS AI (Azure OpenAI)

Minimal Express backend that proxies to Azure OpenAI for Cisco CLI help, with optional Azure Speech TTS, built with Vite + React.

## Local development

**Prereqs**
- Node.js 18+
- Azure OpenAI resource (endpoint, key, deployment name)
- (Optional) Azure Speech resource for TTS

**Setup**
1) Install deps: `npm install`
2) Copy .env.example to .env.local and set:
   - AZURE_OPENAI_ENDPOINT
   - AZURE_OPENAI_API_KEY
   - AZURE_OPENAI_DEPLOYMENT (e.g., gpt-4o-mini)
   - AZURE_SPEECH_KEY (for TTS)
   - AZURE_SPEECH_REGION (for TTS)
   - AZURE_SPEECH_VOICE (optional, defaults to en-US-JennyNeural)
3) Run dev server: `npm run dev`

## Production build

- Build: `npm run build`
- Serve built assets with the Express server: `npm run start` (serves dist on port 4173 by default)

## Azure deployment (container app)

- A Dockerfile and azure.yaml are included. After setting env vars, run `azd up` to build and deploy to Azure Container Apps (port 4173).

## API routes

- POST /api/azure-openai
   - `query`: required for command info
   - `action: "suggestions"`: returns 4 follow-up topics
   - `action: "tts"` with `text`: returns base64 PCM audio (requires Speech keys)

## Notes

- If you see `/index.css doesn't exist at build time`, ensure your CSS is generated or remove the reference in the Vite entry if unused.
