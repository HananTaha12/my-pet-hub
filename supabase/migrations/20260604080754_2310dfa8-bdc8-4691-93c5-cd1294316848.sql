
-- 1. Move staff_notes off appointments into a staff-only table
CREATE TABLE IF NOT EXISTS public.appointment_staff_notes (
  appointment_id uuid PRIMARY KEY REFERENCES public.appointments(id) ON DELETE CASCADE,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointment_staff_notes TO authenticated;
GRANT ALL ON public.appointment_staff_notes TO service_role;

ALTER TABLE public.appointment_staff_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_notes_staff_all" ON public.appointment_staff_notes
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

-- Migrate existing data
INSERT INTO public.appointment_staff_notes (appointment_id, notes)
SELECT id, staff_notes FROM public.appointments WHERE staff_notes IS NOT NULL
ON CONFLICT (appointment_id) DO NOTHING;

ALTER TABLE public.appointments DROP COLUMN staff_notes;

CREATE TRIGGER appointment_staff_notes_touch_updated
  BEFORE UPDATE ON public.appointment_staff_notes
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 2. Restrict loyalty_transactions writes to service_role only
DROP POLICY IF EXISTS loyalty_owner_all ON public.loyalty_transactions;
CREATE POLICY loyalty_owner_select ON public.loyalty_transactions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
REVOKE INSERT, UPDATE, DELETE ON public.loyalty_transactions FROM authenticated, anon;

-- 3. Restrict user_roles writes to service_role only (drop admin write policy)
DROP POLICY IF EXISTS user_roles_admin_all ON public.user_roles;
REVOKE INSERT, UPDATE, DELETE ON public.user_roles FROM authenticated, anon;

-- 4. Set immutable search_path on remaining functions
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public;
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public;

-- 5. Revoke EXECUTE from anon/authenticated on SECURITY DEFINER functions
--    that are not intended to be called by client roles.
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
