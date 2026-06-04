DO $$
DECLARE
  target_user_id uuid := '9f8f91db-4d5b-4637-b123-0e7a6b0d6abc'::uuid;
  table_name text;
  policy_name text;
  tables text[] := ARRAY[
    'admin_requests',
    'admission_queries',
    'admissions',
    'announcements',
    'attendance_records',
    'classes',
    'diary_entries',
    'expenses',
    'fee_vouchers',
    'non_teaching_staff',
    'payment_records',
    'profiles',
    'school_settings',
    'student_parent_links',
    'students',
    'subjects',
    'teacher_permissions',
    'teachers',
    'test_results',
    'timetable_entries',
    'user_roles',
    'website_content'
  ];
BEGIN
  FOREACH table_name IN ARRAY tables LOOP
    policy_name := 'Temporary direct admin access for Gohar';

    IF NOT EXISTS (
      SELECT 1
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = table_name
        AND policyname = policy_name
    ) THEN
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (auth.uid() = %L::uuid) WITH CHECK (auth.uid() = %L::uuid)',
        policy_name,
        table_name,
        target_user_id::text,
        target_user_id::text
      );
    END IF;
  END LOOP;
END $$;