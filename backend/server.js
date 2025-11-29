import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Database File Path
const DB_FILE = path.join(__dirname, 'database.json');

// Initialize Database
const initDb = () => {
  if (!fs.existsSync(DB_FILE)) {
    const initialData = {
      users: [],
      contacts: [],
      campaigns: [],
      emailLogs: [],
      smtpConfig: { isConfigured: false },
      campaignProgress: []
    };
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
    } catch (e) {
      console.error("Failed to write initial DB:", e);
    }
  }
};

initDb();

// Helper: Read/Write DB
const getDb = () => {
  try {
    if (!fs.existsSync(DB_FILE)) return { users: [], contacts: [] }; // Fallback
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    console.error("DB Read Error:", e);
    return { users: [], contacts: [], campaigns: [] };
  }
};

const saveDb = (data) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("DB Write Error:", e);
  }
};

// --- ROUTES ---

// Contacts: Get
app.get('/api/contacts', (req, res) => {
  const db = getDb();
  res.json(db.contacts || []);
});

// Contacts: Add
app.post('/api/contacts', (req, res) => {
  const newContacts = req.body;
  const db = getDb();
  
  const existingEmails = new Set((db.contacts || []).map(c => c.email));
  const uniqueNew = newContacts.filter(c => !existingEmails.has(c.email));
  
  db.contacts = [...uniqueNew, ...(db.contacts || [])];
  saveDb(db);
  res.json({ added: uniqueNew.length });
});

// Campaigns: Get
app.get('/api/campaigns', (req, res) => {
  const db = getDb();
  res.json(db.campaigns || []);
});

// Campaigns: Save
app.post('/api/campaigns', (req, res) => {
  const campaign = req.body;
  const db = getDb();
  if (!db.campaigns) db.campaigns = [];
  if (!db.campaignProgress) db.campaignProgress = [];
  
  const idx = db.campaigns.findIndex(c => c.id === campaign.id);
  if (idx >= 0) {
    db.campaigns[idx] = campaign;
  } else {
    db.campaigns.unshift(campaign);
    const progress = (db.contacts || []).map(c => ({
      campaignId: campaign.id,
      contactId: c.id,
      currentStepIndex: 0,
      status: 'pending',
      nextActionAt: new Date().toISOString()
    }));
    db.campaignProgress = [...db.campaignProgress, ...progress];
  }
  
  saveDb(db);
  res.json({ success: true });
});

// Logs: Get
app.get('/api/logs', (req, res) => {
  const db = getDb();
  res.json(db.emailLogs || []);
});

// Settings: Get SMTP
app.get('/api/smtp', (req, res) => {
  const db = getDb();
  res.json(db.smtpConfig || { isConfigured: false });
});

// Settings: Save SMTP
app.post('/api/smtp', (req, res) => {
  const db = getDb();
  db.smtpConfig = { ...req.body, isConfigured: true };
  saveDb(db);
  res.json({ success: true });
});

// Admin: Stats
app.get('/api/admin/stats', (req, res) => {
  const db = getDb();
  res.json({
    totalUsers: (db.users || []).length,
    activeUsers: (db.users || []).filter(u => u.status !== 'suspended').length,
    totalCampaigns: (db.campaigns || []).length,
    totalEmailsSent: (db.emailLogs || []).filter(l => l.status === 'sent').length,
    systemHealth: {
      cpuUsage: Math.floor(Math.random() * 30) + 10,
      memoryUsage: Math.floor(Math.random() * 40) + 20,
      queueLength: 0,
      errorRate: 0.1
    }
  });
});

// Admin: Users
app.get('/api/admin/users', (req, res) => {
  const db = getDb();
  res.json(db.users || []);
});

// Admin: Toggle User
app.post('/api/admin/users/toggle', (req, res) => {
  const { userId } = req.body;
  const db = getDb();
  const user = (db.users || []).find(u => u.id === userId);
  if (user) {
    user.status = user.status === 'active' ? 'suspended' : 'active';
    saveDb(db);
    res.json(user);
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

// --- SCRAPERS ---

// Website Scraper
app.post('/api/scrape/website', async (req, res) => {
  const { url } = req.body;
  try {
    const response = await fetch(`https://r.jina.ai/${url}`);
    const text = await response.text();
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}/g;
    const matches = text.match(emailRegex) || [];
    const unique = [...new Set(matches)];
    res.json(unique);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Google Maps Scraper
app.post('/api/scrape/google-maps', async (req, res) => {
  const { url } = req.body;
  
  if (!url || !url.includes('google.com/maps')) {
    return res.status(400).json({ error: 'Invalid Google Maps URL' });
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });
    
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    try {
      const consentSelector = 'form[action*="consent"] button';
      if (await page.$(consentSelector)) {
        await page.click(consentSelector);
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
      }
    } catch (e) {}

    const collectedLinks = new Set();
    
    const extractLinks = async () => {
      const links = await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll('a[href]'));
        return anchors
          .map(a => a.href)
          .filter(href => 
            !href.includes('google.com') && 
            !href.includes('googleusercontent') && 
            href.startsWith('http')
          );
      });
      links.forEach(l => collectedLinks.add(l));
    };

    const feedSelector = 'div[role="feed"]';
    try {
        await page.waitForSelector(feedSelector, { timeout: 10000 });
        let previousHeight = 0;
        let noChangeCount = 0;
        while (noChangeCount < 5) {
            await extractLinks();
            const currentHeight = await page.evaluate((selector) => {
                const element = document.querySelector(selector);
                element.scrollTop = element.scrollHeight;
                return element.scrollHeight;
            }, feedSelector);

            if (currentHeight === previousHeight) {
                noChangeCount++;
            } else {
                noChangeCount = 0;
            }
            previousHeight = currentHeight;
            await new Promise(r => setTimeout(r, 2000));
        }
    } catch (e) {
        await extractLinks();
    }

    await browser.close();
    res.json(Array.from(collectedLinks));

  } catch (error) {
    console.error('Puppeteer error:', error);
    if (browser) await browser.close();
    res.status(500).json({ error: 'Failed to scrape Google Maps: ' + error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend Server running on http://localhost:${PORT}`);
});