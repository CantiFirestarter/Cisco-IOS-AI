
export interface CiscoQueryResponse {
  reasoning: string;
  syntax: string;
  description: string;
  usageContext: string;
  options: string;
  notes: string;
  examples: string;
  deviceCategory: 'Switch' | 'Router' | 'Universal';
  commandMode: string;
  correction?: string; // New field for spell-check/syntax correction
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  metadata?: CiscoQueryResponse;
}
