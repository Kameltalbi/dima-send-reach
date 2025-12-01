-- Créer la table bounces
CREATE TABLE IF NOT EXISTS public.bounces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  bounce_type TEXT NOT NULL DEFAULT 'unknown',
  bounce_reason TEXT,
  bounce_code TEXT,
  bounce_message TEXT,
  source TEXT DEFAULT 'resend',
  is_processed BOOLEAN NOT NULL DEFAULT false,
  processed_at TIMESTAMP WITH TIME ZONE,
  action_taken TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Créer la table segments
CREATE TABLE IF NOT EXISTS public.segments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nom TEXT NOT NULL,
  description TEXT,
  criteria JSONB DEFAULT '{}',
  contact_count INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Créer la table automation_executions (référencée dans process-automations)
CREATE TABLE IF NOT EXISTS public.automation_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  automation_id UUID NOT NULL REFERENCES public.automations(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  current_step INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending',
  next_execution_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Ajouter colonnes manquantes à automations si nécessaire
ALTER TABLE public.automations 
ADD COLUMN IF NOT EXISTS total_sent INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_opened INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_clicked INTEGER DEFAULT 0;

-- Enable RLS
ALTER TABLE public.bounces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_executions ENABLE ROW LEVEL SECURITY;

-- RLS policies for bounces
CREATE POLICY "Users can view their bounces" ON public.bounces
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create bounces" ON public.bounces
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their bounces" ON public.bounces
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their bounces" ON public.bounces
FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for segments
CREATE POLICY "Users can view their segments" ON public.segments
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their segments" ON public.segments
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their segments" ON public.segments
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their segments" ON public.segments
FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for automation_executions
CREATE POLICY "Users can view their automation executions" ON public.automation_executions
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.automations WHERE automations.id = automation_executions.automation_id AND automations.user_id = auth.uid())
);

CREATE POLICY "Users can create automation executions" ON public.automation_executions
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.automations WHERE automations.id = automation_executions.automation_id AND automations.user_id = auth.uid())
);

CREATE POLICY "Users can update their automation executions" ON public.automation_executions
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.automations WHERE automations.id = automation_executions.automation_id AND automations.user_id = auth.uid())
);

-- Trigger pour updated_at sur segments
CREATE TRIGGER update_segments_updated_at
BEFORE UPDATE ON public.segments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Fonction pour obtenir les stats des bounces
CREATE OR REPLACE FUNCTION public.get_bounce_stats(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total INTEGER;
  v_hard INTEGER;
  v_soft INTEGER;
  v_complaints INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total FROM public.bounces WHERE user_id = p_user_id;
  SELECT COUNT(*) INTO v_hard FROM public.bounces WHERE user_id = p_user_id AND bounce_type = 'hard';
  SELECT COUNT(*) INTO v_soft FROM public.bounces WHERE user_id = p_user_id AND bounce_type = 'soft';
  SELECT COUNT(*) INTO v_complaints FROM public.bounces WHERE user_id = p_user_id AND bounce_type = 'complaint';

  RETURN jsonb_build_object(
    'total', v_total,
    'hard', v_hard,
    'soft', v_soft,
    'complaints', v_complaints
  );
END;
$$;

-- Fonction pour traiter les bounces
CREATE OR REPLACE FUNCTION public.process_bounce(p_contact_id UUID, p_bounce_type TEXT, p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Pour les hard bounces, marquer le contact comme inactif
  IF p_bounce_type = 'hard' OR p_bounce_type = 'complaint' THEN
    UPDATE public.contacts
    SET statut = 'inactif'
    WHERE id = p_contact_id AND user_id = p_user_id;
  END IF;
END;
$$;