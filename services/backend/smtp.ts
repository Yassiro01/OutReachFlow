
import { SmtpConfig } from '../../types';
import { KEYS } from './constants';
import { getItem, setItem } from './storage';
import { sanitize, validateEmail, validateUrl, checkRateLimit } from './security';

// --- SMTP Module ---

export const getSmtpConfig = (): SmtpConfig => {
  const defaults = { 
    host: '', port: 587, username: '', fromName: '', fromEmail: '', isConfigured: false 
  };
  return getItem<SmtpConfig>(KEYS.SMTP, defaults);
};

export const saveSmtpConfig = async (config: SmtpConfig) => {
  checkRateLimit('save_smtp', 10, 60 * 1000);
  await new Promise(resolve => setTimeout(resolve, 500));

  // Sanitize and Validate
  const sanitizedConfig: SmtpConfig = {
    host: sanitize(config.host),
    port: Number(config.port),
    username: sanitize(config.username),
    password: config.password, // Passwords kept raw but encrypted in storage
    fromName: sanitize(config.fromName),
    fromEmail: sanitize(config.fromEmail),
    isConfigured: true
  };

  if (!validateEmail(sanitizedConfig.fromEmail)) {
    throw new Error("Invalid sender email address.");
  }
  
  if (!validateUrl(sanitizedConfig.host)) {
    // Basic check for host format (allows IP or domain)
    if (!sanitizedConfig.host.includes('.') && sanitizedConfig.host !== 'localhost') {
       throw new Error("Invalid SMTP host format.");
    }
  }

  setItem(KEYS.SMTP, sanitizedConfig);
};
