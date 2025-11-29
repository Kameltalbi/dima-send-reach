# Email Queue System - Complete Documentation

## Overview

This is a production-ready email queue system that enables sending large volumes of emails (50,000+) with:
- **Batch processing** - Queue processes 200 emails per batch
- **Rate limiting** - Max 3 emails per second (330ms delay between sends)
- **Automatic retries** - Up to 3 attempts for failed emails
- **No duplicate sends** - Row-level locking prevents double-processing
- **Status tracking** - Real-time tracking of pending/sending/sent/error states
- **Error handling** - Detailed error logging and reporting

## Architecture

```
Campaign Creation → Enqueue Emails → Cron Job → Process Queue → Send via Resend
                    (email_queue)     (1 min)    (200/batch)    (3/second)
```

## Database Schema

### Table: `email_queue`

```sql
CREATE TABLE public.email_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE,
  recipient_id uuid REFERENCES campaign_recipients(id) ON DELETE CASCADE,
  to_email text NOT NULL,
  from_name text NOT NULL,
  from_email text NOT NULL,
  subject text NOT NULL,
  html text NOT NULL,
  status text NOT NULL DEFAULT 'pending',  -- pending, sending, sent, error
  attempts integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  sent_at timestamp with time zone,
  error_message text,
  locked_at timestamp with time zone,
  locked_by text
);

-- Indexes for performance
CREATE INDEX idx_email_queue_status_created 
  ON email_queue(status, created_at) WHERE status = 'pending';
CREATE INDEX idx_email_queue_campaign ON email_queue(campaign_id);
CREATE INDEX idx_email_queue_recipient ON email_queue(recipient_id);
```

## Components

### 1. Enqueue Email API (`enqueue-email`)

**Purpose**: Accept individual emails and add them to the queue

**Endpoint**: `POST /functions/v1/enqueue-email`

**Request Body**:
```json
{
  "campaignId": "uuid",
  "recipientId": "uuid",  // optional
  "to": "user@example.com",
  "fromName": "Sender Name",
  "fromEmail": "sender@domain.com",
  "subject": "Email Subject",
  "html": "<html>...</html>"
}
```

**Response**:
```json
{
  "success": true,
  "queueId": "uuid",
  "message": "Email queued successfully"
}
```

### 2. Queue Processor (`process-email-queue`)

**Purpose**: Process queued emails in batches with rate limiting

**Triggered by**: Cron job (every 1 minute)

**Process**:
1. Cleans up stale locks (older than 5 minutes)
2. Fetches up to 200 pending emails
3. Locks each email atomically to prevent duplicates
4. Sends via Resend API
5. Updates status (sent/error)
6. Retries failed emails (max 3 attempts)
7. Enforces 330ms delay between emails (~3/second)

**Response**:
```json
{
  "success": true,
  "workerId": "uuid",
  "processed": 200,
  "sent": 198,
  "errors": 2,
  "duration": "67340ms",
  "errorDetails": [...]
}
```

### 3. Send Email Function (`send-email`)

**Purpose**: Validate, prepare, and queue campaign emails

**Modified behavior**: Instead of sending directly, it now:
1. Validates email addresses
2. Checks quota limits
3. Detects bounce risks
4. Adds tracking pixels and links
5. **Queues emails** in `email_queue` table
6. Sets campaign status to "en_cours" (in progress)

## Setup Instructions

### Step 1: Enable pg_cron Extension

Run this SQL to enable the cron extension:

```sql
-- Enable pg_cron extension (run once)
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

### Step 2: Set Up Cron Job

The cron job runs every minute and processes the queue:

```sql
-- Schedule the email queue processor to run every minute
SELECT cron.schedule(
  'process-email-queue',
  '* * * * *',  -- Every minute
  $$
  SELECT net.http_post(
    url := 'https://myrrgvflilxguuucikyq.supabase.co/functions/v1/process-email-queue',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15cnJndmZsaWx4Z3V1dWNpa3lxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3ODgyMDQsImV4cCI6MjA3ODM2NDIwNH0.cPJhFFw5714UDZ2W5iPl6z4dTMdujNFrgDunxZHW_lc"}'::jsonb,
    body := '{}'::jsonb
  ) as request_id;
  $$
);
```

### Step 3: Verify Cron Job

```sql
-- List all scheduled cron jobs
SELECT * FROM cron.job;

-- View cron job execution history
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 10;
```

### Step 4: Manual Testing

You can manually trigger the queue processor:

```bash
curl -X POST https://myrrgvflilxguuucikyq.supabase.co/functions/v1/process-email-queue \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

## Monitoring & Management

### Check Queue Status

```sql
-- View queue statistics
SELECT 
  status,
  COUNT(*) as count,
  MIN(created_at) as oldest,
  MAX(created_at) as newest
FROM email_queue
GROUP BY status;

-- View failed emails
SELECT 
  to_email,
  subject,
  attempts,
  error_message,
  created_at
FROM email_queue
WHERE status = 'error'
ORDER BY created_at DESC
LIMIT 20;

-- View emails in progress
SELECT 
  to_email,
  subject,
  locked_by,
  locked_at,
  EXTRACT(EPOCH FROM (NOW() - locked_at)) as seconds_locked
FROM email_queue
WHERE status = 'sending'
ORDER BY locked_at DESC;
```

### Retry Failed Emails

```sql
-- Reset failed emails with fewer than 3 attempts
UPDATE email_queue
SET status = 'pending', locked_at = NULL, locked_by = NULL
WHERE status = 'error' AND attempts < 3;
```

### Clear Old Sent Emails

```sql
-- Archive or delete emails older than 30 days
DELETE FROM email_queue
WHERE status = 'sent' 
AND sent_at < NOW() - INTERVAL '30 days';
```

### Cancel Pending Campaign

```sql
-- Cancel all pending emails for a specific campaign
UPDATE email_queue
SET status = 'error', error_message = 'Campaign cancelled'
WHERE campaign_id = 'YOUR_CAMPAIGN_ID'
AND status = 'pending';
```

## Performance Metrics

### Expected Throughput

- **Rate**: 3 emails per second
- **Per minute**: 180 emails
- **Per hour**: 10,800 emails
- **50,000 emails**: ~4.6 hours
- **100,000 emails**: ~9.3 hours

### Optimization Tips

1. **Increase batch size** (line 9 in `process-email-queue/index.ts`):
   ```typescript
   const BATCH_SIZE = 500; // Process more per run
   ```

2. **Adjust rate limit** (line 10):
   ```typescript
   const RATE_LIMIT_DELAY_MS = 200; // 5 emails/second
   ```

3. **Run cron more frequently** (cron schedule):
   ```sql
   '*/30 * * * * *'  -- Every 30 seconds instead of 1 minute
   ```

## Troubleshooting

### Problem: Emails stuck in "sending"

**Cause**: Worker crashed mid-processing

**Solution**: Stale locks are auto-cleared after 5 minutes. To force clear:
```sql
UPDATE email_queue
SET status = 'pending', locked_at = NULL, locked_by = NULL
WHERE status = 'sending';
```

### Problem: High error rate

**Check**:
1. Resend API limits (free tier: 100 emails/day, paid: 50k/month)
2. Domain verification in Resend
3. Error messages in `email_queue.error_message`

### Problem: Cron not running

**Check**:
```sql
SELECT * FROM cron.job WHERE jobname = 'process-email-queue';
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 5;
```

## Security Notes

- Edge functions use `SUPABASE_SERVICE_ROLE_KEY` for queue operations
- RLS policies prevent users from viewing other users' queued emails
- Locked rows prevent duplicate sends even with concurrent workers
- All tracking links and pixels are injected server-side

## API Integration Example

```typescript
// Queue a single email
const { data, error } = await supabase.functions.invoke('enqueue-email', {
  body: {
    campaignId: 'campaign-uuid',
    recipientId: 'recipient-uuid',
    to: 'user@example.com',
    fromName: 'Company Name',
    fromEmail: 'hello@company.com',
    subject: 'Newsletter',
    html: '<html>Email content</html>'
  }
});

// Check queue status for a campaign
const { data: queueStatus } = await supabase
  .from('email_queue')
  .select('status, COUNT(*)')
  .eq('campaign_id', 'campaign-uuid')
  .group('status');
```

## Production Checklist

- [ ] pg_cron extension enabled
- [ ] Cron job scheduled and running
- [ ] Resend API key configured
- [ ] Resend domain verified
- [ ] Queue monitoring dashboard set up
- [ ] Error alerting configured
- [ ] Old emails cleanup scheduled
- [ ] Rate limits tested and verified

## Support

For issues or questions:
1. Check `email_queue` table for error messages
2. Review cron job execution logs
3. Monitor edge function logs in Lovable Cloud dashboard
