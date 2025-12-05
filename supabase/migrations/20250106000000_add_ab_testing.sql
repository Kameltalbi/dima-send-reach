-- Migration pour ajouter le support du test A/B

-- Ajouter des champs à la table campaigns pour le test A/B
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS is_ab_test BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ab_test_type TEXT CHECK (ab_test_type IN ('subject', 'content', 'both')) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ab_test_percentage INTEGER DEFAULT 20 CHECK (ab_test_percentage >= 10 AND ab_test_percentage <= 50),
ADD COLUMN IF NOT EXISTS ab_test_duration_hours INTEGER DEFAULT 24 CHECK (ab_test_duration_hours >= 1 AND ab_test_duration_hours <= 168),
ADD COLUMN IF NOT EXISTS ab_test_status TEXT CHECK (ab_test_status IN ('testing', 'completed', 'winner_selected', 'sent')) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ab_test_winner_variant_id UUID DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ab_test_started_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ab_test_completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Table pour stocker les variantes A/B
CREATE TABLE IF NOT EXISTS public.campaign_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  variant_name TEXT NOT NULL DEFAULT 'A',
  sujet_email TEXT NOT NULL,
  html_contenu TEXT,
  total_sent INTEGER DEFAULT 0,
  total_opened INTEGER DEFAULT 0,
  total_clicked INTEGER DEFAULT 0,
  open_rate DECIMAL(5,2) DEFAULT 0,
  click_rate DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(campaign_id, variant_name)
);

CREATE INDEX idx_campaign_variants_campaign_id ON public.campaign_variants(campaign_id);

ALTER TABLE public.campaign_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs peuvent voir les variantes de leurs campagnes"
  ON public.campaign_variants FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.campaigns
    WHERE campaigns.id = campaign_variants.campaign_id
    AND campaigns.user_id = auth.uid()
  ));

CREATE POLICY "Les utilisateurs peuvent créer des variantes pour leurs campagnes"
  ON public.campaign_variants FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.campaigns
    WHERE campaigns.id = campaign_variants.campaign_id
    AND campaigns.user_id = auth.uid()
  ));

CREATE POLICY "Les utilisateurs peuvent modifier les variantes de leurs campagnes"
  ON public.campaign_variants FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.campaigns
    WHERE campaigns.id = campaign_variants.campaign_id
    AND campaigns.user_id = auth.uid()
  ));

CREATE POLICY "Les utilisateurs peuvent supprimer les variantes de leurs campagnes"
  ON public.campaign_variants FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.campaigns
    WHERE campaigns.id = campaign_variants.campaign_id
    AND campaigns.user_id = auth.uid()
  ));

-- Table pour lier les destinataires aux variantes
ALTER TABLE public.campaign_recipients
ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES public.campaign_variants(id) ON DELETE SET NULL;

CREATE INDEX idx_campaign_recipients_variant_id ON public.campaign_recipients(variant_id);

