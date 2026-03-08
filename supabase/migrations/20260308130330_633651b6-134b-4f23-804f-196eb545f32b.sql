
CREATE TABLE public.school_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_name text NOT NULL DEFAULT 'The Country School',
  campus text NOT NULL DEFAULT 'Model Town Fahad Campus',
  city text NOT NULL DEFAULT 'Bahawalpur',
  phone text NOT NULL DEFAULT '+92 322 6107000',
  email text NOT NULL DEFAULT 'thecountryschoolbwp@gmail.com',
  address text NOT NULL DEFAULT 'Model Town Fahad Campus, Bahawalpur',
  motto text NOT NULL DEFAULT 'Towards Academic Excellence',
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.school_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage school settings"
ON public.school_settings FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view school settings"
ON public.school_settings FOR SELECT
TO anon, authenticated
USING (true);

-- Insert default row
INSERT INTO public.school_settings (school_name) VALUES ('The Country School');
