-- Créer la table des organisations
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  email_contact TEXT NOT NULL,
  statut TEXT NOT NULL DEFAULT 'active' CHECK (statut IN ('active', 'blocked', 'suspended')),
  date_creation TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Créer la table des abonnements
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL DEFAULT 'free' CHECK (plan_type IN ('free', 'starter', 'pro', 'enterprise')),
  statut TEXT NOT NULL DEFAULT 'active' CHECK (statut IN ('active', 'cancelled', 'expired', 'trial')),
  email_limit INTEGER NOT NULL DEFAULT 1000,
  date_debut TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  date_fin TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Ajouter organization_id à la table profiles
ALTER TABLE public.profiles
ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

-- Activer RLS sur organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Activer RLS sur subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies pour organizations - Les utilisateurs peuvent voir leur propre organisation
CREATE POLICY "Les utilisateurs peuvent voir leur organisation"
ON public.organizations
FOR SELECT
USING (
  id IN (
    SELECT organization_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

-- Policies pour organizations - Les superadmins ont tous les droits
CREATE POLICY "Les superadmins peuvent tout faire sur organizations"
ON public.organizations
FOR ALL
USING (public.is_superadmin())
WITH CHECK (public.is_superadmin());

-- Policies pour subscriptions - Les utilisateurs peuvent voir leur abonnement
CREATE POLICY "Les utilisateurs peuvent voir leur abonnement"
ON public.subscriptions
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

-- Policies pour subscriptions - Les superadmins ont tous les droits
CREATE POLICY "Les superadmins peuvent tout faire sur subscriptions"
ON public.subscriptions
FOR ALL
USING (public.is_superadmin())
WITH CHECK (public.is_superadmin());

-- Trigger pour updated_at sur organizations
CREATE TRIGGER update_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger pour updated_at sur subscriptions
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index pour améliorer les performances
CREATE INDEX idx_organizations_statut ON public.organizations(statut);
CREATE INDEX idx_subscriptions_organization_id ON public.subscriptions(organization_id);
CREATE INDEX idx_subscriptions_statut ON public.subscriptions(statut);
CREATE INDEX idx_profiles_organization_id ON public.profiles(organization_id);