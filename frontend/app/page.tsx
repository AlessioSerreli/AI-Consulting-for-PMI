'use client'

import Link from 'next/link'
import { ArrowRight, ChevronRight, Clock, Brain, Target, CheckCircle, Star } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-navy-900 overflow-x-hidden">

      {/* ── BACKGROUND GRID ── */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)',
        backgroundSize: '64px 64px',
      }} />

      {/* ── NAVBAR ── */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-navy-900/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="font-display text-2xl tracking-widest text-white">
            AI<span className="text-electric-500">.</span>PMI
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-400 font-mono">
            <a href="#problema" className="hover:text-white transition-colors tracking-wide">Il Problema</a>
            <a href="#metodo" className="hover:text-white transition-colors tracking-wide">Il Metodo</a>
            <a href="#scorecard" className="hover:text-white transition-colors tracking-wide">Scorecard</a>
          </div>
          <Link href="/survey"
            className="bg-electric-500 hover:bg-electric-600 text-navy-900 px-5 py-2 rounded-lg text-sm font-bold transition-all hover:scale-105 flex items-center gap-2"
            style={{ boxShadow: '0 4px 20px rgba(245,158,11,0.35)' }}>
            Diagnosi Gratuita <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative z-10 min-h-screen flex items-center pt-16">
        <div className="max-w-6xl mx-auto px-6 w-full py-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left: copy */}
            <div>
              <div className="inline-flex items-center gap-2 border border-electric-500/30 bg-electric-500/5 text-electric-400 text-xs font-mono px-4 py-2 rounded-full mb-8 tracking-widest uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-electric-500 animate-pulse" />
                Diagnosi AI Gratuita — Solo per PMI italiane
              </div>

              <h1 className="font-display text-white leading-none tracking-wide mb-6" style={{ fontSize: 'clamp(56px, 7vw, 96px)' }}>
                LA TUA AZIENDA<br />
                VALE PIÙ DI<br />
                <span className="text-electric-500" style={{ textShadow: '0 0 80px rgba(245,158,11,0.4)' }}>
                  QUELLO CHE<br />PRODUCE.
                </span>
              </h1>

              <p className="text-slate-400 text-lg leading-relaxed mb-10 max-w-md font-light">
                Ogni giorno la tua azienda perde ore, soldi e opportunità in processi che potrebbero essere automatizzati. In 10 minuti scopri esattamente dove e come.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <Link href="/survey"
                  className="bg-electric-500 hover:bg-electric-600 text-navy-900 px-8 py-4 rounded-xl font-bold text-base transition-all hover:scale-105 flex items-center justify-center gap-2"
                  style={{ boxShadow: '0 8px 40px rgba(245,158,11,0.4)' }}>
                  Avvia la Diagnosi Gratuita <ArrowRight className="w-5 h-5" />
                </Link>
                <a href="#metodo"
                  className="border border-white/10 hover:border-white/20 text-slate-300 hover:text-white px-8 py-4 rounded-xl font-semibold text-base transition-all flex items-center justify-center gap-2">
                  Come funziona <ChevronRight className="w-5 h-5" />
                </a>
              </div>

              <div className="flex items-center gap-6 text-sm text-slate-500 font-mono">
                <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-electric-500" /> Gratuito</span>
                <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-electric-500" /> Nessun impegno</span>
                <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-electric-500" /> Report in 5 giorni</span>
              </div>
            </div>

            {/* Right: scorecard mockup */}
            <div className="relative hidden lg:block">
              {/* Glow background */}
              <div className="absolute inset-0 rounded-3xl" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(245,158,11,0.12) 0%, transparent 70%)' }} />

              {/* Main card */}
              <div className="relative bg-navy-800 border border-white/10 rounded-2xl p-6" style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)' }}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="font-mono text-xs text-slate-500 tracking-widest uppercase mb-1">AI Efficiency Scorecard</div>
                    <div className="font-semibold text-white text-sm">Rossi Costruzioni Srl</div>
                  </div>
                  <div className="font-display text-5xl text-electric-500 tracking-wide">67</div>
                </div>

                {/* Score bars */}
                <div className="space-y-4 mb-6">
                  {[
                    { label: 'Efficienza Operativa', score: 72 },
                    { label: 'Digitalizzazione', score: 48 },
                    { label: 'Gestione Dati', score: 35 },
                    { label: 'Comunicazione', score: 81 },
                    { label: 'Velocità Decisionale', score: 58 },
                  ].map(({ label, score }) => (
                    <div key={label}>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-slate-400 font-mono">{label}</span>
                        <span className="text-electric-400 font-bold">{score}</span>
                      </div>
                      <div className="h-1.5 bg-navy-700 rounded-full overflow-hidden">
                        <div className="h-full bg-electric-500 rounded-full" style={{ width: `${score}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick wins */}
                <div className="border-t border-white/5 pt-4">
                  <div className="font-mono text-xs text-electric-500 tracking-widest uppercase mb-3">3 Quick Win Prioritari</div>
                  {[
                    'Automatizza la gestione preventivi (-3h/settimana)',
                    'Implementa CRM per follow-up clienti',
                    'Dashboard KPI in tempo reale',
                  ].map((win, i) => (
                    <div key={i} className="flex items-start gap-2 mb-2">
                      <span className="font-display text-electric-500 text-sm mt-0.5">{i + 1}.</span>
                      <span className="text-slate-300 text-xs leading-relaxed">{win}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating badge */}
              <div className="absolute -bottom-4 -right-4 bg-navy-800 border border-electric-500/30 rounded-xl px-4 py-3 flex items-center gap-2" style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
                <div className="w-2 h-2 rounded-full bg-electric-500 animate-pulse" />
                <span className="font-mono text-xs text-electric-400">Generata da Claude AI</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="relative z-10 py-16 border-y border-white/5 bg-navy-800/40">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '73%', label: 'delle PMI non usa strumenti AI', sub: 'Fonte: Osservatorio AI 2024' },
            { value: '11h', label: 'perse a settimana in task manuali', sub: 'Media per azienda < 50 dip.' },
            { value: '3×', label: 'produttività con processi AI', sub: 'Risultati medi nei primi 90 giorni' },
            { value: '€0', label: 'per iniziare con la diagnosi', sub: 'Sempre. Nessuna sorpresa.' },
          ].map((stat) => (
            <div key={stat.value} className="group">
              <div className="font-display text-6xl md:text-7xl text-electric-500 tracking-wide mb-2 group-hover:text-electric-400 transition-colors">{stat.value}</div>
              <div className="text-sm text-white font-medium mb-1">{stat.label}</div>
              <div className="text-xs text-slate-600 font-mono">{stat.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── IL PROBLEMA ── */}
      <section id="problema" className="relative z-10 py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <div className="font-mono text-xs text-electric-500 tracking-widest uppercase mb-4">Il contesto</div>
            <h2 className="font-display text-6xl md:text-8xl text-white tracking-wide leading-none">
              IL PROBLEMA<br />
              <span className="text-slate-600">CHE NON SAI</span><br />
              DI AVERE.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                number: '01',
                title: 'Fai tutto manualmente',
                desc: 'Preventivi, follow-up, reportistica, comunicazioni interne. Ogni giorno il tuo team ripete le stesse operazioni che potrebbero essere automatizzate in pochi giorni.',
              },
              {
                number: '02',
                title: 'Decidi senza dati',
                desc: 'Le decisioni più importanti vengono prese di pancia, perché raccogliere e analizzare i dati richiede troppo tempo. L\'AI può cambiare questo in ore, non in mesi.',
              },
              {
                number: '03',
                title: 'Pensi che non sia per te',
                desc: 'L\'intelligenza artificiale sembra roba da grandi aziende. Non è così. Le PMI sotto i 50 dipendenti sono quelle che ottengono i risultati più rapidi e misurabili.',
              },
            ].map((item) => (
              <div key={item.number} className="relative bg-navy-800 border border-white/5 rounded-2xl p-8 hover:border-electric-500/30 transition-all hover:-translate-y-1 group">
                <div className="font-display text-electric-500/15 text-8xl absolute top-4 right-6 group-hover:text-electric-500/30 transition-colors">{item.number}</div>
                <h3 className="font-display text-2xl text-white tracking-wide mb-4">{item.title}</h3>
                <p className="text-slate-400 leading-relaxed text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── METODO ── */}
      <section id="metodo" className="relative z-10 py-32 px-6 bg-navy-800/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <div className="font-mono text-xs text-electric-500 tracking-widest uppercase mb-4">Il processo</div>
            <h2 className="font-display text-6xl md:text-8xl text-white tracking-wide">IL METODO</h2>
            <p className="text-slate-500 mt-4 font-mono text-sm">Tre passi. Zero rischi.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                icon: Clock,
                title: 'Diagnosi',
                time: '10 minuti',
                desc: '4 sezioni, domande intelligenti sui tuoi processi. Si adatta alle tue risposte per un\'analisi davvero su misura.',
              },
              {
                step: '02',
                icon: Brain,
                title: 'Analisi AI',
                time: '5 giorni lavorativi',
                desc: 'Claude analizza le tue risposte e genera un report dettagliato su 5 dimensioni critiche, con 3 quick win prioritari.',
              },
              {
                step: '03',
                icon: Target,
                title: 'Piano d\'Azione',
                time: 'Call gratuita 30min',
                desc: 'Discutiamo insieme il tuo report e definiamo un piano concreto. Nessun impegno, nessuna sorpresa.',
              },
            ].map((item) => (
              <div key={item.step} className="relative bg-navy-800 border border-white/5 rounded-2xl p-8 hover:border-electric-500/30 transition-colors group">
                <div className="font-display text-electric-500/15 text-8xl absolute top-4 right-6 group-hover:text-electric-500/30 transition-colors">{item.step}</div>
                <div className="w-12 h-12 bg-electric-500/10 rounded-xl flex items-center justify-center mb-4 border border-electric-500/20">
                  <item.icon className="w-6 h-6 text-electric-400" />
                </div>
                <div className="font-mono text-xs text-electric-500 tracking-widest uppercase mb-3">{item.time}</div>
                <h3 className="font-display text-3xl text-white tracking-wide mb-3">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SCORECARD PREVIEW ── */}
      <section id="scorecard" className="relative z-10 py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <div className="font-mono text-xs text-electric-500 tracking-widest uppercase mb-4">Il risultato</div>
            <h2 className="font-display text-6xl md:text-8xl text-white tracking-wide">LA TUA<br />SCORECARD</h2>
            <p className="text-slate-500 mt-4 text-sm max-w-md mx-auto">Valutazione su 5 aree critiche, 3 quick win prioritari, stima del valore economico recuperabile.</p>
          </div>

          <div className="grid md:grid-cols-5 gap-4 mb-8">
            {[
              { name: 'Efficienza\nOperativa', icon: '⚙️', score: 68 },
              { name: 'Digitaliz-\nzazione', icon: '💻', score: 45 },
              { name: 'Gestione\nDati', icon: '📊', score: 32 },
              { name: 'Comunicazione', icon: '💬', score: 71 },
              { name: 'Velocità\nDecisionale', icon: '⚡', score: 55 },
            ].map((dim) => (
              <div key={dim.name} className="bg-navy-800 border border-white/5 rounded-2xl p-6 text-center hover:border-electric-500/30 transition-all hover:-translate-y-1 group">
                <div className="text-3xl mb-3">{dim.icon}</div>
                <div className="text-xs text-slate-500 mb-4 whitespace-pre-line font-mono leading-relaxed">{dim.name}</div>
                <div className="relative h-1 bg-navy-700 rounded-full overflow-hidden mb-3">
                  <div className="absolute left-0 top-0 h-full bg-electric-500 rounded-full" style={{ width: `${dim.score}%` }} />
                </div>
                <div className="font-display text-4xl text-electric-500 tracking-wide">{dim.score}</div>
                <div className="font-mono text-xs text-slate-700 mt-1">/100</div>
              </div>
            ))}
          </div>
          <p className="text-center text-slate-700 text-xs font-mono tracking-widest">* Dati di esempio — la tua scorecard sarà completamente personalizzata</p>
        </div>
      </section>

      {/* ── TESTIMONIAL ── */}
      <section className="relative z-10 py-32 px-6 bg-navy-800/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <div className="font-mono text-xs text-electric-500 tracking-widest uppercase mb-4">Social proof</div>
            <h2 className="font-display text-6xl md:text-7xl text-white tracking-wide">COSA DICONO</h2>
            <p className="text-slate-600 text-sm font-mono mt-3">In beta — testimonianze in arrivo</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { company: 'Azienda Manifatturiera', sector: 'Produzione · 28 dipendenti', quote: 'Abbiamo ridotto del 40% il tempo dedicato alla gestione degli ordini. Non pensavo fosse possibile in così poco tempo.' },
              { company: 'Studio Professionale', sector: 'Servizi · 12 dipendenti', quote: 'La scorecard ha identificato i 3 processi dove stavamo perdendo più tempo. Il report era chirurgico.' },
              { company: 'Impresa Edile', sector: 'Costruzioni · 45 dipendenti', quote: 'Pensavo che l\'AI fosse roba da grandi aziende. Mi sbagliavo di grosso. In 3 mesi abbiamo recuperato decine di ore a settimana.' },
            ].map((t) => (
              <div key={t.company} className="bg-navy-800 border border-white/5 rounded-2xl p-6 hover:border-electric-500/20 transition-colors">
                <div className="flex gap-0.5 mb-5">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 text-electric-500 fill-electric-500" />)}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed mb-5 italic">&quot;{t.quote}&quot;</p>
                <div className="border-t border-white/5 pt-4">
                  <div className="font-semibold text-white text-sm">{t.company}</div>
                  <div className="text-slate-600 text-xs font-mono mt-1">{t.sector}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="relative z-10 py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden border border-electric-500/20 p-16 text-center"
            style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.06) 0%, rgba(245,158,11,0.02) 50%, rgba(10,15,30,0) 100%)', boxShadow: '0 0 120px rgba(245,158,11,0.08)' }}>

            {/* Grid inside CTA */}
            <div className="absolute inset-0 pointer-events-none" style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }} />

            <div className="relative">
              <div className="font-mono text-xs text-electric-500 tracking-widest uppercase mb-6">Inizia adesso</div>
              <h2 className="font-display text-7xl md:text-9xl text-white tracking-wide leading-none mb-8">
                PRONTO?
              </h2>
              <p className="text-slate-400 text-lg mb-10 max-w-lg mx-auto leading-relaxed">
                10 minuti oggi. Un piano d&apos;azione concreto entro 5 giorni. Zero rischi.
              </p>
              <Link href="/survey"
                className="inline-flex bg-electric-500 hover:bg-electric-600 text-navy-900 px-14 py-5 rounded-xl text-lg font-bold transition-all hover:scale-105 items-center gap-3"
                style={{ boxShadow: '0 12px 50px rgba(245,158,11,0.45)' }}>
                Avvia la Diagnosi Gratuita <ArrowRight className="w-6 h-6" />
              </Link>
              <div className="mt-8 flex items-center justify-center gap-8 text-xs text-slate-600 font-mono">
                <span>✓ Gratuito</span>
                <span>✓ Nessuna carta di credito</span>
                <span>✓ Nessun impegno</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t border-white/5 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="font-display text-xl tracking-widest text-white">
            AI<span className="text-electric-500">.</span>PMI
          </div>
          <p className="text-slate-700 text-xs font-mono">© 2026 AI.PMI — Tutti i diritti riservati.</p>
          <div className="flex gap-6 text-xs text-slate-600 font-mono">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Termini</a>
          </div>
        </div>
      </footer>

    </div>
  )
}
