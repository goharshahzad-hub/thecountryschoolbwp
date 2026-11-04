ALTER TABLE public.admission_queries ADD COLUMN IF NOT EXISTS preferred_visit_date date;
ALTER TABLE public.admission_queries ADD COLUMN IF NOT EXISTS consent_contact boolean NOT NULL DEFAULT false;
COMMENT ON COLUMN public.admission_queries.consent_contact IS 'Parent consented to be contacted; required on the public admission form';

CREATE TABLE public.leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  parent_user_id uuid,
  from_date date NOT NULL,
  to_date date NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  admin_remarks text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leave_requests TO authenticated;
GRANT ALL ON public.leave_requests TO service_role;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Parents manage own leave requests, admins manage all" ON public.leave_requests FOR ALL TO authenticated USING (parent_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')) WITH CHECK (parent_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_leave_requests_updated BEFORE UPDATE ON public.leave_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();