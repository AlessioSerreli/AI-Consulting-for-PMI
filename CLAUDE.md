# AI Consulting for PMI — CLAUDE.md

## Descrizione
Piattaforma di consulenza AI per PMI italiane (<50 dipendenti).
Funnel a 4 fasi: Audit → Implementazione → Formazione → Manutenzione.

## Obiettivo immediato
MVP Fase 1: Survey dinamica + Scorecard AI generata + CRM admin.

## Stack
- Frontend: Next.js 14 (App Router) + Tailwind CSS — deploy su Vercel
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
Scaffold completo del progetto (41 file) creato e pushato su GitHub.
Frontend Next.js 14 completo con tutte le pagine. Backend FastAPI con AI scoring, PDF generation, CRM routes.
Survey: 15 domande dinamiche con 6 sezioni (Anagrafica, Struttura, Processi, Digitalizzazione, Problemi, Obiettivi).
AI scoring via Claude claude-sonnet-4-6 → JSON scorecard 5 dimensioni + quick wins + executive summary.
PDF branded dark-theme generato con WeasyPrint. Email via Resend con PDF in allegato.

## Prossimi step
1. **Crea tabella Supabase** `leads` con colonne: id, company_name, contact_name, contact_email, sector, employees, status (default 'new'), survey_data (jsonb), scorecard_data (jsonb), overall_score, notes, created_at
2. **Configura `.env`** backend: ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY, RESEND_API_KEY, ADMIN_EMAIL, FROM_EMAIL
3. **Configura `.env.local`** frontend: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_API_URL
4. **Installa dipendenze**: `cd frontend && npm install` → `cd backend && pip install -r requirements.txt`
5. **Test end-to-end locale**: survey → scorecard generata → email ricevuta → lead visibile in admin
6. **Deploy**: Vercel (frontend) + Railway (backend)
7. Decidere nome brand finale e acquistare dominio (~12€/anno Namecheap)

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
