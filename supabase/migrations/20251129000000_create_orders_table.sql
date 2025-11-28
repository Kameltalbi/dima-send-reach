-- Créer la table des commandes
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('starter', 'essential', 'pro')),
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'DT',
  payment_method TEXT NOT NULL CHECK (payment_method IN ('card', 'check', 'transfer', 'cash')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'pending_manual', 'completed', 'failed', 'cancelled', 'refunded')),
  konnect_payment_id TEXT,
  billing_info JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Politique pour voir ses propres commandes
CREATE POLICY "Les utilisateurs peuvent voir leurs commandes"
ON public.orders
FOR SELECT
USING (auth.uid() = user_id);

-- Politique pour créer des commandes
CREATE POLICY "Les utilisateurs peuvent créer des commandes"
ON public.orders
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Politique pour mettre à jour ses commandes
CREATE POLICY "Les utilisateurs peuvent mettre à jour leurs commandes"
ON public.orders
FOR UPDATE
USING (auth.uid() = user_id);

-- Politique pour les superadmins
CREATE POLICY "Les superadmins peuvent tout faire sur orders"
ON public.orders
FOR ALL
USING (public.is_superadmin())
WITH CHECK (public.is_superadmin());

-- Index pour améliorer les performances
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

