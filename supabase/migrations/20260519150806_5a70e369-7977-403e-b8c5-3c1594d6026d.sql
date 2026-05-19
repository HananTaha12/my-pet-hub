
CREATE TABLE public.loyalty_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  points integer NOT NULL,
  reason text NOT NULL,
  order_id uuid,
  appointment_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX loyalty_user_idx ON public.loyalty_transactions(user_id, created_at DESC);
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY loyalty_owner_all ON public.loyalty_transactions FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
