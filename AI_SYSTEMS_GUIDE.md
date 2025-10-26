# AI Systems Integration Guide

## Overview

DataForEarth uses **real production AI systems** powered by Lovable AI (Google Gemini and OpenAI GPT models) for:

1. **AI Marketing Assistant** - Real company research and personalized email drafting
2. **AI Data Curation** - Automated data analysis, categorization, and quality scoring
3. **AI Contact Analysis** - Severity scoring and priority detection for customer communications
4. **Dataset Building** - Intelligent data assembly and pricing recommendations

---

## 1. AI Marketing Assistant

**Location**: `supabase/functions/ai-marketing-assistant/index.ts`

**Model**: `google/gemini-2.5-pro` (upgraded for better research capabilities)

### What It Does (REAL, NOT MOCK):

- Researches companies in specific industries
- Analyzes company websites and initiatives
- Drafts personalized B2B outreach emails
- Creates campaigns with actual company data
- No placeholders or templates - real personalization

### How To Use:

1. Go to Admin Dashboard → AI Marketing tab
2. Ask AI: "Research companies working on renewable energy and draft outreach emails"
3. AI generates campaigns with format: `CAMPAIGN|CompanyName|email@domain.com|EmailContent`
4. Review and approve campaigns before sending
5. Emails sent via Resend from `hello@dataforearth.org`

### Example Flow:

```
User → "Find 3 carbon capture companies and draft partnership emails"
  ↓
AI researches (using Gemini Pro)
  ↓
Creates 3 campaigns with real company data
  ↓
Admin reviews in "Campaigns" tab
  ↓
Approves → Email sent via Resend
  ↓
Logged in audit_logs & conversation_threads
```

### Code Pattern:

```typescript
// Extract campaign from AI response
const campaignMatch = response.match(/CAMPAIGN\|([^|]+)\|([^|]+)\|([\s\S]+?)(?=CAMPAIGN\||$)/);
if (campaignMatch) {
  const [, companyName, email, emailContent] = campaignMatch;
  // Insert into marketing_campaigns table
}
```

---

## 2. AI Data Curation

**Location**: `supabase/functions/ai-curate-data/index.ts`

**Model**: `google/gemini-2.5-flash` (fast, cost-effective for analysis)

### What It Does (REAL AI ANALYSIS):

- Analyzes raw data submissions from review_queue
- Assigns categories (climate, environment, sustainability, etc.)
- Calculates confidence scores (0.0-1.0)
- Determines quality tiers (platinum, gold, silver, bronze)
- Identifies enterprise-grade data
- Extracts domains, sectors, regions
- Suggests pricing tiers

### Quality Tier Logic:

```
Platinum: 95%+ confidence, verified, enterprise-ready
Gold:     85-95% confidence, high quality, reliable
Silver:   75-85% confidence, good quality, needs validation
Bronze:   60-75% confidence, acceptable, requires verification
```

### How To Use:

1. Data flows into `review_queue` (from user submissions or external scrapers)
2. Admin goes to **AI Data Curation** page (`/admin/data-curation`)
3. Click "Curate X Items with AI" for batch processing
4. AI analyzes each item:
   - Reads raw payload
   - Determines category and tags
   - Scores confidence
   - Assigns quality tier
   - Identifies domain/sector
5. Curated data inserted into `curated_pool`
6. Ready for dataset building

### AI Analysis Response:

```json
{
  "category": "climate",
  "tags": ["carbon-emissions", "sensor-data", "real-time"],
  "confidence_score": 0.92,
  "quality_tier": "gold",
  "enterprise_grade": true,
  "domain": "carbon-markets",
  "sector": "energy",
  "region": "north-america",
  "key_insights": "High-quality sensor data with verified provenance",
  "data_type": "sensor",
  "recommended_price_tier": "premium"
}
```

### Batch Processing:

```typescript
// Process up to 10 items at once
const { data } = await supabase.functions.invoke("ai-curate-data", {
  body: { 
    batchMode: true  // Process all pending items
  }
});
```

---

## 3. AI Contact Severity Analysis

**Location**: `supabase/functions/analyze-contact-severity/index.ts`

**Model**: `google/gemini-2.0-flash-exp` (optimized for classification)

### What It Does (REAL AI TRIAGE):

- Analyzes customer contact submissions
- Assigns severity scores (0.0-1.0)
- Determines priority levels (urgent, high, medium, low)
- Detects sentiment (positive, neutral, negative, angry)
- Identifies red flags
- Suggests response times

### Priority Levels:

```
Urgent:  Respond within 1 hour  (legal threats, critical issues)
High:    Respond within 4 hours (complaints, partnership inquiries)
Medium:  Respond within 24 hours (general inquiries, data requests)
Low:     Respond within 3 days (informational questions)
```

### How It Works:

1. User submits contact form
2. Saved to `contact_submissions`
3. Edge function `submit-contact` triggers AI analysis (async)
4. AI analyzes message content, type, organization
5. Results stored in `contact_submissions.ai_analysis`
6. Admin sees prioritized inbox in **Communications Center**

### AI Analysis Response:

```json
{
  "severity_score": 0.85,
  "priority_level": "high",
  "key_insights": "Partnership inquiry from verified organization",
  "sentiment": "positive",
  "requires_immediate_attention": false,
  "suggested_response_time": "within 4 hours",
  "red_flags": [],
  "category_confidence": 0.92
}
```

---

## 4. Communications Center

**Location**: `src/pages/admin/Communications.tsx`

### Features (REAL INBOX/OUTBOX):

- Full conversation threading
- AI-powered severity scoring
- Inbox and outbox tracking via `conversation_threads`
- Multi-sender support (hello@, partnerships@, contact@)
- Real-time updates via Supabase Realtime
- Thread history viewer

### Email Flow:

```
Customer submits contact form
  ↓
Saved to contact_submissions
  ↓
Logged in conversation_threads (direction: "inbound")
  ↓
AI analyzes severity (async)
  ↓
Admin sees in Communications Center (sorted by priority)
  ↓
Admin replies via send-admin-reply
  ↓
Email sent via Resend
  ↓
Logged in conversation_threads (direction: "outbound")
  ↓
Status updated to "responded"
```

### Data Model:

```sql
-- Track all emails (inbound & outbound)
conversation_threads:
  - contact_submission_id (FK)
  - direction (inbound/outbound)
  - from_email
  - to_email
  - subject
  - message
  - sent_at
  - status (sent/delivered/bounced/failed)

-- Track submissions with AI analysis
contact_submissions:
  - ... existing fields ...
  - severity_score (0.0-1.0)
  - priority_level (urgent/high/medium/low)
  - ai_analysis (JSONB)
  - last_response_at
  - response_time_minutes
```

---

## 5. Dataset Building with AI

**Location**: `supabase/functions/build-dataset-from-curated/index.ts`

### Current Implementation:

- Pulls from `curated_pool` (already AI-curated data)
- Filters by category, quality tier, confidence
- Creates Stripe products and prices
- Assembles datasets ready for marketplace

### Future Enhancement (Recommended):

Add AI-powered dataset optimization:

```typescript
// Call AI to optimize dataset composition
const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
  body: JSON.stringify({
    model: "google/gemini-2.5-flash",
    messages: [{
      role: "system",
      content: `Analyze this curated data and suggest:
        - Optimal dataset composition
        - Recommended pricing based on quality mix
        - Target market segments
        - Unique selling points`
    }]
  })
});
```

---

## Error Handling

### Rate Limits (429):

```typescript
if (aiResponse.status === 429) {
  return new Response(
    JSON.stringify({ error: "AI rate limit exceeded, please try again later" }),
    { status: 429 }
  );
}
```

### Credits Exhausted (402):

```typescript
if (aiResponse.status === 402) {
  return new Response(
    JSON.stringify({ error: "AI credits exhausted, please add funds" }),
    { status: 402 }
  );
}
```

### Display to Users:

```typescript
// Frontend must handle these errors
if (error.status === 429) {
  toast.error("AI service rate limited. Please wait a moment.");
}
if (error.status === 402) {
  toast.error("AI credits depleted. Admin must add funds.");
}
```

---

## Testing

### 1. Test AI Marketing:

```bash
# Via Admin UI
1. Go to /admin
2. Click "AI Marketing" tab
3. Type: "Research a solar energy company and draft an email"
4. Verify AI creates real campaign (not mock)
5. Check marketing_campaigns table
```

### 2. Test AI Curation:

```bash
# Via Admin UI
1. Submit test data via /submit-data
2. Go to /admin/data-curation
3. Click "Curate X Items with AI"
4. Verify items appear in curated_pool
5. Check AI analysis fields (category, confidence_score, quality_tier)
```

### 3. Test Contact Severity:

```bash
# Via Contact Form
1. Submit contact form at /contact
2. Go to /admin/communications
3. Verify severity_score and priority_level are set
4. Check ai_analysis field in contact_submissions
```

---

## Production Checklist

✅ **AI Services**:
- [ ] Lovable AI API key configured (`LOVABLE_API_KEY` in Supabase secrets)
- [ ] Rate limit handling in place
- [ ] Error messages user-friendly
- [ ] Audit logs for AI actions

✅ **Email System**:
- [ ] Resend API key configured (`RESEND_API_KEY`)
- [ ] Domain verified in Resend (dataforearth.org)
- [ ] SPF, DKIM, DMARC records set
- [ ] Test emails sent successfully

✅ **Database**:
- [ ] All tables have RLS policies
- [ ] Indexes on high-query columns
- [ ] conversation_threads populated
- [ ] curated_pool growing from AI

✅ **Admin Access**:
- [ ] All admin routes require authentication
- [ ] Role verification enforced
- [ ] Audit logs capturing actions

---

## Cost Management

### Lovable AI Pricing:

- Free tier: 1000 requests/month
- Paid: Pay-as-you-go after free tier
- Monitor usage: Settings → Workspace → Usage

### Model Selection:

```
Expensive → Cheap:
google/gemini-2.5-pro    (research, complex reasoning)
google/gemini-2.5-flash  (default, most tasks)
google/gemini-2.5-flash-lite (simple classification)
```

### Optimization Tips:

1. Use `gemini-2.5-flash` as default
2. Reserve `pro` for complex research
3. Batch operations when possible
4. Cache AI results in database
5. Set reasonable token limits

---

## Debugging

### View AI Responses:

```typescript
console.log("AI Response:", aiData.choices[0].message.content);
```

### Check Edge Function Logs:

```bash
# In Lovable IDE
1. Go to Backend (database icon)
2. Click "Edge Functions"
3. Select function
4. View logs tab
```

### Verify AI Analysis:

```sql
-- Check AI-curated items
SELECT id, category, confidence_score, quality_tier, 
       curated_payload->'ai_analysis' as ai_analysis
FROM curated_pool
ORDER BY created_at DESC
LIMIT 10;

-- Check contact severity scoring
SELECT id, subject, severity_score, priority_level, 
       ai_analysis
FROM contact_submissions
WHERE ai_analysis IS NOT NULL
ORDER BY severity_score DESC
LIMIT 10;
```

---

## Support

- **Lovable AI Docs**: https://docs.lovable.dev/features/ai
- **Gemini API**: https://ai.google.dev/gemini-api/docs
- **Rate Limits**: Contact support@lovable.dev
- **Resend Docs**: https://resend.com/docs

---

## Summary

**This is a REAL AI-powered production system, not mock data:**

✅ AI Marketing drafts real personalized emails
✅ AI Curation analyzes and scores data intelligently  
✅ AI Contact Analysis prioritizes support tickets
✅ All emails tracked in inbox/outbox threading
✅ Comprehensive audit logging
✅ Production-ready error handling
✅ Future developer documentation in place

**Next Steps for Future Developers:**

1. Read this guide thoroughly
2. Review edge function code with inline comments
3. Test each AI system via admin UI
4. Monitor Lovable AI usage in workspace settings
5. Add funds to workspace when free tier depleted
6. Scale up as needed for production traffic