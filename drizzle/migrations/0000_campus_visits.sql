CREATE TABLE public.campus_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid,
  student_name text,
  class_name text,
  parent_name text NOT NULL,
  phone text NOT NULL,
  visit_date date NOT NULL,
  time_slot text NOT NULL,
  status text NOT NULL DEFAULT 'scheduled',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campus_visits TO authenticated;
GRANT ALL ON public.campus_visits TO service_role;
ALTER TABLE public.campus_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage campus visits" ON public.campus_visits FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE UNIQUE INDEX campus_visits_slot_uniq ON public.campus_visits (visit_date, time_slot) WHERE status = 'scheduled';