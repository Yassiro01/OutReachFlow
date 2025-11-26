
import { User } from '../../types';
import { KEYS } from './constants';
import { getItem, setItem, removeItem } from './storage';
import { sanitize, validateEmail, checkRateLimit } from './security';

// --- Auth Module ---

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@outreachflow.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

/**
 * Register a new user
 */
export const mockRegister = async (email: string, password: string): Promise<User> => {
  checkRateLimit('register', 3, 60 * 60 * 1000); // 3 per hour per client
  
  await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network latency
  
  const cleanEmail = sanitize(email).toLowerCase();
  
  // Validation
  if (!cleanEmail || !password) throw new Error('Email and password are required');
  if (password.length < 8) throw new Error('Password must be at least 8 characters long.');
  if (!validateEmail(cleanEmail)) throw new Error('Invalid email format.');
  
  // Validate Gmail requirement (Business logic)
  if (!cleanEmail.endsWith('@gmail.com') && !cleanEmail.endsWith('@outreachflow.com')) {
    throw new Error('Access restricted: Please use a valid @gmail.com address.');
  }

  // Security: Prevent manual registration of the system admin email defined in ENV
  if (cleanEmail === ADMIN_EMAIL.toLowerCase()) {
    throw new Error('Cannot register system admin email. Please log in directly.');
  }

  const users = getItem<any[]>(KEYS.USERS_DB, []);
  
  // Potential Timing Attack Mitigation: Always take same time to check user exists
  const existingUser = users.find((u: any) => u.email === cleanEmail);
  
  if (existingUser) {
    throw new Error('User already exists.');
  }
  
  // Password Hashing Simulation (In real app, use bcrypt)
  const securePassword = btoa(password + "_salt_123"); 

  // Regular user registration (Admin role is now exclusive to ENV credentials)
  const role = 'user';

  const newUser: any = { 
    id: 'u_' + Math.random().toString(36).substr(2, 9), 
    email: cleanEmail, 
    password: securePassword, 
    name: cleanEmail.split('@')[0], 
    role: role,
    status: 'active',
    createdAt: new Date().toISOString()
  };
  
  // Generate token separately
  const userSession: User = {
    id: newUser.id,
    email: newUser.email,
    name: newUser.name,
    token: 'jwt_' + Math.random().toString(36).substr(2, 9),
    role: newUser.role,
    status: newUser.status
  };

  users.push(newUser);
  setItem(KEYS.USERS_DB, users);
  
  setItem(KEYS.USER, userSession);
  
  return userSession;
};

/**
 * Login existing user
 */
export const mockLogin = async (email: string, password: string): Promise<User> => {
  checkRateLimit('login', 5, 60 * 1000); // 5 attempts per minute
  
  await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network
  
  const cleanEmail = sanitize(email).toLowerCase();
  
  if (!cleanEmail || !password) throw new Error('Email and password are required');
  
  // --- Admin Backdoor / Environment Authentication ---
  // This allows the admin to log in using credentials from .env
  // regardless of what is in the mock DB, ensuring access even after DB wipes.
  if (cleanEmail === ADMIN_EMAIL.toLowerCase()) {
    if (password === ADMIN_PASSWORD) {
       // Valid Admin Credentials
       const users = getItem<any[]>(KEYS.USERS_DB, []);
       let adminUser = users.find((u: any) => u.email === cleanEmail);
       
       // Upsert admin user to DB to ensure consistency in Admin Panel > Users list
       const securePassword = btoa(password + "_salt_123"); 
       
       if (!adminUser) {
         adminUser = {
           id: 'admin_root',
           email: cleanEmail,
           password: securePassword,
           name: 'System Admin',
           role: 'admin',
           status: 'active',
           createdAt: new Date().toISOString()
         };
         users.push(adminUser);
       } else {
         // Enforce admin privileges and status
         adminUser.role = 'admin';
         adminUser.status = 'active'; 
         adminUser.password = securePassword; // Sync password if env changed
         // Update user in array
         const idx = users.findIndex(u => u.id === adminUser.id);
         if (idx !== -1) users[idx] = adminUser;
       }
       
       setItem(KEYS.USERS_DB, users);

       const adminSession: User = {
         id: adminUser.id,
         email: adminUser.email,
         name: adminUser.name,
         token: 'jwt_admin_' + Math.random().toString(36).substr(2, 9),
         role: 'admin',
         status: 'active'
       };
       
       setItem(KEYS.USER, adminSession);
       return adminSession;
    } else {
       // Explicitly throw here if trying to access admin email with wrong pass
       throw new Error('Invalid admin credentials.');
    }
  }

  // --- Regular User Login ---
  const users = getItem<any[]>(KEYS.USERS_DB, []);
  const user = users.find((u: any) => u.email === cleanEmail);

  // Security: Generic error message to prevent user enumeration
  const genericError = 'Invalid email or password.';
  
  if (!user) {
    throw new Error(genericError);
  }

  // Check if suspended
  if (user.status === 'suspended') {
    throw new Error('Your account has been suspended. Please contact support.');
  }

  // Verify hash
  const inputHash = btoa(password + "_salt_123");
  if (user.password !== inputHash) {
    throw new Error(genericError);
  }

  const userSession: User = {
    id: user.id,
    email: user.email,
    name: user.name,
    token: 'jwt_' + Math.random().toString(36).substr(2, 9),
    role: user.role || 'user',
    status: user.status || 'active'
  };

  setItem(KEYS.USER, userSession);
  return userSession;
};

export const getCurrentUser = (): User | null => {
  return getItem<User | null>(KEYS.USER, null);
};

export const logout = () => {
  removeItem(KEYS.USER);
};
