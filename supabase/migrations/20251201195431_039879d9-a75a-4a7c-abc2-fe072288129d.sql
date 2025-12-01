-- Ajouter la colonne contact_limit à subscriptions si elle n'existe pas
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS contact_limit INTEGER DEFAULT NULL;

-- Créer la table automations
CREATE TABLE IF NOT EXISTS public.automations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nom TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL DEFAULT 'contact_added',
  trigger_config JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT false,
  last_run_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Créer la table automation_steps
CREATE TABLE IF NOT EXISTS public.automation_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  automation_id UUID NOT NULL REFERENCES public.automations(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL DEFAULT 1,
  step_type TEXT NOT NULL DEFAULT 'send_email',
  step_config JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_steps ENABLE ROW LEVEL SECURITY;

-- RLS policies for automations
CREATE POLICY "Users can view their automations" ON public.automations
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their automations" ON public.automations
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their automations" ON public.automations
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their automations" ON public.automations
FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for automation_steps
CREATE POLICY "Users can view steps of their automations" ON public.automation_steps
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.automations WHERE automations.id = automation_steps.automation_id AND automations.user_id = auth.uid())
);

CREATE POLICY "Users can create steps for their automations" ON public.automation_steps
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.automations WHERE automations.id = automation_steps.automation_id AND automations.user_id = auth.uid())
);

CREATE POLICY "Users can update steps of their automations" ON public.automation_steps
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.automations WHERE automations.id = automation_steps.automation_id AND automations.user_id = auth.uid())
);

CREATE POLICY "Users can delete steps of their automations" ON public.automation_steps
FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.automations WHERE automations.id = automation_steps.automation_id AND automations.user_id = auth.uid())
);

-- Trigger pour updated_at
CREATE TRIGGER update_automations_updated_at
BEFORE UPDATE ON public.automations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Mettre à jour contact_limit selon les plans
UPDATE public.subscriptions SET contact_limit = NULL WHERE plan_type IN ('pro', 'enterprise', 'business', 'essential', 'starter');
UPDATE public.subscriptions SET contact_limit = 1000 WHERE plan_type = 'free';