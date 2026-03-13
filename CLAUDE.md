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

## Ultimo avanzamento (2026-03-13) — Integrazione completata
- Dipendenze aggiornate per Python 3.14: `pydantic>=2.12.0`, `supabase==2.9.1`, `fastapi>=0.115.0`, `anthropic>=0.40.0`
- `weasyprint` reso opzionale (richiede GTK su Windows — skip per MVP)
- Fix email `resend` v2: `to` ora lista, attachment base64 encoded
- **Backend** gira su `http://localhost:8000` ✅
- **Frontend** gira su `http://localhost:3000` ✅
- **Supabase** salva lead correttamente ✅
- **CRM** endpoint `/crm/stats` e `/crm/leads` funzionanti ✅
- **Blocco attuale**: Anthropic API → crediti esauriti → scorecard non generata

## Punto di ripresa (prossima sessione)
Un solo blocco rimasto prima del test end-to-end completo:

1. **Aggiungere crediti Anthropic**: console.anthropic.com → Plans & Billing
2. **Avviare backend**: `cd backend && python -m uvicorn main:app --reload`
3. **Avviare frontend**: `cd frontend && npm run dev`
4. **Test end-to-end completo**: survey → Supabase ✅ → scorecard AI (richiede crediti) → email Resend → admin CRM ✅

**Nota**: uvicorn va lanciato con `python -m uvicorn` (non `uvicorn` direttamente) perché il PATH non include Scripts di Python 3.14

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
