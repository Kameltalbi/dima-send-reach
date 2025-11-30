-- Migration: Système d'Automatisations et Segmentation
-- Description: Ajoute les tables pour les workflows d'automatisation et la segmentation avancée

-- Table des segments sauvegardés
CREATE TABLE IF NOT EXISTS public.segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  description TEXT,
  criteria JSONB NOT NULL, -- Critères de segmentation (filtres)
  contact_count INTEGER DEFAULT 0, -- Nombre de contacts dans le segment (mis à jour périodiquement)
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_segments_user_id ON public.segments(user_id);
CREATE INDEX idx_segments_active ON public.segments(is_active) WHERE is_active = true;

ALTER TABLE public.segments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs peuvent voir leurs segments"
ON public.segments FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent créer leurs segments"
ON public.segments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent modifier leurs segments"
ON public.segments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent supprimer leurs segments"
ON public.segments FOR DELETE
USING (auth.uid() = user_id);

-- Table des automatisations/workflows
CREATE TABLE IF NOT EXISTS public.automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN (
    'contact_added',
    'contact_subscribed',
    'contact_unsubscribed',
    'campaign_opened',
    'campaign_clicked',
    'date_based',
    'tag_added',
    'list_added',
    'custom'
  )),
  trigger_config JSONB, -- Configuration du déclencheur (ex: liste_id, tag, date)
  is_active BOOLEAN NOT NULL DEFAULT true,
  total_sent INTEGER DEFAULT 0,
  total_opened INTEGER DEFAULT 0,
  total_clicked INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_automations_user_id ON public.automations(user_id);
CREATE INDEX idx_automations_active ON public.automations(is_active) WHERE is_active = true;
CREATE INDEX idx_automations_trigger ON public.automations(trigger_type);

ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs peuvent voir leurs automatisations"
ON public.automations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent créer leurs automatisations"
ON public.automations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent modifier leurs automatisations"
ON public.automations FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent supprimer leurs automatisations"
ON public.automations FOR DELETE
USING (auth.uid() = user_id);

-- Table des étapes d'automatisation
CREATE TABLE IF NOT EXISTS public.automation_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID NOT NULL REFERENCES public.automations(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL, -- Ordre d'exécution (1, 2, 3...)
  step_type TEXT NOT NULL CHECK (step_type IN (
    'send_email',
    'wait',
    'condition',
    'add_tag',
    'remove_tag',
    'add_to_list',
    'remove_from_list',
    'update_field'
  )),
  step_config JSONB NOT NULL, -- Configuration de l'étape (template_id, delay, conditions, etc.)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_automation_steps_automation_id ON public.automation_steps(automation_id);
CREATE INDEX idx_automation_steps_order ON public.automation_steps(automation_id, step_order);

ALTER TABLE public.automation_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs peuvent voir les étapes de leurs automatisations"
ON public.automation_steps FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.automations
  WHERE automations.id = automation_steps.automation_id
  AND automations.user_id = auth.uid()
));

CREATE POLICY "Les utilisateurs peuvent créer des étapes pour leurs automatisations"
ON public.automation_steps FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.automations
  WHERE automations.id = automation_steps.automation_id
  AND automations.user_id = auth.uid()
));

CREATE POLICY "Les utilisateurs peuvent modifier les étapes de leurs automatisations"
ON public.automation_steps FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.automations
  WHERE automations.id = automation_steps.automation_id
  AND automations.user_id = auth.uid()
));

CREATE POLICY "Les utilisateurs peuvent supprimer les étapes de leurs automatisations"
ON public.automation_steps FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.automations
  WHERE automations.id = automation_steps.automation_id
  AND automations.user_id = auth.uid()
));

-- Table des exécutions d'automatisation (pour suivre les workflows en cours)
CREATE TABLE IF NOT EXISTS public.automation_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID NOT NULL REFERENCES public.automations(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  current_step INTEGER NOT NULL DEFAULT 1, -- Étape actuelle
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'paused', 'cancelled')),
  next_execution_at TIMESTAMP WITH TIME ZONE, -- Prochaine exécution programmée
  completed_at TIMESTAMP WITH TIME ZONE,
  execution_data JSONB, -- Données de l'exécution (variables, résultats, etc.)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(automation_id, contact_id, status) WHERE status IN ('pending', 'running')
);

CREATE INDEX idx_automation_executions_automation ON public.automation_executions(automation_id);
CREATE INDEX idx_automation_executions_contact ON public.automation_executions(contact_id);
CREATE INDEX idx_automation_executions_status ON public.automation_executions(status);
CREATE INDEX idx_automation_executions_next_execution ON public.automation_executions(next_execution_at) WHERE status = 'pending';

ALTER TABLE public.automation_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs peuvent voir les exécutions de leurs automatisations"
ON public.automation_executions FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.automations
  WHERE automations.id = automation_executions.automation_id
  AND automations.user_id = auth.uid()
));

-- Table des tags pour les contacts (pour segmentation et automatisation)
CREATE TABLE IF NOT EXISTS public.contact_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6', -- Couleur du tag
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, nom)
);

CREATE INDEX idx_contact_tags_user_id ON public.contact_tags(user_id);

ALTER TABLE public.contact_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs peuvent voir leurs tags"
ON public.contact_tags FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent créer leurs tags"
ON public.contact_tags FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent modifier leurs tags"
ON public.contact_tags FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent supprimer leurs tags"
ON public.contact_tags FOR DELETE
USING (auth.uid() = user_id);

-- Table de liaison contacts-tags
CREATE TABLE IF NOT EXISTS public.contact_tag_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.contact_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(contact_id, tag_id)
);

CREATE INDEX idx_contact_tag_assignments_contact ON public.contact_tag_assignments(contact_id);
CREATE INDEX idx_contact_tag_assignments_tag ON public.contact_tag_assignments(tag_id);

ALTER TABLE public.contact_tag_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs peuvent voir les tags de leurs contacts"
ON public.contact_tag_assignments FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.contacts
  WHERE contacts.id = contact_tag_assignments.contact_id
  AND contacts.user_id = auth.uid()
));

CREATE POLICY "Les utilisateurs peuvent assigner des tags à leurs contacts"
ON public.contact_tag_assignments FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.contacts
  WHERE contacts.id = contact_tag_assignments.contact_id
  AND contacts.user_id = auth.uid()
));

CREATE POLICY "Les utilisateurs peuvent retirer des tags de leurs contacts"
ON public.contact_tag_assignments FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.contacts
  WHERE contacts.id = contact_tag_assignments.contact_id
  AND contacts.user_id = auth.uid()
));

-- Fonction pour calculer le nombre de contacts dans un segment
CREATE OR REPLACE FUNCTION public.calculate_segment_count(p_segment_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
  v_criteria JSONB;
  v_user_id UUID;
BEGIN
  -- Récupérer les critères et user_id du segment
  SELECT criteria, user_id INTO v_criteria, v_user_id
  FROM public.segments
  WHERE id = p_segment_id;
  
  IF v_criteria IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Construire la requête dynamique basée sur les critères
  -- Cette fonction sera appelée périodiquement pour mettre à jour le count
  -- Pour l'instant, retourner 0 (sera implémenté dans le code TypeScript)
  RETURN 0;
END;
$$;

-- Fonction pour obtenir les contacts d'un segment
CREATE OR REPLACE FUNCTION public.get_segment_contacts(
  p_segment_id UUID,
  p_limit INTEGER DEFAULT 1000,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  contact_id UUID,
  email TEXT,
  nom TEXT,
  prenom TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_criteria JSONB;
  v_user_id UUID;
BEGIN
  -- Récupérer les critères et user_id
  SELECT criteria, user_id INTO v_criteria, v_user_id
  FROM public.segments
  WHERE id = p_segment_id;
  
  IF v_criteria IS NULL THEN
    RETURN;
  END IF;
  
  -- Cette fonction sera complétée dans le code TypeScript
  -- pour construire dynamiquement la requête selon les critères
  RETURN;
END;
$$;

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_segments_updated_at
BEFORE UPDATE ON public.segments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_automations_updated_at
BEFORE UPDATE ON public.automations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_automation_executions_updated_at
BEFORE UPDATE ON public.automation_executions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Commentaires
COMMENT ON TABLE public.segments IS 'Segments sauvegardés pour la segmentation avancée des contacts';
COMMENT ON TABLE public.automations IS 'Workflows d''automatisation d''emails';
COMMENT ON TABLE public.automation_steps IS 'Étapes d''un workflow d''automatisation';
COMMENT ON TABLE public.automation_executions IS 'Exécutions en cours des workflows d''automatisation';
COMMENT ON TABLE public.contact_tags IS 'Tags personnalisés pour catégoriser les contacts';
COMMENT ON TABLE public.contact_tag_assignments IS 'Assignation de tags aux contacts';

