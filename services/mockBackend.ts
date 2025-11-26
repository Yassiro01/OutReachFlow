
/**
 * Public API Aggregator
 * 
 * This file serves as the main entry point for the "Backend" services.
 * It re-exports functionality from the modular architecture located in ./backend/
 * This ensures that existing frontend imports remain valid.
 */

// Auth Services
export { 
  mockRegister, 
  mockLogin, 
  getCurrentUser, 
  logout 
} from './backend/auth';

// SMTP Configuration
export { 
  getSmtpConfig, 
  saveSmtpConfig 
} from './backend/smtp';

// Contact Management
export { 
  getContacts, 
  addContacts 
} from './backend/contacts';

// Campaign Management
export { 
  getCampaigns, 
  saveCampaign, 
  simulateCampaignProgress,
  getEmailLogs
} from './backend/campaigns';

// Web Scraper
export { 
  scrapeWebsite 
} from './backend/scraper';

// Admin Services
export {
  getSystemStats,
  getAllUsers,
  toggleUserStatus,
  getSystemLogs
} from './backend/admin';
