
-- Verification codes for sensitive admin actions
CREATE TABLE public.admin_verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_hash TEXT NOT NULL,
  action_type TEXT NOT NULL, -- 'approve_admin' | 'revoke_admin' | 'reset_admin_password'
  target_user_id UUID,
  target_email TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  requested_by UUID,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '15 minutes'),
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.admin_verification_codes TO authenticated;
GRANT ALL ON public.admin_verification_codes TO service_role;
ALTER TABLE public.admin_verification_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view code history"
  ON public.admin_verification_codes FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Password reset requests requiring master approval
CREATE TABLE public.password_reset_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  user_role TEXT NOT NULL, -- 'admin' | 'teacher'
  status TEXT NOT NULL DEFAULT 'pending', -- pending | approved | rejected | expired
  approval_token TEXT NOT NULL UNIQUE,
  ip_address TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '1 hour')
);
GRANT SELECT ON public.password_reset_requests TO authenticated;
GRANT ALL ON public.password_reset_requests TO service_role;
ALTER TABLE public.password_reset_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view reset history"
  ON public.password_reset_requests FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_admin_verif_codes_action ON public.admin_verification_codes(action_type, used_at);
CREATE INDEX idx_pwd_reset_token ON public.password_reset_requests(approval_token);
CREATE INDEX idx_pwd_reset_status ON public.password_reset_requests(status, expires_at);
