DROP TRIGGER IF EXISTS trg_enforce_voucher_due_date ON public.fee_vouchers;
DROP TRIGGER IF EXISTS trg_sync_voucher_status ON public.fee_vouchers;
DROP TRIGGER IF EXISTS trg_apply_payment_to_voucher ON public.payment_records;
DROP TRIGGER IF EXISTS apply_payment_to_voucher_trigger ON public.payment_records;