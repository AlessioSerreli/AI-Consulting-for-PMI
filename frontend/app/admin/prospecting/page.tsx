'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { Brain, Users, TrendingUp, Search, MapPin, Phone, Globe, Star, Target, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: TrendingUp },
  { href: '/admin/leads', label: 'Pipeline Lead', icon: Users },
  { href: '/admin/clients', label: 'Clienti Attivi', icon: Brain },
  { href: '/admin/prospecting', label: 'Prospecting', icon: Target },
]

type RunStatus = 'idle' | 'running' | 'succeeded' | 'failed'

interface ProspectingLead {
  id: string
  company_name: string
  category: string
  address: string
  city: string
  phone: string
  website: string
  email: string
  rating: number | null
  review_count: number
  google_maps_url: string
  status: string
  notes: string | null
  created_at: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  new:       { label: 'Nuovo',      color: 'bg-electric-500/10 text-electric-400' },
  contacted: { label: 'Contattato', color: 'bg-yellow-500/10 text-yellow-400' },
  converted: { label: 'Convertito', color: 'bg-green-500/10 text-green-400' },
  dismissed: { label: 'Scartato',   color: 'bg-slate-500/10 text-slate-500' },
}

const EMPLOYEES_OPTIONS = [
  { value: '',         label: 'Qualsiasi dimensione' },
  { value: 'micro',    label: 'Micro (1–9 dip.)' },
  { value: 'piccola',  label: 'Piccola (10–49 dip.)' },
  { value: 'media',    label: 'Media (50–249 dip.)' },
]

const REVENUE_OPTIONS = [
  { value: '',       label: 'Qualsiasi fatturato' },
  { value: '<500k',  label: '< €500k' },
  { value: '500k2m', label: '€500k – €2M' },
  { value: '2m10m',  label: '€2M – €10M' },
  { value: '>10m',   label: '> €10M' },
]

export default function ProspectingPage() {
  const [query, setQuery] = useState('')
  const [city, setCity] = useState('')
  const [maxResults, setMaxResults] = useState(20)
  const [employees, setEmployees] = useState('')
  const [revenue, setRevenue] = useState('')
  const [runStatus, setRunStatus] = useState<RunStatus>('idle')
  const [runId, setRunId] = useState<string | null>(null)
  const [searchLabel, setSearchLabel] = useState('')
  const [newResults, setNewResults] = useState<ProspectingLead[]>([])
  const [savedLeads, setSavedLeads] = useState<ProspectingLead[]>([])
  const [activeTab, setActiveTab] = useState<'search' | 'saved'>('search')
  const [error, setError] = useState<string | null>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    loadSavedLeads()
    return () => { if (pollingRef.current) clearInterval(pollingRef.current) }
  }, [])

  async function loadSavedLeads() {
    const res = await fetch(`${API_URL}/prospecting/leads?limit=100`).catch(() => null)
    if (res?.ok) setSavedLeads(await res.json())
  }

  async function startSearch() {
    if (!query.trim() || !city.trim()) return
    setError(null)
    setRunStatus('running')
    setNewResults([])
    const empLabel = EMPLOYEES_OPTIONS.find(o => o.value === employees)?.label ?? ''
    const revLabel = REVENUE_OPTIONS.find(o => o.value === revenue)?.label ?? ''
    const filters = [empLabel, revLabel].filter(l => l && !l.startsWith('Qualsiasi')).join(' · ')
    setSearchLabel(`${query} · ${city}${filters ? ` · ${filters}` : ''}`)

    const res = await fetch(`${API_URL}/prospecting/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: query.trim(), city: city.trim(), max_results: maxResults, employees: employees || null, revenue: revenue || null }),
    }).catch(() => null)

    if (!res?.ok) {
      setError('Errore avvio ricerca. Verifica che APIFY_API_TOKEN sia configurato nel .env.')
      setRunStatus('failed')
      return
    }

    const data = await res.json()
    setRunId(data.run_id)
    pollStatus(data.run_id)
  }

  function pollStatus(id: string) {
    pollingRef.current = setInterval(async () => {
      const res = await fetch(`${API_URL}/prospecting/runs/${id}/status`).catch(() => null)
      if (!res?.ok) return

      const data = await res.json()

      if (data.status === 'SUCCEEDED') {
        clearInterval(pollingRef.current!)
        fetchResults(id)
      } else if (data.status === 'FAILED' || data.status === 'TIMED-OUT') {
        clearInterval(pollingRef.current!)
        setRunStatus('failed')
        setError(`Scraping fallito con status: ${data.status}`)
      }
    }, 4000)
  }

  async function fetchResults(id: string) {
    const res = await fetch(`${API_URL}/prospecting/runs/${id}/results?save=true`).catch(() => null)
    if (!res?.ok) {
      setRunStatus('failed')
      setError('Errore nel recupero risultati.')
      return
    }
    const data = await res.json()
    setNewResults(data.results || [])
    setRunStatus('succeeded')
    setActiveTab('search')
    loadSavedLeads()
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`${API_URL}/prospecting/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setSavedLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l))
    setNewResults(prev => prev.map(l => l.id === id ? { ...l, status } : l))
  }

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
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                item.href === '/admin/prospecting'
                  ? 'bg-navy-700 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-navy-700'
              }`}
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
          <h1 className="text-2xl font-bold text-white">Prospecting</h1>
          <p className="text-slate-400 text-sm mt-1">Trova nuove PMI da contattare tramite Google Maps</p>
        </div>

        {/* Search form */}
        <div className="bg-navy-800 border border-navy-700 rounded-2xl p-6 mb-6">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Search className="w-4 h-4 text-electric-400" />
            Nuova ricerca
          </h2>
          <div className="grid grid-cols-3 gap-4 mb-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Settore / categoria</label>
              <input
                type="text"
                placeholder="es. officina meccanica"
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full bg-navy-900 border border-navy-600 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-electric-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Città</label>
              <input
                type="text"
                placeholder="es. Milano"
                value={city}
                onChange={e => setCity(e.target.value)}
                className="w-full bg-navy-900 border border-navy-600 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-electric-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Max risultati</label>
              <select
                value={maxResults}
                onChange={e => setMaxResults(Number(e.target.value))}
                className="w-full bg-navy-900 border border-navy-600 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-electric-500"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Dimensione azienda</label>
              <select
                value={employees}
                onChange={e => setEmployees(e.target.value)}
                className="w-full bg-navy-900 border border-navy-600 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-electric-500"
              >
                {EMPLOYEES_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Fascia di fatturato</label>
              <select
                value={revenue}
                onChange={e => setRevenue(e.target.value)}
                className="w-full bg-navy-900 border border-navy-600 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-electric-500"
              >
                {REVENUE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
          <button
            onClick={startSearch}
            disabled={runStatus === 'running' || !query.trim() || !city.trim()}
            className="flex items-center gap-2 px-6 py-2.5 bg-electric-500 hover:bg-electric-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-xl text-sm transition-colors"
          >
            {runStatus === 'running'
              ? <><RefreshCw className="w-4 h-4 animate-spin" /> Analizzando Google Maps...</>
              : <><Search className="w-4 h-4" /> Avvia ricerca</>
            }
          </button>
          {error && (
            <p className="mt-3 text-red-400 text-sm">{error}</p>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-navy-800 border border-navy-700 rounded-xl p-1 w-fit">
          <button
            onClick={() => setActiveTab('search')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'search' ? 'bg-navy-700 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Risultati ricerca {newResults.length > 0 && `(${newResults.length})`}
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'saved' ? 'bg-navy-700 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Tutti i lead salvati {savedLeads.length > 0 && `(${savedLeads.length})`}
          </button>
        </div>

        {/* Results */}
        {activeTab === 'search' && (
          <div className="bg-navy-800 border border-navy-700 rounded-2xl p-6">
            {runStatus === 'idle' && (
              <div className="text-center py-16 text-slate-500">
                <Target className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>Inserisci settore e città per trovare nuovi prospect</p>
              </div>
            )}

            {runStatus === 'running' && (
              <div className="text-center py-16">
                <RefreshCw className="w-10 h-10 mx-auto mb-3 text-electric-400 animate-spin" />
                <p className="text-white font-medium">Scraping in corso: {searchLabel}</p>
                <p className="text-slate-500 text-sm mt-1">Attendi 30–60 secondi...</p>
              </div>
            )}

            {runStatus === 'succeeded' && newResults.length === 0 && (
              <div className="text-center py-16 text-slate-500">
                <p>Nessun risultato trovato per questa ricerca.</p>
              </div>
            )}

            {runStatus === 'succeeded' && newResults.length > 0 && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-slate-400 text-sm">{newResults.length} aziende trovate · {searchLabel}</p>
                </div>
                <LeadTable leads={newResults} onStatusChange={updateStatus} />
              </>
            )}
          </div>
        )}

        {activeTab === 'saved' && (
          <div className="bg-navy-800 border border-navy-700 rounded-2xl p-6">
            {savedLeads.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <p>Nessun lead salvato ancora. Avvia una ricerca per iniziare.</p>
              </div>
            ) : (
              <LeadTable leads={savedLeads} onStatusChange={updateStatus} />
            )}
          </div>
        )}
      </main>
    </div>
  )
}

function LeadTable({ leads, onStatusChange }: { leads: ProspectingLead[], onStatusChange: (id: string, status: string) => void }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-navy-700">
            <th className="text-left text-slate-400 font-medium pb-3 pr-4">Azienda</th>
            <th className="text-left text-slate-400 font-medium pb-3 pr-4">Contatti</th>
            <th className="text-left text-slate-400 font-medium pb-3 pr-4">Rating</th>
            <th className="text-left text-slate-400 font-medium pb-3 pr-4">Status</th>
            <th className="text-left text-slate-400 font-medium pb-3">Azioni</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-navy-700">
          {leads.map(lead => (
            <tr key={lead.id} className={`hover:bg-navy-900/30 transition-colors ${lead.status === 'dismissed' ? 'opacity-40' : ''}`}>
              <td className="py-3 pr-4">
                <div className="font-medium text-white">{lead.company_name}</div>
                <div className="text-slate-500 text-xs flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3" />
                  {lead.city || lead.address || '—'}
                  {lead.category && <span className="ml-2 text-slate-600">· {lead.category}</span>}
                </div>
              </td>
              <td className="py-3 pr-4">
                <div className="space-y-0.5">
                  {lead.phone && (
                    <div className="flex items-center gap-1 text-slate-300 text-xs">
                      <Phone className="w-3 h-3 text-slate-500" /> {lead.phone}
                    </div>
                  )}
                  {lead.website && (
                    <a href={lead.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-electric-400 text-xs hover:underline">
                      <Globe className="w-3 h-3" /> sito web
                    </a>
                  )}
                  {lead.google_maps_url && (
                    <a href={lead.google_maps_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-slate-500 text-xs hover:text-slate-300">
                      <MapPin className="w-3 h-3" /> Google Maps
                    </a>
                  )}
                </div>
              </td>
              <td className="py-3 pr-4">
                {lead.rating ? (
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    <span className="text-white text-xs font-medium">{lead.rating.toFixed(1)}</span>
                    <span className="text-slate-500 text-xs">({lead.review_count})</span>
                  </div>
                ) : (
                  <span className="text-slate-600 text-xs">—</span>
                )}
              </td>
              <td className="py-3 pr-4">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_CONFIG[lead.status]?.color ?? 'text-slate-400'}`}>
                  {STATUS_CONFIG[lead.status]?.label ?? lead.status}
                </span>
              </td>
              <td className="py-3">
                <div className="flex items-center gap-1">
                  {lead.status !== 'contacted' && lead.status !== 'converted' && (
                    <button
                      onClick={() => onStatusChange(lead.id, 'contacted')}
                      title="Segna come contattato"
                      className="p-1.5 rounded-lg hover:bg-yellow-500/10 text-slate-500 hover:text-yellow-400 transition-colors"
                    >
                      <Clock className="w-4 h-4" />
                    </button>
                  )}
                  {lead.status !== 'converted' && (
                    <button
                      onClick={() => onStatusChange(lead.id, 'converted')}
                      title="Segna come convertito"
                      className="p-1.5 rounded-lg hover:bg-green-500/10 text-slate-500 hover:text-green-400 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                  {lead.status !== 'dismissed' && (
                    <button
                      onClick={() => onStatusChange(lead.id, 'dismissed')}
                      title="Scarta"
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
