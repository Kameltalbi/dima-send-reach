-- Créer une table pour les invitations d'utilisateurs
CREATE TABLE IF NOT EXISTS public.user_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  UNIQUE(email, organization_id)
);

-- Activer RLS
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;

-- Politique pour que les utilisateurs voient les invitations de leur organisation
CREATE POLICY "Les utilisateurs peuvent voir les invitations de leur org"
ON public.user_invitations
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Politique pour créer des invitations (seulement pour les membres de l'org)
CREATE POLICY "Les membres peuvent créer des invitations"
ON public.user_invitations
FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
  AND invited_by = auth.uid()
);

-- Politique pour supprimer des invitations
CREATE POLICY "Les membres peuvent supprimer les invitations"
ON public.user_invitations
FOR DELETE
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Créer une table pour les préférences d'envoi
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  timezone TEXT DEFAULT 'Europe/Paris',
  default_send_hour INTEGER DEFAULT 10,
  enable_tracking BOOLEAN DEFAULT true,
  enable_unsubscribe_link BOOLEAN DEFAULT true,
  notify_on_campaign_sent BOOLEAN DEFAULT true,
  notify_on_high_engagement BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Activer RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Politique pour voir ses propres préférences
CREATE POLICY "Les utilisateurs peuvent voir leurs préférences"
ON public.user_preferences
FOR SELECT
USING (auth.uid() = user_id);

-- Politique pour créer ses préférences
CREATE POLICY "Les utilisateurs peuvent créer leurs préférences"
ON public.user_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Politique pour mettre à jour ses préférences
CREATE POLICY "Les utilisateurs peuvent modifier leurs préférences"
ON public.user_preferences
FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON public.user_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();