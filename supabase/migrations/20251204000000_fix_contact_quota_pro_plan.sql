-- Mettre à jour la fonction get_contact_quota pour mieux gérer les plans pro (illimités)
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

  -- Si pas d'organization_id, retourner un quota illimité par défaut
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

  -- Si pas de subscription active, retourner un quota illimité par défaut
  -- (pour permettre l'accès même si la subscription n'est pas trouvée)
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

  -- Retourner le quota
  -- Si contact_limit est NULL, c'est illimité (plans pro et autres)
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

-- S'assurer que les plans pro ont contact_limit = NULL (illimité)
UPDATE public.subscriptions
SET contact_limit = NULL
WHERE plan_type IN ('pro', 'enterprise', 'business', 'essential', 'starter')
  AND contact_limit IS NOT NULL;

-- Garder uniquement la limite pour le plan Free (1000 contacts)
UPDATE public.subscriptions
SET contact_limit = 1000
WHERE plan_type = 'free'
  AND (contact_limit IS NULL OR contact_limit != 1000);

