-- 1) Lock down SECURITY DEFINER helpers (callable only by trigger owner / RLS evaluator)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recalculate_voucher_payment_totals(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_payment_record_to_voucher() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_voucher_status() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.apply_payment_to_voucher() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_voucher_due_date() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- 2) Tighten photos bucket: stop allowing anonymous full-bucket listing
DROP POLICY IF EXISTS "Anyone can view photos" ON storage.objects;
CREATE POLICY "Authenticated users can view photos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'photos');