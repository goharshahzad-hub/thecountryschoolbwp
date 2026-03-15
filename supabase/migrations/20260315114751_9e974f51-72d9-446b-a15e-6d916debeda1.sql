
-- Fix 1: Admin requests INSERT - enforce status must be 'pending'
DROP POLICY IF EXISTS "Users can submit own admin request" ON public.admin_requests;
CREATE POLICY "Users can submit own admin request"
  ON public.admin_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Fix 2: Profiles INSERT - restrict role to 'parent'
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO public
  WITH CHECK (auth.uid() = user_id AND role = 'parent');

-- Fix 3: Profiles UPDATE - prevent role escalation
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO public
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND role = 'parent');

-- Fix 4: Restrict overly permissive INSERT on admission_queries
DROP POLICY IF EXISTS "Anyone can submit admission queries" ON public.admission_queries;
CREATE POLICY "Anyone can submit admission queries"
  ON public.admission_queries FOR INSERT
  TO anon, authenticated
  WITH CHECK (status = 'New');
