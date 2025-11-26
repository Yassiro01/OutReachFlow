
/**
 * Generic Storage Utility
 * Wraps localStorage with JSON parsing and error handling.
 */

export const getItem = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.error(`Error reading key ${key} from storage`, e);
    return defaultValue;
  }
};

export const setItem = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error writing key ${key} to storage`, e);
  }
};

export const removeItem = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.error(`Error removing key ${key} from storage`, e);
  }
};
