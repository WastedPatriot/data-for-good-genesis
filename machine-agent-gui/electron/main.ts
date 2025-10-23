import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';

const CONFIG_PATH = path.join(app.getPath('userData'), 'config.json');
const LOG_PATH = path.join(app.getPath('userData'), 'logs', 'agent.log');

let mainWindow: BrowserWindow | null = null;
let automationInterval: NodeJS.Timeout | null = null;

interface Config {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  INGEST_SECRET: string;
  DATA_PRICE: number;
  BADGE_CODE_COUNT: number;
  CATEGORY: string;
  MIN_RECORDS_FOR_DATASET: number;
  POLL_INTERVAL_MINUTES: number;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3001');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Ensure log directory exists
function ensureLogDir() {
  const logDir = path.dirname(LOG_PATH);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
}

function log(level: string, message: string) {
  ensureLogDir();
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${level}] ${message}\n`;
  fs.appendFileSync(LOG_PATH, logEntry);
  console.log(logEntry.trim());
}

// Config management
ipcMain.handle('load-config', async (): Promise<Config | null> => {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const data = fs.readFileSync(CONFIG_PATH, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    log('error', `Failed to load config: ${error}`);
  }
  return null;
});

ipcMain.handle('save-config', async (_, config: Config) => {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
    log('info', 'Configuration saved');
    return { success: true };
  } catch (error) {
    log('error', `Failed to save config: ${error}`);
    return { success: false, error: String(error) };
  }
});

// HMAC signature generation
function generateHmacSignature(payload: any, secret: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const message = `${timestamp}.${JSON.stringify(payload)}`;
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(message);
  const signature = hmac.digest('hex');
  return `t=${timestamp},v1=${signature}`;
}

// Fetch processed records
ipcMain.handle('fetch-processed-records', async () => {
  try {
    const config = await loadConfigSync();
    if (!config) throw new Error('Config not loaded');

    const response = await fetch(
      `${config.SUPABASE_URL}/functions/v1/data-harvest-api`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Ingest-Secret': config.INGEST_SECRET
        },
        body: JSON.stringify({ limit: 100 })
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    log('info', `Fetched ${data.records?.length || 0} processed records`);
    return { success: true, data };
  } catch (error) {
    log('error', `Failed to fetch processed records: ${error}`);
    return { success: false, error: String(error) };
  }
});

// Publish dataset
ipcMain.handle('publish-dataset', async (_, payload) => {
  try {
    const config = await loadConfigSync();
    if (!config) throw new Error('Config not loaded');

    const signature = generateHmacSignature(payload, config.INGEST_SECRET);

    const response = await fetch(
      `${config.SUPABASE_URL}/functions/v1/ingest-dataset`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Ingest-Sign': signature
        },
        body: JSON.stringify(payload)
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    log('info', `Dataset published: ${payload.name}`);
    return { success: true, data };
  } catch (error) {
    log('error', `Failed to publish dataset: ${error}`);
    return { success: false, error: String(error) };
  }
});

// Generate badge codes
ipcMain.handle('generate-badge-codes', async (_, count: number, datasetId: string) => {
  try {
    const config = await loadConfigSync();
    if (!config) throw new Error('Config not loaded');

    const response = await fetch(
      `${config.SUPABASE_URL}/functions/v1/create-badge-codes`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Ingest-Secret': config.INGEST_SECRET
        },
        body: JSON.stringify({ count, datasetId })
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    log('info', `Generated ${count} badge codes`);
    return { success: true, data };
  } catch (error) {
    log('error', `Failed to generate badge codes: ${error}`);
    return { success: false, error: String(error) };
  }
});

// Check dataset status
ipcMain.handle('check-dataset-status', async (_, datasetId: string) => {
  try {
    const config = await loadConfigSync();
    if (!config) throw new Error('Config not loaded');

    const response = await fetch(
      `${config.SUPABASE_URL}/functions/v1/dataset-status?datasetId=${datasetId}`,
      {
        headers: {
          'X-Ingest-Secret': config.INGEST_SECRET
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    log('error', `Failed to check dataset status: ${error}`);
    return { success: false, error: String(error) };
  }
});

// Query Supabase directly using SUPABASE_ANON_KEY
ipcMain.handle('query-supabase', async (_, query: string) => {
  try {
    const config = await loadConfigSync();
    if (!config) throw new Error('Config not loaded');

    if (!config.SUPABASE_ANON_KEY) {
      throw new Error('SUPABASE_ANON_KEY not configured');
    }

    const response = await fetch(
      `${config.SUPABASE_URL}/rest/v1/${query}`,
      {
        headers: {
          'apikey': config.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${config.SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});

// Read logs
ipcMain.handle('read-logs', async () => {
  try {
    ensureLogDir();
    if (fs.existsSync(LOG_PATH)) {
      const logs = fs.readFileSync(LOG_PATH, 'utf8');
      return { success: true, logs };
    }
    return { success: true, logs: '' };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});

// Review Queue Management
ipcMain.handle('fetch-review-queue', async (_, status: string, filters: any) => {
  try {
    const config = await loadConfigSync();
    if (!config) throw new Error('Config not loaded');

    const params = new URLSearchParams({ status, ...filters });
    const response = await fetch(
      `${config.SUPABASE_URL}/functions/v1/review-queue-fetch?${params}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Ingest-Secret': config.INGEST_SECRET
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    log('info', `Fetched ${data.items?.length || 0} review queue items`);
    return { success: true, data };
  } catch (error) {
    log('error', `Failed to fetch review queue: ${error}`);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('approve-review-item', async (_, id: string, notes: string) => {
  try {
    const config = await loadConfigSync();
    if (!config) throw new Error('Config not loaded');

    const response = await fetch(
      `${config.SUPABASE_URL}/functions/v1/review-queue-update`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Ingest-Secret': config.INGEST_SECRET
        },
        body: JSON.stringify({ itemId: id, action: 'approve', notes })
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    log('info', `Approved review item: ${id}`);
    return { success: true };
  } catch (error) {
    log('error', `Failed to approve review item: ${error}`);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('reject-review-item', async (_, id: string, notes: string) => {
  try {
    const config = await loadConfigSync();
    if (!config) throw new Error('Config not loaded');

    const response = await fetch(
      `${config.SUPABASE_URL}/functions/v1/review-queue-update`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Ingest-Secret': config.INGEST_SECRET
        },
        body: JSON.stringify({ itemId: id, action: 'reject', notes })
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    log('info', `Rejected review item: ${id}`);
    return { success: true };
  } catch (error) {
    log('error', `Failed to reject review item: ${error}`);
    return { success: false, error: String(error) };
  }
});

// Dataset Building
ipcMain.handle('build-dataset', async (_, mode: string, filters: any) => {
  try {
    const config = await loadConfigSync();
    if (!config) throw new Error('Config not loaded');

    const response = await fetch(
      `${config.SUPABASE_URL}/functions/v1/build-dataset-from-curated`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Ingest-Secret': config.INGEST_SECRET
        },
        body: JSON.stringify({ mode, filters })
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    log('info', `Built dataset: ${data.datasetId}`);
    return { success: true, data };
  } catch (error) {
    log('error', `Failed to build dataset: ${error}`);
    return { success: false, error: String(error) };
  }
});

// Release Policy Management - now uses edge function
ipcMain.handle('get-release-policy', async () => {
  try {
    const config = await loadConfigSync();
    if (!config) throw new Error('Config not loaded');

    if (!config.SUPABASE_ANON_KEY) {
      throw new Error('SUPABASE_ANON_KEY not configured');
    }

    const response = await fetch(
      `${config.SUPABASE_URL}/rest/v1/release_policy?select=*`,
      {
        headers: {
          'apikey': config.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${config.SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    log('error', `Failed to get release policy: ${error}`);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('update-release-policy', async (_, payload: any) => {
  try {
    const config = await loadConfigSync();
    if (!config) throw new Error('Config not loaded');

    // Use new edge function instead of direct PostgREST
    const response = await fetch(
      `${config.SUPABASE_URL}/functions/v1/release-policy-update`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Ingest-Secret': config.INGEST_SECRET
        },
        body: JSON.stringify(payload)
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    log('info', 'Release policy updated');
    return { success: true };
  } catch (error) {
    log('error', `Failed to update release policy: ${error}`);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('trigger-burst-mode', async (_, reason: string) => {
  try {
    const config = await loadConfigSync();
    if (!config) throw new Error('Config not loaded');

    // Use edge function for burst mode too
    const response = await fetch(
      `${config.SUPABASE_URL}/functions/v1/release-policy-update`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Ingest-Secret': config.INGEST_SECRET
        },
        body: JSON.stringify({
          channel: 'on_site',
          burst_mode_enabled: true,
          burst_reason: reason,
          burst_activated_at: new Date().toISOString()
        })
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    log('info', `Burst mode triggered: ${reason}`);
    return { success: true };
  } catch (error) {
    log('error', `Failed to trigger burst mode: ${error}`);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('get-trending-signals', async () => {
  try {
    const config = await loadConfigSync();
    if (!config) throw new Error('Config not loaded');

    if (!config.SUPABASE_ANON_KEY) {
      throw new Error('SUPABASE_ANON_KEY not configured');
    }

    // Query curated_pool for trending tags and categories
    const response = await fetch(
      `${config.SUPABASE_URL}/rest/v1/curated_pool?select=tags,category,confidence_score&order=created_at.desc&limit=100`,
      {
        headers: {
          'apikey': config.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${config.SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    
    // Analyze trending patterns
    const tagFrequency: Record<string, number> = {};
    const categoryFrequency: Record<string, number> = {};
    
    data.forEach((item: any) => {
      if (item.tags) {
        item.tags.forEach((tag: string) => {
          tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
        });
      }
      if (item.category) {
        categoryFrequency[item.category] = (categoryFrequency[item.category] || 0) + 1;
      }
    });

    const trending = {
      tags: Object.entries(tagFrequency)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([tag, count]) => ({ tag, count })),
      categories: Object.entries(categoryFrequency)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([category, count]) => ({ category, count }))
    };

    return { success: true, data: trending };
  } catch (error) {
    log('error', `Failed to get trending signals: ${error}`);
    return { success: false, error: String(error) };
  }
});

// Automation control
ipcMain.handle('start-automation', async () => {
  const config = await loadConfigSync();
  if (!config) {
    return { success: false, error: 'Config not loaded' };
  }

  if (automationInterval) {
    clearInterval(automationInterval);
  }

  const intervalMs = config.POLL_INTERVAL_MINUTES * 60 * 1000;
  
  automationInterval = setInterval(async () => {
    log('info', 'Running automated dataset check...');
    mainWindow?.webContents.send('automation-tick');
  }, intervalMs);

  log('info', `Automation started (every ${config.POLL_INTERVAL_MINUTES} minutes)`);
  return { success: true };
});

ipcMain.handle('stop-automation', async () => {
  if (automationInterval) {
    clearInterval(automationInterval);
    automationInterval = null;
    log('info', 'Automation stopped');
  }
  return { success: true };
});

function loadConfigSync(): Config | null {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const data = fs.readFileSync(CONFIG_PATH, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    log('error', `Failed to load config: ${error}`);
  }
  return null;
}
