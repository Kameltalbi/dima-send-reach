-- Migration: Batch Email Sending System
-- This migration adds support for batch email sending with automatic contact selection
-- and duplicate prevention across multiple send rounds

-- Table to track each contact that has received a campaign (for batch sending)
CREATE TABLE IF NOT EXISTS public.campaign_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'pending')),
  batch_number INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(campaign_id, contact_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaign_sends_campaign_id ON public.campaign_sends(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_sends_contact_id ON public.campaign_sends(contact_id);
CREATE INDEX IF NOT EXISTS idx_campaign_sends_status ON public.campaign_sends(status);
CREATE INDEX IF NOT EXISTS idx_campaign_sends_campaign_contact ON public.campaign_sends(campaign_id, contact_id);

-- Enable RLS
ALTER TABLE public.campaign_sends ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view campaign sends for their campaigns"
  ON public.campaign_sends FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.campaigns
    WHERE campaigns.id = campaign_sends.campaign_id
    AND campaigns.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert campaign sends for their campaigns"
  ON public.campaign_sends FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.campaigns
    WHERE campaigns.id = campaign_sends.campaign_id
    AND campaigns.user_id = auth.uid()
  ));

CREATE POLICY "Users can update campaign sends for their campaigns"
  ON public.campaign_sends FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.campaigns
    WHERE campaigns.id = campaign_sends.campaign_id
    AND campaigns.user_id = auth.uid()
  ));

-- Function: Get remaining contacts for a campaign
-- Returns all contacts in a list that have NOT been sent the campaign yet
CREATE OR REPLACE FUNCTION public.get_remaining_contacts(
  p_list_id UUID,
  p_campaign_id UUID
)
RETURNS TABLE (
  contact_id UUID,
  email TEXT,
  nom TEXT,
  prenom TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id AS contact_id,
    c.email,
    c.nom,
    c.prenom
  FROM public.contacts c
  INNER JOIN public.list_contacts lc ON c.id = lc.contact_id
  WHERE lc.list_id = p_list_id
    AND c.id NOT IN (
      SELECT cs.contact_id
      FROM public.campaign_sends cs
      WHERE cs.campaign_id = p_campaign_id
        AND cs.status = 'sent'
    )
  ORDER BY c.email;
END;
$$;

-- Function: Get count of remaining contacts
CREATE OR REPLACE FUNCTION public.get_remaining_contacts_count(
  p_list_id UUID,
  p_campaign_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.contacts c
  INNER JOIN public.list_contacts lc ON c.id = lc.contact_id
  WHERE lc.list_id = p_list_id
    AND c.id NOT IN (
      SELECT cs.contact_id
      FROM public.campaign_sends cs
      WHERE cs.campaign_id = p_campaign_id
        AND cs.status = 'sent'
    );
  
  RETURN v_count;
END;
$$;

-- Function: Get count of already sent contacts
CREATE OR REPLACE FUNCTION public.get_sent_contacts_count(
  p_list_id UUID,
  p_campaign_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.campaign_sends cs
  INNER JOIN public.list_contacts lc ON cs.contact_id = lc.contact_id
  WHERE lc.list_id = p_list_id
    AND cs.campaign_id = p_campaign_id
    AND cs.status = 'sent';
  
  RETURN v_count;
END;
$$;

-- Function: Get total contacts in list
CREATE OR REPLACE FUNCTION public.get_total_contacts_in_list(
  p_list_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.list_contacts
  WHERE list_id = p_list_id;
  
  RETURN v_count;
END;
$$;

-- Function: Pick random subset of contacts
-- This function randomly selects contacts from the remaining ones
CREATE OR REPLACE FUNCTION public.pick_random_contacts(
  p_list_id UUID,
  p_campaign_id UUID,
  p_limit INTEGER
)
RETURNS TABLE (
  contact_id UUID,
  email TEXT,
  nom TEXT,
  prenom TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id AS contact_id,
    c.email,
    c.nom,
    c.prenom
  FROM public.contacts c
  INNER JOIN public.list_contacts lc ON c.id = lc.contact_id
  WHERE lc.list_id = p_list_id
    AND c.id NOT IN (
      SELECT cs.contact_id
      FROM public.campaign_sends cs
      WHERE cs.campaign_id = p_campaign_id
        AND cs.status = 'sent'
    )
  ORDER BY RANDOM()
  LIMIT p_limit;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_remaining_contacts(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_remaining_contacts_count(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_sent_contacts_count(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_total_contacts_in_list(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.pick_random_contacts(UUID, UUID, INTEGER) TO authenticated;

