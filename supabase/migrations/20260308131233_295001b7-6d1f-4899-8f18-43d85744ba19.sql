
CREATE TABLE public.admin_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_requests ENABLE ROW LEVEL SECURITY;

-- Admins can view and manage all requests
CREATE POLICY "Admins can manage admin requests"
ON public.admin_requests FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Authenticated users can insert their own request
CREATE POLICY "Users can submit own admin request"
ON public.admin_requests FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can view their own request status
CREATE POLICY "Users can view own request"
ON public.admin_requests FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
