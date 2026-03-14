# Team Workflow — AI Consulting for PMI

> Guida operativa per Alessio e Luigi. Aggiornata: 2026-03-14.

---

## Panoramica

Due sviluppatori, un repo, zero frizioni. Il modello è semplice:

```
[main] ← branch stabile, sempre deployabile
   ↑
[feat/xxx] o [fix/xxx] o [spike/xxx]  ← branch di lavoro
   ↑
[clone locale sviluppatore]
```

Ogni sviluppatore lavora nel proprio clone locale. Il codice arriva su `main` solo tramite Pull Request approvata dall'altro.

---

## Ruoli e responsabilità

| Sviluppatore | Area | Cartella |
|---|---|---|
| **Alessio** | Backend — FastAPI, AI, database, endpoint | `backend/` |
| **Luigi** | Frontend — Next.js, componenti, UI, pagine | `frontend/` |

Regola: ognuno lavora nella propria area. Se serve toccare l'area dell'altro (es. aggiornare un'interfaccia API condivisa), **accordarsi prima** via messaggio.

---

## Workflow quotidiano — passo per passo

### 1. Inizio sessione

```bash
# Assicurarsi di avere main aggiornato
git checkout main
git pull origin main
```

### 2. Creare un branch per il task

```bash
git checkout -b feat/nome-descrittivo
# oppure:
git checkout -b fix/nome-bug
git checkout -b spike/nome-esperimento
```

> Scegli un nome che descrive il task, non l'autore. Es: `feat/survey-drag-rank`, non `luigi-lavora`.

### 3. Lavorare in locale

```bash
# Commit frequenti e piccoli — meglio tanti piccoli che uno enorme
git add frontend/         # o backend/ — solo la tua area
git commit -m "feat: aggiungi drag-to-rank alla domanda 3"

# Continua a fare commit mentre lavori...
git commit -m "feat: aggiungi animazione di feedback al drop"
git commit -m "fix: correggi ordine iniziale elementi"
```

### 4. Checklist pre-PR

Prima di aprire la PR, **eseguire sempre**:

**Frontend (Luigi):**
```bash
cd frontend
npm run lint          # zero errori
npx tsc --noEmit      # zero errori TypeScript
npm run build         # la build non deve rompersi
```

**Backend (Alessio):**
```bash
cd backend
python -m uvicorn main:app --reload
# → aprire http://localhost:8000/docs
# → testare ogni endpoint nuovo o modificato manualmente
```

**Entrambi — review personale:**
- [ ] Il codice fa esattamente quello che il task richiedeva
- [ ] Nessuna chiave API o file `.env` incluso nel commit (`git status` per verificare)
- [ ] Nessun `console.log()` o `print()` di debug rimasto nel codice
- [ ] Il branch è basato sull'ultimo `main` (se `main` è andato avanti, fare `git rebase main`)

### 5. Aprire la Pull Request

```bash
git push origin feat/nome-descrittivo
```

Su GitHub:
1. Vai su **github.com/AlessioSerreli/AI-Consulting-for-PMI**
2. Clicca **"Compare & pull request"** (appare in automatico)
3. **Base branch: `main`** (verificare sempre)
4. Titolo PR: descrizione chiara del task (es. `feat: drag-to-rank per sezione processi`)
5. Descrizione: cosa hai fatto, cosa testare, screenshot se è UI
6. **Assign reviewer**: l'altro sviluppatore
7. Clicca **"Create pull request"**

### 6. Review e merge

Il reviewer:
1. Legge il diff su GitHub
2. Se va bene → **"Approve"** → **"Submit review"**
3. Clicca **"Merge pull request"** → usa **"Squash and merge"** per mantenere `main` pulita
4. Elimina il branch dopo il merge (GitHub lo propone automaticamente)

L'autore della PR:
```bash
git checkout main
git pull origin main
git branch -d feat/nome-descrittivo   # pulizia locale
```

---

## Naming convention branch — quando usare cosa

### `feat/<nome>`
Per qualsiasi nuova funzionalità, componente, pagina, endpoint.

```
feat/survey-drag-rank
feat/crm-export-csv
feat/landing-hero-redesign
feat/certificate-pdf
feat/email-confirmation-template
```

### `fix/<nome>`
Per bug fix, correzioni di comportamento errato, hotfix.

```
fix/email-not-sending
fix/survey-progress-bar-stuck
fix/crm-stats-null-pointer
fix/typescript-strict-error
```

### `spike/<nome>`
Per esperimenti, prototipi, esplorazioni tecniche. Il codice di un spike può essere buttato — serve per imparare. **Non richiedono standard qualità piena**, ma devono comunque passare per PR se vengono mergiati.

```
spike/weasyprint-alternative
spike/ai-streaming-response
spike/supabase-realtime
```

---

## Quando usare `develop` (e quando no)

### Non usare `develop` se:
- Stai lavorando su un task indipendente → vai diretto su `main` via PR
- La feature è auto-contenuta nella tua area (frontend o backend)
- Non hai bisogno di testare la tua feature con codice non ancora su `main`

Questo è il 95% dei casi normali.

### Usa `develop` solo se:
- Alessio e Luigi stanno lavorando su feature strettamente correlate (es. nuovo endpoint + nuovo componente che lo chiama) e devono testarle insieme **prima** che vadano su `main`
- Si sta preparando un rilascio con più PR da integrare simultaneamente

In quel caso:
```bash
# Entrambi aprono PR verso develop invece che main
git checkout develop
git pull origin develop
git checkout -b feat/mia-feature
# ... lavoro ...
git push origin feat/mia-feature
# PR → base: develop

# Quando tutto è testato su develop → PR develop → main
```

---

## Esempio completo — dalla task al merge

**Scenario:** Luigi deve aggiungere un componente di feedback dopo la survey.

```bash
# 1. Aggiorna main
git checkout main
git pull origin main

# 2. Crea branch
git checkout -b feat/thank-you-feedback-widget

# 3. Lavora
# ... modifica frontend/app/thank-you/page.tsx ...
# ... crea frontend/components/FeedbackWidget.tsx ...

git add frontend/app/thank-you/page.tsx
git commit -m "feat: aggiungi sezione feedback al thank-you"

git add frontend/components/FeedbackWidget.tsx
git commit -m "feat: crea componente FeedbackWidget con stelle"

# 4. Checklist pre-PR
cd frontend
npm run lint        # ✓ ok
npx tsc --noEmit    # ✓ ok
npm run build       # ✓ ok

# 5. Push e PR
git push origin feat/thank-you-feedback-widget
# → GitHub → PR → base: main → reviewer: Alessio

# --- Alessio fa review, approva, mergia ---

# 6. Pulizia
git checkout main
git pull origin main
git branch -d feat/thank-you-feedback-widget
```

---

## Conflitti e situazioni speciali

### Se main è andato avanti mentre lavoravi
```bash
git fetch origin
git rebase origin/main   # riapplica i tuoi commit sopra l'ultimo main
# risolvi eventuali conflitti
git push origin feat/nome-task --force-with-lease  # l'unico caso in cui il force è accettabile
```

### Se c'è un conflitto da risolvere
Non fare mai `git push --force` su un branch condiviso. Se il conflitto è complesso, risolverlo insieme in call.

### Hotfix urgente su produzione
```bash
git checkout main
git pull origin main
git checkout -b fix/hotfix-nome-critico
# fix rapido
git push origin fix/hotfix-nome-critico
# PR → main → review veloce → merge immediato
```

---

## Convenzioni commit message

```
feat: breve descrizione in italiano o inglese
fix: breve descrizione
refactor: breve descrizione
docs: breve descrizione
chore: breve descrizione (dipendenze, config, ecc.)
```

Esempi:
```
feat: aggiungi drag-to-rank alla domanda processi
fix: correggi errore 500 su /crm/stats con lead vuoti
docs: aggiorna CLAUDE.md con nuovi endpoint
chore: aggiorna dipendenze frontend
```

---

## TODO: CI automatica con GitHub Actions

Non ancora configurata. Quando si aggiunge, il file va in `.github/workflows/ci.yml`.

Template suggerito per frontend:
```yaml
name: CI Frontend
on:
  pull_request:
    branches: [main]
    paths: ['frontend/**']
jobs:
  lint-and-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      - run: npm ci
        working-directory: frontend
      - run: npm run lint
        working-directory: frontend
      - run: npx tsc --noEmit
        working-directory: frontend
      - run: npm run build
        working-directory: frontend
```

Template suggerito per backend (dopo aver installato `ruff` e `pytest`):
```yaml
name: CI Backend
on:
  pull_request:
    branches: [main]
    paths: ['backend/**']
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - run: pip install ruff
      - run: ruff check backend/
```
