# DataForEarth Machine Agent - Complete Setup Guide

## Overview
This guide will walk you through setting up the professional-grade data harvesting, analysis, and publishing system that automatically produces datasets for the DataForEarth marketplace.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Machine Agent  │────▶│  Supabase Edge   │────▶│  DataForEarth   │
│  (Electron GUI) │     │    Functions     │     │    Website      │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │                        │                        │
         │                        ▼                        │
         │              ┌──────────────────┐              │
         └─────────────▶│   PostgreSQL     │◀─────────────┘
                        │    Database      │
                        └──────────────────┘
```

## Prerequisites

### 1. System Requirements
- **Windows**: Windows 10/11 (64-bit)
- **Linux**: Ubuntu 20.04+ or similar
- **RAM**: Minimum 4GB, Recommended 8GB+
- **Storage**: 10GB+ free space
- **Network**: Stable internet connection

### 2. Software Requirements
- Node.js 18+ and npm
- Git
- Windows: Visual Studio Build Tools (for native modules)
- Linux: build-essential package

## Part 1: Build the Machine Agent

### Step 1: Clone and Prepare

```bash
cd data-for-good-genesis/machine-agent-gui
git pull
npm install
```

### Step 2: Build the Agent

**For Windows:**
```bash
npm run package:win
```

**For Linux:**
```bash
npm run package:linux
```

### Step 3: Locate the Executable

**Windows:**
- NSIS Installer: `dist-package/DataForEarth Agent Setup.exe`
- Portable: `dist-package/DataForEarth Agent.exe`

**Linux:**
- AppImage: `dist-package/DataForEarth-Agent-x86_64.AppImage`

## Part 2: Initial Configuration

### Step 1: First Launch

1. Run the agent executable
2. Navigate to **⚙️ Settings** tab
3. You'll see empty configuration fields

### Step 2: Get Supabase Credentials

From your DataForEarth project, you need:

1. **SUPABASE_URL**: `https://fszghwwbvxwkmgfvhzrh.supabase.co`
2. **SUPABASE_ANON_KEY**: Your anon/publishable key
3. **INGEST_SECRET**: Your secure ingest secret

> ⚠️ **Security Note**: The anon key is safe to use in the agent. The INGEST_SECRET should be kept secure and only used by authorized agents.

### Step 3: Configure the Agent

Enter the following configuration:

```json
{
  "SUPABASE_URL": "https://fszghwwbvxwkmgfvhzrh.supabase.co",
  "SUPABASE_ANON_KEY": "your-anon-key-here",
  "INGEST_SECRET": "your-ingest-secret-here",
  "DATA_PRICE": 49.99,
  "BADGE_CODE_COUNT": 10,
  "CATEGORY": "sustainability",
  "MIN_RECORDS_FOR_DATASET": 100,
  "POLL_INTERVAL_MINUTES": 60
}
```

**Configuration Parameters Explained:**

- **DATA_PRICE**: Default price for generated datasets (USD)
- **BADGE_CODE_COUNT**: Number of verification codes to generate per dataset
- **CATEGORY**: Primary category for harvested data
- **MIN_RECORDS_FOR_DATASET**: Minimum records before building a dataset
- **POLL_INTERVAL_MINUTES**: How often to check for new work

### Step 4: Save and Test Connection

1. Click **Save Configuration**
2. Agent will automatically connect to the backend
3. Status indicator should show **Connected**

## Part 3: Multi-Device Deployment

### Device Registration System

Each agent instance automatically registers with the backend using:
- **Device Fingerprint**: Unique hardware ID
- **Device Name**: Auto-generated or custom
- **Agent ID**: UUID for coordination

### Step 1: Deploy on Multiple Machines

1. **Install on each machine** using the built executable
2. **Configure with same credentials** on all machines
3. **Each agent auto-registers** on first connection

### Step 2: Link to Organization (Optional)

If you want agents tied to a specific organization:

1. Get your organization ID from the website
2. In agent settings, add:
   ```json
   "ORGANIZATION_ID": "your-org-uuid-here"
   ```

### Step 3: Monitor Fleet

From the DataForEarth website:
1. Login as admin
2. Navigate to **Admin** → **Machine Agents**
3. View all registered agents, their status, and stats

## Part 4: Data Pipeline Flow

### Understanding the Pipeline

```
[External Sources]
      ↓
[Machine Agent Scrapes/Collects]
      ↓
[Submit to Review Queue]
      ↓
[AI Curation Process]
      ↓
[Curated Pool]
      ↓
[Dataset Builder]
      ↓
[Publish to Marketplace]
      ↓
[Available for Purchase]
```

### Pipeline Components

#### 1. Data Harvest Hub
- **Purpose**: Collect data from external sources
- **Features**:
  - Web scraping
  - API integration
  - File uploads
  - Real-time monitoring

#### 2. Scraper Feeds
- **Purpose**: Review and approve scraped data
- **Process**:
  1. Data queued for review
  2. Manual or auto-approval
  3. Handoff to curation

#### 3. AI Curation
- **Purpose**: Clean, categorize, and quality-check data
- **Automated**:
  - Deduplication
  - Quality scoring
  - Categorization
  - Tagging

#### 4. Dataset Builder
- **Purpose**: Package curated data into sellable datasets
- **Triggers**:
  - Minimum records reached
  - Manual build request
  - Scheduled automation

#### 5. Publisher
- **Purpose**: List datasets on marketplace
- **Includes**:
  - Stripe product creation
  - Pricing configuration
  - Badge code generation
  - File export (CSV, JSON, Parquet)

## Part 5: Automated Operation

### Automation Tab

The **🤖 Dataset Automation** tab controls the entire pipeline:

#### Quick Start Automation

1. Navigate to **Dataset Automation**
2. Set configuration:
   ```
   Auto-Curation: ON
   Auto-Building: ON
   Auto-Publishing: ON
   Burst Mode: OFF (enable for rapid processing)
   ```

3. Click **Start Automation**

#### Automation Behavior

**Every cycle (default 60 minutes):**

1. ✅ Check for pending records in review queue
2. ✅ Run AI curation on approved items
3. ✅ Add to curated pool
4. ✅ Check if ready to build dataset
5. ✅ Build and publish if criteria met
6. ✅ Generate badge codes
7. ✅ Export multiple formats
8. ✅ Create Stripe product
9. ✅ List on marketplace

### Burst Mode

For rapid data processing:

```
Burst Mode: ON
Processing Speed: 10x normal
Use Case: Initial data loading, urgent datasets
```

⚠️ **Warning**: Burst mode uses more resources and may hit rate limits

## Part 6: Task Coordination (Multi-Agent)

### How Task Distribution Works

```
┌─────────┐     ┌─────────┐     ┌─────────┐
│ Agent 1 │     │ Agent 2 │     │ Agent 3 │
└────┬────┘     └────┬────┘     └────┬────┘
     │               │               │
     └───────────────┴───────────────┘
                     │
            ┌────────▼────────┐
            │  Task  Queue    │
            │  ┌───┐ ┌───┐   │
            │  │ T │ │ T │   │
            │  └───┘ └───┘   │
            └─────────────────┘
```

### Task Types

1. **scrape**: Collect data from specific sources
2. **curate**: Process and clean data
3. **analyze**: Run analytics on datasets
4. **publish**: Create marketplace listings
5. **harvest**: General data collection

### Coordination Features

#### Automatic Load Balancing
- Tasks assigned to available agents
- Priority-based queuing
- Retry on failure

#### Distributed Locking
- Prevents duplicate work
- Ensures data consistency
- Automatic lock expiration

#### Heartbeat System
- Agent sends status every 30 seconds
- Backend marks offline after 2 minutes
- Tasks reassigned automatically

## Part 7: Data Quality & Provenance

### Duplicate Prevention

The system uses multiple layers:

1. **Content Hash**: SHA-256 of normalized data
2. **Provenance Tracking**: Source + timestamp
3. **Collision Detection**: Flags duplicates for review

### Quality Tiers

Curated data is scored:

- **Enterprise Grade**: 90-100% confidence
- **Premium**: 75-89% confidence
- **Standard**: 60-74% confidence
- **Review**: <60% (flagged for manual review)

### Data Enrichment

AI automatically adds:
- **Tags**: Relevant keywords
- **Categories**: Industry classifications
- **Regions**: Geographic relevance
- **Sectors**: Business segments

## Part 8: Monitoring & Logs

### Dashboard Tab

Real-time metrics:

```
📊 Records Processed: 15,234
🔄 Active Automations: 3
📦 Datasets Published: 42
⚡ Agent Status: Online
```

### Logs Tab

Filter and search:
- **Info**: Normal operations
- **Warning**: Potential issues
- **Error**: Failures requiring attention

### System Health

Monitor:
- **Heartbeat**: Green = connected
- **Task Queue**: Pending vs completed
- **Error Rate**: Success/failure ratio

## Part 9: Troubleshooting

### Agent Won't Connect

**Check:**
1. Valid SUPABASE_URL and SUPABASE_ANON_KEY
2. Internet connection stable
3. Firewall not blocking requests
4. Backend edge functions deployed

**Solution:**
```bash
# Re-deploy edge functions
git pull
# Backend automatically redeploys
```

### No Tasks Assigned

**Check:**
1. Agent registered in database
2. Heartbeat successful
3. Tasks exist in queue
4. Agent status = 'online'

**Solution:**
Check `machine_agents` table:
```sql
SELECT * FROM machine_agents 
WHERE agent_id = 'your-agent-id';
```

### Datasets Not Publishing

**Check:**
1. Minimum records reached
2. Auto-publishing enabled
3. Stripe credentials configured
4. No errors in logs

**Solution:**
Manual publish from **Publisher** tab

### High Memory Usage

**Cause**: Large dataset processing

**Solution:**
1. Reduce `MIN_RECORDS_FOR_DATASET`
2. Process in smaller batches
3. Enable garbage collection:
   ```json
   "MAX_BATCH_SIZE": 1000
   ```

## Part 10: Advanced Configuration

### Custom Data Sources

Edit `machine-agent-gui/data-sources.json`:

```json
{
  "sources": [
    {
      "name": "Custom API",
      "type": "api",
      "endpoint": "https://api.example.com/data",
      "auth": "Bearer YOUR_TOKEN",
      "interval_minutes": 30
    },
    {
      "name": "CSV Files",
      "type": "file",
      "path": "/path/to/files/*.csv",
      "watch": true
    }
  ]
}
```

### Python Scraper Integration

The agent includes Python scrapers in `data-scraper-module/`:

**Activate:**
```bash
cd data-scraper-module
pip install -r requirements.txt
python scraper.py
```

**Configure targets in** `HARVESTER_TARGETS.md`

### Webhook Integration

Receive data via webhooks:

**Endpoint**: `https://your-supabase-url/functions/v1/data-harvest-api`

**Payload:**
```json
{
  "source": "webhook",
  "data": { /* your data */ },
  "category": "sustainability",
  "tags": ["renewable", "energy"]
}
```

## Part 11: Production Deployment

### Service Mode (Linux)

Run agent as system service:

```bash
# Copy service file
sudo cp dataforearth-agent.service /etc/systemd/system/

# Enable and start
sudo systemctl enable dataforearth-agent
sudo systemctl start dataforearth-agent

# Check status
sudo systemctl status dataforearth-agent
```

### Service Mode (Windows)

Run as Windows Service:

```batch
# Install service
windows-service-install.bat

# Uninstall service
windows-service-uninstall.bat
```

### Docker Deployment

```dockerfile
FROM node:18
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
CMD ["npm", "start"]
```

```bash
docker build -t dataforearth-agent .
docker run -d -v /config:/app/config dataforearth-agent
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: dataforearth-agent
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: agent
        image: dataforearth-agent:latest
        env:
        - name: SUPABASE_URL
          valueFrom:
            secretKeyRef:
              name: dataforearth-secrets
              key: supabase-url
```

## Part 12: Performance Optimization

### Scaling Guidelines

**Single Agent:**
- Handles: ~10K records/hour
- Best for: Testing, small deployments

**Multi-Agent (3-5):**
- Handles: ~50K records/hour
- Best for: Production, medium volume

**Large Deployment (10+):**
- Handles: 100K+ records/hour
- Best for: Enterprise, high volume

### Database Optimization

```sql
-- Add indexes for performance
CREATE INDEX idx_agent_tasks_pending 
ON agent_tasks(status, priority DESC) 
WHERE status = 'pending';

CREATE INDEX idx_curated_unused 
ON curated_pool(usage_count) 
WHERE usage_count = 0;
```

### Rate Limiting

Configure in agent settings:

```json
{
  "RATE_LIMITS": {
    "requests_per_minute": 100,
    "concurrent_requests": 10,
    "backoff_multiplier": 2
  }
}
```

## Part 13: Security Best Practices

### Credentials Management

1. **Never commit secrets** to git
2. **Use environment variables** in production
3. **Rotate keys** regularly
4. **Use separate keys** per environment

### Network Security

1. **HTTPS only** for all communications
2. **Verify SSL certificates**
3. **Use VPN** for remote agents
4. **Whitelist IPs** if possible

### Data Protection

1. **Encrypt at rest**: All sensitive data
2. **Encrypt in transit**: TLS 1.3+
3. **PII handling**: Follow GDPR/CCPA
4. **Audit logging**: Track all access

## Part 14: Maintenance

### Regular Tasks

**Daily:**
- ✅ Check agent status
- ✅ Review error logs
- ✅ Monitor data quality

**Weekly:**
- ✅ Update dependencies
- ✅ Clean old logs
- ✅ Review task queue

**Monthly:**
- ✅ Security audit
- ✅ Performance review
- ✅ Backup verification

### Updates

```bash
# Pull latest code
git pull origin main

# Update dependencies
npm install

# Rebuild agent
npm run package:win  # or package:linux

# Restart agents
# (they will auto-update on restart)
```

## Support & Community

- **Documentation**: `PROJECT_INDEX.md`
- **Issues**: Check `TROUBLESHOOTING.md`
- **Architecture**: `ARCHITECTURE.md`
- **API Docs**: Edge function headers

## Success Metrics

After setup, you should see:

✅ **Agent Status**: Online and sending heartbeats  
✅ **Tasks Completing**: Regular task assignments and completions  
✅ **Data Flowing**: Records moving through pipeline  
✅ **Datasets Published**: New datasets appearing on marketplace  
✅ **No Errors**: Clean logs with minimal warnings  

## Next Steps

1. ✅ Complete this setup guide
2. ✅ Run first automation cycle
3. ✅ Verify dataset published
4. ✅ Test purchase flow
5. ✅ Scale to multiple agents
6. ✅ Monitor and optimize

---

**You now have a professional-grade, multi-agent data harvesting and publishing system!** 🚀

The system will automatically:
- Collect data from sources
- Curate and quality-check
- Build datasets
- Publish to marketplace
- Handle purchases
- Track provenance
- Prevent duplicates
- Coordinate across devices

**Welcome to the future of automated data marketplaces.**
