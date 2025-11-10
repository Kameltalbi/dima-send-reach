-- Créer la table des templates
CREATE TABLE public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'newsletter' CHECK (type IN ('newsletter', 'promotion', 'annonce', 'autre')),
  content_html TEXT,
  content_json JSONB,
  thumbnail_url TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- Policies pour templates - Les utilisateurs peuvent voir leurs templates
CREATE POLICY "Les utilisateurs peuvent voir leurs templates"
ON public.templates
FOR SELECT
USING (auth.uid() = user_id OR is_public = true);

-- Les utilisateurs peuvent créer leurs templates
CREATE POLICY "Les utilisateurs peuvent créer leurs templates"
ON public.templates
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent modifier leurs templates
CREATE POLICY "Les utilisateurs peuvent modifier leurs templates"
ON public.templates
FOR UPDATE
USING (auth.uid() = user_id);

-- Les utilisateurs peuvent supprimer leurs templates
CREATE POLICY "Les utilisateurs peuvent supprimer leurs templates"
ON public.templates
FOR DELETE
USING (auth.uid() = user_id);

-- Superadmins ont tous les droits
CREATE POLICY "Les superadmins peuvent tout faire sur templates"
ON public.templates
FOR ALL
USING (public.is_superadmin())
WITH CHECK (public.is_superadmin());

-- Trigger pour updated_at
CREATE TRIGGER update_templates_updated_at
BEFORE UPDATE ON public.templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index pour améliorer les performances
CREATE INDEX idx_templates_user_id ON public.templates(user_id);
CREATE INDEX idx_templates_type ON public.templates(type);
CREATE INDEX idx_templates_is_public ON public.templates(is_public);