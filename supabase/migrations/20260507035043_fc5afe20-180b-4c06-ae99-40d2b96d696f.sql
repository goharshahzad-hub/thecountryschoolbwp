DROP POLICY IF EXISTS "Authenticated users can view all announcements" ON public.announcements;
CREATE POLICY "Authenticated users can view public announcements"
ON public.announcements FOR SELECT
TO authenticated
USING (is_public = true OR public.has_role(auth.uid(), 'admin'::public.app_role));