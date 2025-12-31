
export interface CiscoQueryResponse {
  reasoning: string;
  syntax: string;
  description: string;
  usageContext: string;
  options: string;
  notes: string;
  examples: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  metadata?: CiscoQueryResponse;
}
