-- Créer l'enum pour les rôles
CREATE TYPE public.app_role AS ENUM ('superadmin', 'user');

-- Créer la table user_roles
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Activer RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Politique : les utilisateurs peuvent voir leurs propres rôles
CREATE POLICY "Les utilisateurs peuvent voir leurs propres rôles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Créer une fonction sécurisée pour vérifier les rôles (évite la récursion RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Créer une fonction helper pour vérifier si l'utilisateur courant est superadmin
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'superadmin'::app_role)
$$;

-- Supprimer d'abord les anciennes politiques
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leur config SES" ON public.ses_config;
DROP POLICY IF EXISTS "Les utilisateurs peuvent créer leur config SES" ON public.ses_config;
DROP POLICY IF EXISTS "Les utilisateurs peuvent modifier leur config SES" ON public.ses_config;

-- Maintenant on peut modifier la table ses_config
ALTER TABLE public.ses_config DROP COLUMN user_id;
ALTER TABLE public.ses_config ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;

-- Nouvelles politiques : seuls les superadmins peuvent gérer SES
CREATE POLICY "Seuls les superadmins peuvent voir la config SES"
ON public.ses_config
FOR SELECT
TO authenticated
USING (public.is_superadmin());

CREATE POLICY "Seuls les superadmins peuvent créer la config SES"
ON public.ses_config
FOR INSERT
TO authenticated
WITH CHECK (public.is_superadmin());

CREATE POLICY "Seuls les superadmins peuvent modifier la config SES"
ON public.ses_config
FOR UPDATE
TO authenticated
USING (public.is_superadmin());

CREATE POLICY "Seuls les superadmins peuvent supprimer la config SES"
ON public.ses_config
FOR DELETE
TO authenticated
USING (public.is_superadmin());