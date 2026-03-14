import Link from 'next/link'
import { CheckCircle, Mail, Calendar, Brain } from 'lucide-react'

export default function ThankYouPage() {
  return (
    <div className="min-h-screen bg-navy-900 flex flex-col items-center justify-center px-6">

      {/* Background grid */}
      <div className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

      <div className="relative z-10 max-w-lg text-center">

        {/* Logo */}
        <div className="font-display text-2xl tracking-widest text-white mb-12">
          AI<span className="text-electric-500">.</span>PMI
        </div>

        {/* Success icon */}
        <div className="w-20 h-20 bg-electric-500/10 border border-electric-500/30 rounded-full flex items-center justify-center mx-auto mb-8">
          <CheckCircle className="w-10 h-10 text-electric-400" />
        </div>

        <div className="font-mono text-xs text-electric-500 tracking-widest uppercase mb-4">Diagnosi ricevuta</div>
        <h1 className="font-display text-6xl text-white tracking-wide mb-6">RICHIESTA<br />INVIATA!</h1>
        <p className="text-slate-400 text-base mb-12 leading-relaxed">
          Il nostro sistema AI sta analizzando le tue risposte e generando la tua Efficiency Scorecard personalizzata.
        </p>

        {/* Steps */}
        <div className="space-y-3 mb-12 text-left">
          {[
            { icon: Brain, title: "L'AI sta lavorando", desc: 'Claude analizza i tuoi processi e genera la scorecard personalizzata' },
            { icon: Mail, title: 'Riceverai una email', desc: 'La tua Scorecard PDF arriverà nella tua casella entro 5 giorni lavorativi' },
            { icon: Calendar, title: 'Prenota la call gratuita', desc: '30 minuti con i nostri esperti per discutere il tuo piano d\'azione' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-4 bg-navy-800 border border-navy-700 rounded-xl p-4">
              <div className="w-10 h-10 bg-electric-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-electric-400" />
              </div>
              <div>
                <div className="font-semibold text-white text-sm mb-1">{title}</div>
                <div className="text-slate-400 text-sm">{desc}</div>
              </div>
            </div>
          ))}
        </div>

        <a
          href="https://calendly.com/ai-consulting-pmi"
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-electric-500 hover:bg-electric-600 text-navy-900 px-8 py-4 rounded-xl font-bold transition-all hover:scale-105 mb-4"
          style={{ boxShadow: '0 8px 32px rgba(245,158,11,0.3)' }}
        >
          Prenota la Call Gratuita
        </a>
        <Link href="/" className="text-slate-500 hover:text-white text-sm font-mono transition-colors">
          ← Torna alla home
        </Link>
      </div>
    </div>
  )
}
