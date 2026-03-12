# AI Consulting for PMI — CLAUDE.md

## Descrizione
Piattaforma di consulenza AI per PMI italiane (<50 dipendenti).
Funnel a 4 fasi: Audit → Implementazione → Formazione → Manutenzione.

## Obiettivo immediato
MVP Fase 1: Survey dinamica + Scorecard AI generata + CRM admin.

## Stack
- Frontend: Next.js 14 (App Router) + Tailwind CSS
- Backend: Python FastAPI
- AI: Claude API (Anthropic claude-sonnet-4-6)
- Database: Supabase (PostgreSQL)
- PDF: WeasyPrint
- Email: Resend

## Struttura Blocchi
- [x] BLOCCO 0 — Foundation: struttura progetto, design system
- [ ] BLOCCO 1 — Survey Engine: survey dinamica web
- [ ] BLOCCO 2 — AI Scorecard Generator: scoring + PDF + email
- [ ] BLOCCO 3 — Sales Infrastructure: landing page + thank-you
- [ ] BLOCCO 3b — CRM: dashboard admin + pipeline lead
- [ ] BLOCCO 4 — Core AI Engine (post-MVP)

## Ultimo avanzamento
Struttura progetto creata. Frontend Next.js e backend FastAPI scaffolded.

## Prossimi step
1. Collegare Supabase (creare tabelle survey_responses, leads)
2. Implementare survey engine con logica condizionale
3. Integrare Claude API per generazione scorecard
4. Testare flusso end-to-end

## Decisioni architetturali
- App Router Next.js 14 (non Pages Router)
- Tailwind per styling (no CSS modules)
- FastAPI con async/await nativo
- Supabase come unico DB (sia per dati survey che CRM)
- Claude claude-sonnet-4-6 per tutti i task AI
