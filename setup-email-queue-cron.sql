-- ============================================
-- Email Queue System - Cron Job Setup
-- ============================================
-- This SQL file sets up the cron job to process
-- the email queue every minute
-- ============================================

-- 1. Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Schedule the email queue processor to run every minute
SELECT cron.schedule(
  'process-email-queue',           -- Job name
  '* * * * *',                      -- Every minute (cron format)
  $$
  SELECT net.http_post(
    url := 'https://myrrgvflilxguuucikyq.supabase.co/functions/v1/process-email-queue',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15cnJndmZsaWx4Z3V1dWNpa3lxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3ODgyMDQsImV4cCI6MjA3ODM2NDIwNH0.cPJhFFw5714UDZ2W5iPl6z4dTMdujNFrgDunxZHW_lc"}'::jsonb,
    body := '{}'::jsonb
  ) as request_id;
  $$
);

-- 3. Verify the cron job was created
SELECT 
  jobid,
  jobname,
  schedule,
  active,
  command
FROM cron.job
WHERE jobname = 'process-email-queue';

-- ============================================
-- Management Commands
-- ============================================

-- View cron job execution history (last 10 runs)
-- SELECT * FROM cron.job_run_details 
-- WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'process-email-queue')
-- ORDER BY start_time DESC 
-- LIMIT 10;

-- Disable the cron job (run if needed)
-- SELECT cron.unschedule('process-email-queue');

-- Re-enable after changes (run if needed)
-- SELECT cron.schedule(
--   'process-email-queue',
--   '* * * * *',
--   $$ [same command as above] $$
-- );

-- ============================================
-- Cron Schedule Examples
-- ============================================
-- Every minute:     '* * * * *'
-- Every 2 minutes:  '*/2 * * * *'
-- Every 5 minutes:  '*/5 * * * *'
-- Every 30 seconds: '*/30 * * * * *'  (if pg_cron supports seconds)
-- ============================================