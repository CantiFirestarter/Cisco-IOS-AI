
export interface GroundingSource {
  title: string;
  uri: string;
}

export interface CiscoQueryResponse {
  reasoning: string;
  syntax: string;
  description: string;
  usageContext: string;
  checklist: string;
  options: string;
  troubleshooting: string;
  security: string;
  notes: string;
  examples: string;
  deviceCategory: 'Switch' | 'Router' | 'Universal';
  commandMode: string;
  correction?: string;
  sources?: GroundingSource[];
  isOutOfScope?: boolean; // Flag for non-Cisco queries
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  metadata?: CiscoQueryResponse;
  image?: string; // Base64 image data
}
