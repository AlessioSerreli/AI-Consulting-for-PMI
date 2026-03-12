'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Brain, Users, TrendingUp, Calendar, ArrowRight, AlertCircle } from 'lucide-react'

interface Stats {
  total_leads: number
  surveys_today: number
  conversion_rate: number
  active_clients: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentLeads, setRecentLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    Promise.all([
      fetch(`${apiUrl}/crm/stats`).then(r => r.json()).catch(() => ({ total_leads: 0, surveys_today: 0, conversion_rate: 0, active_clients: 0 })),
      fetch(`${apiUrl}/crm/leads?limit=5`).then(r => r.json()).catch(() => []),
    ]).then(([s, l]) => {
      setStats(s)
      setRecentLeads(Array.isArray(l) ? l : [])
      setLoading(false)
    })
  }, [])

  const statsCards = [
    { label: 'Lead Totali', value: stats?.total_leads ?? '—', icon: Users, color: 'text-electric-400' },
    { label: 'Survey Oggi', value: stats?.surveys_today ?? '—', icon: TrendingUp, color: 'text-green-400' },
    { label: 'Tasso Conversione', value: stats ? `${stats.conversion_rate}%` : '—', icon: Calendar, color: 'text-yellow-400' },
    { label: 'Clienti Attivi', value: stats?.active_clients ?? '—', icon: Brain, color: 'text-purple-400' },
  ]

  return (
    <div className="min-h-screen bg-navy-900">
      {/* Sidebar */}
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
            { href: '/admin', label: 'Dashboard', icon: TrendingUp },
            { href: '/admin/leads', label: 'Pipeline Lead', icon: Users },
            { href: '/admin/clients', label: 'Clienti Attivi', icon: Brain },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:text-white hover:bg-navy-700 transition-colors text-sm font-medium"
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-navy-700">
          <div className="text-xs text-slate-500">v0.1.0 — MVP</div>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Panoramica delle attività</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          {statsCards.map((card) => (
            <div key={card.label} className="bg-navy-800 border border-navy-700 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-slate-400 text-sm">{card.label}</span>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <div className="text-3xl font-bold text-white">
                {loading ? <div className="h-8 w-16 bg-navy-700 rounded animate-pulse" /> : card.value}
              </div>
            </div>
          ))}
        </div>

        {/* Recent Leads */}
        <div className="bg-navy-800 border border-navy-700 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-white">Lead Recenti</h2>
            <Link href="/admin/leads" className="text-electric-400 text-sm flex items-center gap-1 hover:text-electric-300 transition-colors">
              Vedi tutti <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-navy-700 rounded-xl animate-pulse" />)}
            </div>
          ) : recentLeads.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <AlertCircle className="w-8 h-8 mx-auto mb-3 opacity-50" />
              <p>Nessun lead ancora. Condividi la survey per iniziare!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentLeads.map((lead: any) => (
                <div key={lead.id} className="flex items-center justify-between bg-navy-900/50 rounded-xl p-4 hover:bg-navy-900 transition-colors">
                  <div>
                    <div className="font-medium text-white text-sm">{lead.company_name}</div>
                    <div className="text-slate-500 text-xs">{lead.contact_email} · {lead.sector}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                      lead.status === 'new' ? 'bg-electric-500/10 text-electric-400' :
                      lead.status === 'contacted' ? 'bg-yellow-500/10 text-yellow-400' :
                      'bg-green-500/10 text-green-400'
                    }`}>
                      {lead.status === 'new' ? 'Nuovo' : lead.status === 'contacted' ? 'Contattato' : lead.status}
                    </span>
                    {lead.overall_score && (
                      <span className="text-electric-400 font-bold text-sm">{lead.overall_score}/100</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
