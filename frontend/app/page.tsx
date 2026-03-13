'use client'

import Link from 'next/link'
import { ArrowRight, BarChart3, Zap, Target, CheckCircle, ChevronRight, Brain, Clock, TrendingUp } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-navy-900">

      {/* Background grid */}
      <div className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-navy-700 bg-navy-900/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="font-display text-2xl tracking-widest text-white">
            AI<span className="text-electric-500">.</span>PMI
          </div>
          <Link
            href="/survey"
            className="bg-electric-500 hover:bg-electric-600 text-navy-900 px-5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
          >
            Diagnosi Gratuita <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-40 pb-28 px-6 z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-electric-500/10 border border-electric-500/30 text-electric-400 text-xs font-mono px-4 py-2 rounded-full mb-10 tracking-widest uppercase">
            <Zap className="w-3 h-3" />
            Diagnosi AI Gratuita — Report in 5 giorni lavorativi
          </div>

          <h1 className="font-display text-7xl md:text-9xl text-white mb-6 leading-none tracking-wide">
            LA TUA PMI<br />
            PERDE TEMPO<br />
            <span className="text-electric-500">OGNI GIORNO.</span>
          </h1>

          <p className="text-lg text-slate-400 mb-12 max-w-xl mx-auto leading-relaxed font-light">
            In 10 minuti scopri esattamente dove la tua azienda spreca risorse — e ricevi un piano d&apos;azione personalizzato generato dall&apos;AI.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/survey"
              className="bg-electric-500 hover:bg-electric-600 text-navy-900 px-10 py-4 rounded-xl text-base font-bold transition-all hover:scale-105 flex items-center justify-center gap-2"
              style={{ boxShadow: '0 8px 32px rgba(245,158,11,0.3)' }}
            >
              Avvia la Diagnosi Gratuita <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#come-funziona"
              className="border border-navy-600 text-slate-300 hover:text-white hover:border-slate-500 px-10 py-4 rounded-xl text-base font-semibold transition-colors flex items-center justify-center gap-2"
            >
              Come funziona <ChevronRight className="w-5 h-5" />
            </a>
          </div>
          <p className="mt-6 text-xs text-slate-500 font-mono tracking-widest uppercase">Gratuito · Nessuna carta di credito · Nessun impegno</p>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="relative z-10 py-12 border-y border-navy-700 bg-navy-800/60">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '73%', label: 'delle PMI non usa strumenti AI' },
            { value: '8h', label: 'perse ogni settimana per task manuali' },
            { value: '3x', label: 'più veloce con processi automatizzati' },
            { value: '< 2w', label: 'per vedere i primi risultati concreti' },
          ].map((stat) => (
            <div key={stat.value}>
              <div className="font-display text-5xl text-electric-500 mb-2 tracking-wide">{stat.value}</div>
              <div className="text-sm text-slate-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Come funziona */}
      <section id="come-funziona" className="relative z-10 py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <div className="font-mono text-xs text-electric-500 tracking-widest uppercase mb-4">Il Processo</div>
            <h2 className="font-display text-6xl md:text-7xl text-white tracking-wide">COME FUNZIONA</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                icon: Clock,
                title: 'Compila la Diagnosi',
                desc: '4 sezioni, 10 minuti. Domande intelligenti sui tuoi processi aziendali per un\'analisi su misura.',
              },
              {
                step: '02',
                icon: Brain,
                title: 'L\'AI genera il Report',
                desc: 'Claude analizza le tue risposte e genera una valutazione dettagliata su 5 dimensioni chiave della tua azienda.',
              },
              {
                step: '03',
                icon: Target,
                title: 'Pianifica la Call',
                desc: 'Ricevi il report via email con 3 quick win prioritari e prenota una call gratuita con i nostri esperti.',
              },
            ].map((item) => (
              <div key={item.step} className="relative bg-navy-800 border border-navy-700 rounded-2xl p-8 hover:border-electric-500/50 transition-colors group">
                <div className="font-display text-electric-500/20 text-8xl absolute top-4 right-6 group-hover:text-electric-500/40 transition-colors">{item.step}</div>
                <div className="w-12 h-12 bg-electric-500/10 rounded-xl flex items-center justify-center mb-6">
                  <item.icon className="w-6 h-6 text-electric-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-3">{item.title}</h3>
                <p className="text-slate-400 leading-relaxed text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Le 5 Dimensioni */}
      <section className="relative z-10 py-28 px-6 bg-navy-800/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <div className="font-mono text-xs text-electric-500 tracking-widest uppercase mb-4">Il Risultato</div>
            <h2 className="font-display text-6xl md:text-7xl text-white tracking-wide">LA TUA SCORECARD</h2>
            <p className="text-slate-400 mt-4">Valutazione su 5 aree critiche per ogni PMI</p>
          </div>
          <div className="grid md:grid-cols-5 gap-4">
            {[
              { name: 'Efficienza\nOperativa', icon: '⚙️', score: 68 },
              { name: 'Digitaliz-\nzazione', icon: '💻', score: 45 },
              { name: 'Gestione\nDati', icon: '📊', score: 32 },
              { name: 'Comunicazione\nInterna', icon: '💬', score: 71 },
              { name: 'Velocità\nDecisionale', icon: '⚡', score: 55 },
            ].map((dim) => (
              <div key={dim.name} className="bg-navy-800 border border-navy-700 rounded-2xl p-6 text-center hover:border-electric-500/40 transition-colors">
                <div className="text-3xl mb-3">{dim.icon}</div>
                <div className="text-xs text-slate-400 mb-4 whitespace-pre-line font-mono">{dim.name}</div>
                <div className="relative h-1.5 bg-navy-700 rounded-full overflow-hidden mb-3">
                  <div
                    className="absolute left-0 top-0 h-full bg-electric-500 rounded-full"
                    style={{ width: `${dim.score}%` }}
                  />
                </div>
                <div className="font-display text-electric-500 text-3xl tracking-wide">{dim.score}</div>
                <div className="text-xs text-slate-600 mt-1 font-mono">/100</div>
              </div>
            ))}
          </div>
          <p className="text-center text-slate-600 text-xs font-mono mt-6 tracking-widest uppercase">* Dati di esempio — la tua scorecard sarà personalizzata</p>
        </div>
      </section>

      {/* Social Proof */}
      <section className="relative z-10 py-28 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="font-mono text-xs text-electric-500 tracking-widest uppercase mb-4">Testimonianze</div>
          <h2 className="font-display text-6xl md:text-7xl text-white tracking-wide mb-4">COSA DICONO</h2>
          <p className="text-slate-500 mb-16 text-sm font-mono">(Testimonianze in arrivo — siamo in beta)</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { company: 'Azienda Manifatturiera', sector: 'Produzione', quote: 'Abbiamo ridotto del 40% il tempo dedicato alla gestione degli ordini.' },
              { company: 'Studio Professionale', sector: 'Servizi', quote: 'La scorecard ha identificato esattamente i 3 processi dove stavamo perdendo più tempo.' },
              { company: 'Impresa Edile', sector: 'Costruzioni', quote: 'Non pensavamo che l\'AI potesse essere utile per noi. Ci sbagliavamo.' },
            ].map((t) => (
              <div key={t.company} className="bg-navy-800 border border-navy-700 rounded-2xl p-6 text-left hover:border-electric-500/30 transition-colors">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => <span key={i} className="text-electric-500">★</span>)}
                </div>
                <p className="text-slate-300 italic mb-4 text-sm leading-relaxed">&quot;{t.quote}&quot;</p>
                <div>
                  <div className="font-semibold text-white text-sm">{t.company}</div>
                  <div className="text-slate-500 text-xs font-mono mt-1">{t.sector}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Bottom */}
      <section className="relative z-10 py-28 px-6">
        <div className="max-w-3xl mx-auto text-center bg-navy-800 border border-electric-500/30 rounded-3xl p-16"
          style={{ boxShadow: '0 0 80px rgba(245,158,11,0.08)' }}>
          <div className="font-mono text-xs text-electric-500 tracking-widest uppercase mb-6">Inizia adesso</div>
          <h2 className="font-display text-6xl text-white tracking-wide mb-6">PRONTO A<br />MIGLIORARE?</h2>
          <p className="text-slate-400 mb-10 max-w-md mx-auto leading-relaxed">10 minuti di diagnosi, un report professionale, un piano d&apos;azione concreto. Completamente gratuito.</p>
          <Link
            href="/survey"
            className="inline-flex bg-electric-500 hover:bg-electric-600 text-navy-900 px-12 py-4 rounded-xl text-base font-bold transition-all hover:scale-105 items-center gap-2"
            style={{ boxShadow: '0 8px 32px rgba(245,158,11,0.3)' }}
          >
            Avvia la Diagnosi Gratuita <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-navy-700 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="font-display text-xl tracking-widest text-white">
            AI<span className="text-electric-500">.</span>PMI
          </div>
          <p className="text-slate-600 text-xs font-mono">© 2026 AI.PMI — Tutti i diritti riservati.</p>
          <div className="flex gap-6 text-xs text-slate-500 font-mono">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Termini</a>
          </div>
        </div>
      </footer>

    </div>
  )
}
