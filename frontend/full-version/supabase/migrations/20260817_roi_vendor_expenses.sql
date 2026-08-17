-- EVE-138: roi_vendor_expenses + private roi-invoices storage bucket
-- Applied to production Supabase via MCP on 2026-08-17.

CREATE TABLE IF NOT EXISTS public.roi_vendor_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor text NOT NULL,
  category text NOT NULL DEFAULT 'other',
  amount_eur numeric(12,4) NOT NULL CHECK (amount_eur >= 0),
  currency text NOT NULL DEFAULT 'EUR',
  amount_original numeric(12,4),
  day date,
  period_start date,
  period_end date,
  source text NOT NULL DEFAULT 'invoice_upload',
  note text,
  invoice_filename text,
  invoice_storage_path text,
  invoice_url text,
  extracted_json jsonb,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'rejected')),
  created_by uuid,
  created_by_email text,
  confirmed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT roi_vendor_expenses_dates CHECK (
    day IS NOT NULL OR (period_start IS NOT NULL AND period_end IS NOT NULL)
  ),
  CONSTRAINT roi_vendor_expenses_category CHECK (
    category IN ('asr', 'translation', 'tts', 'llm', 'other')
  )
);

CREATE INDEX IF NOT EXISTS roi_vendor_expenses_status_idx ON public.roi_vendor_expenses (status);
CREATE INDEX IF NOT EXISTS roi_vendor_expenses_day_idx ON public.roi_vendor_expenses (day);
CREATE INDEX IF NOT EXISTS roi_vendor_expenses_period_idx ON public.roi_vendor_expenses (period_start, period_end);
CREATE INDEX IF NOT EXISTS roi_vendor_expenses_created_at_idx ON public.roi_vendor_expenses (created_at DESC);

ALTER TABLE public.roi_vendor_expenses ENABLE ROW LEVEL SECURITY;
