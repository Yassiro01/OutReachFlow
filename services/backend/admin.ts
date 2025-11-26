
import { User, SystemStats, AdminLog, Campaign, EmailLog } from '../../types';
import { KEYS } from './constants';
import { getItem, setItem } from './storage';
import { checkRateLimit } from './security';
import { getCurrentUser } from './auth';

// --- Admin Module ---

const ensureAdmin = () => {
  const currentUser = getCurrentUser();
  if (!currentUser || currentUser.role !== 'admin') {
    throw new Error("Unauthorized: Admin access required.");
  }
};

/**
 * Fetch global system statistics
 */
export const getSystemStats = async (): Promise<SystemStats> => {
  ensureAdmin();
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate DB latency

  const users = getItem<any[]>(KEYS.USERS_DB, []);
  const campaigns = getItem<Campaign[]>(KEYS.CAMPAIGNS, []);
  const logs = getItem<EmailLog[]>(KEYS.EMAIL_LOGS, []);

  // Calculate stats
  const totalEmailsSent = logs.filter(l => l.status === 'sent' || l.status === 'opened').length;
  
  // Simulate system health metrics
  const loadBase = 20;
  const loadVar = Math.floor(Math.random() * 30);
  
  return {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status !== 'suspended').length,
    totalCampaigns: campaigns.length,
    totalEmailsSent,
    systemHealth: {
      cpuUsage: loadBase + loadVar,
      memoryUsage: 40 + Math.floor(Math.random() * 20),
      queueLength: Math.floor(Math.random() * 50),
      errorRate: parseFloat((Math.random() * 2).toFixed(2))
    }
  };
};

/**
 * Get all users for management table
 */
export const getAllUsers = async (): Promise<any[]> => {
  ensureAdmin();
  const users = getItem<any[]>(KEYS.USERS_DB, []);
  const campaigns = getItem<Campaign[]>(KEYS.CAMPAIGNS, []); // In real app, we'd count per user
  
  // Aggregate mock stats for users (since current mock is single-tenant local storage, 
  // we simulate stats for other users for the visual demo)
  return users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role || 'user',
    status: u.status || 'active',
    joinedAt: u.createdAt || new Date().toISOString(),
    campaignsCount: campaigns.length, // Mock: associating global items to display data
    emailsSent: Math.floor(Math.random() * 500) // Mock data
  }));
};

/**
 * Toggle user suspension status
 */
export const toggleUserStatus = async (userId: string) => {
  ensureAdmin();
  const users = getItem<any[]>(KEYS.USERS_DB, []);
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) throw new Error("User not found");
  
  // Prevent suspending self
  const currentUser = getCurrentUser();
  if (currentUser?.id === userId) throw new Error("Cannot suspend your own admin account.");

  const user = users[userIndex];
  user.status = user.status === 'active' ? 'suspended' : 'active';
  
  users[userIndex] = user;
  setItem(KEYS.USERS_DB, users);
  
  return user.status;
};

/**
 * Get unified system logs
 */
export const getSystemLogs = async (): Promise<AdminLog[]> => {
  ensureAdmin();
  
  const emailLogs = getItem<EmailLog[]>(KEYS.EMAIL_LOGS, []);
  // Mock some system events for variety
  const systemEvents: AdminLog[] = [
    {
      id: 'sys_1', type: 'system', userEmail: 'system', 
      action: 'Daily Backup Completed', status: 'success', timestamp: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 'sys_2', type: 'system', userEmail: 'system', 
      action: 'Cron Job: Campaign Processor', status: 'success', timestamp: new Date(Date.now() - 1800000).toISOString()
    }
  ];

  // Convert EmailLogs to AdminLogs
  const formattedEmailLogs: AdminLog[] = emailLogs.slice(0, 50).map(l => ({
    id: l.id,
    type: 'email',
    userEmail: l.contactEmail, // Log target as userEmail context
    action: `Sent email: "${l.subject.substring(0, 30)}..."`,
    status: l.status === 'failed' ? 'error' : 'success',
    timestamp: l.sentAt
  }));

  return [...systemEvents, ...formattedEmailLogs].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
};
