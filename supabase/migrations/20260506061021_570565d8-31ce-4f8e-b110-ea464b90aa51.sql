-- Add a separate parent-child link table so both Mother and Father can be connected to the same student
CREATE TABLE IF NOT EXISTS public.student_parent_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  parent_user_id uuid NOT NULL,
  relationship text NOT NULL DEFAULT 'Guardian',
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT student_parent_links_relationship_check CHECK (relationship IN ('Father', 'Mother', 'Guardian')),
  CONSTRAINT student_parent_links_unique UNIQUE (student_id, parent_user_id),
  CONSTRAINT student_parent_links_student_fk FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE
);

ALTER TABLE public.student_parent_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage student parent links" ON public.student_parent_links;
CREATE POLICY "Admins can manage student parent links"
ON public.student_parent_links
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Parents can view own child links" ON public.student_parent_links;
CREATE POLICY "Parents can view own child links"
ON public.student_parent_links
FOR SELECT
TO authenticated
USING (parent_user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_student_parent_links_student_id ON public.student_parent_links(student_id);
CREATE INDEX IF NOT EXISTS idx_student_parent_links_parent_user_id ON public.student_parent_links(parent_user_id);

DROP TRIGGER IF EXISTS update_student_parent_links_updated_at ON public.student_parent_links;
CREATE TRIGGER update_student_parent_links_updated_at
BEFORE UPDATE ON public.student_parent_links
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Restore voucher due date and status triggers; the functions already exist but triggers were missing
DROP TRIGGER IF EXISTS enforce_fee_voucher_due_date ON public.fee_vouchers;
CREATE TRIGGER enforce_fee_voucher_due_date
BEFORE INSERT OR UPDATE OF month, year, due_date ON public.fee_vouchers
FOR EACH ROW
EXECUTE FUNCTION public.enforce_voucher_due_date();

DROP TRIGGER IF EXISTS sync_fee_voucher_status ON public.fee_vouchers;
CREATE TRIGGER sync_fee_voucher_status
BEFORE INSERT OR UPDATE OF amount, amount_paid, status ON public.fee_vouchers
FOR EACH ROW
EXECUTE FUNCTION public.sync_voucher_status();

-- Recalculate paid totals from payment records instead of relying on one-way increments
CREATE OR REPLACE FUNCTION public.recalculate_voucher_payment_totals(_voucher_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  paid_total numeric;
BEGIN
  IF _voucher_id IS NULL THEN
    RETURN;
  END IF;

  SELECT COALESCE(SUM(amount), 0)
  INTO paid_total
  FROM public.payment_records
  WHERE voucher_id = _voucher_id;

  UPDATE public.fee_vouchers
  SET amount_paid = paid_total,
      updated_at = now()
  WHERE id = _voucher_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_payment_record_to_voucher()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.recalculate_voucher_payment_totals(NEW.voucher_id);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.voucher_id IS DISTINCT FROM NEW.voucher_id THEN
      PERFORM public.recalculate_voucher_payment_totals(OLD.voucher_id);
    END IF;
    PERFORM public.recalculate_voucher_payment_totals(NEW.voucher_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.recalculate_voucher_payment_totals(OLD.voucher_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS apply_payment_to_voucher_trigger ON public.payment_records;
DROP TRIGGER IF EXISTS sync_payment_record_to_voucher_trigger ON public.payment_records;
CREATE TRIGGER sync_payment_record_to_voucher_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.payment_records
FOR EACH ROW
EXECUTE FUNCTION public.sync_payment_record_to_voucher();

-- Backfill the new parent-link table from existing single-parent links
INSERT INTO public.student_parent_links (student_id, parent_user_id, relationship, is_primary)
SELECT id, parent_user_id, 'Guardian', true
FROM public.students
WHERE parent_user_id IS NOT NULL
ON CONFLICT (student_id, parent_user_id) DO UPDATE
SET is_primary = true,
    updated_at = now();

-- Backfill current voucher paid totals from existing receipts
UPDATE public.fee_vouchers fv
SET amount_paid = COALESCE(p.total_paid, 0),
    updated_at = now()
FROM (
  SELECT voucher_id, SUM(amount) AS total_paid
  FROM public.payment_records
  WHERE voucher_id IS NOT NULL
  GROUP BY voucher_id
) p
WHERE fv.id = p.voucher_id;