import { User, Contact, Campaign, SmtpConfig, EmailLog, SystemStats, AdminLog } from '../types';

// Use relative path so Vite proxy handles the connection to backend
const API_URL = '/api';

// --- Helper ---

// Wrapper for fetch with timeout
const fetchWithTimeout = async (url: string, options: RequestInit & { timeout?: number } = {}) => {
  const { timeout = 15000 } = options;
  
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  // Separate timeout from fetch options
  const fetchOptions = { ...options };
  delete (fetchOptions as any).timeout;
  
  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error: any) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Backend may be slow or unreachable.');
    }
    throw error;
  }
};

const handleResponse = async (res: Response) => {
  const contentType = res.headers.get("content-type");
  
  if (contentType && contentType.includes("application/json")) {
    const data = await res.json();
    
    // Check for explicit API success flag
    if (data.success === false) {
      throw new Error(data.message || 'API request failed');
    }

    if (!res.ok) {
      throw new Error(data.message || data.error || `Error ${res.status}`);
    }
    
    return data;
  } else {
    // Fallback for non-JSON responses (usually severe server errors or 404s)
    if (!res.ok) {
      const text = await res.text();
      // If we get HTML (like Vite error page), throw a clear connection error
      if (text.includes('<!DOCTYPE html>')) {
        throw new Error('Cannot connect to backend server. Please ensure it is running.');
      }
      throw new Error(text || `API Error: ${res.status} ${res.statusText}`);
    }
    return {};
  }
};

const getAuthHeaders = () => {
  const userStr = localStorage.getItem('outreach_user');
  const user = userStr ? JSON.parse(userStr) : null;
  return user ? { 'Authorization': `Bearer ${user.token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
};

// --- Auth ---

export const login = async (email: string, password: string): Promise<User> => {
  const data = await fetchWithTimeout(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  }).then(handleResponse);
  
  if (data.success && data.user) {
    localStorage.setItem('outreach_user', JSON.stringify(data.user));
    return data.user;
  } else {
    throw new Error(data.message || 'Login failed');
  }
};

export const register = async (email: string, password: string): Promise<User> => {
  const data = await fetchWithTimeout(`${API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  }).then(handleResponse);

  if (data.success && data.user) {
    localStorage.setItem('outreach_user', JSON.stringify(data.user));
    return data.user;
  } else {
    throw new Error(data.message || 'Registration failed');
  }
};

export const logout = () => {
  localStorage.removeItem('outreach_user');
};

export const getCurrentUser = (): User | null => {
  const u = localStorage.getItem('outreach_user');
  try {
    return u ? JSON.parse(u) : null;
  } catch (e) {
    return null;
  }
};

// --- Contacts ---
export const getContacts = async (): Promise<Contact[]> => {
  return fetchWithTimeout(`${API_URL}/contacts`, { headers: getAuthHeaders() }).then(handleResponse);
};

export const addContacts = async (contacts: Contact[]) => {
  return fetchWithTimeout(`${API_URL}/contacts`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(contacts)
  }).then(handleResponse);
};

// --- Campaigns ---
export const getCampaigns = async (): Promise<Campaign[]> => {
  return fetchWithTimeout(`${API_URL}/campaigns`, { headers: getAuthHeaders() }).then(handleResponse);
};

export const saveCampaign = async (campaign: Campaign) => {
  return fetchWithTimeout(`${API_URL}/campaigns`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(campaign)
  }).then(handleResponse);
};

export const getEmailLogs = async (campaignId?: string): Promise<EmailLog[]> => {
  const logs: EmailLog[] = await fetchWithTimeout(`${API_URL}/logs`, { headers: getAuthHeaders() }).then(handleResponse);
  if (campaignId) return logs.filter(l => l.campaignId === campaignId);
  return logs;
};

// --- Scraper ---
export const scrapeWebsite = async (url: string): Promise<string[]> => {
  return fetchWithTimeout(`${API_URL}/scrape/website`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ url })
  }).then(handleResponse);
};

export const scrapeGoogleMaps = async (url: string, onProgress?: (msg: string) => void): Promise<string[]> => {
  if (onProgress) onProgress('Connecting to remote browser...');
  const res = await fetchWithTimeout(`${API_URL}/scrape/google-maps`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ url }),
    timeout: 120000 
  }).then(handleResponse);
  
  if (onProgress) onProgress('Extraction complete!');
  return res;
};

// --- Settings ---
export const getSmtpConfig = async (): Promise<SmtpConfig> => {
  return fetchWithTimeout(`${API_URL}/smtp`, { headers: getAuthHeaders() }).then(handleResponse);
};

export const saveSmtpConfig = async (config: SmtpConfig) => {
  return fetchWithTimeout(`${API_URL}/smtp`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(config)
  }).then(handleResponse);
};

// --- Admin ---
export const getSystemStats = async (): Promise<SystemStats> => {
  return fetchWithTimeout(`${API_URL}/admin/stats`, { headers: getAuthHeaders() }).then(handleResponse);
};

export const getAllUsers = async (): Promise<any[]> => {
  return fetchWithTimeout(`${API_URL}/admin/users`, { headers: getAuthHeaders() }).then(handleResponse);
};

export const toggleUserStatus = async (userId: string) => {
  return fetchWithTimeout(`${API_URL}/admin/users/toggle`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ userId })
  }).then(handleResponse);
};

export const getSystemLogs = async (): Promise<AdminLog[]> => {
  return []; 
};