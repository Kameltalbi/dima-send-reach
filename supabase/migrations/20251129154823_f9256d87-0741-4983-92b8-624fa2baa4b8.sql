-- Créer l'enum pour les rôles d'organisation
CREATE TYPE public.organization_role AS ENUM ('admin', 'user');

-- Ajouter le champ role dans profiles (par défaut 'user')
ALTER TABLE public.profiles 
ADD COLUMN organization_role public.organization_role NOT NULL DEFAULT 'user';

-- Créer la table des permissions utilisateurs
CREATE TABLE public.user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  permission TEXT NOT NULL,
  granted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, organization_id, permission)
);

-- Activer RLS sur user_permissions
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- Les admins d'organisation peuvent voir et gérer les permissions de leur org
CREATE POLICY "Admins org peuvent voir permissions de leur org"
ON public.user_permissions FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles 
    WHERE id = auth.uid() AND organization_role = 'admin'
  )
);

CREATE POLICY "Admins org peuvent créer permissions"
ON public.user_permissions FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.profiles 
    WHERE id = auth.uid() AND organization_role = 'admin'
  )
);

CREATE POLICY "Admins org peuvent supprimer permissions"
ON public.user_permissions FOR DELETE
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles 
    WHERE id = auth.uid() AND organization_role = 'admin'
  )
);

-- Les utilisateurs peuvent voir leurs propres permissions
CREATE POLICY "Users peuvent voir leurs permissions"
ON public.user_permissions FOR SELECT
USING (user_id = auth.uid());

-- Fonction pour vérifier si un utilisateur est admin de son organisation
CREATE OR REPLACE FUNCTION public.is_org_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id
    AND organization_role = 'admin'
  )
$$;

-- Fonction pour vérifier si un utilisateur a une permission spécifique
CREATE OR REPLACE FUNCTION public.has_permission(_user_id UUID, _permission TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- L'utilisateur est admin de son org (toutes permissions)
    SELECT 1 FROM public.profiles
    WHERE id = _user_id AND organization_role = 'admin'
  ) OR EXISTS (
    -- L'utilisateur a la permission spécifique
    SELECT 1 FROM public.user_permissions
    WHERE user_id = _user_id AND permission = _permission
  )
$$;

-- Mettre à jour les policies de contacts pour la suppression
DROP POLICY IF EXISTS "Les utilisateurs peuvent supprimer leurs contacts" ON public.contacts;
CREATE POLICY "Les utilisateurs avec permission peuvent supprimer contacts"
ON public.contacts FOR DELETE
USING (
  user_id = auth.uid() AND 
  public.has_permission(auth.uid(), 'delete_contacts')
);

-- Mettre à jour les policies de lists pour la suppression
DROP POLICY IF EXISTS "Les utilisateurs peuvent supprimer leurs listes" ON public.lists;
CREATE POLICY "Les utilisateurs avec permission peuvent supprimer listes"
ON public.lists FOR DELETE
USING (
  user_id = auth.uid() AND 
  public.has_permission(auth.uid(), 'manage_lists')
);

-- Mettre à jour les policies de lists pour la modification
DROP POLICY IF EXISTS "Les utilisateurs peuvent modifier leurs listes" ON public.lists;
CREATE POLICY "Les utilisateurs avec permission peuvent modifier listes"
ON public.lists FOR UPDATE
USING (
  user_id = auth.uid() AND 
  public.has_permission(auth.uid(), 'manage_lists')
);

-- Mettre à jour les policies de campaigns pour la suppression
DROP POLICY IF EXISTS "Les utilisateurs peuvent supprimer leurs campagnes" ON public.campaigns;
CREATE POLICY "Les utilisateurs avec permission peuvent supprimer campagnes"
ON public.campaigns FOR DELETE
USING (
  user_id = auth.uid() AND 
  public.has_permission(auth.uid(), 'manage_campaigns')
);

-- Définir le premier utilisateur d'une organisation comme admin
-- (Trigger sur profiles pour détecter le premier utilisateur)
CREATE OR REPLACE FUNCTION public.set_first_user_as_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Si c'est le premier utilisateur de l'organisation, le mettre admin
  IF NEW.organization_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE organization_id = NEW.organization_id 
      AND id != NEW.id
    ) THEN
      NEW.organization_role = 'admin';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_first_user_admin
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_first_user_as_admin();