import Link from 'next/link'
import { CheckCircle, Mail, Calendar, Brain } from 'lucide-react'

export default function ThankYouPage() {
  return (
    <div className="min-h-screen bg-navy-900 flex flex-col items-center justify-center px-6">
      <div className="max-w-lg text-center">
        <div className="w-20 h-20 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-8">
          <CheckCircle className="w-10 h-10 text-green-400" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">Survey completata!</h1>
        <p className="text-slate-400 text-lg mb-10 leading-relaxed">
          Il nostro sistema AI sta analizzando le tue risposte e generando la tua Efficiency Scorecard personalizzata.
        </p>

        <div className="space-y-4 mb-10">
          <div className="flex items-start gap-4 bg-navy-800 border border-navy-700 rounded-xl p-4 text-left">
            <div className="w-10 h-10 bg-electric-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Brain className="w-5 h-5 text-electric-400" />
            </div>
            <div>
              <div className="font-semibold text-white text-sm mb-1">L&apos;AI sta lavorando</div>
              <div className="text-slate-400 text-sm">Claude analizza i tuoi processi e genera la scorecard personalizzata</div>
            </div>
          </div>
          <div className="flex items-start gap-4 bg-navy-800 border border-navy-700 rounded-xl p-4 text-left">
            <div className="w-10 h-10 bg-electric-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-electric-400" />
            </div>
            <div>
              <div className="font-semibold text-white text-sm mb-1">Riceverai una email</div>
              <div className="text-slate-400 text-sm">La tua Scorecard PDF arriverà nella tua casella entro pochi minuti</div>
            </div>
          </div>
          <div className="flex items-start gap-4 bg-navy-800 border border-navy-700 rounded-xl p-4 text-left">
            <div className="w-10 h-10 bg-electric-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-electric-400" />
            </div>
            <div>
              <div className="font-semibold text-white text-sm mb-1">Prenota la call gratuita</div>
              <div className="text-slate-400 text-sm">30 minuti con i nostri esperti per discutere il tuo piano d&apos;azione</div>
            </div>
          </div>
        </div>

        <a
          href="https://calendly.com/ai-consulting-pmi"
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-electric-500 hover:bg-electric-600 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all hover:scale-105 mb-4"
        >
          Prenota la Call Gratuita
        </a>
        <Link href="/" className="text-slate-500 hover:text-white text-sm transition-colors">
          Torna alla home
        </Link>
      </div>
    </div>
  )
}
