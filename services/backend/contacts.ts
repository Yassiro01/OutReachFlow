
import { Contact } from '../../types';
import { KEYS } from './constants';
import { getItem, setItem } from './storage';
import { sanitize, validateEmail } from './security';

// --- Contacts Module ---

export const getContacts = (): Contact[] => {
  return getItem<Contact[]>(KEYS.CONTACTS, []);
};

export const addContacts = async (newContacts: Contact[]) => {
  // Validate and Sanitize Payload
  if (!Array.isArray(newContacts)) throw new Error("Invalid payload");
  
  const validContacts = newContacts
    .filter(c => c && c.email && validateEmail(c.email))
    .map(c => ({
      ...c,
      id: sanitize(c.id),
      email: sanitize(c.email).toLowerCase(),
      source: sanitize(c.source),
      status: 'new' as const, // Force status reset on import
      // Whitelist fields to prevent prototype pollution
    }));

  const current = getContacts();
  
  // Deduplication logic
  const existingEmails = new Set(current.map(c => c.email));
  const uniqueNew = validContacts.filter(c => !existingEmails.has(c.email));

  const updated = [...uniqueNew, ...current];
  setItem(KEYS.CONTACTS, updated);
};
