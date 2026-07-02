
CREATE TABLE public.construction_features (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Planning',
  enabled BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.construction_features TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.construction_features TO authenticated;
GRANT ALL ON public.construction_features TO service_role;
ALTER TABLE public.construction_features ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view construction features" ON public.construction_features FOR SELECT USING (true);
CREATE POLICY "Admins manage construction features" ON public.construction_features FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_construction_features_updated_at BEFORE UPDATE ON public.construction_features
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.construction_features (title, description, status, sort_order) VALUES
('Online Fee Payment Gateway','Allow parents to pay fees directly through the portal using debit/credit cards or bank transfer.','Planning',1),
('Mobile App (Android & iOS)','Native mobile apps for parents and teachers with push notifications.','Planning',2),
('Library Management Module','Track book inventory, issue/return records, and reading history per student.','Coming Soon',3),
('Transport / Bus Tracking','Live bus tracking and route management for parents.','Coming Soon',4),
('Examination & Grading System','Comprehensive exam scheduling, grade books and automated report cards.','In Progress',5),
('Inventory & Asset Management','Track school assets, stationery, and lab equipment.','Planning',6),
('SMS Gateway Integration','Send fee reminders, attendance alerts, and announcements via SMS.','Planning',7),
('Parent–Teacher Chat','Secure in-app messaging between parents and teachers.','In Progress',8);
