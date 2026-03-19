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

-- RLS: abilitato — service_role bypassa RLS automaticamente (backend sicuro)
-- anon/authenticated bloccati completamente (nessun accesso diretto da frontend)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "block_anon_leads" ON leads
  AS RESTRICTIVE
  FOR ALL
  TO anon, authenticated
  USING (false);

-- -------------------------------------------------------
-- Tabella prospecting_leads: lead trovati via Apify scraping
-- Esegui nel SQL Editor di Supabase dopo la tabella leads
-- -------------------------------------------------------

CREATE TABLE IF NOT EXISTS prospecting_leads (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name     TEXT NOT NULL,
  category         TEXT,
  address          TEXT,
  city             TEXT,
  phone            TEXT,
  website          TEXT,
  email            TEXT,
  rating           FLOAT,
  review_count     INTEGER DEFAULT 0,
  google_maps_url  TEXT,
  apify_run_id     TEXT,
  status           TEXT NOT NULL DEFAULT 'new',  -- new, contacted, converted, dismissed
  notes            TEXT,
  -- Campi Hunter.io enrichment
  owner_name       TEXT,
  owner_email      TEXT,
  owner_position   TEXT,
  hunter_domain    TEXT,
  hunter_emails    JSONB,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Aggiunta colonne Hunter.io a tabella esistente (esegui se la tabella esiste già)
ALTER TABLE prospecting_leads ADD COLUMN IF NOT EXISTS owner_name TEXT;
ALTER TABLE prospecting_leads ADD COLUMN IF NOT EXISTS owner_email TEXT;
ALTER TABLE prospecting_leads ADD COLUMN IF NOT EXISTS owner_position TEXT;
ALTER TABLE prospecting_leads ADD COLUMN IF NOT EXISTS hunter_domain TEXT;
ALTER TABLE prospecting_leads ADD COLUMN IF NOT EXISTS hunter_emails JSONB;

CREATE INDEX IF NOT EXISTS prospecting_leads_status_idx ON prospecting_leads(status);
CREATE INDEX IF NOT EXISTS prospecting_leads_created_at_idx ON prospecting_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS prospecting_leads_run_idx ON prospecting_leads(apify_run_id);

ALTER TABLE prospecting_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "block_anon_prospecting" ON prospecting_leads
  AS RESTRICTIVE
  FOR ALL
  TO anon, authenticated
  USING (false);
