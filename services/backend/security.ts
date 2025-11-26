
import { KEYS } from './constants';
import { getItem, setItem } from './storage';

/**
 * Sanitizes input strings to prevent XSS and Injection
 * @param input Raw string input
 * @returns Sanitized string safe for rendering
 */
export const sanitize = (input: any): string => {
  if (typeof input !== 'string') return '';
  return input
    .trim()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

/**
 * Strict Email Validation using RFC 5322 regex
 * @param email Email address to validate
 */
export const validateEmail = (email: string): boolean => {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
};

/**
 * Strict URL Validation & SSRF Check (Simulated)
 * Prevents access to local/private networks
 * @param urlStr Raw URL string
 * @returns Validated fully qualified URL
 */
export const validateUrl = (urlStr: string): string => {
  try {
    let finalUrl = urlStr.trim();
    if (!finalUrl.startsWith('http')) {
      finalUrl = `https://${finalUrl}`;
    }
    const url = new URL(finalUrl);
    
    // SSRF Protection: Prevent scanning local/private networks
    const hostname = url.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.endsWith('.local')
    ) {
      throw new Error('Access to local/private networks is restricted.');
    }

    return finalUrl;
  } catch (e: any) {
    throw new Error(`Invalid URL: ${e.message}`);
  }
};

/**
 * Rate Limiting Implementation (Sliding Window)
 * Throws error if limit is exceeded
 */
export const checkRateLimit = (action: string, limit: number, windowMs: number) => {
  const now = Date.now();
  const limits = getItem<Record<string, number[]>>(KEYS.RATE_LIMITS, {});
  
  // Clean up old entries for this action
  const timestamps = (limits[action] || []).filter((t: number) => now - t < windowMs);
  
  if (timestamps.length >= limit) {
    const resetTime = Math.ceil((timestamps[0] + windowMs - now) / 1000);
    throw new Error(`Rate limit exceeded. Please try again in ${resetTime} seconds.`);
  }

  timestamps.push(now);
  limits[action] = timestamps;
  
  // Cleanup other keys occasionally (simulated maintenance)
  if (Math.random() > 0.9) {
    for (const k in limits) {
      limits[k] = limits[k].filter((t: number) => now - t < windowMs); // keep only valid windows
    }
  }

  setItem(KEYS.RATE_LIMITS, limits);
};
