GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_requests TO authenticated;
GRANT ALL ON public.admin_requests TO service_role;