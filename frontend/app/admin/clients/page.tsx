'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Brain, Users, TrendingUp, CheckCircle, Target } from 'lucide-react'

const PHASES = ['Audit', 'Implementazione', 'Formazione', 'Manutenzione']

function Sidebar({ active }: { active: string }) {
  const links = [
    { href: '/admin', label: 'Dashboard', icon: TrendingUp },
    { href: '/admin/leads', label: 'Pipeline Lead', icon: Users },
    { href: '/admin/clients', label: 'Clienti Attivi', icon: Brain },
    { href: '/admin/prospecting', label: 'Prospecting', icon: Target },
  ]
  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-navy-800 border-r border-navy-700 flex flex-col z-40">
      <div className="p-6 border-b border-navy-700">
        <div className="font-display text-2xl tracking-widest text-white">
          AI<span className="text-electric-500">.</span>PMI
        </div>
        <div className="font-mono text-xs text-slate-500 tracking-widest uppercase mt-1">Admin Panel</div>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {links.map((item) => (
          <Link key={item.href} href={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium ${
              active === item.href
                ? 'bg-electric-500/10 text-electric-400 border border-electric-500/20'
                : 'text-slate-300 hover:text-white hover:bg-navy-700'
            }`}>
            <item.icon className="w-4 h-4" />{item.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    fetch(`${apiUrl}/crm/leads?status=client`)
      .then(r => r.json())
      .then(data => { setClients(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-navy-900">
      <Sidebar active="/admin/clients" />
      <main className="ml-64 p-8">
        <div className="mb-10">
          <div className="font-mono text-xs text-electric-500 tracking-widest uppercase mb-2">Gestione</div>
          <h1 className="font-display text-5xl text-white tracking-wide">CLIENTI ATTIVI</h1>
          <p className="text-slate-500 text-sm font-mono mt-2">{clients.length} clienti in gestione</p>
        </div>

        {loading ? (
          <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-navy-800 rounded-2xl animate-pulse" />)}</div>
        ) : clients.length === 0 ? (
          <div className="text-center py-24 text-slate-500">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-display text-3xl text-slate-600 tracking-wide">NESSUN CLIENTE</p>
            <p className="text-sm font-mono mt-3">Converti i lead dalla pipeline per vederli qui!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {clients.map((c: any) => (
              <div key={c.id} className="bg-navy-800 border border-navy-700 rounded-2xl p-6 hover:border-electric-500/30 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-white text-lg">{c.company_name}</h3>
                    <p className="text-slate-400 text-xs font-mono mt-1">{c.contact_email} · {c.sector}</p>
                  </div>
                  <div className="font-display text-4xl text-electric-500 tracking-wide">{c.overall_score}<span className="text-slate-600 text-xl">/100</span></div>
                </div>
                <div className="flex gap-2">
                  {PHASES.map((phase, i) => (
                    <div key={phase} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-mono ${i === 0 ? 'bg-electric-500/10 text-electric-400 border border-electric-500/20' : 'bg-navy-700 text-slate-500 border border-navy-600'}`}>
                      {i === 0 && <CheckCircle className="w-3 h-3" />}
                      {phase}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
