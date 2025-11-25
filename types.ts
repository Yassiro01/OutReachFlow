export interface User {
  id: string;
  email: string;
  name: string;
  token: string;
}

export interface SmtpConfig {
  host: string;
  port: number;
  username: string;
  password?: string; // Stored encrypted in real backend
  fromName: string;
  fromEmail: string;
  isConfigured: boolean;
}

export interface Contact {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  source: string; // e.g., "Scraped: example.com" or "CSV Import"
  status: 'new' | 'contacted' | 'replied' | 'bounced';
  createdAt: string;
}

export interface CampaignStep {
  id: string;
  order: number;
  delayDays: number; // 0 for initial email
  subject: string;
  body: string;
}

export interface Campaign {
  id: string;
  name: string;
  status: 'draft' | 'running' | 'completed' | 'paused';
  steps: CampaignStep[]; // Replaces single subject/body
  sentCount: number;
  openCount: number;
  totalContacts: number;
  createdAt: string;
}

export interface ScrapeResult {
  url: string;
  emailsFound: string[];
  status: 'success' | 'failed';
  timestamp: string;
}