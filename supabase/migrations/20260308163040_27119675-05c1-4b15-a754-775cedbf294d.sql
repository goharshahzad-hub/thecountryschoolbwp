
CREATE TABLE public.non_teaching_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id text NOT NULL,
  name text NOT NULL,
  designation text NOT NULL DEFAULT '',
  department text NOT NULL DEFAULT '',
  phone text DEFAULT '',
  cnic text DEFAULT '',
  salary numeric DEFAULT 0,
  qualification text DEFAULT '',
  address text DEFAULT '',
  joining_date date DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'Active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.non_teaching_staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage non teaching staff"
  ON public.non_teaching_staff FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
