
import { Campaign, CampaignProgress, Contact, EmailLog, CampaignStep } from '../../types';
import { KEYS } from './constants';
import { getItem, setItem } from './storage';
import { sanitize, checkRateLimit } from './security';
import { getContacts } from './contacts';

// --- Campaigns Module ---

export const getCampaigns = (): Campaign[] => {
  const rawCampaigns = getItem<any[]>(KEYS.CAMPAIGNS, []);
  
  // Migration & Sanitization on read
  return rawCampaigns.map((c: any) => {
    let steps = c.steps || [];
    if (!c.steps && c.subject && c.body) {
      steps = [{
        id: 'migrated_1',
        order: 1,
        delayDays: 0,
        subject: c.subject,
        body: c.body
      }];
    }
    
    return {
      ...c,
      name: sanitize(c.name),
      steps: steps.map((s: any) => ({
        ...s,
        subject: sanitize(s.subject),
        body: s.body 
      }))
    };
  });
};

export const saveCampaign = async (campaign: Campaign) => {
  checkRateLimit('save_campaign', 20, 60 * 1000);
  await new Promise(resolve => setTimeout(resolve, 600));
  
  if (!campaign.name || !campaign.steps || campaign.steps.length === 0) {
    throw new Error("Invalid campaign data.");
  }

  const cleanCampaign: Campaign = {
    ...campaign,
    name: sanitize(campaign.name),
    steps: campaign.steps.map(s => ({
      ...s,
      subject: sanitize(s.subject),
    }))
  };

  const campaigns = getCampaigns();
  const existingIndex = campaigns.findIndex(c => c.id === cleanCampaign.id);
  
  if (existingIndex >= 0) {
    campaigns[existingIndex] = cleanCampaign;
  } else {
    campaigns.unshift(cleanCampaign);
    // Initialize progress for new campaign
    initializeCampaignProgress(cleanCampaign);
  }
  
  setItem(KEYS.CAMPAIGNS, campaigns);
};

export const getEmailLogs = (campaignId?: string): EmailLog[] => {
  const logs = getItem<EmailLog[]>(KEYS.EMAIL_LOGS, []);
  if (campaignId) {
    return logs.filter(l => l.campaignId === campaignId).sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
  }
  return logs.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
};

// --- Engine Logic ---

const initializeCampaignProgress = (campaign: Campaign) => {
  const contacts = getContacts();
  const allProgress = getItem<CampaignProgress[]>(KEYS.CAMPAIGN_PROGRESS, []);
  
  const newProgress: CampaignProgress[] = contacts.map(contact => ({
    campaignId: campaign.id,
    contactId: contact.id,
    currentStepIndex: 0,
    status: 'pending',
    lastActionAt: '',
    nextActionAt: new Date().toISOString() // Ready to start immediately
  }));

  setItem(KEYS.CAMPAIGN_PROGRESS, [...allProgress, ...newProgress]);
};

const replaceVariables = (template: string, contact: Contact): string => {
  let text = template;
  text = text.replace(/{{firstName}}/g, contact.firstName || 'there');
  text = text.replace(/{{lastName}}/g, contact.lastName || '');
  text = text.replace(/{{company}}/g, contact.company || 'your company');
  text = text.replace(/{{email}}/g, contact.email);
  return text;
};

// Core Engine: Simulates the cron job
export const simulateCampaignProgress = (): Campaign[] => {
  const campaigns = getCampaigns();
  const allContacts = getContacts();
  const allProgress = getItem<CampaignProgress[]>(KEYS.CAMPAIGN_PROGRESS, []);
  const allLogs = getItem<EmailLog[]>(KEYS.EMAIL_LOGS, []);
  let logsChanged = false;
  let progressChanged = false;
  let campaignsChanged = false;

  const now = new Date();

  // Process each running campaign
  campaigns.forEach(campaign => {
    if (campaign.status !== 'running') return;

    // Filter progress for this campaign
    const campaignProgress = allProgress.filter(p => p.campaignId === campaign.id && p.status !== 'completed' && p.status !== 'bounced');

    // Batch process a few contacts to avoid freezing UI (Simulation constraint)
    const batch = campaignProgress.slice(0, 5); 

    batch.forEach(progress => {
      const contact = allContacts.find(c => c.id === progress.contactId);
      if (!contact) return;

      const step = campaign.steps[progress.currentStepIndex];
      if (!step) {
        progress.status = 'completed';
        progressChanged = true;
        return;
      }

      // Check if it's time to send
      if (new Date(progress.nextActionAt) <= now) {
        // "Send" the email
        const personalizedSubject = replaceVariables(step.subject, contact);
        // Note: Body isn't stored in log to save space, but subject is helpful
        
        const newLog: EmailLog = {
          id: Math.random().toString(36).substr(2, 9),
          campaignId: campaign.id,
          contactId: contact.id,
          contactEmail: contact.email,
          stepOrder: step.order,
          subject: personalizedSubject,
          status: Math.random() > 0.1 ? 'sent' : 'failed', // 90% success rate simulation
          sentAt: now.toISOString()
        };

        allLogs.push(newLog);
        logsChanged = true;

        if (newLog.status === 'sent') {
          // Update campaign stats
          campaign.sentCount++;
          campaignsChanged = true;

          // Move to next step
          progress.lastActionAt = now.toISOString();
          progress.currentStepIndex++;
          
          if (progress.currentStepIndex >= campaign.steps.length) {
            progress.status = 'completed';
            progress.nextActionAt = '';
          } else {
            // Schedule next step
            const nextStep = campaign.steps[progress.currentStepIndex];
            const nextDate = new Date(now);
            nextDate.setDate(nextDate.getDate() + (nextStep.delayDays || 1));
            progress.nextActionAt = nextDate.toISOString();
            progress.status = 'active';
          }
        }
        progressChanged = true;
      }
    });

    // Simulate Opens for previously sent emails
    const recentLogs = allLogs.filter(l => l.campaignId === campaign.id && l.status === 'sent' && !l.status.includes('opened'));
    recentLogs.forEach(log => {
      // 30% chance to open if sent more than 1 minute ago
      if (Math.random() < 0.3 && (now.getTime() - new Date(log.sentAt).getTime() > 60000)) {
         log.status = 'opened';
         campaign.openCount++;
         campaignsChanged = true;
         logsChanged = true;
      }
    });
    
    // Check if campaign is finished
    const remaining = allProgress.filter(p => p.campaignId === campaign.id && (p.status === 'pending' || p.status === 'active'));
    if (remaining.length === 0 && campaign.totalContacts > 0) {
      campaign.status = 'completed';
      campaignsChanged = true;
    }
  });

  if (logsChanged) setItem(KEYS.EMAIL_LOGS, allLogs);
  if (progressChanged) setItem(KEYS.CAMPAIGN_PROGRESS, allProgress);
  if (campaignsChanged) setItem(KEYS.CAMPAIGNS, campaigns);

  return campaigns;
};
