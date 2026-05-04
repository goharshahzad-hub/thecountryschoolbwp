-- Enforce that fee_vouchers.due_date is always the 10th of the voucher's billing month/year.
-- A trigger normalizes the date on every insert/update so custom due dates cannot be saved.

CREATE OR REPLACE FUNCTION public.enforce_voucher_due_date()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  month_idx INT;
  months TEXT[] := ARRAY['January','February','March','April','May','June',
                         'July','August','September','October','November','December'];
BEGIN
  month_idx := array_position(months, NEW.month);
  IF month_idx IS NULL THEN
    RAISE EXCEPTION 'Invalid month: %', NEW.month;
  END IF;
  -- Always force the due date to the 10th of the billing month/year
  NEW.due_date := make_date(NEW.year, month_idx, 10);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_voucher_due_date ON public.fee_vouchers;

CREATE TRIGGER trg_enforce_voucher_due_date
BEFORE INSERT OR UPDATE ON public.fee_vouchers
FOR EACH ROW
EXECUTE FUNCTION public.enforce_voucher_due_date();