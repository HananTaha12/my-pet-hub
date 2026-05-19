
ALTER TYPE reminder_type ADD VALUE IF NOT EXISTS 'medication';
ALTER TYPE reminder_type ADD VALUE IF NOT EXISTS 'other';

CREATE TABLE public.weight_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id UUID NOT NULL,
  weight_kg NUMERIC NOT NULL CHECK (weight_kg > 0 AND weight_kg < 500),
  recorded_on DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX weight_records_pet_idx ON public.weight_records(pet_id, recorded_on);
ALTER TABLE public.weight_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY weight_owner_all ON public.weight_records
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.pets p WHERE p.id = weight_records.pet_id AND p.owner_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.pets p WHERE p.id = weight_records.pet_id AND p.owner_id = auth.uid())
  );

CREATE POLICY weight_staff_select ON public.weight_records
  FOR SELECT USING (is_staff(auth.uid()));
