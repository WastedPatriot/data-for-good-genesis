# Quick Start - 5 Minutes to Your First Dataset

## Step 1: Build (2 minutes)

```bash
cd machine-agent-gui
git pull
npm install
npm run package:win  # or package:linux
```

## Step 2: Configure (1 minute)

Launch the agent, go to Settings, paste:

```json
{
  "SUPABASE_URL": "https://fszghwwbvxwkmgfvhzrh.supabase.co",
  "SUPABASE_ANON_KEY": "your-key-here",
  "INGEST_SECRET": "your-secret-here",
  "DATA_PRICE": 49.99,
  "CATEGORY": "sustainability",
  "MIN_RECORDS_FOR_DATASET": 50
}
```

Click Save.

## Step 3: Add Test Data (1 minute)

Go to **Data Harvest Hub** tab:

1. Click **Upload CSV** or **Manual Entry**
2. Add some sustainability data
3. Click **Submit for Review**

## Step 4: Start Automation (30 seconds)

Go to **Dataset Automation** tab:

1. Toggle **Auto-Curation**: ON
2. Toggle **Auto-Building**: ON  
3. Toggle **Auto-Publishing**: ON
4. Click **Start Automation**

## Step 5: Watch It Work! (30 seconds)

Go to **Dashboard** tab and watch:

```
Processing... ⚡
↓
Curating... 🔄
↓
Building... 📦
↓
Publishing... 🚀
↓
✅ Dataset Live on Marketplace!
```

## Verify on Website

1. Go to https://your-site.com/marketplace
2. See your new dataset
3. Check pricing and badge codes

## Add More Agents

Just install on another machine with same config - they'll coordinate automatically!

---

**That's it! You're now running a professional data marketplace.** 🎉

Read `AGENT_SETUP_GUIDE.md` for advanced features.
