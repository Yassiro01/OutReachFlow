import { Contact, Campaign, SmtpConfig, User, ScrapeResult } from '../types';
import { load } from 'cheerio';

// Keys for localStorage
const KEYS = {
  USER: 'outreach_user',
  USERS_DB: 'outreach_users_db',
  SMTP: 'outreach_smtp',
  CONTACTS: 'outreach_contacts',
  CAMPAIGNS: 'outreach_campaigns',
  SCRAPE_HISTORY: 'outreach_scrapes',
};

// --- Auth Simulation ---

// Register a new user
export const mockRegister = async (email: string, password: string): Promise<User> => {
  await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network
  
  if (!email || !password) throw new Error('Email and password are required');
  
  // Validate Gmail
  const emailLower = email.toLowerCase().trim();
  if (!emailLower.endsWith('@gmail.com')) {
    throw new Error('Access restricted: Please use a valid @gmail.com address.');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailLower)) {
    throw new Error('Please enter a valid email format.');
  }
  
  const usersRaw = localStorage.getItem(KEYS.USERS_DB);
  const users = usersRaw ? JSON.parse(usersRaw) : [];
  
  if (users.find((u: any) => u.email === emailLower)) {
    throw new Error('This Gmail address is already registered. Please sign in.');
  }
  
  const newUser = { 
    id: 'u_' + Math.random().toString(36).substr(2, 9), 
    email: emailLower, 
    password, 
    name: emailLower.split('@')[0], 
    token: 'jwt_' + Math.random().toString(36).substr(2, 9) 
  };
  
  users.push(newUser);
  localStorage.setItem(KEYS.USERS_DB, JSON.stringify(users));
  
  const { password: _, ...userSession } = newUser;
  localStorage.setItem(KEYS.USER, JSON.stringify(userSession));
  
  return userSession;
};

export const mockLogin = async (email: string, password: string): Promise<User> => {
  await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network
  
  if (!email || !password) throw new Error('Email and password are required');
  
  const emailLower = email.toLowerCase().trim();

  if (!emailLower.endsWith('@gmail.com')) {
    throw new Error('Invalid email domain. Please use your @gmail.com account.');
  }

  const usersRaw = localStorage.getItem(KEYS.USERS_DB);
  const users = usersRaw ? JSON.parse(usersRaw) : [];
  
  const user = users.find((u: any) => u.email === emailLower);

  if (!user) {
    throw new Error('Account not found. Please check your email or Sign Up first.');
  }

  if (user.password !== password) {
    throw new Error('Incorrect password. Please try again.');
  }

  const { password: _, ...userSession } = user;
  localStorage.setItem(KEYS.USER, JSON.stringify(userSession));
  return userSession;
};

export const getCurrentUser = (): User | null => {
  const stored = localStorage.getItem(KEYS.USER);
  return stored ? JSON.parse(stored) : null;
};

export const logout = () => {
  localStorage.removeItem(KEYS.USER);
};

// --- SMTP Simulation ---
export const getSmtpConfig = (): SmtpConfig => {
  const stored = localStorage.getItem(KEYS.SMTP);
  return stored ? JSON.parse(stored) : { 
    host: '', port: 587, username: '', fromName: '', fromEmail: '', isConfigured: false 
  };
};

export const saveSmtpConfig = async (config: SmtpConfig) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  localStorage.setItem(KEYS.SMTP, JSON.stringify({ ...config, isConfigured: true }));
};

// --- Real Scraper Implementation ---
export const scrapeWebsite = async (url: string): Promise<string[]> => {
  if (!url) throw new Error("URL is required");
  
  let targetUrl = url.trim();
  if (!targetUrl.startsWith('http')) {
    targetUrl = `https://${targetUrl}`;
  }
  
  let html: string | null = null;
  let errorDetails = "";

  // Strategy 1: AllOrigins JSON endpoint
  try {
    const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`);
    if (response.ok) {
      const data = await response.json();
      if (data && data.contents) {
        html = data.contents;
      }
    }
  } catch (e: any) {
    console.warn("AllOrigins JSON failed", e);
    errorDetails += `AllOrigins JSON: ${e.message || 'Network Error'}; `;
  }

  // Strategy 2: AllOrigins Raw
  if (!html) {
    try {
      const response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}&t=${Date.now()}`);
      if (response.ok) {
        html = await response.text();
      }
    } catch (e: any) {
      console.warn("AllOrigins Raw failed", e);
      errorDetails += `AllOrigins Raw: ${e.message || 'Network Error'}; `;
    }
  }

  // Strategy 3: CodeTabs
  if (!html) {
    try {
      const response = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`);
      if (response.ok) {
        html = await response.text();
      }
    } catch (e: any) {
      console.warn("CodeTabs failed", e);
      errorDetails += `CodeTabs: ${e.message || 'Network Error'}; `;
    }
  }

  // Strategy 4: CorsProxy.io
  if (!html) {
    try {
      const response = await fetch(`https://corsproxy.io/?${encodeURIComponent(targetUrl)}`);
      if (response.ok) {
        html = await response.text();
      }
    } catch (e: any) {
      console.warn("CorsProxy.io failed", e);
      errorDetails += `CorsProxy.io: ${e.message || 'Network Error'}; `;
    }
  }

  // Fallback for Demo/Testing
  if (!html) {
    if (targetUrl.includes('example') || targetUrl.includes('test')) {
      const domain = new URL(targetUrl).hostname;
      console.log("Using fallback demo content for:", domain);
      html = `
        <!DOCTYPE html>
        <html>
          <body>
            <h1>Contact Us</h1>
            <p>For support inquiries: <a href="mailto:support@${domain}">support@${domain}</a></p>
            <p>For sales: sales@${domain}</p>
            <p>CEO: founder@${domain}</p>
          </body>
        </html>
      `;
    } else {
      throw new Error(`Could not fetch ${targetUrl}. All proxies failed. Details: ${errorDetails}`);
    }
  }

  try {
    const $ = load(html);
    const bodyContent = $('body').html() || '';
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}/g;
    const matches = bodyContent.match(emailRegex) || [];
    const uniqueEmails: string[] = [...new Set(matches as string[])];

    const cleanEmails = uniqueEmails.filter(email => {
      const lower = email.toLowerCase();
      if (!lower.includes('.') || lower.length < 5) return false;
      const invalidExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.bmp', '.mp4', '.css', '.js'];
      if (invalidExtensions.some(ext => lower.endsWith(ext))) return false;
      return true;
    });

    return cleanEmails;
  } catch (error: any) {
    console.error("Scraping Parsing Error:", error);
    throw new Error(error.message || "Failed to parse website content");
  }
};

// --- Database (Contacts) ---
export const getContacts = (): Contact[] => {
  const stored = localStorage.getItem(KEYS.CONTACTS);
  return stored ? JSON.parse(stored) : [];
};

export const addContacts = async (newContacts: Contact[]) => {
  const current = getContacts();
  const updated = [...newContacts, ...current]; // Add to top
  localStorage.setItem(KEYS.CONTACTS, JSON.stringify(updated));
};

// --- Database (Campaigns) ---
export const getCampaigns = (): Campaign[] => {
  const stored = localStorage.getItem(KEYS.CAMPAIGNS);
  const rawCampaigns = stored ? JSON.parse(stored) : [];
  
  // Migration: If campaign has old 'subject'/'body' fields but no 'steps', convert it
  return rawCampaigns.map((c: any) => {
    if (!c.steps && c.subject && c.body) {
      return {
        ...c,
        steps: [{
          id: 'migrated_1',
          order: 1,
          delayDays: 0,
          subject: c.subject,
          body: c.body
        }]
      };
    }
    return c;
  });
};

export const saveCampaign = async (campaign: Campaign) => {
  await new Promise(resolve => setTimeout(resolve, 600));
  const campaigns = getCampaigns();
  const existingIndex = campaigns.findIndex(c => c.id === campaign.id);
  
  if (existingIndex >= 0) {
    campaigns[existingIndex] = campaign;
  } else {
    campaigns.unshift(campaign);
  }
  localStorage.setItem(KEYS.CAMPAIGNS, JSON.stringify(campaigns));
};

// Simulate the backend cron job that sends emails
export const simulateCampaignProgress = (): Campaign[] => {
  const campaigns = getCampaigns();
  let changed = false;

  const updated = campaigns.map(c => {
    if (c.status === 'running' && c.sentCount < c.totalContacts) {
      // Simulate sending emails (random 1-5 per tick)
      const newSent = Math.min(c.totalContacts, c.sentCount + Math.floor(Math.random() * 5) + 1);
      
      // Simulate opens (approx 40% open rate)
      const newOpens = c.openCount + (Math.random() > 0.6 ? Math.floor(Math.random() * 2) : 0);
      const safeOpens = Math.min(newSent, newOpens);

      // Check for completion
      const newStatus: Campaign['status'] = newSent === c.totalContacts ? 'completed' : 'running';

      if (newSent !== c.sentCount || newOpens !== c.openCount || newStatus !== c.status) {
        changed = true;
        return { 
          ...c, 
          sentCount: newSent, 
          openCount: safeOpens,
          status: newStatus 
        };
      }
    }
    return c;
  });

  if (changed) {
    localStorage.setItem(KEYS.CAMPAIGNS, JSON.stringify(updated));
  }
  return updated;
};
