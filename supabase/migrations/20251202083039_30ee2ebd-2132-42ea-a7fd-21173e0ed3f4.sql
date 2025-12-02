-- Table pour les tests A/B
CREATE TABLE public.ab_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  test_type TEXT NOT NULL DEFAULT 'subject', -- 'subject', 'content', 'send_time'
  variant_a_subject TEXT,
  variant_a_content TEXT,
  variant_b_subject TEXT,
  variant_b_content TEXT,
  variant_a_send_time TIMESTAMP WITH TIME ZONE,
  variant_b_send_time TIMESTAMP WITH TIME ZONE,
  test_percentage INTEGER NOT NULL DEFAULT 20, -- % des contacts pour le test
  winning_criteria TEXT NOT NULL DEFAULT 'open_rate', -- 'open_rate', 'click_rate'
  test_duration_hours INTEGER NOT NULL DEFAULT 4, -- Durée avant sélection du gagnant
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'testing', 'completed'
  winner TEXT, -- 'A', 'B', ou null
  variant_a_sent INTEGER DEFAULT 0,
  variant_a_opens INTEGER DEFAULT 0,
  variant_a_clicks INTEGER DEFAULT 0,
  variant_b_sent INTEGER DEFAULT 0,
  variant_b_opens INTEGER DEFAULT 0,
  variant_b_clicks INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Ajouter une colonne pour lier les recipients à une variante A/B
ALTER TABLE public.campaign_recipients ADD COLUMN IF NOT EXISTS ab_variant TEXT;

-- Activer RLS
ALTER TABLE public.ab_tests ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
CREATE POLICY "Users can view their ab_tests" ON public.ab_tests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their ab_tests" ON public.ab_tests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their ab_tests" ON public.ab_tests
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their ab_tests" ON public.ab_tests
  FOR DELETE USING (auth.uid() = user_id);

-- Index pour performance
CREATE INDEX idx_ab_tests_campaign_id ON public.ab_tests(campaign_id);
CREATE INDEX idx_ab_tests_user_id ON public.ab_tests(user_id);
CREATE INDEX idx_ab_tests_status ON public.ab_tests(status);
CREATE INDEX idx_campaign_recipients_ab_variant ON public.campaign_recipients(ab_variant);

-- Trigger pour updated_at
CREATE TRIGGER update_ab_tests_updated_at
  BEFORE UPDATE ON public.ab_tests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();