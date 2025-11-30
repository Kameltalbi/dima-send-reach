-- Migration: Gestion des Bounces et Désabonnements Améliorée
-- Description: Ajoute les tables pour gérer les bounces et améliorer les désabonnements

-- Table des bounces
CREATE TABLE IF NOT EXISTS public.bounces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  recipient_id UUID REFERENCES public.campaign_recipients(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  bounce_type TEXT NOT NULL CHECK (bounce_type IN ('hard', 'soft', 'complaint', 'unknown')),
  bounce_reason TEXT,
  bounce_code TEXT,
  bounce_message TEXT,
  source TEXT DEFAULT 'resend', -- 'resend', 'manual', 'system'
  is_processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP WITH TIME ZONE,
  action_taken TEXT, -- 'none', 'removed', 'marked_inactive', 'suppressed'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_bounces_user_id ON public.bounces(user_id);
CREATE INDEX idx_bounces_contact_id ON public.bounces(contact_id);
CREATE INDEX idx_bounces_email ON public.bounces(email);
CREATE INDEX idx_bounces_bounce_type ON public.bounces(bounce_type);
CREATE INDEX idx_bounces_is_processed ON public.bounces(is_processed) WHERE is_processed = false;
CREATE INDEX idx_bounces_created_at ON public.bounces(created_at);

ALTER TABLE public.bounces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs peuvent voir leurs bounces"
ON public.bounces FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent créer des bounces"
ON public.bounces FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent modifier leurs bounces"
ON public.bounces FOR UPDATE
USING (auth.uid() = user_id);

-- Table des préférences de désabonnement
CREATE TABLE IF NOT EXISTS public.unsubscribe_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  unsubscribe_all BOOLEAN DEFAULT false,
  preferences JSONB DEFAULT '{}'::jsonb, -- Préférences par type d'email
  reason TEXT, -- Raison du désabonnement
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(contact_id)
);

CREATE INDEX idx_unsubscribe_preferences_contact_id ON public.unsubscribe_preferences(contact_id);
CREATE INDEX idx_unsubscribe_preferences_user_id ON public.unsubscribe_preferences(user_id);
CREATE INDEX idx_unsubscribe_preferences_email ON public.unsubscribe_preferences(email);

ALTER TABLE public.unsubscribe_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs peuvent voir les préférences de leurs contacts"
ON public.unsubscribe_preferences FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent créer des préférences"
ON public.unsubscribe_preferences FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent modifier les préférences"
ON public.unsubscribe_preferences FOR UPDATE
USING (auth.uid() = user_id);

-- Ajouter une colonne pour compter les bounces dans la table contacts
ALTER TABLE public.contacts
ADD COLUMN IF NOT EXISTS bounce_count INTEGER DEFAULT 0;

ALTER TABLE public.contacts
ADD COLUMN IF NOT EXISTS last_bounce_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.contacts
ADD COLUMN IF NOT EXISTS is_suppressed BOOLEAN DEFAULT false;

CREATE INDEX idx_contacts_bounce_count ON public.contacts(bounce_count);
CREATE INDEX idx_contacts_is_suppressed ON public.contacts(is_suppressed) WHERE is_suppressed = true;

-- Fonction pour traiter automatiquement les bounces
CREATE OR REPLACE FUNCTION public.process_bounce(
  p_contact_id UUID,
  p_bounce_type TEXT,
  p_user_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_bounce_count INTEGER;
  v_max_hard_bounces INTEGER := 3; -- Nombre max de hard bounces avant suppression
BEGIN
  -- Mettre à jour le compteur de bounces
  UPDATE public.contacts
  SET 
    bounce_count = bounce_count + 1,
    last_bounce_at = now()
  WHERE id = p_contact_id AND user_id = p_user_id
  RETURNING bounce_count INTO v_bounce_count;

  -- Si hard bounce et nombre de bounces >= max, supprimer le contact
  IF p_bounce_type = 'hard' AND v_bounce_count >= v_max_hard_bounces THEN
    UPDATE public.contacts
    SET 
      statut = 'erreur',
      is_suppressed = true
    WHERE id = p_contact_id AND user_id = p_user_id;
  END IF;

  -- Si complaint (spam), supprimer immédiatement
  IF p_bounce_type = 'complaint' THEN
    UPDATE public.contacts
    SET 
      statut = 'desabonne',
      is_suppressed = true
    WHERE id = p_contact_id AND user_id = p_user_id;
  END IF;
END;
$$;

-- Fonction pour obtenir les statistiques de bounces
CREATE OR REPLACE FUNCTION public.get_bounce_stats(p_user_id UUID)
RETURNS TABLE (
  total_bounces BIGINT,
  hard_bounces BIGINT,
  soft_bounces BIGINT,
  complaints BIGINT,
  unprocessed_bounces BIGINT,
  suppressed_contacts BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_bounces,
    COUNT(*) FILTER (WHERE bounce_type = 'hard')::BIGINT as hard_bounces,
    COUNT(*) FILTER (WHERE bounce_type = 'soft')::BIGINT as soft_bounces,
    COUNT(*) FILTER (WHERE bounce_type = 'complaint')::BIGINT as complaints,
    COUNT(*) FILTER (WHERE is_processed = false)::BIGINT as unprocessed_bounces,
    (SELECT COUNT(*)::BIGINT FROM public.contacts WHERE user_id = p_user_id AND is_suppressed = true) as suppressed_contacts
  FROM public.bounces
  WHERE user_id = p_user_id;
END;
$$;

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_unsubscribe_preferences_updated_at
BEFORE UPDATE ON public.unsubscribe_preferences
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Commentaires
COMMENT ON TABLE public.bounces IS 'Enregistre tous les bounces d''emails (hard, soft, complaints)';
COMMENT ON TABLE public.unsubscribe_preferences IS 'Préférences de désabonnement des contacts avec options granulaires';
COMMENT ON FUNCTION public.process_bounce IS 'Traite automatiquement un bounce et met à jour le statut du contact';
COMMENT ON FUNCTION public.get_bounce_stats IS 'Retourne les statistiques de bounces pour un utilisateur';

