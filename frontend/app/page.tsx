'use client'

import Link from 'next/link'
import { ArrowRight, BarChart3, Zap, Target, CheckCircle, ChevronRight, Brain, Clock, TrendingUp } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-navy-900">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-navy-700 bg-navy-900/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-electric-500 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-white">AIConsulting PMI</span>
          </div>
          <Link
            href="/survey"
            className="bg-electric-500 hover:bg-electric-600 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
          >
            Avvia l&apos;Audit Gratuito <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-electric-500/10 border border-electric-500/30 text-electric-400 text-sm font-medium px-4 py-2 rounded-full mb-8">
            <Zap className="w-4 h-4" />
            Audit AI Gratuito — Risultati in 24 ore
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            La tua PMI perde efficienza{' '}
            <span className="text-electric-400">ogni giorno</span>{' '}
            senza saperlo.
          </h1>
          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            In 10 minuti scopri esattamente dove la tua azienda spreca tempo e denaro — e ricevi un piano d&apos;azione personalizzato generato dall&apos;AI.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/survey"
              className="bg-electric-500 hover:bg-electric-600 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all hover:scale-105 flex items-center justify-center gap-2 shadow-lg shadow-electric-500/25"
            >
              Avvia l&apos;Audit Gratuito <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#come-funziona"
              className="border border-navy-600 text-slate-300 hover:text-white hover:border-slate-500 px-8 py-4 rounded-xl text-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              Come funziona <ChevronRight className="w-5 h-5" />
            </a>
          </div>
          <p className="mt-6 text-sm text-slate-500">Gratuito · Nessuna carta di credito · Risultati in 24 ore</p>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-12 border-y border-navy-700 bg-navy-800/50">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '73%', label: 'delle PMI non usa strumenti AI' },
            { value: '8h', label: 'perse ogni settimana per task manuali' },
            { value: '3x', label: 'più veloce con processi automatizzati' },
            { value: '2-4w', label: 'per vedere i primi risultati concreti' },
          ].map((stat) => (
            <div key={stat.value}>
              <div className="text-3xl font-bold text-electric-400 mb-1">{stat.value}</div>
              <div className="text-sm text-slate-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Come funziona */}
      <section id="come-funziona" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Come funziona</h2>
            <p className="text-slate-400 text-lg">Tre passi per scoprire il potenziale della tua azienda</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                icon: Clock,
                title: 'Compila la Survey',
                desc: '10 domande intelligenti sui tuoi processi aziendali. Le domande si adattano alle tue risposte per un\'analisi su misura.',
              },
              {
                step: '02',
                icon: Brain,
                title: 'L\'AI genera la Scorecard',
                desc: 'Claude analizza le tue risposte e genera una valutazione dettagliata su 5 dimensioni chiave della tua azienda.',
              },
              {
                step: '03',
                icon: Target,
                title: 'Pianifica la Call',
                desc: 'Ricevi la scorecard via email con 3 quick win prioritari e prenota una call gratuita con i nostri esperti.',
              },
            ].map((item) => (
              <div key={item.step} className="relative bg-navy-800 border border-navy-700 rounded-2xl p-8 hover:border-electric-500/50 transition-colors">
                <div className="text-electric-500/30 font-bold text-6xl absolute top-6 right-6">{item.step}</div>
                <div className="w-12 h-12 bg-electric-500/10 rounded-xl flex items-center justify-center mb-6">
                  <item.icon className="w-6 h-6 text-electric-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                <p className="text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Le 5 Dimensioni */}
      <section className="py-24 px-6 bg-navy-800/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">La tua Efficiency Scorecard</h2>
            <p className="text-slate-400 text-lg">Valutazione su 5 aree critiche per ogni PMI</p>
          </div>
          <div className="grid md:grid-cols-5 gap-4">
            {[
              { name: 'Efficienza\nOperativa', icon: '⚙️', score: 68 },
              { name: 'Digitaliz-\nzazione', icon: '💻', score: 45 },
              { name: 'Gestione\nDati', icon: '📊', score: 32 },
              { name: 'Comunicazione\nInterna', icon: '💬', score: 71 },
              { name: 'Velocità\nDecisionale', icon: '⚡', score: 55 },
            ].map((dim) => (
              <div key={dim.name} className="bg-navy-800 border border-navy-700 rounded-2xl p-6 text-center">
                <div className="text-3xl mb-3">{dim.icon}</div>
                <div className="text-sm text-slate-400 mb-4 whitespace-pre-line">{dim.name}</div>
                <div className="relative h-2 bg-navy-700 rounded-full overflow-hidden mb-2">
                  <div
                    className="absolute left-0 top-0 h-full bg-electric-500 rounded-full"
                    style={{ width: `${dim.score}%` }}
                  />
                </div>
                <div className="text-electric-400 font-bold text-lg">{dim.score}/100</div>
                <div className="text-xs text-slate-500 mt-1">esempio</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Cosa dicono le PMI che hanno già fatto l&apos;Audit</h2>
          <p className="text-slate-500 mb-12 text-sm">(Testimonianze in arrivo — siamo in beta)</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { company: 'Azienda Manifatturiera', sector: 'Produzione', quote: 'Abbiamo ridotto del 40% il tempo dedicato alla gestione degli ordini.' },
              { company: 'Studio Professionale', sector: 'Servizi', quote: 'La scorecard ha identificato esattamente i 3 processi dove stavamo perdendo più tempo.' },
              { company: 'Impresa Edile', sector: 'Costruzioni', quote: 'Non pensavamo che l\'AI potesse essere utile per noi. Ci sbagliavamo.' },
            ].map((t) => (
              <div key={t.company} className="bg-navy-800 border border-navy-700 rounded-2xl p-6 text-left">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => <span key={i} className="text-electric-400">★</span>)}
                </div>
                <p className="text-slate-300 italic mb-4">&quot;{t.quote}&quot;</p>
                <div>
                  <div className="font-semibold text-white text-sm">{t.company}</div>
                  <div className="text-slate-500 text-xs">{t.sector}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Bottom */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center bg-navy-800 border border-electric-500/30 rounded-3xl p-12">
          <div className="w-16 h-16 bg-electric-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <TrendingUp className="w-8 h-8 text-electric-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Pronto a scoprire dove puoi migliorare?</h2>
          <p className="text-slate-400 mb-8">10 minuti di survey, una scorecard professionale, un piano d&apos;azione concreto. Gratuito.</p>
          <Link
            href="/survey"
            className="inline-flex bg-electric-500 hover:bg-electric-600 text-white px-10 py-4 rounded-xl text-lg font-semibold transition-all hover:scale-105 items-center gap-2 shadow-lg shadow-electric-500/25"
          >
            Avvia l&apos;Audit Gratuito <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-navy-700 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-electric-500 rounded flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-white">AIConsulting PMI</span>
          </div>
          <p className="text-slate-500 text-sm">© 2026 AIConsulting PMI. Tutti i diritti riservati.</p>
          <div className="flex gap-6 text-sm text-slate-500">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Termini</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
