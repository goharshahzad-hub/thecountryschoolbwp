
CREATE TABLE public.admission_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name text NOT NULL,
  father_name text NOT NULL,
  phone text NOT NULL,
  email text DEFAULT '',
  applying_for_class text NOT NULL,
  message text DEFAULT '',
  status text NOT NULL DEFAULT 'New',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.admission_queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit admission queries"
ON public.admission_queries FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins can manage admission queries"
ON public.admission_queries FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
