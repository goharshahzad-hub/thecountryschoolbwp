-- Teachers can view all students
CREATE POLICY "Teachers can view students"
ON public.students
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'teacher'));

-- Teachers can manage attendance records
CREATE POLICY "Teachers can manage attendance"
ON public.attendance_records
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'teacher'))
WITH CHECK (public.has_role(auth.uid(), 'teacher'));

-- Teachers can view subjects
CREATE POLICY "Teachers can view subjects"
ON public.subjects
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'teacher'));

-- Teachers can manage test results
CREATE POLICY "Teachers can manage test results"
ON public.test_results
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'teacher'))
WITH CHECK (public.has_role(auth.uid(), 'teacher'));

-- Teachers can view classes
CREATE POLICY "Teachers can view classes"
ON public.classes
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'teacher'));

-- Teachers can view diary entries
CREATE POLICY "Teachers can manage diary"
ON public.diary_entries
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'teacher'))
WITH CHECK (public.has_role(auth.uid(), 'teacher'));