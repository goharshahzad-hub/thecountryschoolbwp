
-- 1. User roles table (separate from profiles per security requirements)
CREATE TYPE public.app_role AS ENUM ('admin', 'teacher', 'parent');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS for user_roles: users can view their own roles, admins can manage all
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. Teachers table
CREATE TABLE public.teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id text NOT NULL UNIQUE,
  name text NOT NULL,
  subject text NOT NULL DEFAULT '',
  classes text NOT NULL DEFAULT '',
  phone text DEFAULT '',
  qualification text DEFAULT '',
  cnic text DEFAULT '',
  address text DEFAULT '',
  salary numeric(10,2) DEFAULT 0,
  status text NOT NULL DEFAULT 'Active',
  joining_date date DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage teachers" ON public.teachers
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. Classes table
CREATE TABLE public.classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  section text DEFAULT 'A',
  level text NOT NULL DEFAULT 'Primary',
  room text DEFAULT '',
  class_teacher_id uuid REFERENCES public.teachers(id) ON DELETE SET NULL,
  max_students int DEFAULT 40,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage classes" ON public.classes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4. Fee vouchers table
CREATE TABLE public.fee_vouchers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_no text NOT NULL UNIQUE,
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  amount numeric(10,2) NOT NULL DEFAULT 0,
  fee_type text NOT NULL DEFAULT 'Monthly',
  month text NOT NULL,
  year int NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  due_date date NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '15 days'),
  paid_date date,
  status text NOT NULL DEFAULT 'Pending',
  remarks text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.fee_vouchers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage fee vouchers" ON public.fee_vouchers
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Parents can view own fee vouchers" ON public.fee_vouchers
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.students
    WHERE students.id = fee_vouchers.student_id
    AND students.parent_user_id = auth.uid()
  ));

-- 5. Subjects table
CREATE TABLE public.subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage subjects" ON public.subjects
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 6. Test results / report cards
CREATE TABLE public.test_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  subject_id uuid REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
  exam_type text NOT NULL DEFAULT 'Monthly Test',
  term text NOT NULL DEFAULT 'Term 1',
  total_marks numeric(5,1) NOT NULL DEFAULT 100,
  obtained_marks numeric(5,1) NOT NULL DEFAULT 0,
  grade text DEFAULT '',
  remarks text DEFAULT '',
  exam_date date DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage test results" ON public.test_results
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Parents can view own test results" ON public.test_results
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.students
    WHERE students.id = test_results.student_id
    AND students.parent_user_id = auth.uid()
  ));

-- 7. Admissions table
CREATE TABLE public.admissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_no text NOT NULL UNIQUE,
  student_name text NOT NULL,
  father_name text NOT NULL,
  mother_name text DEFAULT '',
  date_of_birth date NOT NULL,
  gender text NOT NULL DEFAULT 'Male',
  religion text DEFAULT 'Islam',
  nationality text DEFAULT 'Pakistani',
  cnic_bform text DEFAULT '',
  father_cnic text DEFAULT '',
  father_occupation text DEFAULT '',
  father_phone text DEFAULT '',
  mother_phone text DEFAULT '',
  address text DEFAULT '',
  previous_school text DEFAULT '',
  previous_class text DEFAULT '',
  applying_for_class text NOT NULL,
  applying_for_section text DEFAULT 'A',
  admission_date date DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'Pending',
  remarks text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage admissions" ON public.admissions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Update triggers for new tables
CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON public.teachers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON public.classes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fee_vouchers_updated_at BEFORE UPDATE ON public.fee_vouchers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_admissions_updated_at BEFORE UPDATE ON public.admissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Also update existing students table RLS to allow admin full access
CREATE POLICY "Admins can manage students" ON public.students
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admin full access to attendance
CREATE POLICY "Admins can manage attendance" ON public.attendance_records
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admin full access to profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Insert default subjects
INSERT INTO public.subjects (name, code) VALUES
  ('English', 'ENG'),
  ('Urdu', 'URD'),
  ('Mathematics', 'MATH'),
  ('Science', 'SCI'),
  ('Physics', 'PHY'),
  ('Chemistry', 'CHEM'),
  ('Biology', 'BIO'),
  ('Computer Science', 'CS'),
  ('Islamiat', 'ISL'),
  ('Pakistan Studies', 'PST'),
  ('Social Studies', 'SS');
