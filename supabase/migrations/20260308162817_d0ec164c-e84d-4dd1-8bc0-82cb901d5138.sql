
ALTER TABLE public.students ADD COLUMN mother_phone text DEFAULT '';
ALTER TABLE public.students ADD COLUMN whatsapp text DEFAULT '';

ALTER TABLE public.admissions ADD COLUMN whatsapp text DEFAULT '';

ALTER TABLE public.admission_queries ADD COLUMN mother_phone text DEFAULT '';
ALTER TABLE public.admission_queries ADD COLUMN whatsapp text DEFAULT '';
