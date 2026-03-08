
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_head TEXT NOT NULL,
  description TEXT DEFAULT '',
  amount NUMERIC NOT NULL DEFAULT 0,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  month TEXT NOT NULL,
  year INTEGER NOT NULL DEFAULT EXTRACT(year FROM CURRENT_DATE),
  paid_to TEXT DEFAULT '',
  payment_method TEXT NOT NULL DEFAULT 'Cash',
  receipt_no TEXT DEFAULT '',
  remarks TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage expenses"
  ON public.expenses
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
