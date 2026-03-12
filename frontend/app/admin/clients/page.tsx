'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Brain, Users, TrendingUp, CheckCircle } from 'lucide-react'

const PHASES = ['Audit', 'Implementazione', 'Formazione', 'Manutenzione']

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
      <aside className="fixed left-0 top-0 h-full w-64 bg-navy-800 border-r border-navy-700 flex flex-col">
        <div className="p-6 border-b border-navy-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-electric-500 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-white">Admin Panel</span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {[
            { href: '/admin', label: 'Dashboard', icon: TrendingUp, active: false },
            { href: '/admin/leads', label: 'Pipeline Lead', icon: Users, active: false },
            { href: '/admin/clients', label: 'Clienti Attivi', icon: Brain, active: true },
          ].map((item) => (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium ${item.active ? 'bg-electric-500/10 text-electric-400' : 'text-slate-300 hover:text-white hover:bg-navy-700'}`}>
              <item.icon className="w-4 h-4" />{item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Clienti Attivi</h1>
          <p className="text-slate-400 text-sm mt-1">{clients.length} clienti in gestione</p>
        </div>
        {loading ? (
          <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-navy-800 rounded-2xl animate-pulse" />)}</div>
        ) : clients.length === 0 ? (
          <div className="text-center py-24 text-slate-500">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>Nessun cliente ancora. Converti i lead dalla pipeline!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {clients.map((c: any) => (
              <div key={c.id} className="bg-navy-800 border border-navy-700 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-white text-lg">{c.company_name}</h3>
                    <p className="text-slate-400 text-sm">{c.contact_email} · {c.sector}</p>
                  </div>
                  <div className="text-electric-400 font-bold">{c.overall_score}/100</div>
                </div>
                <div className="flex gap-2">
                  {PHASES.map((phase, i) => (
                    <div key={phase} className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium ${i === 0 ? 'bg-electric-500/10 text-electric-400' : 'bg-navy-700 text-slate-500'}`}>
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
