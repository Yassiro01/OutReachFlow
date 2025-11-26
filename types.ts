
export interface User {
  id: string;
  email: string;
  name: string;
  token: string;
  role: 'admin' | 'user';
  status: 'active' | 'suspended';
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
  steps: CampaignStep[]; 
  sentCount: number;
  openCount: number;
  totalContacts: number;
  createdAt: string;
}

export interface CampaignProgress {
  campaignId: string;
  contactId: string;
  currentStepIndex: number;
  status: 'pending' | 'active' | 'completed' | 'bounced';
  lastActionAt: string;
  nextActionAt: string;
}

export interface EmailLog {
  id: string;
  campaignId: string;
  contactId: string;
  contactEmail: string;
  stepOrder: number;
  subject: string;
  status: 'sent' | 'failed' | 'opened' | 'clicked';
  sentAt: string;
  errorMessage?: string;
}

export interface ScrapeResult {
  url: string;
  emailsFound: string[];
  status: 'success' | 'failed';
  timestamp: string;
}

// --- Admin Types ---

export interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalEmailsSent: number;
  totalCampaigns: number;
  systemHealth: {
    cpuUsage: number;
    memoryUsage: number;
    queueLength: number;
    errorRate: number;
  }
}

export interface AdminLog {
  id: string;
  type: 'email' | 'scrape' | 'system';
  userEmail: string;
  action: string;
  status: 'success' | 'warning' | 'error';
  timestamp: string;
}
