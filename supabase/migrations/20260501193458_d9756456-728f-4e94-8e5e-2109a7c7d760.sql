-- Teacher permissions table
CREATE TABLE public.teacher_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_user_id UUID NULL,
  is_global_default BOOLEAN NOT NULL DEFAULT false,
  can_view_students BOOLEAN NOT NULL DEFAULT true,
  can_view_fees BOOLEAN NOT NULL DEFAULT false,
  can_view_results BOOLEAN NOT NULL DEFAULT true,
  can_enter_results BOOLEAN NOT NULL DEFAULT true,
  can_view_attendance BOOLEAN NOT NULL DEFAULT true,
  can_enter_attendance BOOLEAN NOT NULL DEFAULT true,
  can_view_diary BOOLEAN NOT NULL DEFAULT true,
  can_enter_diary BOOLEAN NOT NULL DEFAULT true,
  can_view_timetable BOOLEAN NOT NULL DEFAULT true,
  can_view_all_classes BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(teacher_user_id)
);

ALTER TABLE public.teacher_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage teacher permissions"
  ON public.teacher_permissions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers view own permissions"
  ON public.teacher_permissions FOR SELECT TO authenticated
  USING (teacher_user_id = auth.uid() OR is_global_default = true);

CREATE TRIGGER trg_teacher_permissions_updated
  BEFORE UPDATE ON public.teacher_permissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed global default row
INSERT INTO public.teacher_permissions (teacher_user_id, is_global_default)
VALUES (NULL, true);

-- Payment records table (links receipts to vouchers/students)
CREATE TABLE public.payment_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  receipt_no TEXT NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  student_id UUID NULL,
  voucher_id UUID NULL,
  parent_user_id UUID NULL,
  fee_head TEXT NOT NULL DEFAULT 'Custom',
  description TEXT NOT NULL DEFAULT '',
  amount NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'Cash',
  remarks TEXT NULL DEFAULT '',
  created_by UUID NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_payment_records_student ON public.payment_records(student_id);
CREATE INDEX idx_payment_records_voucher ON public.payment_records(voucher_id);
CREATE INDEX idx_payment_records_date ON public.payment_records(payment_date);

ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage payment records"
  ON public.payment_records FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Parents view own payment records"
  ON public.payment_records FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = payment_records.student_id
      AND s.parent_user_id = auth.uid()
  ));