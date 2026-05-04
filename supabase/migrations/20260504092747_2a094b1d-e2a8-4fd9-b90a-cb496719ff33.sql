
-- Partial payment + arrears aging support
ALTER TABLE public.fee_vouchers
  ADD COLUMN IF NOT EXISTS amount_paid NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS arrears_aging_months INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS arrears_source_voucher_id UUID;

-- Recompute status from amount_paid vs amount on every insert/update
CREATE OR REPLACE FUNCTION public.sync_voucher_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.amount_paid IS NULL THEN NEW.amount_paid := 0; END IF;
  IF NEW.amount_paid <= 0 THEN
    NEW.status := COALESCE(NULLIF(NEW.status,'Paid'), 'Pending');
    IF NEW.status = 'Partial' THEN NEW.status := 'Pending'; END IF;
  ELSIF NEW.amount_paid >= NEW.amount THEN
    NEW.status := 'Paid';
    IF NEW.paid_date IS NULL THEN NEW.paid_date := CURRENT_DATE; END IF;
  ELSE
    NEW.status := 'Partial';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_voucher_status ON public.fee_vouchers;
CREATE TRIGGER trg_sync_voucher_status
  BEFORE INSERT OR UPDATE OF amount_paid, amount ON public.fee_vouchers
  FOR EACH ROW EXECUTE FUNCTION public.sync_voucher_status();

-- Ensure 10th-of-month due date trigger is attached (function already exists)
DROP TRIGGER IF EXISTS trg_enforce_voucher_due_date ON public.fee_vouchers;
CREATE TRIGGER trg_enforce_voucher_due_date
  BEFORE INSERT OR UPDATE OF month, year ON public.fee_vouchers
  FOR EACH ROW EXECUTE FUNCTION public.enforce_voucher_due_date();

-- When a payment_records row is inserted against a voucher, increment amount_paid
CREATE OR REPLACE FUNCTION public.apply_payment_to_voucher()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.voucher_id IS NOT NULL THEN
    UPDATE public.fee_vouchers
       SET amount_paid = COALESCE(amount_paid,0) + COALESCE(NEW.amount,0)
     WHERE id = NEW.voucher_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_apply_payment_to_voucher ON public.payment_records;
CREATE TRIGGER trg_apply_payment_to_voucher
  AFTER INSERT ON public.payment_records
  FOR EACH ROW EXECUTE FUNCTION public.apply_payment_to_voucher();
