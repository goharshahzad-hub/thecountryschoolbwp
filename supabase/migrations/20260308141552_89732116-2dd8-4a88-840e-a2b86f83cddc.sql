
CREATE TABLE public.timetable_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_name text NOT NULL,
  section text NOT NULL DEFAULT 'A',
  day_of_week text NOT NULL,
  time_slot text NOT NULL,
  subject text NOT NULL DEFAULT '',
  teacher_name text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.timetable_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage timetable" ON public.timetable_entries
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view timetable" ON public.timetable_entries
  FOR SELECT TO authenticated
  USING (true);
