'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Brain, Users, TrendingUp, Mail, Star, Target, FileText } from 'lucide-react'

const PIPELINE_STAGES = [
  { id: 'new', label: 'Nuovo Lead', color: 'border-electric-500 text-electric-400 bg-electric-500/10' },
  { id: 'survey_done', label: 'Survey Completata', color: 'border-blue-500 text-blue-400 bg-blue-500/10' },
  { id: 'call_scheduled', label: 'Call Schedulata', color: 'border-yellow-500 text-yellow-400 bg-yellow-500/10' },
  { id: 'offer_sent', label: 'Offerta Inviata', color: 'border-orange-500 text-orange-400 bg-orange-500/10' },
  { id: 'client', label: 'Cliente', color: 'border-green-500 text-green-400 bg-green-500/10' },
  { id: 'lost', label: 'Perso', color: 'border-red-500 text-red-400 bg-red-500/10' },
]

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

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const [selectedStage, setSelectedStage] = useState<string | null>(null)
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  useEffect(() => {
    fetch(`${apiUrl}/crm/leads`)
      .then(r => { if (!r.ok) throw new Error(String(r.status)); return r.json() })
      .then(data => { setLeads(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => { setFetchError(true); setLoading(false) })
  }, [apiUrl])

  const getLeadsByStage = (stage: string) => leads.filter(l => l.status === stage)

  const updateStatus = async (leadId: string, newStatus: string) => {
    const prevLeads = leads
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l))
    try {
      const res = await fetch(`${apiUrl}/crm/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error(String(res.status))
    } catch {
      setLeads(prevLeads)
    }
  }

  const filteredLeads = selectedStage ? leads.filter(l => l.status === selectedStage) : leads

  return (
    <div className="min-h-screen bg-navy-900">
      <Sidebar active="/admin/leads" />
      <main className="ml-64 p-8">
        <div className="flex items-start justify-between mb-10">
          <div>
            <div className="font-mono text-xs text-electric-500 tracking-widest uppercase mb-2">Gestione</div>
            <h1 className="font-display text-5xl text-white tracking-wide">PIPELINE LEAD</h1>
            <p className="text-slate-500 text-sm font-mono mt-2">{leads.length} lead totali</p>
          </div>
          <div className="flex gap-2 flex-wrap justify-end mt-2">
            <button onClick={() => setSelectedStage(null)}
              className={`px-4 py-2 rounded-lg text-xs font-mono tracking-widest uppercase transition-colors ${!selectedStage ? 'bg-electric-500 text-navy-900 font-bold' : 'bg-navy-800 text-slate-400 hover:text-white border border-navy-700'}`}>
              Tutti ({leads.length})
            </button>
            {PIPELINE_STAGES.map(s => (
              <button key={s.id} onClick={() => setSelectedStage(s.id === selectedStage ? null : s.id)}
                className={`px-4 py-2 rounded-lg text-xs font-mono tracking-widest uppercase transition-colors ${selectedStage === s.id ? 'bg-navy-700 text-white border border-electric-500/40' : 'bg-navy-800 text-slate-400 hover:text-white border border-navy-700'}`}>
                {s.label} ({getLeadsByStage(s.id).length})
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-navy-800 rounded-2xl animate-pulse" />)}
          </div>
        ) : fetchError ? (
          <div className="text-center py-24 text-slate-500">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-display text-3xl text-red-600/50 tracking-wide">ERRORE DI CONNESSIONE</p>
            <p className="text-sm font-mono mt-3">Impossibile caricare i lead. Verifica che il backend sia attivo.</p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="text-center py-24 text-slate-500">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-display text-3xl text-slate-600 tracking-wide">NESSUN LEAD</p>
            <p className="text-sm font-mono mt-3">Condividi il link della survey per iniziare a raccogliere lead.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredLeads.map((lead: any) => (
              <div key={lead.id} className="bg-navy-800 border border-navy-700 rounded-2xl p-6 hover:border-electric-500/30 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-white">{lead.company_name || 'Azienda sconosciuta'}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full font-mono border ${PIPELINE_STAGES.find(s => s.id === lead.status)?.color || ''}`}>
                        {PIPELINE_STAGES.find(s => s.id === lead.status)?.label || lead.status}
                      </span>
                      {lead.overall_score && (
                        <span className="flex items-center gap-1 text-electric-400 font-display text-lg tracking-wide">
                          <Star className="w-3 h-3" />{lead.overall_score}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-4 text-xs text-slate-400 font-mono">
                      {lead.contact_email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{lead.contact_email}</span>}
                      {lead.sector && <span>{lead.sector}</span>}
                      {lead.employees && <span>{lead.employees} dip.</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {lead.has_pdf && (
                      <a
                        href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/crm/leads/${lead.id}/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-2 bg-navy-700 border border-navy-600 text-electric-400 text-xs rounded-lg font-mono hover:border-electric-500/40 hover:text-electric-300 transition-colors"
                        title="Apri PDF Scorecard"
                      >
                        <FileText className="w-3.5 h-3.5" /> PDF
                      </a>
                    )}
                    <select
                      value={lead.status}
                      onChange={(e) => updateStatus(lead.id, e.target.value)}
                      className="bg-navy-700 border border-navy-600 text-white text-xs px-3 py-2 rounded-lg outline-none cursor-pointer font-mono hover:border-electric-500/40 transition-colors"
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
