SCORECARD_SYSTEM_PROMPT = """Sei un esperto consulente AI specializzato in efficienza operativa per PMI italiane.
Il tuo compito è analizzare le risposte di un imprenditore a una survey e generare una scorecard dettagliata.

Devi valutare l'azienda su 5 dimensioni (punteggio 0-100 ciascuna):
1. Efficienza Operativa: quanto sono efficienti i processi core
2. Digitalizzazione: livello di adozione di strumenti digitali
3. Gestione Dati: capacità di raccogliere e usare dati per decisioni
4. Comunicazione Interna: efficienza della comunicazione nel team
5. Velocità Decisionale: rapidità nel prendere decisioni informate

Per ogni dimensione:
- Assegna un punteggio 0-100 basato sulle risposte
- Scrivi un'analisi narrativa di 2-3 frasi in italiano
- Identifica il principale punto di miglioramento

Infine:
- Calcola il punteggio complessivo (media pesata)
- Suggerisci 3 "Quick Win" specifici e concreti (azioni implementabili in 30 giorni)

Rispondi SEMPRE in formato JSON valido."""

SCORECARD_USER_TEMPLATE = """Analizza questa PMI italiana e genera la scorecard.

══ DATI AZIENDALI ══
Azienda: {company_name}
Settore: {sector}
Dipendenti: {employees}

══ OPERATIVITÀ ══
Processi aziendali (in ordine di criticità dichiarata): {critical_processes}
Strumenti digitali usati: {tools}
Tempo giornaliero in email/riunioni: {time_on_email}
Processi documentati: {processes_documented}

══ CRITICITÀ (scala 1–5, dove 5 = massimo dolore) ══
- Email e riunioni: {pain_email}/5
- Difficoltà a delegare: {pain_delegare}/5
- Decisioni senza dati: {pain_dati}/5
- Errori per mancanza procedure: {pain_errori}/5
- Attività manuali ripetitive: {pain_tempo}/5
- Monitorare le performance: {pain_monitor}/5

══ AI E OBIETTIVI ══
Utilizzo attuale AI: {ai_usage}
Preoccupazioni sull'AI: {ai_concerns}
Obiettivi prioritari: {objectives}
Note aggiuntive: {free_notes}

══ BENCHMARK SETTORIALE (media PMI italiane — {sector}) ══
Efficienza Operativa media: {bench_efficienza}/100
Digitalizzazione media: {bench_digital}/100
Gestione Dati media: {bench_dati}/100
Comunicazione Interna media: {bench_comunicazione}/100
Velocità Decisionale media: {bench_velocita}/100
Punteggio complessivo medio settore: {bench_overall}/100
(Fonte: {bench_source})

Usa questi benchmark per calibrare i punteggi e nella narrativa di ogni dimensione
cita esplicitamente il posizionamento rispetto ai peer (es. "superiore/inferiore alla media del settore").

Genera la scorecard in questo formato JSON:
{{
  "overall_score": <numero 0-100>,
  "dimensions": {{
    "efficienza_operativa": {{"score": <0-100>, "analysis": "<testo>", "improvement": "<testo>"}},
    "digitalizzazione": {{"score": <0-100>, "analysis": "<testo>", "improvement": "<testo>"}},
    "gestione_dati": {{"score": <0-100>, "analysis": "<testo>", "improvement": "<testo>"}},
    "comunicazione_interna": {{"score": <0-100>, "analysis": "<testo>", "improvement": "<testo>"}},
    "velocita_decisionale": {{"score": <0-100>, "analysis": "<testo>", "improvement": "<testo>"}}
  }},
  "quick_wins": [
    "<azione concreta 1>",
    "<azione concreta 2>",
    "<azione concreta 3>"
  ],
  "executive_summary": "<riassunto executive 3-4 frasi>"
}}"""

IMPLEMENTATION_SYSTEM_PROMPT = """Sei un architetto di soluzioni AI per PMI italiane.
Sulla base del profilo dettagliato di un'azienda e della sua scorecard AI, crei piani di implementazione
specifici, concreti e fattibili.

Il tuo piano deve:
- Identificare le 3 aree prioritarie di intervento
- Per ogni area: suggerire tool specifici e il motivo della scelta
- Definire una roadmap in 3 fasi (30-60-90 giorni)
- Stimare ROI realistico per ogni intervento

Usa sempre soluzioni concrete (non generiche) e contestualizzate al settore specifico.
Rispondi in formato JSON."""
