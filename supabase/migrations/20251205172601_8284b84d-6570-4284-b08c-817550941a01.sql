-- Créer la table unsubscribe_preferences
CREATE TABLE public.unsubscribe_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  unsubscribe_all BOOLEAN NOT NULL DEFAULT false,
  preferences JSONB DEFAULT '{}'::jsonb,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS
ALTER TABLE public.unsubscribe_preferences ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre l'insertion publique (depuis l'edge function avec service role)
CREATE POLICY "Service can manage unsubscribe_preferences"
ON public.unsubscribe_preferences
FOR ALL
USING (true)
WITH CHECK (true);

-- Index pour les recherches rapides
CREATE INDEX idx_unsubscribe_preferences_contact_id ON public.unsubscribe_preferences(contact_id);
CREATE INDEX idx_unsubscribe_preferences_email ON public.unsubscribe_preferences(email);