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
- [x] BLOCCO 2 — AI Scorecard Generator: scoring.py + prompts.py + pdf/generator.py (da testare con API reali)
- [x] BLOCCO 3 — Sales Infrastructure: landing page + thank-you page implementate
- [x] BLOCCO 3b — CRM: dashboard admin + pipeline lead + clienti attivi implementati
- [ ] BLOCCO 4 — Core AI Engine (post-MVP)

## Ultimo avanzamento (2026-03-13)
- Fix critico: `ai/scoring.py` e `ai/engine.py` ora usano `AsyncAnthropic` (prima bloccavano l'event loop)
- `supabase_schema.sql` creato e tabella `leads` creata su Supabase ✅
- `backend/.env` configurato: ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY, RESEND_API_KEY ✅
- `frontend/.env.local` configurato: SUPABASE_URL, SUPABASE_ANON_KEY, API_URL ✅
- Python non trovato nel sistema — da installare o verificare

## Punto di ripresa (prossima sessione)
Gli env sono configurati e Supabase è pronto. Manca solo avviare i server.

Step da fare in ordine:
1. **Verificare Python**: aprire terminale Cursor → `python --version`
   - Se non trovato: installare da python.org (spuntare "Add Python to PATH")
2. **Installare dipendenze backend**: `cd backend && pip install -r requirements.txt`
3. **Avviare backend**: `uvicorn main:app --reload` (da `backend/`)
4. **Avviare frontend**: `npm run dev` (da `frontend/`)
5. **Test end-to-end**: completare una survey → verificare salvataggio in Supabase → verificare scorecard generata → verificare email ricevuta → verificare lead visibile in admin

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
