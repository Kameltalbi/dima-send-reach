-- Migration: Système de warming pour emails
-- Description: Ajoute un système de warming progressif pour limiter les volumes d'envoi initiaux

-- Table pour tracker le warming par organisation
CREATE TABLE IF NOT EXISTS public.email_warming (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  domain TEXT, -- Domaine d'envoi (optionnel, pour warming par domaine)
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  current_day INTEGER NOT NULL DEFAULT 1, -- Jour actuel du warming (1-42)
  max_emails_today INTEGER NOT NULL DEFAULT 50, -- Limite max pour aujourd'hui
  total_emails_sent INTEGER NOT NULL DEFAULT 0, -- Total envoyé depuis le début
  is_active BOOLEAN NOT NULL DEFAULT true, -- Si false, le warming est désactivé
  warming_completed_at TIMESTAMP WITH TIME ZONE, -- Date de fin du warming
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, domain)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_email_warming_org ON public.email_warming(organization_id);
CREATE INDEX IF NOT EXISTS idx_email_warming_active ON public.email_warming(is_active) WHERE is_active = true;

-- Activer RLS
ALTER TABLE public.email_warming ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent voir le warming de leur organisation
CREATE POLICY "Les utilisateurs peuvent voir le warming de leur organisation"
ON public.email_warming
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

-- Policy: Les superadmins ont tous les droits
CREATE POLICY "Les superadmins peuvent tout faire sur email_warming"
ON public.email_warming
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND is_superadmin = true
  )
);

-- Fonction pour calculer la limite de warming selon le jour
CREATE OR REPLACE FUNCTION public.get_warming_limit(day_number INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Plan de warming progressif sur 6 semaines (42 jours)
  CASE
    WHEN day_number <= 1 THEN RETURN 50;
    WHEN day_number <= 2 THEN RETURN 75;
    WHEN day_number <= 3 THEN RETURN 100;
    WHEN day_number <= 4 THEN RETURN 150;
    WHEN day_number <= 5 THEN RETURN 200;
    WHEN day_number <= 7 THEN RETURN 300;
    WHEN day_number <= 10 THEN RETURN 500;
    WHEN day_number <= 14 THEN RETURN 1000;
    WHEN day_number <= 21 THEN RETURN 2000;
    WHEN day_number <= 28 THEN RETURN 5000;
    WHEN day_number <= 35 THEN RETURN 10000;
    WHEN day_number <= 42 THEN RETURN 20000;
    ELSE RETURN 50000; -- Après 6 semaines, limite élevée
  END CASE;
END;
$$;

-- Fonction pour obtenir ou créer le warming pour une organisation
CREATE OR REPLACE FUNCTION public.get_or_create_warming(
  p_organization_id UUID,
  p_domain TEXT DEFAULT NULL
)
RETURNS public.email_warming
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_warming public.email_warming;
  v_days_since_start INTEGER;
  v_new_limit INTEGER;
BEGIN
  -- Chercher le warming existant
  SELECT * INTO v_warming
  FROM public.email_warming
  WHERE organization_id = p_organization_id
    AND (
      (domain IS NULL AND p_domain IS NULL) 
      OR (domain = p_domain)
    )
  LIMIT 1;

  -- Si pas de warming, en créer un nouveau
  IF v_warming IS NULL THEN
    INSERT INTO public.email_warming (
      organization_id,
      domain,
      started_at,
      current_day,
      max_emails_today
    ) VALUES (
      p_organization_id,
      p_domain,
      now(),
      1,
      get_warming_limit(1)
    )
    RETURNING * INTO v_warming;
  END IF;

  -- Si le warming est désactivé, retourner sans limite
  IF NOT v_warming.is_active THEN
    RETURN v_warming;
  END IF;

  -- Calculer le nombre de jours depuis le début
  v_days_since_start := EXTRACT(EPOCH FROM (now() - v_warming.started_at)) / 86400;
  v_days_since_start := GREATEST(1, FLOOR(v_days_since_start)::INTEGER);

  -- Si on est à un nouveau jour, mettre à jour
  IF v_days_since_start > v_warming.current_day THEN
    v_new_limit := get_warming_limit(v_days_since_start);
    
    UPDATE public.email_warming
    SET 
      current_day = v_days_since_start,
      max_emails_today = v_new_limit,
      updated_at = now()
    WHERE id = v_warming.id
    RETURNING * INTO v_warming;
  END IF;

  -- Si le warming est terminé (après 42 jours), marquer comme complété
  IF v_days_since_start > 42 AND v_warming.warming_completed_at IS NULL THEN
    UPDATE public.email_warming
    SET 
      warming_completed_at = now(),
      is_active = false,
      updated_at = now()
    WHERE id = v_warming.id
    RETURNING * INTO v_warming;
  END IF;

  RETURN v_warming;
END;
$$;

-- Fonction pour vérifier la limite de warming pour aujourd'hui
CREATE OR REPLACE FUNCTION public.check_warming_limit(
  p_organization_id UUID,
  p_domain TEXT DEFAULT NULL,
  p_email_count INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_warming public.email_warming;
  v_emails_sent_today INTEGER;
  v_limit INTEGER;
  v_allowed BOOLEAN;
BEGIN
  -- Obtenir ou créer le warming
  v_warming := get_or_create_warming(p_organization_id, p_domain);

  -- Si le warming est désactivé ou complété, autoriser
  IF NOT v_warming.is_active OR v_warming.warming_completed_at IS NOT NULL THEN
    RETURN jsonb_build_object(
      'allowed', true,
      'limit', NULL,
      'used', 0,
      'remaining', NULL,
      'is_warming', false
    );
  END IF;

  -- Compter les emails envoyés aujourd'hui pour cette organisation
  SELECT COALESCE(SUM(cs.total_envoyes), 0) INTO v_emails_sent_today
  FROM public.campaigns c
  JOIN public.campaign_stats cs ON cs.campaign_id = c.id
  JOIN public.profiles p ON p.id = c.user_id
  WHERE p.organization_id = p_organization_id
    AND c.statut = 'envoye'
    AND DATE(c.date_envoi) = CURRENT_DATE;

  v_limit := v_warming.max_emails_today;
  v_allowed := (v_emails_sent_today + p_email_count) <= v_limit;

  RETURN jsonb_build_object(
    'allowed', v_allowed,
    'limit', v_limit,
    'used', v_emails_sent_today,
    'remaining', GREATEST(0, v_limit - v_emails_sent_today),
    'is_warming', true,
    'current_day', v_warming.current_day,
    'warming_completed', v_warming.warming_completed_at IS NOT NULL
  );
END;
$$;

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.update_email_warming_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_email_warming_updated_at
BEFORE UPDATE ON public.email_warming
FOR EACH ROW
EXECUTE FUNCTION update_email_warming_updated_at();

-- Commentaires
COMMENT ON TABLE public.email_warming IS 'Système de warming pour limiter progressivement les volumes d''envoi d''emails';
COMMENT ON FUNCTION public.get_warming_limit(INTEGER) IS 'Calcule la limite d''emails selon le jour du warming (1-42 jours)';
COMMENT ON FUNCTION public.get_or_create_warming(UUID, TEXT) IS 'Obtient ou crée un enregistrement de warming pour une organisation';
COMMENT ON FUNCTION public.check_warming_limit(UUID, TEXT, INTEGER) IS 'Vérifie si une organisation peut envoyer un nombre d''emails selon le warming';

