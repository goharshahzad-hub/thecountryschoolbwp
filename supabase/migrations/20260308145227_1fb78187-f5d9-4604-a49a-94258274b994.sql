
CREATE TABLE public.website_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text NOT NULL UNIQUE,
  content jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.website_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage website content" ON public.website_content
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view website content" ON public.website_content
  FOR SELECT TO anon, authenticated
  USING (true);

-- Insert default content
INSERT INTO public.website_content (section_key, content) VALUES
('hero', '{"tagline": "Empowering young minds with quality education, strong values, and a nurturing environment since day one."}'),
('stats', '[{"value": "500+", "label": "Students Enrolled"}, {"value": "35+", "label": "Expert Teachers"}, {"value": "20+", "label": "Years of Excellence"}, {"value": "95%", "label": "Success Rate"}]'),
('features', '[{"title": "Academic Excellence", "desc": "Comprehensive curriculum designed for holistic student development", "icon": "GraduationCap"}, {"title": "Expert Faculty", "desc": "Dedicated and qualified teachers committed to nurturing young minds", "icon": "Users"}, {"title": "Modern Learning", "desc": "State-of-the-art facilities and innovative teaching methodologies", "icon": "BookOpen"}, {"title": "Co-Curricular Activities", "desc": "Sports, arts, and extracurricular programs for well-rounded growth", "icon": "Trophy"}, {"title": "Safe Environment", "desc": "Secure campus with caring staff ensuring student well-being", "icon": "Shield"}, {"title": "Structured Schedule", "desc": "Well-organized timetables maximizing learning outcomes", "icon": "Clock"}]'),
('about', '{"heading": "Why Choose Us", "subheading": "Building tomorrow''s leaders with today''s best education"}');
