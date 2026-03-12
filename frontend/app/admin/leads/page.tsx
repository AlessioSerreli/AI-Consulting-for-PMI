'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Brain, Users, TrendingUp, Mail, Star } from 'lucide-react'

const PIPELINE_STAGES = [
  { id: 'new', label: 'Nuovo Lead', color: 'border-electric-500 text-electric-400 bg-electric-500/10' },
  { id: 'survey_done', label: 'Survey Completata', color: 'border-blue-500 text-blue-400 bg-blue-500/10' },
  { id: 'call_scheduled', label: 'Call Schedulata', color: 'border-yellow-500 text-yellow-400 bg-yellow-500/10' },
  { id: 'offer_sent', label: 'Offerta Inviata', color: 'border-orange-500 text-orange-400 bg-orange-500/10' },
  { id: 'client', label: 'Cliente', color: 'border-green-500 text-green-400 bg-green-500/10' },
  { id: 'lost', label: 'Perso', color: 'border-red-500 text-red-400 bg-red-500/10' },
]

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStage, setSelectedStage] = useState<string | null>(null)

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    fetch(`${apiUrl}/crm/leads`)
      .then(r => r.json())
      .then(data => { setLeads(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const getLeadsByStage = (stage: string) => leads.filter(l => l.status === stage)

  const updateStatus = async (leadId: string, newStatus: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    await fetch(`${apiUrl}/crm/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l))
  }

  const filteredLeads = selectedStage ? leads.filter(l => l.status === selectedStage) : leads

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
            { href: '/admin/leads', label: 'Pipeline Lead', icon: Users, active: true },
            { href: '/admin/clients', label: 'Clienti Attivi', icon: Brain, active: false },
          ].map((item) => (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium ${item.active ? 'bg-electric-500/10 text-electric-400' : 'text-slate-300 hover:text-white hover:bg-navy-700'}`}>
              <item.icon className="w-4 h-4" />{item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="ml-64 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Pipeline Lead</h1>
            <p className="text-slate-400 text-sm mt-1">{leads.length} lead totali</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setSelectedStage(null)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${!selectedStage ? 'bg-electric-500 text-white' : 'bg-navy-800 text-slate-400 hover:text-white'}`}>
              Tutti
            </button>
            {PIPELINE_STAGES.map(s => (
              <button key={s.id} onClick={() => setSelectedStage(s.id === selectedStage ? null : s.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedStage === s.id ? 'bg-navy-700 text-white' : 'bg-navy-800 text-slate-400 hover:text-white'}`}>
                {s.label} ({getLeadsByStage(s.id).length})
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <div key={i} className="h-32 bg-navy-800 rounded-2xl animate-pulse" />)}
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="text-center py-24 text-slate-500">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg">Nessun lead ancora.</p>
            <p className="text-sm mt-2">Condividi il link della survey per iniziare a raccogliere lead.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredLeads.map((lead: any) => (
              <div key={lead.id} className="bg-navy-800 border border-navy-700 rounded-2xl p-6 hover:border-navy-600 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-white">{lead.company_name || 'Azienda sconosciuta'}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium border ${PIPELINE_STAGES.find(s => s.id === lead.status)?.color || ''}`}>
                        {PIPELINE_STAGES.find(s => s.id === lead.status)?.label || lead.status}
                      </span>
                      {lead.overall_score && (
                        <span className="flex items-center gap-1 text-electric-400 text-sm font-bold">
                          <Star className="w-3 h-3" />{lead.overall_score}/100
                        </span>
                      )}
                    </div>
                    <div className="flex gap-4 text-sm text-slate-400">
                      {lead.contact_email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{lead.contact_email}</span>}
                      {lead.sector && <span>{lead.sector}</span>}
                      {lead.employees && <span>{lead.employees} dipendenti</span>}
                    </div>
                    {lead.main_pain && <p className="text-slate-500 text-xs mt-2">Pain: {lead.main_pain}</p>}
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={lead.status}
                      onChange={(e) => updateStatus(lead.id, e.target.value)}
                      className="bg-navy-700 border border-navy-600 text-white text-xs px-3 py-2 rounded-lg outline-none cursor-pointer"
                    >
                      {PIPELINE_STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
