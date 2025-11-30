-- Ajouter la colonne contact_limit à la table subscriptions
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS contact_limit INTEGER;

-- Définir les limites par défaut selon le plan_type
UPDATE public.subscriptions
SET contact_limit = CASE
  WHEN plan_type = 'free' THEN 500
  WHEN plan_type = 'starter' THEN 2000
  WHEN plan_type = 'essential' THEN 10000
  WHEN plan_type = 'pro' THEN 50000
  WHEN plan_type = 'business' THEN NULL -- NULL = illimité
  ELSE 500 -- Par défaut pour les anciens plans
END
WHERE contact_limit IS NULL;

-- Définir une valeur par défaut pour les nouvelles subscriptions
ALTER TABLE public.subscriptions
ALTER COLUMN contact_limit SET DEFAULT 500;

-- Créer une fonction pour vérifier le quota de contacts
CREATE OR REPLACE FUNCTION public.check_contact_quota(
  p_user_id UUID,
  p_contact_count INTEGER DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_organization_id UUID;
  v_subscription RECORD;
  v_current_count INTEGER;
  v_limit INTEGER;
  v_remaining INTEGER;
BEGIN
  -- Récupérer l'organization_id de l'utilisateur
  SELECT organization_id INTO v_organization_id
  FROM public.profiles
  WHERE id = p_user_id;

  IF v_organization_id IS NULL THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'Aucune organisation associée à votre compte'
    );
  END IF;

  -- Récupérer la subscription active
  SELECT * INTO v_subscription
  FROM public.subscriptions
  WHERE organization_id = v_organization_id
    AND statut = 'active'
  ORDER BY date_debut DESC
  LIMIT 1;

  IF v_subscription IS NULL THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'Aucun abonnement actif trouvé'
    );
  END IF;

  -- Si contact_limit est NULL, c'est illimité
  IF v_subscription.contact_limit IS NULL THEN
    RETURN jsonb_build_object(
      'allowed', true,
      'limit', NULL,
      'used', 0,
      'remaining', NULL
    );
  END IF;

  v_limit := v_subscription.contact_limit;

  -- Compter les contacts actuels de l'utilisateur
  SELECT COUNT(*) INTO v_current_count
  FROM public.contacts
  WHERE user_id = p_user_id;

  v_remaining := GREATEST(0, v_limit - v_current_count);

  -- Vérifier si le quota est suffisant
  IF v_current_count + p_contact_count > v_limit THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', format('Quota de contacts insuffisant. Limite: %s, Actuels: %s, Restant: %s, Demandé: %s', 
        v_limit, v_current_count, v_remaining, p_contact_count),
      'limit', v_limit,
      'used', v_current_count,
      'remaining', v_remaining
    );
  END IF;

  RETURN jsonb_build_object(
    'allowed', true,
    'limit', v_limit,
    'used', v_current_count,
    'remaining', v_remaining
  );
END;
$$;

-- Créer une fonction pour obtenir le quota de contacts
CREATE OR REPLACE FUNCTION public.get_contact_quota(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_organization_id UUID;
  v_subscription RECORD;
  v_current_count INTEGER;
BEGIN
  -- Récupérer l'organization_id de l'utilisateur
  SELECT organization_id INTO v_organization_id
  FROM public.profiles
  WHERE id = p_user_id;

  IF v_organization_id IS NULL THEN
    RETURN jsonb_build_object(
      'limit', NULL,
      'used', 0,
      'remaining', NULL
    );
  END IF;

  -- Récupérer la subscription active
  SELECT * INTO v_subscription
  FROM public.subscriptions
  WHERE organization_id = v_organization_id
    AND statut = 'active'
  ORDER BY date_debut DESC
  LIMIT 1;

  IF v_subscription IS NULL THEN
    RETURN jsonb_build_object(
      'limit', NULL,
      'used', 0,
      'remaining', NULL
    );
  END IF;

  -- Compter les contacts actuels
  SELECT COUNT(*) INTO v_current_count
  FROM public.contacts
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object(
    'limit', v_subscription.contact_limit,
    'used', v_current_count,
    'remaining', CASE 
      WHEN v_subscription.contact_limit IS NULL THEN NULL
      ELSE GREATEST(0, v_subscription.contact_limit - v_current_count)
    END
  );
END;
$$;

