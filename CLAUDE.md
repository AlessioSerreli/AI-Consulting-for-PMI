# AI Consulting for PMI — CLAUDE.md

## Descrizione
Piattaforma di consulenza AI per PMI italiane (<50 dipendenti).
Funnel a 4 fasi: Audit → Implementazione → Formazione → Manutenzione.

## Obiettivo immediato
MVP Fase 1: Survey dinamica + Scorecard AI generata + CRM admin.

## Stack
- Frontend: Next.js 14.2.29 (App Router) + Tailwind CSS — deploy su Vercel
- Backend: Python FastAPI — deploy su Railway/Render
- AI: Claude API (Anthropic claude-sonnet-4-6)
- Database: Supabase (PostgreSQL free tier)
- PDF: WeasyPrint
- Email: Resend (free tier)

## Struttura Blocchi
- [x] BLOCCO 0 — Foundation: struttura progetto, design system, 41 file scaffolded
- [x] BLOCCO 1 — Survey Engine: survey dinamica 15 domande con logica condizionale, progress bar
- [x] BLOCCO 2 — AI Scorecard Generator: scoring.py + prompts.py + pdf/generator.py
- [x] BLOCCO 3 — Sales Infrastructure: landing page + thank-you page implementate
- [x] BLOCCO 3b — CRM: dashboard admin + pipeline lead + clienti attivi implementati
- [ ] BLOCCO 4 — Core AI Engine (post-MVP)

## Ultimo avanzamento (2026-03-13) — Test end-to-end completato ✅

### Test completati oggi
- **Backend** avviato con `python -m uvicorn main:app --reload` ✅
- **Frontend** avviato con `npm run dev` ✅
- **Survey completa** → lead salvato in Supabase ✅
- **CRM frontend** su `/admin`, `/admin/leads`, `/admin/clients` ✅
- **CRM API** `/crm/stats` e `/crm/leads` funzionanti ✅
- **Scorecard AI** generata correttamente (crediti Anthropic ricaricati $5) ✅
- **Email** inviata via Resend ✅

### Fix applicati in questa sessione
- Aggiunti endpoint `POST /survey/retry-pending` e `POST /survey/resend-email/{lead_id}`
- `retry-pending`: processa tutti i lead con status `new` che non hanno ricevuto scorecard
- `resend-email/{lead_id}`: rimanda email a lead già `survey_done` (scorecard già generata)
- Fix logging errori email (errori ora visibili nel terminale)
- `FROM_EMAIL` impostato su `onboarding@resend.dev` per testing (sandbox Resend)

### Collaborazione
- Luigi Negros (`luiginegros`) aggiunto come collaboratore GitHub
- Branch `develop` creato come branch di integrazione
- `main` protetto: richiede PR approvata per merge
- Workflow: `luigi/feature` o `alessio/feature` → PR → `develop` → `main`
- Luigi: backend (FastAPI) | Alessio: frontend (Next.js)

## Punto di ripresa (prossima sessione)
Il flusso end-to-end funziona completamente. Prossimi step:

1. **Deploy**: frontend su Vercel, backend su Railway/Render
2. **Dominio**: verificare `aiconsultingpmi.it` su Resend e aggiornare `FROM_EMAIL` nel `.env` di produzione
3. **Calendly**: sostituire il link placeholder nel thank-you page con quello reale
4. **Decisioni da prendere**: nome brand, pricing, lingua survey

## Note operative
- Avviare backend: `cd backend` poi `python -m uvicorn main:app --reload` (usare cmd, non PowerShell)
- Avviare frontend: `cd frontend` poi `npm run dev` (usare cmd, non PowerShell)
- Backend su `http://localhost:8000` | Swagger su `http://localhost:8000/docs`
- Frontend su `http://localhost:3000`
- Con Resend sandbox (`onboarding@resend.dev`), le mail arrivano solo all'email registrata su resend.com

## Decisioni architetturali
- App Router Next.js 14 (non Pages Router)
- Tailwind per styling (no CSS modules)
- FastAPI con async/await nativo
- Supabase come unico DB (sia per dati survey che CRM)
- Claude claude-sonnet-4-6 per tutti i task AI
- Nessun tool a pagamento monthly (tutto free tier o pay-per-use)
- Pipeline status: new → survey_done → call_scheduled → offer_sent → client → lost

## Decisioni da prendere ancora
- [ ] Nome brand finale
- [ ] Pricing per le 4 fasi
- [ ] Lingua survey (solo italiano o anche inglese?)
- [ ] Calendly link reale (ora è placeholder)
- [ ] Deploy: Railway vs Render per il backend
