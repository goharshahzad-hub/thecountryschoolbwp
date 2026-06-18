ALTER TABLE public.test_results ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT false;
-- Mark existing results as published to avoid hiding historical data from parents
UPDATE public.test_results SET is_published = true WHERE is_published = false;
CREATE INDEX IF NOT EXISTS idx_test_results_is_published ON public.test_results(is_published);