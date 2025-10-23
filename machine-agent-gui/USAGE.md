# Usage Guide

## Starting the Agent

### GUI Mode
```bash
./dist-package/DataForEarth-Agent-*.AppImage
```

### Headless Mode (via systemd)
```bash
sudo systemctl start dataforearth-agent
sudo systemctl status dataforearth-agent
```

## Tab-by-Tab Guide

### 📊 Dashboard Tab

**Purpose**: Monitor overall system health and revenue

**Key Metrics**:
- Total Datasets Published
- Total Revenue ($)
- Badge Codes Remaining
- Last Purchase Timestamp
- Machine Health Status

**Features**:
- Revenue trends chart (last 7 days)
- Low badge code warnings
- Real-time status updates (refreshes every 30s)

**Actions**: View-only monitoring

---

### 🤖 Dataset Automation Tab

**Purpose**: Configure and control automated dataset publishing

**Configuration Options**:
- **Category**: Environmental, Climate, Energy, Sustainability
- **Minimum Records Threshold**: How many records before auto-publish
- **Badge Codes to Generate**: How many codes per dataset
- **Dataset Price**: Price in USD

**Actions**:
1. **Publish Now**: Manually publish a dataset immediately
2. **Refresh Records**: Fetch latest processed records
3. **Start Automation**: Enable automatic publishing
4. **Stop Automation**: Disable automatic publishing

**How It Works**:
- Polls for processed records at configured interval
- When threshold is met, automatically publishes dataset
- Generates unique dataset name: `{category}-dataset-{timestamp}`
- Creates badge codes for the dataset
- Logs all operations

**Status Logs**: Shows real-time operation logs

---

### 🌱 Eco Projects Tab

**Purpose**: Discover and approve external eco data projects

**Features**:
- Scans for trending projects related to:
  - Solar energy
  - Wind power
  - Electric vehicles
  - Ocean cleanup
  - Carbon capture
  - Other sustainability topics

**Actions**:
1. **Scan for Projects**: Search for new projects
2. **Approve**: Add project to database for tracking

**Project Information**:
- Title and description
- Category tag
- Relevance score
- Source URL

---

### 🏆 Badge Codes Tab

**Purpose**: Manage badge code inventory

**Metrics**:
- Unclaimed Badge Codes count
- Inventory Status (Critical/Low/Healthy)

**Alerts**:
- 🔴 Critical: < 10 codes
- 🟡 Low: < 50 codes
- 🟢 Healthy: ≥ 50 codes

**Actions**:
1. **Generate Codes**: Create new badge codes
   - Specify quantity (1-1000)
   - Automatically linked to latest dataset

**Recent Codes Table**: Shows last 5 unclaimed codes

**Usage Guidelines**:
- Maintain at least 50 codes in inventory
- Generate after each major dataset publication
- Monitor daily to prevent stockouts
- Email alerts sent when < 10 codes remain

---

### 📝 Logs Tab

**Purpose**: View and filter system operation logs

**Features**:
- Real-time log display
- Auto-refresh every 5 seconds (toggle on/off)
- Filter by level: All, Info, Warning, Error
- Log statistics dashboard

**Actions**:
1. **Refresh**: Manually reload logs
2. **Clear**: Delete all logs (requires confirmation)

**Log Levels**:
- **Info** (Blue): Normal operations
- **Warning** (Yellow): Potential issues
- **Error** (Red): Failed operations

**Statistics**:
- Total entries
- Error count
- Warning count
- Info count

---

### ⚙️ Settings Tab

**Purpose**: Configure agent connection and defaults

**Supabase Connection**:
- **Supabase URL**: Your project URL
- **Ingest Secret**: Authentication key
- **Test Connection**: Verify credentials

**Dataset Configuration**:
- Default Category
- Dataset Price ($)
- Minimum Records for Dataset
- Badge Codes per Dataset

**Automation Settings**:
- **Poll Interval**: How often to check for new records (minutes)
  - Range: 1-1440 minutes
  - Recommended: 60 minutes for production

**Actions**:
1. **Test Connection**: Verify Supabase credentials
2. **Save Configuration**: Persist all settings

**Configuration Storage**: 
- Saved locally in JSON format
- Located at `~/.config/dataforearth-machine-agent/config.json`

---

## Automation Workflow

1. **Configure** (Settings Tab):
   - Set Supabase credentials
   - Configure thresholds and defaults
   - Save configuration

2. **Start Automation** (Dataset Automation Tab):
   - Click "Start Automation"
   - Agent begins polling at configured interval

3. **Automatic Publishing**:
   - Fetches processed records
   - Checks if threshold is met
   - Publishes dataset with HMAC signature
   - Generates badge codes
   - Sends admin email notification
   - Logs all operations

4. **Monitor** (Dashboard Tab):
   - Watch revenue trends
   - Check badge inventory
   - View system health

5. **Review** (Logs Tab):
   - Check for errors
   - Monitor successful operations
   - Debug issues

## Email Notifications

The agent sends emails via Resend when:
- ✅ Dataset published successfully
- ⚠️ Badge codes low (< 10 remaining)
- ❌ Scraper or publish failures

Emails sent to: `hello@dataforearth.org`

## Best Practices

1. **Keep Badge Inventory Healthy**: Generate codes before running low
2. **Monitor Logs Daily**: Catch issues early
3. **Set Reasonable Thresholds**: Balance frequency vs data quality
4. **Test Connection Regularly**: Ensure credentials haven't expired
5. **Review Dashboard**: Check revenue and system health daily
6. **Backup Configuration**: Save config file externally

## Troubleshooting

### Connection Failed
- Verify Supabase URL format
- Check INGEST_SECRET is correct
- Test network connectivity

### No Records to Publish
- Check data harvest API is running
- Verify processed records exist in queue
- Review logs for fetch errors

### Automation Not Triggering
- Confirm automation is started
- Check poll interval setting
- Verify threshold configuration
- Review logs for errors

### Badge Generation Failed
- Ensure edge function is deployed
- Check INGEST_SECRET permissions
- Verify dataset exists

For more help, check the Logs tab for detailed error messages.
