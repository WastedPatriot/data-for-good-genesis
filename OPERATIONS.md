# DataForEarth Operations Guide

## Daily Operations Checklist

### Morning
- [ ] Check external scraper feeds in machine-agent GUI
- [ ] Review new data submissions in processing queue
- [ ] Monitor badge code inventory levels
- [ ] Check for failed edge function invocations
- [ ] Review audit logs for anomalies
- [ ] Verify Stripe payment processing status

### Afternoon
- [ ] Approve queued scraper data (if not auto-approved)
- [ ] Review AI processing quality scores
- [ ] Check dataset marketplace for user feedback
- [ ] Monitor Impact Dashboard metrics
- [ ] Respond to contact submissions

### Evening
- [ ] Generate daily metrics report
- [ ] Check backup locations for data integrity
- [ ] Review rate limiting logs for abuse patterns
- [ ] Verify email delivery status (Resend dashboard)

## Weekly Operations Checklist

### Every Monday
- [ ] Review previous week's revenue and project funding
- [ ] Check for low badge code inventory (trigger regeneration if < 50)
- [ ] Audit RLS policies for security compliance
- [ ] Test all edge functions with sample payloads
- [ ] Review and update scraper source URLs

### Every Wednesday
- [ ] Run full database backup verification
- [ ] Check Stripe product/price synchronization
- [ ] Review AI categorization accuracy
- [ ] Update Impact Dashboard environmental metrics
- [ ] Test purchase flow end-to-end

### Every Friday
- [ ] Generate weekly impact report for stakeholders
- [ ] Review and respond to organization signup requests
- [ ] Check for Supabase service health alerts
- [ ] Update project roadmap based on user feedback
- [ ] Plan next week's dataset publications

## Monthly Operations Checklist

### First Week
- [ ] Conduct full security audit (RLS, HMAC, rate limiting)
- [ ] Review and optimize edge function performance
- [ ] Update documentation for new features
- [ ] Check Lovable AI usage and costs
- [ ] Generate monthly financial report

### Second Week
- [ ] Review and prune old audit logs (retain 90 days)
- [ ] Test disaster recovery procedures
- [ ] Update scraper modules with new sources
- [ ] Review marketplace dataset performance
- [ ] Conduct user feedback session

### Third Week
- [ ] Optimize database query performance
- [ ] Review and update RLS policies
- [ ] Check for dependency updates (Python, npm, Deno)
- [ ] Test all user flows (contribute, purchase, donate, claim)
- [ ] Generate environmental impact verification report

### Fourth Week
- [ ] Plan next month's feature releases
- [ ] Review competitor analysis
- [ ] Update marketing materials with latest metrics
- [ ] Conduct team retrospective
- [ ] Archive completed projects

## Machine Agent Monitoring

### Key Metrics to Watch
1. **Automation Loop Status**: Should run every N minutes (configurable)
2. **Badge Code Inventory**: Alert if < 50 remaining
3. **Processing Queue**: Should not exceed 100 pending items
4. **Ingest Rate**: Monitor for spikes indicating abuse
5. **AI Processing Errors**: Should be < 5% failure rate

### Connection Status
- **Green**: All systems operational
- **Yellow**: Degraded performance or warnings
- **Red**: Critical failure requiring immediate attention

## Emergency Procedures

### Badge Code Shortage
```bash
# Via machine-agent GUI:
1. Navigate to "Badge Codes" tab
2. Select dataset needing codes
3. Enter quantity (recommended: 100)
4. Click "Generate Codes"
```

### Dataset Publication Failure
1. Check Stripe API status
2. Verify INGEST_SECRET is correct
3. Review edge function logs for errors
4. Manually retry via Admin panel

### Data Processing Backlog
1. Check Lovable AI quota status
2. Review processing queue for errors
3. Reprocess failed submissions manually
4. Scale up processing if needed

### Rate Limit Hit
1. Identify source IP from logs
2. Review audit logs for pattern
3. Temporarily ban if abuse detected
4. Adjust rate limits if legitimate traffic

## Health Check Commands

### Check Edge Function Status
```bash
# Via browser console or curl:
curl https://your-project.supabase.co/functions/v1/dataset-status?name=test
```

### Verify HMAC Signature
```python
import hmac
import hashlib
import time
import json

secret = "YOUR_INGEST_SECRET"
timestamp = int(time.time())
payload = {"dataset": {"name": "test"}}
message = f"{timestamp}.{json.dumps(payload)}"
signature = hmac.new(secret.encode(), message.encode(), hashlib.sha256).hexdigest()
print(f"X-Ingest-Sign: {signature}")
```

### Test External Ingest
```bash
curl -X POST https://your-project.supabase.co/functions/v1/external-ingest \
  -H "Content-Type: application/json" \
  -H "X-Ingest-Signature: [computed_signature]" \
  -d '{"submissions": [...]}'
```

## Troubleshooting

### Common Issues

**Problem**: Scraper data not appearing in GUI
- **Solution**: Check scraper output file path, verify JSON format

**Problem**: Badge codes not generating
- **Solution**: Check dataset_id exists, verify INGEST_SECRET

**Problem**: AI processing stuck
- **Solution**: Check LOVABLE_API_KEY, review logs for quota errors

**Problem**: Emails not sending
- **Solution**: Verify RESEND_API_KEY, check Resend dashboard

**Problem**: Marketplace not showing datasets
- **Solution**: Verify datasets have active=true and valid Stripe IDs

## Monitoring Dashboards

### Supabase Dashboard
- Monitor database queries
- Review RLS policy hits
- Check storage usage

### Stripe Dashboard
- Review payment success rates
- Monitor dispute rates
- Check product/price catalog

### Resend Dashboard
- Email delivery rates
- Bounce/complaint rates
- Domain reputation

### Machine Agent GUI
- Real-time scraper status
- Badge inventory levels
- Dataset automation status

## Escalation Procedures

### Low Priority (Response within 24 hours)
- Minor UI bugs
- Non-critical documentation updates
- Feature requests

### Medium Priority (Response within 4 hours)
- Badge code shortage warnings
- Degraded scraper performance
- Email delivery issues

### High Priority (Response within 1 hour)
- Database connection failures
- Payment processing errors
- Security policy violations
- Data leak or breach suspected

### Critical Priority (Immediate response)
- Complete system outage
- Confirmed security breach
- Data integrity compromised
- Legal/compliance violation
