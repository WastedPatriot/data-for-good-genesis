# Testing & Verification Checklist

## Pre-Flight Checks

### ✅ Build Success
- [ ] Windows build completes without errors
- [ ] Linux build completes without errors  
- [ ] Executable launches without crashes
- [ ] GUI renders correctly

### ✅ Database Migration
**IMPORTANT**: Before the agent can work, approve the database migration:

1. Check Lovable chat for migration approval request
2. Click **Approve** to create agent coordination tables:
   - `machine_agents`
   - `agent_tasks`
   - `agent_locks`
   - `agent_metrics`

3. Verify tables created:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'agent_%' OR table_name = 'machine_agents';
```

Expected result:
```
agent_locks
agent_metrics
agent_tasks
machine_agents
```

### ✅ Edge Functions Deployed
Check these functions exist:
- [ ] agent-register
- [ ] agent-heartbeat
- [ ] agent-get-task
- [ ] agent-complete-task

Verify in Lovable backend or run:
```bash
# Check function logs
curl https://fszghwwbvxwkmgfvhzrh.supabase.co/functions/v1/agent-heartbeat \
  -H "Content-Type: application/json" \
  -d '{"agentId":"test"}'
```

## Agent Connection Test

### Test 1: Configuration Save
1. Launch agent
2. Go to Settings
3. Paste valid config
4. Click Save
5. **Expected**: Success message, status shows "Connected"

### Test 2: Registration
1. After saving config
2. Check backend logs
3. **Expected**: Agent registered in `machine_agents` table

Verify:
```sql
SELECT agent_id, device_name, status, last_heartbeat 
FROM machine_agents 
ORDER BY created_at DESC 
LIMIT 5;
```

### Test 3: Heartbeat
1. Wait 30 seconds after connection
2. Check `machine_agents.last_heartbeat`
3. **Expected**: Timestamp updates every ~30 seconds

Monitor:
```sql
SELECT agent_id, last_heartbeat, status 
FROM machine_agents 
WHERE agent_id = 'your-agent-id';
```

## Data Pipeline Test

### Test 4: Data Submission
1. Go to **Data Harvest Hub**
2. Click **Manual Entry**
3. Enter test data:
```json
{
  "type": "sustainability",
  "metric": "carbon_offset",
  "value": 100,
  "unit": "tons_co2"
}
```
4. Click **Submit**
5. **Expected**: Success, data appears in review queue

Verify:
```sql
SELECT * FROM review_queue 
WHERE status = 'pending' 
ORDER BY created_at DESC 
LIMIT 1;
```

### Test 5: Scraper Feed
1. Go to **Scraper Feeds**
2. **Expected**: See queued records (if any)
3. Select a record
4. Click **Approve & Ingest**
5. **Expected**: Moves to curation

Verify:
```sql
SELECT COUNT(*) FROM review_queue WHERE status = 'approved';
```

### Test 6: AI Curation
1. Ensure records in review queue
2. Go to **Dataset Automation**
3. Enable **Auto-Curation**
4. Click **Trigger AI Curation**
5. Wait 10-30 seconds
6. **Expected**: Records move to curated_pool

Verify:
```sql
SELECT COUNT(*) FROM curated_pool;
SELECT * FROM curated_pool ORDER BY created_at DESC LIMIT 5;
```

### Test 7: Dataset Building
1. Ensure 50+ curated records exist
2. Go to **Publisher** tab
3. Click **Build Dataset**
4. Select category: "sustainability"
5. Enable AI enhancement
6. Click **Build**
7. **Expected**: Dataset created

Verify:
```sql
SELECT id, name, size_mb, active FROM datasets 
ORDER BY created_at DESC LIMIT 1;
```

### Test 8: Publishing
1. After dataset built
2. Still in **Publisher** tab
3. Click **Publish to Marketplace**
4. **Expected**: 
   - Stripe product created
   - Badge codes generated
   - Files exported (CSV, JSON, Parquet)
   - Dataset active on marketplace

Verify:
```sql
-- Check dataset published
SELECT * FROM datasets WHERE active = true 
ORDER BY created_at DESC LIMIT 1;

-- Check badge codes
SELECT COUNT(*) FROM badge_codes 
WHERE dataset_id = 'your-dataset-id';

-- Check files
SELECT format, file_size_bytes FROM dataset_files 
WHERE dataset_id = 'your-dataset-id';
```

## Automation Test

### Test 9: Full Automation Cycle
1. Go to **Dataset Automation**
2. Configure:
   - Auto-Curation: ON
   - Auto-Building: ON
   - Auto-Publishing: ON
   - Min Records: 50
3. Click **Start Automation**
4. Add 50+ test records to review queue
5. Wait for automation cycle (check interval setting)
6. **Expected**: Complete pipeline executes automatically

Monitor progress:
```sql
-- Check pipeline stages
SELECT 
  (SELECT COUNT(*) FROM review_queue WHERE status = 'pending') as pending_review,
  (SELECT COUNT(*) FROM curated_pool WHERE usage_count = 0) as ready_to_build,
  (SELECT COUNT(*) FROM datasets WHERE active = true) as published_datasets;
```

### Test 10: Burst Mode
1. In **Dataset Automation**
2. Enable **Burst Mode**
3. Add 100 records quickly
4. **Expected**: Processes 10x faster than normal

Observe logs for rapid processing.

## Multi-Agent Test

### Test 11: Second Agent Registration
1. Install agent on second machine
2. Use same config
3. Launch and connect
4. **Expected**: Both agents show in database

Verify:
```sql
SELECT agent_id, device_name, status, last_heartbeat 
FROM machine_agents 
WHERE status = 'online'
ORDER BY last_heartbeat DESC;
```

### Test 12: Task Distribution
1. Create 10 tasks manually:
```sql
INSERT INTO agent_tasks (task_type, status, priority, payload)
VALUES 
  ('scrape', 'pending', 5, '{"target": "test1"}'),
  ('scrape', 'pending', 5, '{"target": "test2"}'),
  ('scrape', 'pending', 5, '{"target": "test3"}'),
  ('scrape', 'pending', 5, '{"target": "test4"}'),
  ('scrape', 'pending', 5, '{"target": "test5"}');
```

2. **Expected**: Tasks distributed across agents
3. Check which agent got which task:
```sql
SELECT task_type, agent_id, status 
FROM agent_tasks 
WHERE task_type = 'scrape' 
ORDER BY assigned_at DESC;
```

### Test 13: Distributed Locking
1. Create competing task
2. Have both agents try to claim it
3. **Expected**: Only one succeeds
4. Other agent gets different task

Verify no duplicates:
```sql
SELECT task_id, COUNT(*) as agent_count 
FROM agent_tasks 
WHERE status != 'pending'
GROUP BY task_id 
HAVING COUNT(*) > 1;
```

Should return 0 rows.

## Performance Test

### Test 14: Load Testing
1. Generate 1000 test records:
```python
import requests
import json

for i in range(1000):
    data = {
        "source": "load_test",
        "data": {"index": i, "value": i * 10},
        "category": "test"
    }
    response = requests.post(
        "https://your-url/functions/v1/data-harvest-api",
        json=data,
        headers={"Content-Type": "application/json"}
    )
    if i % 100 == 0:
        print(f"Submitted {i} records")
```

2. **Expected**: All records processed within reasonable time
3. Monitor:
   - Agent CPU/memory usage
   - Database performance
   - No errors in logs

### Test 15: Deduplication
1. Submit same data twice:
```json
{
  "source": "test",
  "data": {"unique_id": "12345", "value": 100}
}
```

2. **Expected**: Second submission flagged as duplicate
3. Check `provenance_collisions` table:
```sql
SELECT * FROM provenance_collisions 
WHERE created_at > NOW() - INTERVAL '1 hour';
```

## Integration Test

### Test 16: End-to-End Purchase Flow
1. Ensure dataset published on marketplace
2. Go to website marketplace page
3. Add dataset to cart
4. Complete purchase (use Stripe test cards)
5. **Expected**: 
   - Purchase recorded
   - Download links active
   - Badge code generated
   - User can download files

Verify:
```sql
SELECT * FROM purchases 
WHERE status = 'completed' 
ORDER BY created_at DESC LIMIT 1;
```

### Test 17: Badge Verification
1. Get a badge code from published dataset
2. Go to website `/claim-badge`
3. Enter code
4. **Expected**: Badge claimed, shows in user profile

Verify:
```sql
SELECT * FROM badge_codes 
WHERE claimed = true 
ORDER BY claimed_at DESC LIMIT 1;
```

### Test 18: Organization Subscription
1. Sign up organization account
2. Subscribe to tier (e.g., "starter")
3. Download dataset
4. **Expected**: Download counted against limit

Verify:
```sql
SELECT 
  organization_name,
  subscription_tier,
  monthly_downloads_used,
  monthly_downloads_limit
FROM organization_profiles 
WHERE subscription_status = 'active';
```

## Error Handling Test

### Test 19: Invalid Data
1. Submit malformed data
2. **Expected**: Rejected with clear error message

### Test 20: Network Failure
1. Disconnect internet
2. Agent should:
   - Show offline status
   - Queue operations
   - Reconnect automatically
   - Resume operations

### Test 21: Database Failure
1. Simulate DB timeout
2. Agent should:
   - Retry with backoff
   - Log error
   - Continue when DB recovers

## Monitoring Test

### Test 22: Dashboard Metrics
1. Open **Dashboard** tab
2. **Expected** to see:
   - Total records processed
   - Active automations
   - Datasets published
   - Agent status

### Test 23: Logs
1. Go to **Logs** tab
2. Perform various actions
3. **Expected**: See real-time log entries
4. Filter by level (info/warn/error)

### Test 24: Agent Metrics
Query performance metrics:
```sql
SELECT 
  agent_id,
  metric_type,
  AVG(value) as avg_value,
  COUNT(*) as count
FROM agent_metrics 
GROUP BY agent_id, metric_type 
ORDER BY agent_id, metric_type;
```

## Security Test

### Test 25: Authentication
1. Try accessing edge functions without auth
2. **Expected**: 401 Unauthorized (for protected endpoints)

### Test 26: RLS Policies
1. Try querying as non-admin:
```sql
SELECT * FROM machine_agents;
```
2. **Expected**: Only see your org's agents

### Test 27: Injection Protection
1. Try SQL injection in inputs
2. **Expected**: Safely escaped, no execution

## Failover Test

### Test 28: Agent Crash Recovery
1. Force quit agent
2. Restart
3. **Expected**:
   - Reconnects automatically
   - Resumes from last state
   - No data loss

### Test 29: Task Reassignment
1. Agent claims task
2. Agent goes offline (kill process)
3. Wait 3 minutes
4. **Expected**: Task reassigned to another agent

Monitor:
```sql
SELECT * FROM agent_tasks 
WHERE status = 'assigned' 
AND assigned_at < NOW() - INTERVAL '3 minutes';
```

## Stress Test

### Test 30: Concurrent Operations
1. Run 3+ agents simultaneously
2. Submit 1000+ records rapidly
3. Enable burst mode
4. **Expected**:
   - All agents coordinate
   - No duplicate work
   - All data processed
   - System remains stable

## Production Readiness

### Final Checklist

- [ ] All tests passing
- [ ] No errors in logs
- [ ] Agents connecting reliably
- [ ] Data flowing through pipeline
- [ ] Datasets publishing successfully
- [ ] Purchases working
- [ ] Multi-agent coordination working
- [ ] Performance acceptable
- [ ] Security verified
- [ ] Documentation complete

## Success Criteria

✅ **Bronze**: Single agent operational, manual workflow works  
✅ **Silver**: Automation enabled, datasets publishing  
✅ **Gold**: Multi-agent coordination, production-ready  
✅ **Platinum**: High-volume, enterprise-grade performance  

## When Tests Fail

1. **Check Logs**: Agent logs + edge function logs
2. **Check Database**: Verify data in expected tables
3. **Check Network**: Ensure connectivity
4. **Check Config**: Validate all settings
5. **Check Migrations**: Ensure DB tables exist
6. **Check Stripe**: If purchase tests fail

## Support

If tests consistently fail:
1. Review `AGENT_SETUP_GUIDE.md`
2. Check `TROUBLESHOOTING.md`
3. Verify edge functions deployed
4. Confirm database migrations applied

---

**Run through this checklist systematically. Each passed test brings you closer to production readiness!** ✅
