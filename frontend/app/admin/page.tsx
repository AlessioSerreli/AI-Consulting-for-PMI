'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Brain, Users, TrendingUp, Calendar, ArrowRight, AlertCircle, Target, LogOut } from 'lucide-react'

interface Stats {
  total_leads: number
  surveys_today: number
  conversion_rate: number
  active_clients: number
}

function Sidebar({ active }: { active: string }) {
  const router = useRouter()
  const links = [
    { href: '/admin', label: 'Dashboard', icon: TrendingUp },
    { href: '/admin/leads', label: 'Pipeline Lead', icon: Users },
    { href: '/admin/clients', label: 'Clienti Attivi', icon: Brain },
    { href: '/admin/prospecting', label: 'Prospecting', icon: Target },
  ]

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
    router.refresh()
  }

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
      <div className="p-4 border-t border-navy-700 space-y-3">
        <div className="font-mono text-xs text-slate-600">v0.1.0 — MVP</div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-xs text-slate-500 hover:text-red-400 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" /> Esci
        </button>
      </div>
    </aside>
  )
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
    { label: 'Survey Oggi', value: stats?.surveys_today ?? '—', icon: TrendingUp, color: 'text-electric-400' },
    { label: 'Tasso Conversione', value: stats ? `${stats.conversion_rate}%` : '—', icon: Calendar, color: 'text-electric-400' },
    { label: 'Clienti Attivi', value: stats?.active_clients ?? '—', icon: Brain, color: 'text-electric-400' },
  ]

  const PIPELINE_STATUS: Record<string, string> = {
    new: 'Nuovo',
    survey_done: 'Survey Done',
    call_scheduled: 'Call Schedulata',
    offer_sent: 'Offerta Inviata',
    client: 'Cliente',
    lost: 'Perso',
  }

  return (
    <div className="min-h-screen bg-navy-900">
      <Sidebar active="/admin" />
      <main className="ml-64 p-8">
        <div className="mb-10">
          <div className="font-mono text-xs text-electric-500 tracking-widest uppercase mb-2">Panoramica</div>
          <h1 className="font-display text-5xl text-white tracking-wide">DASHBOARD</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          {statsCards.map((card) => (
            <div key={card.label} className="bg-navy-800 border border-navy-700 rounded-2xl p-6 hover:border-electric-500/30 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <span className="text-slate-400 text-sm">{card.label}</span>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <div className="font-display text-5xl text-white tracking-wide">
                {loading ? <div className="h-10 w-16 bg-navy-700 rounded animate-pulse" /> : card.value}
              </div>
            </div>
          ))}
        </div>

        {/* Recent Leads */}
        <div className="bg-navy-800 border border-navy-700 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-white">Lead Recenti</h2>
            <Link href="/admin/leads" className="text-electric-400 text-sm flex items-center gap-1 hover:text-electric-300 transition-colors font-mono">
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
              <p className="font-mono text-sm">Nessun lead ancora. Condividi la survey per iniziare!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentLeads.map((lead: any) => (
                <div key={lead.id} className="flex items-center justify-between bg-navy-900/50 rounded-xl p-4 hover:bg-navy-900 transition-colors">
                  <div>
                    <div className="font-medium text-white text-sm">{lead.company_name}</div>
                    <div className="text-slate-500 text-xs font-mono mt-0.5">{lead.contact_email} · {lead.sector}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs px-3 py-1 rounded-full font-mono bg-electric-500/10 text-electric-400 border border-electric-500/20">
                      {PIPELINE_STATUS[lead.status] || lead.status}
                    </span>
                    {lead.overall_score && (
                      <span className="text-electric-400 font-display text-lg tracking-wide">{lead.overall_score}</span>
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
