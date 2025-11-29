-- Create email_queue table for batch email processing
CREATE TABLE IF NOT EXISTS public.email_queue (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE,
  recipient_id uuid REFERENCES public.campaign_recipients(id) ON DELETE CASCADE,
  to_email text NOT NULL,
  from_name text NOT NULL,
  from_email text NOT NULL,
  subject text NOT NULL,
  html text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'error')),
  attempts integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  sent_at timestamp with time zone,
  error_message text,
  locked_at timestamp with time zone,
  locked_by text
);

-- Index for efficient queue processing
CREATE INDEX idx_email_queue_status_created ON public.email_queue(status, created_at) WHERE status = 'pending';
CREATE INDEX idx_email_queue_campaign ON public.email_queue(campaign_id);
CREATE INDEX idx_email_queue_recipient ON public.email_queue(recipient_id);

-- RLS policies
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

-- Users can view their campaign emails
CREATE POLICY "Users can view their campaign emails"
ON public.email_queue
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.campaigns
    WHERE campaigns.id = email_queue.campaign_id
    AND campaigns.user_id = auth.uid()
  )
);

-- System can insert queue items
CREATE POLICY "System can insert queue items"
ON public.email_queue
FOR INSERT
WITH CHECK (true);

-- System can update queue items
CREATE POLICY "System can update queue items"
ON public.email_queue
FOR UPDATE
USING (true);