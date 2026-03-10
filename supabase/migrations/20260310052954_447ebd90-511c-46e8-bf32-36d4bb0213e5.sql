
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS date_of_birth date;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS date_of_birth date;
ALTER TABLE public.non_teaching_staff ADD COLUMN IF NOT EXISTS date_of_birth date;
