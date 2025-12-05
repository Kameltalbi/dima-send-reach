-- Migration: Sections de mail sauvegardées
-- Description: Permet aux utilisateurs de sauvegarder des sections de mail pour les réutiliser

CREATE TABLE IF NOT EXISTS public.saved_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  description TEXT,
  html_content TEXT NOT NULL,
  preview_image_url TEXT, -- URL d'une image de prévisualisation (optionnelle)
  category TEXT DEFAULT 'general', -- Catégorie de la section (header, footer, content, etc.)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_saved_sections_user_id ON public.saved_sections(user_id);
CREATE INDEX idx_saved_sections_category ON public.saved_sections(category);

ALTER TABLE public.saved_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs peuvent voir leurs sections sauvegardées"
ON public.saved_sections FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent créer leurs sections sauvegardées"
ON public.saved_sections FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent modifier leurs sections sauvegardées"
ON public.saved_sections FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent supprimer leurs sections sauvegardées"
ON public.saved_sections FOR DELETE
USING (auth.uid() = user_id);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_saved_sections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_saved_sections_updated_at
BEFORE UPDATE ON public.saved_sections
FOR EACH ROW
EXECUTE FUNCTION update_saved_sections_updated_at();

