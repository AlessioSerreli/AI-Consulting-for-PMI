'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type PainKey = 'painEmail' | 'painDelegare' | 'painDati' | 'painErrori' | 'painTempo' | 'painMonitor'

interface FormData {
  nomeAzienda: string
  nomeContatto: string
  email: string
  telefono: string
  settore: string
  dipendenti: string
  strumenti: string[]
  processoKritico: string
  tempoEmail: number
  procDocumentati: string
  painEmail: number
  painDelegare: number
  painDati: number
  painErrori: number
  painTempo: number
  painMonitor: number
  usaAI: string
  preoccupazioni: string[]
  obiettivo: string
  tempistiche: string
  budget: string
  noteLibere: string
}

const INITIAL: FormData = {
  nomeAzienda: '', nomeContatto: '', email: '', telefono: '',
  settore: '', dipendenti: '', strumenti: [], processoKritico: '',
  tempoEmail: 2, procDocumentati: '',
  painEmail: 0, painDelegare: 0, painDati: 0,
  painErrori: 0, painTempo: 0, painMonitor: 0,
  usaAI: '', preoccupazioni: [],
  obiettivo: '', tempistiche: '', budget: '', noteLibere: '',
}

const C = {
  navy: '#0A0F1E',
  accent: '#F59E0B',
  green: '#10B981',
  white: '#F8FAFC',
  gray: '#94A3B8',
  light: '#E2E8F0',
  border: 'rgba(255,255,255,0.08)',
} as const

const PAIN_ITEMS: { key: PainKey; label: string }[] = [
  { key: 'painEmail', label: '📧 Email e riunioni che rubano troppo tempo' },
  { key: 'painDelegare', label: '🔄 Difficoltà a delegare e far crescere il team' },
  { key: 'painDati', label: '📊 Decisioni prese senza dati o informazioni chiare' },
  { key: 'painErrori', label: '⚠️ Errori ripetuti per mancanza di procedure' },
  { key: 'painTempo', label: '⏱️ Troppo tempo su attività manuali e ripetitive' },
  { key: 'painMonitor', label: '📉 Difficoltà a monitorare le performance aziendali' },
]

export default function SurveyPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [data, setData] = useState<FormData>(INITIAL)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const set = (field: keyof FormData, value: FormData[keyof FormData]) => {
    setData(prev => ({ ...prev, [field]: value }))
    setErrors(prev => { const n = { ...prev }; delete n[field]; return n })
  }

  const toggleArr = (field: 'strumenti' | 'preoccupazioni', value: string) => {
    const current = data[field] as string[]
    set(field, current.includes(value) ? current.filter(v => v !== value) : [...current, value])
  }

  const validate = (s: number): boolean => {
    const e: Record<string, string> = {}
    if (s === 1) {
      if (!data.nomeAzienda.trim()) e.nomeAzienda = 'Campo obbligatorio'
      if (!data.nomeContatto.trim()) e.nomeContatto = 'Campo obbligatorio'
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) e.email = "Inserisci un'email valida"
      if (!data.settore) e.settore = 'Seleziona un settore'
      if (!data.dipendenti) e.dipendenti = 'Seleziona il numero di dipendenti'
    }
    if (s === 2) {
      if (data.strumenti.length === 0) e.strumenti = 'Seleziona almeno uno strumento'
      if (!data.processoKritico) e.processoKritico = 'Seleziona un processo'
    }
    if (s === 3) {
      if (!data.usaAI) e.usaAI = "Seleziona un'opzione"
    }
    if (s === 4) {
      if (!data.obiettivo) e.obiettivo = 'Seleziona un obiettivo'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const nextStep = () => {
    if (!validate(step)) return
    setStep(s => s + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const prevStep = () => {
    setStep(s => s - 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const submit = async () => {
    if (!validate(4)) return
    setIsSubmitting(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const payload = {
        company_name: data.nomeAzienda,
        contact_name: data.nomeContatto,
        contact_email: data.email,
        sector: data.settore,
        employees: data.dipendenti,
        phone: data.telefono,
        tools: data.strumenti,
        critical_process: data.processoKritico,
        time_on_email: data.tempoEmail + 'h/giorno',
        processes_documented: data.procDocumentati,
        pain_email: data.painEmail,
        pain_delegare: data.painDelegare,
        pain_dati: data.painDati,
        pain_errori: data.painErrori,
        pain_tempo: data.painTempo,
        pain_monitor: data.painMonitor,
        ai_usage: data.usaAI,
        ai_concerns: data.preoccupazioni,
        objective: data.obiettivo,
        timeline: data.tempistiche,
        budget: data.budget,
        free_notes: data.noteLibere,
      }
      const res = await fetch(`${apiUrl}/survey`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Errore server')
      setIsSuccess(true)
      setTimeout(() => router.push('/thank-you'), 3000)
    } catch {
      setErrors({ submit: 'Si è verificato un errore. Riprova tra qualche istante.' })
      setIsSubmitting(false)
    }
  }

  const progress = isSuccess ? 100 : (step / 4) * 100

  const cardStyle = (selected: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 18px',
    background: selected ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.03)',
    border: `1.5px solid ${selected ? C.accent : C.border}`,
    borderRadius: '10px',
    fontSize: '14px',
    color: selected ? C.white : C.light,
    cursor: 'pointer',
    transition: 'all 0.2s',
    userSelect: 'none',
  })

  const inputStyle = (hasError = false): React.CSSProperties => ({
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: `1.5px solid ${hasError ? '#EF4444' : C.border}`,
    borderRadius: '10px',
    padding: '14px 18px',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '15px',
    color: C.white,
    outline: 'none',
    transition: 'border-color 0.2s',
  })

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    color: C.light,
    marginBottom: '8px',
    letterSpacing: '0.02em',
  }

  const errStyle: React.CSSProperties = {
    fontSize: '12px',
    color: '#EF4444',
    marginTop: '6px',
    fontFamily: "'DM Mono', monospace",
  }

  const btnNext: React.CSSProperties = {
    background: C.accent,
    color: C.navy,
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 700,
    fontSize: '15px',
    padding: '16px 36px',
    borderRadius: '10px',
    border: 'none',
    cursor: 'pointer',
  }

  const btnBack: React.CSSProperties = {
    background: 'transparent',
    color: C.gray,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '14px',
    padding: '16px 24px',
    borderRadius: '10px',
    border: `1.5px solid ${C.border}`,
    cursor: 'pointer',
  }

  const headingStyle: React.CSSProperties = {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 'clamp(36px, 5vw, 60px)',
    lineHeight: 0.95,
    letterSpacing: '0.02em',
    color: C.white,
    marginBottom: '10px',
  }

  const tagStyle: React.CSSProperties = {
    fontFamily: "'DM Mono', monospace",
    fontSize: '11px',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    color: C.accent,
    marginBottom: '12px',
  }

  const subStyle: React.CSSProperties = {
    fontSize: '15px',
    color: C.gray,
    lineHeight: 1.6,
    marginBottom: '40px',
    maxWidth: '520px',
  }

  const grid2: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    marginBottom: '24px',
  }

  const grid2cards: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
  }

  const grid3cards: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px',
  }

  const icon = (e: string) => (
    <span style={{ fontSize: '20px', width: '28px', textAlign: 'center', flexShrink: 0 }}>{e}</span>
  )

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: C.navy, color: C.white, minHeight: '100vh' }}>
      {/* Background grid */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />

      {/* Topbar */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: '64px',
        background: 'rgba(10,15,30,0.95)', backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 40px', zIndex: 100,
      }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '22px', letterSpacing: '0.08em' }}>
          AI<span style={{ color: C.accent }}>.</span>PMI
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, maxWidth: '400px', margin: '0 auto' }}>
          <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: C.accent, borderRadius: '2px', width: `${progress}%`, transition: 'width 0.5s cubic-bezier(.4,0,.2,1)' }} />
          </div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: C.gray, whiteSpace: 'nowrap', letterSpacing: '0.08em' }}>
            {isSuccess ? 'COMPLETATO ✓' : `SEZIONE ${step} / 4`}
          </div>
        </div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: C.gray }}>DIAGNOSI GRATUITA</div>
      </div>

      {/* Loading overlay */}
      {isSubmitting && !isSuccess && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,15,30,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, flexDirection: 'column', gap: '20px' }}>
          <div className="survey-spinner" />
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '13px', color: C.gray, letterSpacing: '0.1em' }}>INVIO IN CORSO...</div>
        </div>
      )}

      {/* Main content */}
      <div style={{ paddingTop: '64px', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{ width: '100%', maxWidth: '780px', padding: '60px 40px' }}>

          {/* SUCCESS */}
          {isSuccess && (
            <div className="survey-fadein" style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ width: '80px', height: '80px', background: 'rgba(16,185,129,0.15)', border: `2px solid ${C.green}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px', fontSize: '36px' }}>✓</div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '52px', color: C.white, letterSpacing: '0.02em', marginBottom: '16px' }}>RICHIESTA INVIATA!</div>
              <p style={{ fontSize: '16px', color: C.gray, lineHeight: 1.7, maxWidth: '480px', margin: '0 auto 32px' }}>
                Abbiamo ricevuto la tua diagnosi. Entro <strong style={{ color: C.white }}>5 giorni lavorativi</strong> riceverai il tuo report personalizzato con il <strong style={{ color: C.accent }}>Certificato di Efficienza Operativa</strong>.
              </p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', padding: '14px 24px', borderRadius: '10px', fontSize: '14px', color: C.accent, fontWeight: 600 }}>
                ★ Il tuo Certificato di Efficienza Operativa è in preparazione
              </div>
              <p style={{ marginTop: '24px', fontSize: '13px', color: C.gray }}>Controlla la tua email — riceverai una conferma a breve.</p>
            </div>
          )}

          {/* STEP 1 — Anagrafica */}
          {!isSuccess && step === 1 && (
            <div className="survey-fadein">
              <div style={tagStyle}>Sezione 1 di 4 — Anagrafica Aziendale</div>
              <h1 style={headingStyle}>PARLACI<br />DELLA TUA<br />AZIENDA</h1>
              <p style={subStyle}>Pochi dati per capire il tuo contesto. Il report sarà completamente personalizzato.</p>

              <div style={grid2}>
                <div>
                  <label style={labelStyle}>Nome Azienda <span style={{ color: C.accent }}>*</span></label>
                  <input className="survey-input" style={inputStyle(!!errors.nomeAzienda)} value={data.nomeAzienda} onChange={e => set('nomeAzienda', e.target.value)} placeholder="Es. Rossi Srl" />
                  {errors.nomeAzienda && <div style={errStyle}>{errors.nomeAzienda}</div>}
                </div>
                <div>
                  <label style={labelStyle}>Nome e Cognome <span style={{ color: C.accent }}>*</span></label>
                  <input className="survey-input" style={inputStyle(!!errors.nomeContatto)} value={data.nomeContatto} onChange={e => set('nomeContatto', e.target.value)} placeholder="Es. Mario Rossi" />
                  {errors.nomeContatto && <div style={errStyle}>{errors.nomeContatto}</div>}
                </div>
              </div>

              <div style={grid2}>
                <div>
                  <label style={labelStyle}>Email aziendale <span style={{ color: C.accent }}>*</span></label>
                  <input type="email" className="survey-input" style={inputStyle(!!errors.email)} value={data.email} onChange={e => set('email', e.target.value)} placeholder="mario@azienda.it" />
                  {errors.email && <div style={errStyle}>{errors.email}</div>}
                </div>
                <div>
                  <label style={labelStyle}>Telefono</label>
                  <input type="tel" className="survey-input" style={inputStyle()} value={data.telefono} onChange={e => set('telefono', e.target.value)} placeholder="+39 000 000 0000" />
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>Settore di attività <span style={{ color: C.accent }}>*</span></label>
                <select className="survey-input" style={{ ...inputStyle(!!errors.settore), cursor: 'pointer' }} value={data.settore} onChange={e => set('settore', e.target.value)}>
                  <option value="">— Seleziona il settore —</option>
                  {['Manifatturiero / Produzione', 'Commercio / Retail', 'Servizi alle imprese', 'Edilizia / Costruzioni', 'Logistica / Trasporti', 'Alimentare / Ristorazione', 'Salute / Benessere', 'Tecnologia / IT', 'Studi professionali (Legale, Contabile...)', 'Turismo / Hospitality', 'Altro'].map(s => (
                    <option key={s} value={s} style={{ background: '#111827' }}>{s}</option>
                  ))}
                </select>
                {errors.settore && <div style={errStyle}>{errors.settore}</div>}
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>Numero di dipendenti <span style={{ color: C.accent }}>*</span></label>
                <div style={grid3cards}>
                  {[['👤', '1 – 5', '1-5'], ['👥', '6 – 15', '6-15'], ['🏢', '16 – 50', '16-50'], ['🏭', '51 – 100', '51-100'], ['🌐', '100+', '100+']].map(([emoji, label, val]) => (
                    <div key={val} style={cardStyle(data.dipendenti === val)} onClick={() => set('dipendenti', val)}>
                      {icon(emoji)} {label}
                    </div>
                  ))}
                </div>
                {errors.dipendenti && <div style={errStyle}>{errors.dipendenti}</div>}
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '40px' }}>
                <button style={btnNext} onClick={nextStep}>Continua →</button>
              </div>
            </div>
          )}

          {/* STEP 2 — Processi */}
          {!isSuccess && step === 2 && (
            <div className="survey-fadein">
              <div style={tagStyle}>Sezione 2 di 4 — Processi e Strumenti</div>
              <h1 style={headingStyle}>COME<br />LAVORATE<br />OGGI?</h1>
              <p style={subStyle}>Vogliamo capire gli strumenti che usi e dove si concentrano le inefficienze.</p>

              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>
                  Quali strumenti usi per gestire il lavoro? <span style={{ color: C.accent }}>*</span>{' '}
                  <span style={{ color: C.gray, fontWeight: 400 }}>(più risposte)</span>
                </label>
                <div style={grid2cards}>
                  {[['📧', 'Email / WhatsApp'], ['📊', 'Fogli Excel / Google Sheets'], ['🖥️', 'Gestionale ERP'], ['🤝', 'CRM (gestione clienti)'], ['📋', 'Project management'], ['📝', 'Carta / memoria']].map(([e, label]) => (
                    <div key={label} style={cardStyle(data.strumenti.includes(label))} onClick={() => toggleArr('strumenti', label)}>
                      {icon(e)} {label}
                    </div>
                  ))}
                </div>
                {errors.strumenti && <div style={errStyle}>{errors.strumenti}</div>}
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>Qual è il processo aziendale più critico per voi? <span style={{ color: C.accent }}>*</span></label>
                <select className="survey-input" style={{ ...inputStyle(!!errors.processoKritico), cursor: 'pointer' }} value={data.processoKritico} onChange={e => set('processoKritico', e.target.value)}>
                  <option value="">— Seleziona —</option>
                  {['Gestione ordini e clienti', 'Produzione e operations', 'Amministrazione e contabilità', 'Vendite e marketing', 'Risorse umane e formazione', 'Logistica e magazzino', 'Comunicazione interna', 'Reportistica e analisi dati'].map(v => (
                    <option key={v} value={v} style={{ background: '#111827' }}>{v}</option>
                  ))}
                </select>
                {errors.processoKritico && <div style={errStyle}>{errors.processoKritico}</div>}
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>Quanto tempo passa mediamente il team in riunioni o email ogni giorno?</label>
                <input type="range" className="survey-range" min={0} max={8} step={0.5} value={data.tempoEmail}
                  onChange={e => set('tempoEmail', parseFloat(e.target.value))}
                  style={{ width: '100%' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                  <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '28px', color: C.accent }}>{data.tempoEmail}h</span>
                  <span style={{ fontSize: '12px', color: C.gray }}>per persona / giorno</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'DM Mono', monospace", fontSize: '11px', color: C.gray }}>
                  <span>0h</span><span>4h</span><span>8h</span>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>I vostri processi sono documentati?</label>
                <div style={grid2cards}>
                  {[['🧠', 'No, tutto nella testa delle persone'], ['📄', 'Parzialmente, solo alcuni processi'], ['📁', 'Sì, ma non aggiornati'], ['✅', 'Sì, completi e aggiornati']].map(([e, label]) => (
                    <div key={label} style={cardStyle(data.procDocumentati === label)} onClick={() => set('procDocumentati', label)}>
                      {icon(e)} {label}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '40px' }}>
                <button style={btnBack} onClick={prevStep}>← Indietro</button>
                <button style={btnNext} onClick={nextStep}>Continua →</button>
              </div>
            </div>
          )}

          {/* STEP 3 — Criticità */}
          {!isSuccess && step === 3 && (
            <div className="survey-fadein">
              <div style={tagStyle}>Sezione 3 di 4 — Criticità e Priorità</div>
              <h1 style={headingStyle}>DOVE<br />SENTI PIÙ<br />IL DOLORE?</h1>
              <p style={subStyle}>Valuta quanto questi problemi impattano sulla tua azienda oggi. 1 = poco, 5 = molto.</p>

              <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`, borderRadius: '12px', padding: '24px', marginBottom: '32px' }}>
                {PAIN_ITEMS.map(({ key, label }) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 0', borderBottom: `1px solid rgba(255,255,255,0.05)` }}>
                    <div style={{ flex: 1, fontSize: '14px', color: C.light }}>{label}</div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {[1, 2, 3, 4, 5].map(n => (
                        <button key={n} onClick={() => set(key, n)} style={{
                          width: '32px', height: '32px', borderRadius: '8px',
                          border: `1.5px solid ${(data[key] as number) >= n ? C.accent : C.border}`,
                          background: (data[key] as number) >= n ? 'rgba(245,158,11,0.15)' : 'transparent',
                          color: (data[key] as number) >= n ? C.accent : C.gray,
                          cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>{n}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>Hai già provato a usare strumenti AI? <span style={{ color: C.accent }}>*</span></label>
                <div style={grid2cards}>
                  {[['🚫', 'No, mai provato'], ['💬', 'Sì, ChatGPT informalmente'], ['🛠️', 'Sì, qualche strumento'], ['🚀', 'Sì, in modo strutturato']].map(([e, label]) => (
                    <div key={label} style={cardStyle(data.usaAI === label)} onClick={() => set('usaAI', label)}>
                      {icon(e)} {label}
                    </div>
                  ))}
                </div>
                {errors.usaAI && <div style={errStyle}>{errors.usaAI}</div>}
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>Qual è la tua principale preoccupazione rispetto all'AI? <span style={{ color: C.gray, fontWeight: 400 }}>(più risposte)</span></label>
                <div style={grid2cards}>
                  {[['💰', 'Costi troppo alti'], ['🗺️', 'Non so da dove iniziare'], ['👥', 'Il team non è pronto'], ['🔒', 'Privacy e sicurezza dati'], ['✅', 'Nessuna preoccupazione'], ['🤔', 'Non vedo il beneficio']].map(([e, label]) => (
                    <div key={label} style={cardStyle(data.preoccupazioni.includes(label))} onClick={() => toggleArr('preoccupazioni', label)}>
                      {icon(e)} {label}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '40px' }}>
                <button style={btnBack} onClick={prevStep}>← Indietro</button>
                <button style={btnNext} onClick={nextStep}>Continua →</button>
              </div>
            </div>
          )}

          {/* STEP 4 — Obiettivi */}
          {!isSuccess && step === 4 && (
            <div className="survey-fadein">
              <div style={tagStyle}>Sezione 4 di 4 — Obiettivi</div>
              <h1 style={headingStyle}>COSA<br />VUOI<br />OTTENERE?</h1>
              <p style={subStyle}>Ultime domande per calibrare il tuo report e capire come possiamo aiutarti al meglio.</p>

              <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '10px', padding: '16px 20px', fontSize: '13px', color: C.gray, lineHeight: 1.6, marginBottom: '28px' }}>
                ⭐ Riceverai il tuo <strong style={{ color: C.accent }}>report personalizzato + Certificato di Efficienza Operativa</strong> entro 5 giorni lavorativi, completamente gratuito.
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>Qual è il tuo obiettivo principale? <span style={{ color: C.accent }}>*</span></label>
                <div style={grid2cards}>
                  {[['⏱️', 'Risparmiare tempo, ridurre il caos'], ['💶', 'Ridurre i costi operativi'], ['📈', 'Crescere senza assumere'], ['🎯', 'Migliorare la qualità'], ['🏆', 'Essere più competitivi'], ['🤲', 'Delegare meglio']].map(([e, label]) => (
                    <div key={label} style={cardStyle(data.obiettivo === label)} onClick={() => set('obiettivo', label)}>
                      {icon(e)} {label}
                    </div>
                  ))}
                </div>
                {errors.obiettivo && <div style={errStyle}>{errors.obiettivo}</div>}
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>In quanto tempo vorresti vedere i primi risultati?</label>
                <div style={grid3cards}>
                  {[['⚡', 'Subito (1 mese)'], ['📅', 'Breve (3 mesi)'], ['🗓️', 'Medio (6-12 mesi)']].map(([e, label]) => (
                    <div key={label} style={cardStyle(data.tempistiche === label)} onClick={() => set('tempistiche', label)}>
                      {icon(e)} {label}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>Budget indicativo per un progetto di ottimizzazione</label>
                <div style={grid2cards}>
                  {[['🆓', 'Solo diagnosi gratuita'], ['💼', 'Fino a 2.000€'], ['📦', '2.000€ – 5.000€'], ['🏗️', 'Oltre 5.000€']].map(([e, label]) => (
                    <div key={label} style={cardStyle(data.budget === label)} onClick={() => set('budget', label)}>
                      {icon(e)} {label}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>Vuoi aggiungere qualcosa che non abbiamo chiesto?</label>
                <textarea className="survey-input" value={data.noteLibere} onChange={e => set('noteLibere', e.target.value)}
                  placeholder="Descrivi liberamente la tua situazione, le tue sfide o quello che ti aspetti dal report..."
                  style={{ ...inputStyle(), resize: 'vertical', minHeight: '100px' }} />
              </div>

              {errors.submit && <p style={{ color: '#EF4444', fontSize: '14px', marginBottom: '16px' }}>{errors.submit}</p>}

              <div style={{ display: 'flex', gap: '12px', marginTop: '40px' }}>
                <button style={btnBack} onClick={prevStep}>← Indietro</button>
                <button style={{ ...btnNext, opacity: isSubmitting ? 0.5 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
                  onClick={submit} disabled={isSubmitting}>
                  ✉️ Invia e ricevi il report gratuito
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
