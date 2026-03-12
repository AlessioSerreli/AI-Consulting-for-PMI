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

## Ultimo avanzamento (2026-03-12)
- Scaffold completo (41 file) creato e pushato su GitHub
- `npm install` completato nel frontend — Next.js aggiornato a 14.2.29 (patch sicurezza)
- Build Next.js: ✅ zero errori, tutte e 7 le route compilate
- Dev server testato e funzionante su http://localhost:3000
- UI visivamente verificabile: landing page, survey, thank-you, admin, leads, clients

## Punto di ripresa (prossima sessione)
Il frontend gira. Il prossimo blocco è collegare il backend.

Step da fare in ordine:
1. **Creare tabella Supabase** `leads`:
   - Colonne: id (uuid), company_name, contact_name, contact_email, sector, employees, status (default 'new'), survey_data (jsonb), scorecard_data (jsonb), overall_score (int), notes (text), created_at (timestamptz)
2. **Configurare `.env`** in `backend/`:
   - ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY, RESEND_API_KEY, ADMIN_EMAIL, FROM_EMAIL
3. **Configurare `.env.local`** in `frontend/`:
   - NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_API_URL=http://localhost:8000
4. **Installare dipendenze backend**: `cd backend && pip install -r requirements.txt`
5. **Avviare backend**: `uvicorn main:app --reload` (da `backend/`)
6. **Avviare frontend**: `npm run dev` (da `frontend/`)
7. **Test end-to-end**: completare una survey → verificare salvataggio in Supabase → verificare scorecard generata → verificare email ricevuta → verificare lead visibile in admin

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
