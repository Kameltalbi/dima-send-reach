-- Create orders table for tracking subscription payments
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'DT',
  payment_method TEXT NOT NULL CHECK (payment_method IN ('card', 'check', 'transfer', 'cash')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'cancelled', 'failed')),
  konnect_payment_id TEXT,
  billing_info JSONB,
  notes TEXT,
  validated_by UUID,
  validated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Users can view their own orders
CREATE POLICY "Users can view their own orders"
ON public.orders
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create orders
CREATE POLICY "Users can create orders"
ON public.orders
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Superadmins can view all orders
CREATE POLICY "Superadmins can view all orders"
ON public.orders
FOR SELECT
USING (is_superadmin());

-- Superadmins can update orders (for validation)
CREATE POLICY "Superadmins can update orders"
ON public.orders
FOR UPDATE
USING (is_superadmin());

-- Superadmins can delete orders
CREATE POLICY "Superadmins can delete orders"
ON public.orders
FOR DELETE
USING (is_superadmin());

-- Create index for performance
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_organization_id ON public.orders(organization_id);
CREATE INDEX idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);

-- Create trigger for updated_at
CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();