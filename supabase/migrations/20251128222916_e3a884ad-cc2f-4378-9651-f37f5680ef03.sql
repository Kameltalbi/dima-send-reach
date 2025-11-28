-- Allow new plan type 'essential' for subscriptions
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_type_check;

ALTER TABLE public.subscriptions
ADD CONSTRAINT subscriptions_plan_type_check
CHECK (plan_type IN ('free', 'starter', 'essential', 'pro', 'enterprise'));
