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

## Onboarding Luigi — Benvenuto nel progetto

Ciao Luigi! Questo documento ti racconta tutto quello che è stato fatto e come funziona il progetto.

### Cos'è il progetto
Una piattaforma web che aiuta le piccole imprese italiane (<50 dipendenti) a capire come l'AI può migliorare il loro lavoro. Il flusso è:
1. L'imprenditore arriva sulla **landing page**
2. Compila una **survey** di 15 domande sulla sua azienda
3. Riceve via email una **scorecard** generata dall'AI con un punteggio e 3 azioni concrete
4. Noi lo contattiamo per una **call gratuita** → diventa cliente

### I blocchi del progetto (cosa è già fatto)

**BLOCCO 0 — Foundation** ✅
Struttura del progetto creata da zero: cartelle, file di configurazione, design system (colori, font, componenti base). Non devi toccare nulla qui.

**BLOCCO 1 — Survey Engine** ✅
La survey dinamica con 15 domande e logica condizionale (alcune domande appaiono solo in base alle risposte precedenti). Ha una progress bar e invia i dati al backend.
- File chiave: `frontend/app/survey/page.tsx`

**BLOCCO 2 — AI Scorecard Generator** ✅
Il backend riceve i dati della survey, li manda a Claude AI (Anthropic), che genera un punteggio da 0 a 100 e 3 "quick win" personalizzati. Il risultato viene salvato su Supabase e inviato via email.
- File chiave: `backend/ai/scoring.py`, `backend/routes/survey.py`

**BLOCCO 3 — Sales Infrastructure** ✅
La landing page (homepage) e la pagina di ringraziamento dopo la survey.
- File chiave: `frontend/app/page.tsx`, `frontend/app/thank-you/page.tsx`

**BLOCCO 3b — CRM Admin** ✅
Dashboard di amministrazione per vedere tutti i lead, il loro stato e i clienti attivi. Solo per uso interno nostro.
- File chiave: `frontend/app/admin/page.tsx`, `frontend/app/admin/leads/page.tsx`

**BLOCCO 4 — Core AI Engine** ⏳ (post-MVP, non ancora iniziato)
Espansione delle funzionalità AI. Si farà dopo il lancio.

### Architettura in 30 secondi
```
[Utente] → [Frontend Next.js :3000] → [Backend FastAPI :8000] → [Supabase DB]
                                              ↓
                                    [Claude AI (Anthropic)]
                                              ↓
                                    [Email via Resend]
```

### Il tuo ruolo
**Tu gestisci il Frontend** — tutto quello che è in `frontend/`. Alessio gestisce il backend in `backend/`. Non dovrai toccare il backend salvo accordi.

### Prima di iniziare a lavorare
Chiedi ad Alessio il file `backend/.env` con le chiavi API (non è nel repo per sicurezza). Ti servirà solo se vuoi avviare il backend in locale per testare. Per il frontend puoi lavorare autonomamente.

---

## Workflow di collaborazione (Alessio + Luigi)

### Ruoli
- **Alessio** → Backend (FastAPI, endpoint, logica AI, database)
- **Luigi** → Frontend (Next.js, pagine, componenti, UI)

### Struttura branch
```
main       ← produzione, protetto (solo merge via PR approvata)
develop    ← branch di integrazione, da cui si parte sempre
alessio/   ← branch di Alessio (es. alessio/landing-fix)
luigi/     ← branch di Luigi (es. luigi/crm-endpoint)
```

### Regole di lavoro
1. **Mai lavorare direttamente su `main`** — è protetto e richiede PR
2. **Ogni sessione inizia così**:
   ```
   git checkout develop
   git pull origin develop
   git checkout -b alessio/nome-feature   (o luigi/nome-feature)
   ```
3. **Finita la feature**, si apre una PR verso `develop`:
   ```
   git push origin alessio/nome-feature
   ```
   Poi su GitHub: "Compare & pull request" → assegnare l'altro come reviewer
4. **L'altro approva** la PR → merge su `develop`
5. **Quando il codice è stabile** e testato su `develop` → PR verso `main`

### Regole pratiche
- Commit frequenti con messaggi chiari (imperativo: "add", "fix", "update")
- Fare `git pull origin develop` prima di iniziare ogni sessione
- Non modificare mai file dell'area dell'altro senza avvisare
- Se c'è un conflitto, risolverlo insieme — non fare mai force push

---

## Cheatsheet Git — Comandi sessione

### ALESSIO (Backend — cartella `backend/`)

```bash
# Inizio sessione
git checkout develop
git pull origin develop
git checkout -b alessio/nome-feature

# Durante il lavoro (ripeti spesso)
git add backend/
git commit -m "feat: descrizione"

# Fine sessione — push e PR
git push origin alessio/nome-feature
# Poi vai su github.com/AlessioSerreli/AI-Consulting-for-PMI
# → "Compare & pull request" → base: develop → crea PR → chiedi a Luigi di approvare
```

### LUIGI (Frontend — cartella `frontend/`)

```bash
# Inizio sessione
git checkout develop
git pull origin develop
git checkout -b luigi/nome-feature

# Durante il lavoro (ripeti spesso)
git add frontend/
git commit -m "feat: descrizione"

# Fine sessione — push e PR
git push origin luigi/nome-feature
# Poi vai su github.com/AlessioSerreli/AI-Consulting-for-PMI
# → "Compare & pull request" → base: develop → crea PR → chiedi ad Alessio di approvare
```

### Approvare una PR (entrambi)
1. Vai su github.com/AlessioSerreli/AI-Consulting-for-PMI → tab **Pull Requests**
2. Apri la PR dell'altro
3. Clicca **"Add your review"** → **"Approve"** → **"Submit review"**
4. Clicca **"Merge pull request"**

### Sincronizzarsi dopo un merge
```bash
git checkout develop
git pull origin develop
```

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
