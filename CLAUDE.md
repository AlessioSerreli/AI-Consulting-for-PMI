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

### Istruzioni per Claude Code
> **REGOLA CRITICA:** Claude non deve mai modificare file direttamente su `main`.
> Ogni task deve iniziare su un branch dedicato e terminare con una Pull Request.
> Quando ti viene chiesto di fare una modifica, proponi sempre: nome branch → comandi git → PR verso main.
> Non fare commit su `main`, `develop`, o qualsiasi branch già esistente senza esplicita istruzione.

### Ruoli
- **Alessio** → Backend (`backend/` — FastAPI, endpoint, logica AI, database)
- **Luigi** → Frontend (`frontend/` — Next.js, pagine, componenti, UI)

### Branch strategy

```
main     ← sempre stabile e rilasciabile. NESSUN push diretto. Solo merge via PR approvata.
develop  ← OPZIONALE. Usare solo se più feature devono integrarsi e testarsi insieme
           prima di andare su main. Per un singolo task indipendente, non serve.
```

### Naming convention branch

| Prefisso | Quando usarlo | Esempio |
|---|---|---|
| `feat/<nome>` | nuova funzionalità | `feat/survey-drag-rank` |
| `fix/<nome>` | correzione bug | `fix/email-not-sending` |
| `spike/<nome>` | esperimento / prototipo / esplorazione | `spike/pdf-weasyprint-v2` |

Regola opzionale: aggiungere le iniziali per chiarire l'autore → `feat/luigi-survey-redesign`, `fix/alessio-crm-stats`.

### Regole di lavoro
1. **Mai push diretti su `main`** — è protetto, richiede PR approvata
2. **Ogni task = 1 branch** con naming `feat/`, `fix/`, o `spike/`
3. Il branch parte sempre da `main` aggiornato (non da `develop` salvo necessità)
4. **Ogni branch termina con una PR** verso `main` (o `develop` se serve coordinamento)
5. La PR richiede: checklist pre-merge completata + review e approval dell'altro sviluppatore
6. Non modificare mai file nell'area dell'altro senza accordo esplicito
7. Nessun force push — se c'è un conflitto, risolverlo con merge o rebase condiviso

### Quando usare `develop`
Usa `develop` **solo** se:
- Stai coordinando 2+ feature che devono girare insieme prima di essere pronte per `main`
- Stai preparando un rilascio con più PR da integrare prima del deploy

**Non usare `develop`** per task normali — ogni branch va direttamente su `main` via PR.

---

## Checklist pre-merge (obbligatoria prima di ogni PR)

### Frontend (Luigi — `frontend/`)
```bash
cd frontend
npm run lint          # ESLint — zero errori/warning bloccanti
npx tsc --noEmit      # TypeScript — zero errori di tipo
npm run build         # build completa — verifica che non ci siano errori di produzione
```

### Backend (Alessio — `backend/`)
```bash
# Nessun lint/test automatico configurato ancora — vedi TODO consigliati
# Per ora: avviare il server e testare manualmente i nuovi endpoint via Swagger
python -m uvicorn main:app --reload   # avvia da cartella backend/
# → http://localhost:8000/docs → testare ogni endpoint modificato
```

### Review veloce (entrambi)
- [ ] Il codice fa solo quello che il task richiedeva (no scope creep)
- [ ] Nessuna chiave API o secret committata
- [ ] I file `.env` non sono inclusi nel commit
- [ ] Nessun `console.log` / `print()` di debug lasciato nel codice
- [ ] Il branch è aggiornato con `main` (nessun conflitto pendente)

---

## TODO consigliati — lint/test non ancora configurati

Questi strumenti **non sono ancora installati** nel repo. Aggiungerli prima del deploy.

### Backend — Python
```bash
pip install ruff              # linter Python moderno e veloce
pip install pytest pytest-asyncio httpx  # test per FastAPI async

# Uso:
ruff check backend/           # lint
pytest backend/tests/         # test (creare cartella tests/ con i file)
```

### Frontend — Test unitari
```bash
# Opzione A: Vitest (consigliato per Next.js)
npm install -D vitest @vitejs/plugin-react @testing-library/react

# Opzione B: usare solo npm run build come smoke test CI (già disponibile)
```

### GitHub Actions (CI automatica)
Creare `.github/workflows/ci.yml` per far girare lint + build ad ogni PR automaticamente.
Vedere `docs/team-workflow.md` per il template suggerito.

---

## Cheatsheet Git — Comandi sessione

### ALESSIO (Backend — `backend/`)

```bash
# Inizio sessione — si parte sempre da main aggiornato
git checkout main
git pull origin main
git checkout -b feat/nome-task        # o fix/ o spike/

# Durante il lavoro (commit frequenti)
git add backend/
git commit -m "feat: descrizione breve"

# Fine sessione — push e apri PR verso main
git push origin feat/nome-task
# → github.com/AlessioSerreli/AI-Consulting-for-PMI
# → "Compare & pull request" → base: main → descrivi le modifiche → chiedi a Luigi di approvare

# Dopo il merge
git checkout main
git pull origin main
git branch -d feat/nome-task          # pulizia branch locale
```

### LUIGI (Frontend — `frontend/`)

```bash
# Inizio sessione — si parte sempre da main aggiornato
git checkout main
git pull origin main
git checkout -b feat/nome-task        # o fix/ o spike/

# Durante il lavoro (commit frequenti)
git add frontend/
git commit -m "feat: descrizione breve"

# Pre-merge: eseguire checklist
cd frontend && npm run lint && npx tsc --noEmit

# Fine sessione — push e apri PR verso main
git push origin feat/nome-task
# → github.com/AlessioSerreli/AI-Consulting-for-PMI
# → "Compare & pull request" → base: main → descrivi le modifiche → chiedi ad Alessio di approvare

# Dopo il merge
git checkout main
git pull origin main
git branch -d feat/nome-task          # pulizia branch locale
```

### Approvare una PR (entrambi)
1. Vai su github.com/AlessioSerreli/AI-Consulting-for-PMI → tab **Pull Requests**
2. Apri la PR dell'altro → leggi il diff
3. Clicca **"Add your review"** → **"Approve"** → **"Submit review"**
4. Clicca **"Merge pull request"** (usa "Squash and merge" per tenere `main` pulita)

### Sincronizzarsi dopo un merge
```bash
git checkout main
git pull origin main
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
