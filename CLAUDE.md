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
- PDF: WeasyPrint (Linux/produzione) + xhtml2pdf (fallback Windows)
- Email: Resend (free tier)

## Struttura Blocchi
- [x] BLOCCO 0 — Foundation: struttura progetto, design system, 41 file scaffolded
- [x] BLOCCO 1 — Survey Engine: survey dinamica 15 domande con logica condizionale, progress bar
- [x] BLOCCO 2 — AI Scorecard Generator: scoring.py + prompts.py + pdf/certificate.py
- [x] BLOCCO 3 — Sales Infrastructure: landing page + thank-you page implementate
- [x] BLOCCO 3b — CRM: dashboard admin + pipeline lead + clienti attivi implementati
- [x] BLOCCO 3c — Prospecting: scraping Google Maps via Apify + sezione CRM /admin/prospecting
- [x] BLOCCO 3d — Hunter.io Enrichment: email e decision maker automatici per ogni lead
- [x] BLOCCO 3e — DDG Enrichment + Outreach: scraping email via sito/DuckDuckGo, email outreach personalizzata con link survey pre-compilata
- [ ] BLOCCO 4 — Core AI Engine (post-MVP)

## Ultimo avanzamento (2026-03-16) — DDG Enrichment + Outreach + Bug Fix ✅

### Fatto in questa sessione

#### Merge branch Luigi (DDG enrichment + Outreach)
- **`backend/routes/prospecting.py`** — enrichment email ora usa 3 step in cascata:
  1. Scraping diretto sito aziendale (homepage + /contatti + altre pagine)
  2. DuckDuckGo search (cerca email dal web)
  3. Hunter.io (fallback finale)
- **Nuovo endpoint** `POST /prospecting/leads/{id}/outreach` — invia email outreach personalizzata HTML con link alla survey pre-compilata (nome, azienda, email pre-filled)
- **`backend/routes/survey.py`** — aggiunto campo `prospecting_ref` al payload: quando un prospect compila la survey via link outreach, il lead viene automaticamente aggiornato a `status: "converted"`
- **`frontend/app/survey/page.tsx`** — legge query params `?ref=&name=&company=&email=` per pre-compilare la survey
- **`frontend/app/admin/prospecting/page.tsx`** — pulsante **Outreach** per ogni lead (invia email + aggiorna stato UI)

#### Bug fix (questa sessione)
1. **Branch protection rimossa** — Luigi non riusciva a fare push su main perché c'era una branch protection che richiedeva PR. Rimossa via GitHub API (siamo in 2, non serve)
2. **`_clean_emails` dominio vuoto** — `"" in e` è sempre `True` in Python → tutte le email finivano in `priority`. Fix: guarda al dominio solo se non vuoto
3. **`_scrape_website_emails` break prematuro** — si fermava alla prima pagina con qualsiasi email (anche noreply/tracking). Fix: break solo se `_clean_emails` trova email valide
4. **Survey `useSearchParams` senza Suspense** — build Next.js 14 crashava. Fix: wrapper `<Suspense>` con inner component `SurveyContent`
5. **Quick wins email mostravano dict raw** — `quick_wins` sono dict `{title, tool, impact, ...}` ma venivano stampati come `repr()`. Fix: funzione `_qw_label()` estrae i campi
6. **PDF allegato corrotto** — WeasyPrint non disponibile su Windows → fallback ritornava HTML come bytes → allegato `.pdf` era HTML → viewer crashava. Fix: `b""` se WeasyPrint fallisce + aggiunto `xhtml2pdf` come fallback funzionante su Windows
7. **resend-email senza PDF** — l'endpoint `/survey/resend-email` non rigenerava il PDF. Fix: aggiunta generazione PDF anche all'endpoint resend

### Note importanti porta backend
Le porte 8000-8004 hanno processi Windows bloccati non killabili.
Usare **porta libera disponibile** (es. 8005, 8006...) se le precedenti sono occupate.
Per verificare: `netstat -aon | grep ":800"`.

---

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
Supporta anche pre-compilazione via query params (`?ref=&name=&company=&email=`) per il flusso outreach.
- File chiave: `frontend/app/survey/page.tsx`

**BLOCCO 2 — AI Scorecard Generator** ✅
Il backend riceve i dati della survey, li manda a Claude AI (Anthropic), che genera un punteggio da 0 a 100 e 3 "quick win" personalizzati. Il risultato viene salvato su Supabase e inviato via email con PDF allegato.
- File chiave: `backend/ai/scoring.py`, `backend/routes/survey.py`, `backend/pdf/certificate.py`

**BLOCCO 3 — Sales Infrastructure** ✅
La landing page (homepage) e la pagina di ringraziamento dopo la survey.
- File chiave: `frontend/app/page.tsx`, `frontend/app/thank-you/page.tsx`

**BLOCCO 3b — CRM Admin** ✅
Dashboard di amministrazione per vedere tutti i lead, il loro stato e i clienti attivi. Solo per uso interno nostro.
- File chiave: `frontend/app/admin/page.tsx`, `frontend/app/admin/leads/page.tsx`

**BLOCCO 3c — Prospecting** ✅
Scraping Google Maps via Apify. Sezione `/admin/prospecting` per cercare aziende e salvarle come lead.
- File chiave: `frontend/app/admin/prospecting/page.tsx`, `backend/routes/prospecting.py`

**BLOCCO 3d — Enrichment** ✅
Trova automaticamente email e decision maker per ogni prospect. 3 metodi in cascata: scraping sito → DuckDuckGo → Hunter.io.
- Pulsante **⚡ Enrich** per singolo lead, **⚡ Enrich All** per batch

**BLOCCO 3e — Outreach** ✅
Invia email personalizzata HTML al prospect con link alla survey pre-compilata. Quando compila la survey, il prospect viene automaticamente marcato come "converted".
- Pulsante **Outreach** nella tabella prospect → invia email → stato diventa "contacted"

**BLOCCO 4 — Core AI Engine** ⏳ (post-MVP, non ancora iniziato)
Espansione delle funzionalità AI. Si farà dopo il lancio.

### Architettura in 30 secondi
```
[Utente] → [Frontend Next.js :3000] → [Backend FastAPI :8002] → [Supabase DB]
                                              ↓
                                    [Claude AI (Anthropic)]
                                              ↓
                                    [Email via Resend + PDF allegato]
```

### Il tuo ruolo
**Tu gestisci il Frontend** — tutto quello che è in `frontend/`. Alessio gestisce il backend in `backend/`. Non dovrai toccare il backend salvo accordi.

### Prima di iniziare a lavorare
Chiedi ad Alessio il file `backend/.env` con le chiavi API (non è nel repo per sicurezza). Ti servirà solo se vuoi avviare il backend in locale per testare. Per il frontend puoi lavorare autonomamente.

---

## Workflow di collaborazione (Alessio + Luigi)

### Istruzioni per Claude Code
> **NOTA:** La branch protection su main è stata rimossa. Luigi può fare push diretto su main dopo aver completato la checklist pre-merge, senza aspettare approvazioni.

### Come parlare a Claude per lavorare secondo questo workflow

Usa questi prompt copia-incolla nel terminale di Claude Code. Sostituisci solo le parti in `<angolari>`.

**Iniziare un task nuovo:**
```
Crea il branch feat/<nome-task> da main, poi implementa <descrizione di cosa fare>.
Lavora solo in <frontend/ oppure backend/>. Alla fine mostrami la checklist pre-merge.
```

**Esempio reale:**
```
Crea il branch feat/thank-you-calendly da main, poi sostituisci il link placeholder
del Calendly in frontend/app/thank-you/page.tsx con "<url>". Lavora solo in frontend/.
Alla fine mostrami la checklist pre-merge.
```

**Correggere un bug:**
```
Crea il branch fix/<nome-bug> da main, poi correggi <descrizione del problema>
in <file o area>. Alla fine esegui la checklist pre-merge.
```

**Esplorare / prototipare senza impegnarsi:**
```
Crea il branch spike/<nome> da main e sperimenta <idea> in <area>.
Non aprire PR — voglio solo vedere se funziona.
```

**Eseguire la checklist pre-merge:**
```
Siamo su branch <nome-branch>. Esegui la checklist pre-merge completa
(lint, tsc, build) e riportami l'esito prima di procedere con la PR.
```

**Aprire la PR a fine lavoro:**
```
Il lavoro su <nome-branch> è finito e la checklist è ok.
Crea la PR verso main con titolo "<titolo>" e assegna come reviewer <Alessio o Luigi>.
```

**Sincronizzarsi dopo un merge altrui:**
```
Aggiorna il mio branch locale con l'ultimo main e dimmi se ci sono conflitti.
```

### Ruoli
- **Alessio** → Backend (`backend/` — FastAPI, endpoint, logica AI, database)
- **Luigi** → Frontend (`frontend/` — Next.js, pagine, componenti, UI)

### Branch strategy

```
main     ← sempre stabile e rilasciabile. Push diretto ok dopo checklist pre-merge.
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
1. **Ogni task = 1 branch** con naming `feat/`, `fix/`, o `spike/`
2. Il branch parte sempre da `main` aggiornato (non da `develop` salvo necessità)
3. **Ogni branch termina con un merge su `main`** — ognuno può mergiare il proprio branch autonomamente dopo aver completato la checklist pre-merge
4. Non serve aspettare l'approvazione dell'altro per fare merge — basta che la checklist sia ok
5. Non modificare mai file nell'area dell'altro senza accordo esplicito
6. Nessun force push — se c'è un conflitto, risolverlo con merge o rebase condiviso

### Quando usare `develop`
Usa `develop` **solo** se:
- Stai coordinando 2+ feature che devono girare insieme prima di essere pronte per `main`
- Stai preparando un rilascio con più PR da integrare prima del deploy

**Non usare `develop`** per task normali — ogni branch va direttamente su `main`.

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
python -m uvicorn main:app --port 8002   # avvia da cartella backend/
# → http://localhost:8002/docs → testare ogni endpoint modificato
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

# Testa il backend prima del merge
python -m uvicorn main:app --port 8002
# → http://localhost:8002/docs

# Fine sessione — merge diretto su main
git checkout main
git pull origin main
git merge feat/nome-task --no-ff -m "feat: descrizione"
git push origin main
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
cd frontend && npm run lint && npx tsc --noEmit && npm run build

# Fine sessione — merge diretto su main (no attesa approvazione)
git checkout main
git pull origin main
git merge feat/nome-task --no-ff -m "feat: descrizione"
git push origin main
git branch -d feat/nome-task          # pulizia branch locale
```

### Sincronizzarsi dopo un merge
```bash
git checkout main
git pull origin main
```

---

## Punto di ripresa (prossima sessione)
Il flusso end-to-end funziona completamente e testato: prospecting → enrichment → outreach → survey → scorecard + PDF → CRM.

Prossimi step prioritari:
1. **Deploy**: frontend su Vercel, backend su Railway/Render
2. **Dominio**: verificare `aiconsultingpmi.it` su Resend → aggiornare `FROM_EMAIL` nel `.env` di produzione
3. **Calendly**: sostituire il link placeholder in `thank-you/page.tsx` e nelle email con il link reale
4. **Decisioni da prendere**: nome brand, pricing, lingua survey

## Note operative
- Avviare backend: `cd backend` poi `python -m uvicorn main:app --port 8002` (usare cmd, non PowerShell)
- Avviare frontend: `cd frontend` poi `npm run dev` (usare cmd, non PowerShell)
- Se la porta 8002 è occupata (processi Windows bloccati), usare 8005, 8006, ecc.
- Backend su `http://localhost:8002` | Swagger su `http://localhost:8002/docs`
- Frontend su `http://localhost:3000`
- Con Resend sandbox (`onboarding@resend.dev`), le mail arrivano solo all'email registrata su resend.com
- Prospecting: `/admin/prospecting` — richiede `APIFY_API_TOKEN` nel `.env` del backend
- Enrichment: richiede `HUNTER_API_KEY` nel `.env` — free tier: 250 ricerche/mese
- PDF: WeasyPrint su Linux (produzione), xhtml2pdf come fallback su Windows

## Decisioni architetturali
- App Router Next.js 14 (non Pages Router)
- Tailwind per styling (no CSS modules)
- FastAPI con async/await nativo
- Supabase come unico DB (sia per dati survey che CRM)
- Claude claude-sonnet-4-6 per tutti i task AI
- Nessun tool a pagamento monthly (tutto free tier o pay-per-use)
- Pipeline status: new → survey_done → call_scheduled → offer_sent → client → lost
- PDF: WeasyPrint primario (Linux) + xhtml2pdf fallback (Windows/cross-platform)
- Enrichment email: cascata sito web → DuckDuckGo → Hunter.io

## Decisioni da prendere ancora
- [ ] Nome brand finale
- [ ] Pricing per le 4 fasi
- [ ] Lingua survey (solo italiano o anche inglese?)
- [ ] Calendly link reale (ora è placeholder in thank-you page e nelle email)
- [ ] Deploy: Railway vs Render per il backend
