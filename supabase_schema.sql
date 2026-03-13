-- Tabella leads: esegui questo SQL nel SQL Editor di Supabase
-- Dashboard → SQL Editor → New query → Incolla e Run

CREATE TABLE IF NOT EXISTS leads (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name  TEXT NOT NULL,
  contact_name  TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  sector        TEXT,
  employees     TEXT,
  status        TEXT NOT NULL DEFAULT 'new',
  survey_data   JSONB,
  scorecard_data JSONB,
  overall_score  INTEGER,
  notes         TEXT,
  estimated_value FLOAT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Indici per le query più frequenti
CREATE INDEX IF NOT EXISTS leads_status_idx ON leads(status);
CREATE INDEX IF NOT EXISTS leads_created_at_idx ON leads(created_at DESC);

-- RLS: disabilita per ora (ambiente dev), da abilitare in prod
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
