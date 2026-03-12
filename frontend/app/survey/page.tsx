'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Brain, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react'

interface Answer {
  questionId: string
  value: string | string[] | number
}

interface Question {
  id: string
  section: string
  type: 'text' | 'select' | 'multiselect' | 'scale' | 'number'
  question: string
  subtitle?: string
  options?: string[]
  min?: number
  max?: number
  required?: boolean
  showIf?: { questionId: string; value: string | string[] }
}

const questions: Question[] = [
  // SEZIONE 1: Anagrafica
  {
    id: 'company_name',
    section: 'Anagrafica',
    type: 'text',
    question: 'Come si chiama la tua azienda?',
    subtitle: 'Useremo questo nome nella tua scorecard personalizzata.',
    required: true,
  },
  {
    id: 'sector',
    section: 'Anagrafica',
    type: 'select',
    question: 'In quale settore opera la tua azienda?',
    options: ['Manifattura/Produzione', 'Commercio/Retail', 'Servizi Professionali', 'Edilizia/Costruzioni', 'Food & Beverage', 'Logistica/Trasporti', 'Tecnologia', 'Altro'],
    required: true,
  },
  {
    id: 'employees',
    section: 'Struttura',
    type: 'select',
    question: 'Quanti dipendenti ha la tua azienda?',
    options: ['1-5', '6-15', '16-30', '31-50'],
    required: true,
  },
  {
    id: 'founded_year',
    section: 'Anagrafica',
    type: 'select',
    question: 'Da quanti anni è attiva l\'azienda?',
    options: ['Meno di 2 anni', '2-5 anni', '5-10 anni', 'Più di 10 anni'],
    required: true,
  },
  // SEZIONE 2: Processi
  {
    id: 'main_processes',
    section: 'Processi',
    type: 'multiselect',
    question: 'Quali sono i processi principali della tua azienda?',
    subtitle: 'Seleziona tutti quelli che si applicano.',
    options: ['Gestione ordini/clienti', 'Produzione/erogazione servizio', 'Contabilità/amministrazione', 'Vendite e marketing', 'Gestione fornitori', 'HR e onboarding', 'Reportistica/analisi dati', 'Comunicazione interna'],
    required: true,
  },
  {
    id: 'manual_processes',
    section: 'Processi',
    type: 'scale',
    question: 'Quanto sono manuali i tuoi processi principali?',
    subtitle: '1 = tutto automatizzato, 10 = tutto fatto a mano',
    min: 1,
    max: 10,
    required: true,
  },
  {
    id: 'time_waste',
    section: 'Processi',
    type: 'select',
    question: 'In quale area si perde più tempo ogni settimana?',
    options: ['Inserimento dati manuale', 'Comunicazioni ripetitive (email, messaggi)', 'Ricerca informazioni/documenti', 'Reportistica e analisi', 'Coordinamento del team', 'Gestione reclami/problemi', 'Fatturazione e amministrazione'],
    required: true,
  },
  // SEZIONE 3: Digital
  {
    id: 'current_tools',
    section: 'Digitalizzazione',
    type: 'multiselect',
    question: 'Quali strumenti digitali usi già in azienda?',
    subtitle: 'Seleziona tutti quelli attivi.',
    options: ['Excel/Google Sheets', 'Software gestionale (ERP)', 'CRM', 'Software contabilità', 'Chat aziendale (Slack/Teams)', 'Gestione progetti (Trello/Asana)', 'Email marketing', 'Nessuno strumento specifico'],
    required: true,
  },
  {
    id: 'digital_satisfaction',
    section: 'Digitalizzazione',
    type: 'scale',
    question: 'Quanto sei soddisfatto degli strumenti digitali attuali?',
    subtitle: '1 = molto insoddisfatto, 10 = molto soddisfatto',
    min: 1,
    max: 10,
    required: true,
  },
  // SEZIONE 4: Problemi
  {
    id: 'main_pain',
    section: 'Problemi',
    type: 'select',
    question: 'Qual è il tuo principale problema operativo?',
    options: ['Troppo tempo su task ripetitivi', 'Mancanza di dati per prendere decisioni', 'Comunicazione inefficiente nel team', 'Perdita di clienti/opportunità', 'Costi operativi troppo alti', 'Difficoltà a scalare il business', 'Qualità inconsistente del servizio'],
    required: true,
  },
  {
    id: 'ai_knowledge',
    section: 'Problemi',
    type: 'select',
    question: 'Qual è la tua familiarità con l\'AI e l\'automazione?',
    options: ['Nessuna — non so da dove iniziare', 'Base — ho sentito parlare di AI ma non l\'ho usata', 'Intermedia — ho usato qualche tool AI (ChatGPT, ecc.)', 'Avanzata — stiamo già usando soluzioni AI'],
    required: true,
  },
  // SEZIONE 5: Obiettivi
  {
    id: 'main_goal',
    section: 'Obiettivi',
    type: 'select',
    question: 'Qual è il tuo principale obiettivo per i prossimi 6 mesi?',
    options: ['Ridurre i costi operativi', 'Aumentare la produttività del team', 'Migliorare l\'esperienza cliente', 'Crescita del fatturato', 'Espansione in nuovi mercati', 'Migliorare la qualità dei processi'],
    required: true,
  },
  {
    id: 'budget_range',
    section: 'Obiettivi',
    type: 'select',
    question: 'Che budget hai in mente per migliorare i processi aziendali?',
    options: ['Meno di 500€/mese', '500€ - 1.500€/mese', '1.500€ - 3.000€/mese', 'Oltre 3.000€/mese', 'Non ho ancora un budget definito'],
    required: true,
  },
  // SEZIONE 6: Contatto
  {
    id: 'contact_name',
    section: 'Contatto',
    type: 'text',
    question: 'Come ti chiami?',
    subtitle: 'Il tuo nome comparirà nella scorecard personalizzata.',
    required: true,
  },
  {
    id: 'contact_email',
    section: 'Contatto',
    type: 'text',
    question: 'A quale email inviamo la tua Scorecard AI?',
    subtitle: 'Riceverai la scorecard entro pochi minuti.',
    required: true,
  },
]

export default function SurveyPage() {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [currentValue, setCurrentValue] = useState<string | string[] | number>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const visibleQuestions = questions.filter((q) => {
    if (!q.showIf) return true
    const dep = answers.find((a) => a.questionId === q.showIf!.questionId)
    if (!dep) return false
    if (Array.isArray(q.showIf.value)) {
      return q.showIf.value.includes(dep.value as string)
    }
    return dep.value === q.showIf.value
  })

  const currentQuestion = visibleQuestions[currentIndex]
  const progress = Math.round(((currentIndex + 1) / visibleQuestions.length) * 100)

  const getCurrentAnswer = () => {
    const existing = answers.find((a) => a.questionId === currentQuestion?.id)
    return existing?.value ?? ''
  }

  const handleNext = () => {
    const val = currentValue !== '' ? currentValue : getCurrentAnswer()
    if (currentQuestion.required && (!val || (Array.isArray(val) && val.length === 0))) {
      setError('Questo campo è obbligatorio')
      return
    }
    setError('')

    const newAnswers = answers.filter((a) => a.questionId !== currentQuestion.id)
    if (val !== '') {
      newAnswers.push({ questionId: currentQuestion.id, value: val })
    }
    setAnswers(newAnswers)
    setCurrentValue('')

    if (currentIndex < visibleQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      handleSubmit(newAnswers)
    }
  }

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setCurrentValue('')
      setError('')
    }
  }

  const handleSubmit = async (finalAnswers: Answer[]) => {
    setIsSubmitting(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const payload: Record<string, string | string[] | number> = {}
      finalAnswers.forEach((a) => { payload[a.questionId] = a.value })

      const res = await fetch(`${apiUrl}/survey`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Errore server')
      router.push('/thank-you')
    } catch {
      setError('Si è verificato un errore. Riprova tra qualche istante.')
      setIsSubmitting(false)
    }
  }

  const toggleMultiselect = (option: string) => {
    const current = (currentValue as string[]) || (getCurrentAnswer() as string[]) || []
    const arr = Array.isArray(current) ? current : []
    const updated = arr.includes(option) ? arr.filter((v) => v !== option) : [...arr, option]
    setCurrentValue(updated)
  }

  if (!currentQuestion) return null

  return (
    <div className="min-h-screen bg-navy-900 flex flex-col">
      {/* Header */}
      <header className="border-b border-navy-700 py-4 px-6">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-electric-500 rounded-lg flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-white text-sm">AI Efficiency Audit</span>
          </div>
          <span className="text-slate-400 text-sm">{currentIndex + 1} / {visibleQuestions.length}</span>
        </div>
      </header>

      {/* Progress */}
      <div className="h-1 bg-navy-800">
        <div
          className="h-full bg-electric-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl">
          {/* Section badge */}
          <div className="text-electric-400 text-xs font-semibold uppercase tracking-widest mb-4">
            {currentQuestion.section}
          </div>

          {/* Question */}
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
            {currentQuestion.question}
          </h2>
          {currentQuestion.subtitle && (
            <p className="text-slate-400 mb-8">{currentQuestion.subtitle}</p>
          )}
          {!currentQuestion.subtitle && <div className="mb-8" />}

          {/* Input by type */}
          {currentQuestion.type === 'text' && (
            <input
              type={currentQuestion.id === 'contact_email' ? 'email' : 'text'}
              value={(currentValue as string) || (getCurrentAnswer() as string) || ''}
              onChange={(e) => setCurrentValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleNext()}
              placeholder="Scrivi qui..."
              className="w-full bg-navy-800 border border-navy-600 focus:border-electric-500 text-white text-lg px-6 py-4 rounded-xl outline-none transition-colors placeholder:text-slate-600"
            />
          )}

          {currentQuestion.type === 'select' && (
            <div className="space-y-3">
              {currentQuestion.options!.map((opt) => {
                const selected = (currentValue || getCurrentAnswer()) === opt
                return (
                  <button
                    key={opt}
                    onClick={() => { setCurrentValue(opt); setError('') }}
                    className={`w-full text-left px-6 py-4 rounded-xl border transition-all ${
                      selected
                        ? 'bg-electric-500/20 border-electric-500 text-white'
                        : 'bg-navy-800 border-navy-600 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    {opt}
                  </button>
                )
              })}
            </div>
          )}

          {currentQuestion.type === 'multiselect' && (
            <div className="space-y-3">
              {currentQuestion.options!.map((opt) => {
                const current = (currentValue as string[]) || (getCurrentAnswer() as string[]) || []
                const arr = Array.isArray(current) ? current : []
                const selected = arr.includes(opt)
                return (
                  <button
                    key={opt}
                    onClick={() => toggleMultiselect(opt)}
                    className={`w-full text-left px-6 py-4 rounded-xl border transition-all flex items-center gap-3 ${
                      selected
                        ? 'bg-electric-500/20 border-electric-500 text-white'
                        : 'bg-navy-800 border-navy-600 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${selected ? 'bg-electric-500 border-electric-500' : 'border-navy-500'}`}>
                      {selected && <CheckCircle className="w-3 h-3 text-white" />}
                    </div>
                    {opt}
                  </button>
                )
              })}
            </div>
          )}

          {currentQuestion.type === 'scale' && (
            <div>
              <div className="flex gap-2 flex-wrap">
                {Array.from({ length: (currentQuestion.max! - currentQuestion.min!) + 1 }, (_, i) => i + currentQuestion.min!).map((val) => {
                  const selected = (currentValue || getCurrentAnswer()) === val
                  return (
                    <button
                      key={val}
                      onClick={() => { setCurrentValue(val); setError('') }}
                      className={`w-12 h-12 rounded-xl border font-semibold transition-all ${
                        selected
                          ? 'bg-electric-500 border-electric-500 text-white'
                          : 'bg-navy-800 border-navy-600 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      {val}
                    </button>
                  )
                })}
              </div>
              {currentQuestion.min !== undefined && (
                <div className="flex justify-between mt-2 text-xs text-slate-500">
                  <span>← {currentQuestion.min === 1 ? 'Minimo' : currentQuestion.min}</span>
                  <span>{currentQuestion.max} →</span>
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {error && <p className="mt-4 text-red-400 text-sm">{error}</p>}

          {/* Navigation */}
          <div className="flex gap-4 mt-10">
            {currentIndex > 0 && (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors px-4 py-3"
              >
                <ArrowLeft className="w-4 h-4" /> Indietro
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={isSubmitting}
              className="ml-auto bg-electric-500 hover:bg-electric-600 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-semibold transition-all hover:scale-105 flex items-center gap-2"
            >
              {isSubmitting ? 'Invio in corso...' : currentIndex === visibleQuestions.length - 1 ? 'Invia e genera Scorecard' : 'Avanti'}
              {!isSubmitting && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
