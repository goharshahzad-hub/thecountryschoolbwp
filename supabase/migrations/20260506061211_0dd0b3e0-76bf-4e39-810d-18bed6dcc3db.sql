-- Allow any linked parent (Mother/Father/Guardian) to view the child and related records
DROP POLICY IF EXISTS "Linked parents can view their children" ON public.students;
CREATE POLICY "Linked parents can view their children"
ON public.students
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.student_parent_links spl
    WHERE spl.student_id = students.id
      AND spl.parent_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Linked parents can view children attendance" ON public.attendance_records;
CREATE POLICY "Linked parents can view children attendance"
ON public.attendance_records
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.student_parent_links spl
    WHERE spl.student_id = attendance_records.student_id
      AND spl.parent_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Linked parents can view children fee vouchers" ON public.fee_vouchers;
CREATE POLICY "Linked parents can view children fee vouchers"
ON public.fee_vouchers
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.student_parent_links spl
    WHERE spl.student_id = fee_vouchers.student_id
      AND spl.parent_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Linked parents can view children payment records" ON public.payment_records;
CREATE POLICY "Linked parents can view children payment records"
ON public.payment_records
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.student_parent_links spl
    WHERE spl.student_id = payment_records.student_id
      AND spl.parent_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Linked parents can view children test results" ON public.test_results;
CREATE POLICY "Linked parents can view children test results"
ON public.test_results
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.student_parent_links spl
    WHERE spl.student_id = test_results.student_id
      AND spl.parent_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Linked parents can view children diary entries" ON public.diary_entries;
CREATE POLICY "Linked parents can view children diary entries"
ON public.diary_entries
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.student_parent_links spl
    JOIN public.students s ON s.id = spl.student_id
    WHERE spl.parent_user_id = auth.uid()
      AND s.class = diary_entries.class_name
      AND COALESCE(s.section, 'A') = diary_entries.section
  )
);