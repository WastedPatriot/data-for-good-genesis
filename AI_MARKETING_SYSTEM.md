# AI Marketing System - Complete Guide

## Overview

DataForEarth's AI Marketing System automates B2B outreach to potential partners through intelligent company research, personalized email generation, and secure campaign management.

## System Architecture

```
┌─────────────────────┐
│   Admin Dashboard   │
│  (React Frontend)   │
└──────────┬──────────┘
           │
           ├──────────────────────────────────────┐
           │                                      │
           v                                      v
┌──────────────────────┐           ┌──────────────────────────┐
│  AI Marketing        │           │  Batch Campaign          │
│  Assistant           │           │  Generator               │
│  (Chat Interface)    │           │  (Automated)             │
└──────────┬───────────┘           └───────────┬──────────────┘
           │                                   │
           v                                   v
┌──────────────────────────────────────────────────────────┐
│            AI Engine (Lovable AI - Gemini Pro)          │
│  • Company Research   • Email Generation                 │
│  • Personalization    • Quality Analysis                 │
└───────────────────────┬──────────────────────────────────┘
                        │
                        v
┌──────────────────────────────────────────────────────────┐
│              Campaign Database (Supabase)                │
│  marketing_campaigns table                               │
│  • Status tracking    • Email content                    │
│  • Research data      • Delivery logs                    │
└───────────────────────┬──────────────────────────────────┘
                        │
                        v
┌──────────────────────────────────────────────────────────┐
│              Email Delivery (Resend)                     │
│  • From: hello@dataforearth.org                          │
│  • Rate limited: 1 email/second                          │
│  • Delivery tracking & error handling                    │
└──────────────────────────────────────────────────────────┘
```

## Core Components

### 1. AI Marketing Assistant (`ai-marketing-assistant`)

**Location**: `supabase/functions/ai-marketing-assistant/index.ts`

**Capabilities**:
- Interactive AI chat for campaign planning
- Company research via conversational interface
- Email drafting with personalization
- Campaign approval workflow
- Test email functionality

**Actions**:
- `chat`: Conversational AI interaction
- `send_test_email`: Verify email configuration
- `approve_campaign`: Send approved campaign

**Usage Example**:
```javascript
const { data, error } = await supabase.functions.invoke("ai-marketing-assistant", {
  body: {
    action: "chat",
    messages: [
      { role: "user", content: "Research 5 companies in renewable energy" }
    ]
  }
});
```

### 2. Batch Campaign Generator (`generate-marketing-campaigns`)

**Location**: `supabase/functions/generate-marketing-campaigns/index.ts`

**Purpose**: Fully automated campaign generation at scale

**Process**:
1. **Research Phase**: AI researches companies matching criteria
2. **Analysis Phase**: Evaluates company fit and initiatives
3. **Generation Phase**: Creates personalized emails
4. **Storage Phase**: Saves campaigns for admin review

**Parameters**:
- `industry`: Target industry (e.g., "renewable energy", "electric vehicles")
- `count`: Number of campaigns to generate (1-20)
- `keywords`: Filtering keywords (default: ["sustainability", "ESG", "climate data"])

**Example**:
```javascript
const { data, error } = await supabase.functions.invoke("generate-marketing-campaigns", {
  body: {
    industry: "renewable energy",
    count: 10,
    keywords: ["sustainability", "carbon reduction", "clean energy"]
  }
});

// Returns:
{
  success: true,
  campaigns_created: 10,
  campaigns: [
    { id: "uuid", company: "Acme Solar", email: "partnerships@acme.com" }
  ]
}
```

### 3. Batch Email Sender (`send-marketing-batch`)

**Location**: `supabase/functions/send-marketing-batch/index.ts`

**Purpose**: Sends multiple approved campaigns with rate limiting

**Features**:
- Rate limiting: 1 email per second
- Error handling per campaign
- Delivery status tracking
- Audit logging

**Parameters**:
- `campaign_ids`: Array of campaign IDs to send

**Example**:
```javascript
const { data, error } = await supabase.functions.invoke("send-marketing-batch", {
  body: {
    campaign_ids: ["uuid-1", "uuid-2", "uuid-3"]
  }
});

// Returns:
{
  success: true,
  sent: 3,
  failed: 0,
  results: {
    sent: ["uuid-1", "uuid-2", "uuid-3"],
    failed: []
  }
}
```

## Admin Interface

### Location
`src/components/admin/AIMarketingAssistant.tsx`

### Tabs

#### 1. AI Chat
- Conversational interface for campaign management
- Natural language commands
- Real-time campaign creation
- Research assistance

**Example Commands**:
- "Research 5 companies in carbon capture technology"
- "Draft an email to Tesla about our ESG data products"
- "Find potential partners in the renewable energy sector"

#### 2. Batch Generate
- Industry selection
- Campaign count configuration
- Automated research and generation
- Progress tracking

**Workflow**:
1. Enter target industry
2. Set number of campaigns
3. Click "Generate Campaigns"
4. AI researches and creates personalized emails
5. Review in Campaigns tab

#### 3. Campaigns
- View all generated campaigns
- Filter by status
- Bulk selection for sending
- Individual approve/reject
- Campaign details and research data

**Statuses**:
- `pending_approval`: Ready for review
- `sent`: Successfully delivered
- `failed`: Delivery failed
- `draft`: Work in progress

#### 4. Test Email
- Verify email configuration
- Test deliverability
- Check sender authentication

## Campaign Database Schema

```sql
CREATE TABLE marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  email TEXT NOT NULL,
  email_content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_approval',
  research_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id)
);

-- Research data structure:
{
  "company": {
    "name": "Acme Corp",
    "website": "https://acme.com",
    "email": "partnerships@acme.com",
    "contact_role": "Head of Sustainability",
    "fit_reason": "Active carbon reduction program"
  },
  "subject": "Partnership Opportunity with DataForEarth",
  "ai_generated": true,
  "industry": "renewable energy",
  "source": "automated_generation",
  "timestamp": "2025-01-01T00:00:00Z"
}
```

## Email Configuration

### Sender Settings
- **From**: `DataForEarth <hello@dataforearth.org>`
- **Reply-To**: `hello@dataforearth.org`
- **Service**: Resend (configured via `RESEND_API_KEY`)

### Rate Limiting
- **Batch Sending**: 1 email per second
- **AI Generation**: Managed by Lovable AI quotas
- **Test Emails**: No specific limit

### Required Environment Variables
```bash
RESEND_API_KEY=re_xxx           # Resend API key
LOVABLE_API_KEY=xxx             # Auto-configured
ADMIN_EMAIL=hello@dataforearth.org  # Sender email
```

## AI Models Used

### Research & Generation: `google/gemini-2.5-pro`
- **Why**: Superior research capabilities and context understanding
- **Usage**: Company research, market analysis
- **Cost**: Higher cost per request, but better quality

### Email Writing: `google/gemini-2.5-flash`
- **Why**: Fast, cost-effective, high-quality writing
- **Usage**: Email content generation
- **Cost**: Lower cost, optimized for text generation

## Security & Compliance

### Admin-Only Access
- All marketing functions require admin role
- User authentication verified via JWT
- Audit logging for all actions

### Approval Workflow
1. AI generates campaigns
2. Admin reviews content
3. Manual approval required
4. Email sent with tracking
5. Delivery status logged

### Rate Limiting & Abuse Prevention
- 1 email per second max send rate
- AI quotas prevent excessive generation
- Failed delivery tracking
- Automatic retry prevention

### Privacy & Data Handling
- No personal data stored without consent
- Company information from public sources only
- Email addresses verified before outreach
- Opt-out handling (manual for now)

## Getting Started

### 1. Initial Setup
```javascript
// Test email configuration
await supabase.functions.invoke("ai-marketing-assistant", {
  body: {
    action: "send_test_email",
    test_email: "your@email.com"
  }
});
```

### 2. Generate First Campaigns
```javascript
// Generate 5 campaigns in target industry
await supabase.functions.invoke("generate-marketing-campaigns", {
  body: {
    industry: "clean energy",
    count: 5
  }
});
```

### 3. Review & Approve
Navigate to Admin Dashboard → AI Marketing Assistant → Campaigns tab
- Review generated emails
- Check company research
- Approve individually or in bulk

### 4. Send Campaigns
- Select campaigns to send
- Click "Send Selected"
- Monitor delivery status
- Track responses in Communications Center

## Best Practices

### Campaign Generation
1. **Target Specific Industries**: Be specific (e.g., "electric vehicle charging" vs "technology")
2. **Start Small**: Generate 5-10 campaigns first to assess quality
3. **Review Research**: Check AI's company research before approving
4. **Personalization Matters**: Ensure emails reference specific company initiatives

### Email Quality
- **Length**: Keep emails 150-250 words
- **Personalization**: Reference specific company work
- **Value Prop**: Clear benefit for the recipient
- **Call to Action**: Demo, call, or meeting request
- **Professional Tone**: Data-driven, not salesy

### Approval Workflow
1. Read full email content
2. Verify company fit
3. Check contact email validity
4. Ensure personalization quality
5. Approve or regenerate

### Monitoring
- Check delivery status regularly
- Review failed sends for patterns
- Monitor response rates
- Adjust industry targeting based on results

## Troubleshooting

### Email Not Sending
**Issue**: Campaigns stuck in "pending_approval"
**Solution**:
1. Check RESEND_API_KEY is configured
2. Verify ADMIN_EMAIL is valid
3. Test with `send_test_email` action
4. Check Resend dashboard for errors

### AI Generation Failing
**Issue**: Batch generation returns errors
**Solution**:
1. Check LOVABLE_API_KEY is configured
2. Verify AI credits available
3. Reduce batch count
4. Check rate limits in AI Systems Guide

### Poor Email Quality
**Issue**: Generated emails are too generic
**Solution**:
1. Use more specific industry names
2. Add relevant keywords
3. Try gemini-2.5-pro for research
4. Manually edit before sending

### Company Research Issues
**Issue**: AI returns invalid companies
**Solution**:
1. Be more specific with industry
2. Add geographic filters
3. Reduce count for higher quality
4. Review research_data before approving

## Metrics & Analytics

Track these key metrics in `audit_logs`:

### Generation Metrics
- Campaigns generated per day
- Average generation time
- AI model usage costs
- Quality score trends

### Delivery Metrics
- Email send success rate
- Delivery failures by type
- Time to approval
- Batch send efficiency

### Engagement Metrics
- Open rates (via external tracking)
- Response rates
- Meeting bookings
- Partnership conversions

## Future Enhancements

### Planned Features
- [ ] Response tracking integration
- [ ] A/B testing for email templates
- [ ] Geographic targeting
- [ ] Company size filtering
- [ ] Auto-follow-up sequences
- [ ] CRM integration
- [ ] Email template library
- [ ] Sentiment analysis on responses

### AI Improvements
- [ ] Multi-language support
- [ ] Industry-specific models
- [ ] Competitive intelligence
- [ ] Contact finder enhancement
- [ ] Email warming strategies

## Support

For issues or questions:
1. Check logs in Admin → System Logs
2. Review audit trail in Admin → Audit Logs
3. Test email configuration first
4. Contact development team with error details

## References

- [AI Systems Guide](./AI_SYSTEMS_GUIDE.md)
- [Developer Guide](./DEVELOPER_GUIDE.md)
- [Resend Documentation](https://resend.com/docs)
- [Lovable AI Documentation](https://docs.lovable.dev/features/ai)
