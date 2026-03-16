'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { Brain, Users, TrendingUp, Search, MapPin, Phone, Globe, Star, Target, CheckCircle, XCircle, Clock, RefreshCw, Mail, Zap, UserPlus } from 'lucide-react'

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
  owner_name: string | null
  owner_email: string | null
  owner_position: string | null
  outreach_sent_at: string | null
  source: string | null
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

function formatOutreachDate(isoDate: string): string {
  const d = new Date(isoDate)
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`
}

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

  const [enrichingAll, setEnrichingAll] = useState(false)
  const [outreachSending, setOutreachSending] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkOutreaching, setBulkOutreaching] = useState(false)

  const [showManualForm, setShowManualForm] = useState(false)
  const [manualForm, setManualForm] = useState({
    company_name: '', owner_email: '', owner_name: '',
    city: '', phone: '', website: '', category: '',
  })
  const [manualSubmitting, setManualSubmitting] = useState(false)

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

  async function enrichLead(id: string) {
    const res = await fetch(`${API_URL}/prospecting/leads/${id}/enrich`, { method: 'POST' }).catch(() => null)
    if (!res?.ok) return
    const data = await res.json()
    if (data.enriched && data.contact) {
      const update = { owner_name: data.contact.owner_name, owner_email: data.contact.owner_email, owner_position: data.contact.owner_position }
      setSavedLeads(prev => prev.map(l => l.id === id ? { ...l, ...update } : l))
      setNewResults(prev => prev.map(l => l.id === id ? { ...l, ...update } : l))
    }
  }

  async function enrichAll() {
    setEnrichingAll(true)
    await fetch(`${API_URL}/prospecting/leads/enrich-all?limit=20`, { method: 'POST' }).catch(() => null)
    await loadSavedLeads()
    setEnrichingAll(false)
  }

  async function sendOutreach(lead: ProspectingLead) {
    if (!lead.owner_email && !lead.email) {
      alert('Nessuna email disponibile. Esegui prima l\'enrich Hunter.io.')
      return
    }
    setOutreachSending(lead.id)
    const res = await fetch(`${API_URL}/prospecting/leads/${lead.id}/outreach`, { method: 'POST' }).catch(() => null)
    setOutreachSending(null)
    if (res?.ok) {
      const data = await res.json()
      const now = new Date().toISOString()
      setSavedLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: 'contacted', outreach_sent_at: now } : l))
      setNewResults(prev => prev.map(l => l.id === lead.id ? { ...l, status: 'contacted', outreach_sent_at: now } : l))
      if (data.already_in_pipeline) {
        alert('Lead già in pipeline')
      }
    } else {
      alert('Errore invio email. Controlla i log del backend.')
    }
  }

  async function sendBulkOutreach() {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return
    setBulkOutreaching(true)

    const res = await fetch(`${API_URL}/prospecting/leads/bulk-outreach`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_ids: ids }),
    }).catch(() => null)

    setBulkOutreaching(false)

    if (res?.ok) {
      const data = await res.json()
      const now = new Date().toISOString()
      const sentSet = new Set<string>(data.sent as string[])
      setSavedLeads(prev => prev.map(l => sentSet.has(l.id) ? { ...l, status: 'contacted', outreach_sent_at: now } : l))
      setNewResults(prev => prev.map(l => sentSet.has(l.id) ? { ...l, status: 'contacted', outreach_sent_at: now } : l))
      setSelectedIds(new Set())
      if (data.failed?.length > 0) {
        alert(`Inviato a ${data.sent.length}/${ids.length}. Falliti: ${data.failed.length} (nessuna email o errore SMTP).`)
      }
    } else {
      alert('Errore bulk outreach. Controlla i log del backend.')
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAll(leads: ProspectingLead[]) {
    const withEmail = leads.filter(l => l.owner_email || l.email).map(l => l.id)
    setSelectedIds(new Set(withEmail))
  }

  function deselectAll() {
    setSelectedIds(new Set())
  }

  async function submitManualLead() {
    if (!manualForm.company_name.trim() || !manualForm.owner_email.trim()) return
    setManualSubmitting(true)
    // Omette i campi opzionali vuoti (stringa vuota → non inviato)
    const payload = Object.fromEntries(
      Object.entries(manualForm).filter(([, v]) => v.trim() !== '')
    )
    const res = await fetch(`${API_URL}/prospecting/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => null)
    setManualSubmitting(false)
    if (res?.ok) {
      const newLead = await res.json()
      setSavedLeads(prev => [newLead, ...prev])
      setManualForm({ company_name: '', owner_email: '', owner_name: '', city: '', phone: '', website: '', category: '' })
      setShowManualForm(false)
      setActiveTab('saved')
    } else {
      alert('Errore nel salvataggio del lead. Controlla i log del backend.')
    }
  }

  const currentLeads = activeTab === 'search' ? newResults : savedLeads
  const allWithEmailSelected =
    currentLeads.filter(l => l.owner_email || l.email).length > 0 &&
    currentLeads.filter(l => l.owner_email || l.email).every(l => selectedIds.has(l.id))

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

        {/* Manual lead form */}
        {showManualForm && (
          <div className="bg-navy-800 border border-navy-700 rounded-2xl p-6 mb-6">
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-electric-400" />
              Aggiungi lead manuale
            </h2>
            <div className="grid grid-cols-3 gap-4 mb-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Azienda <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  placeholder="es. Officina Rossi"
                  value={manualForm.company_name}
                  onChange={e => setManualForm(f => ({ ...f, company_name: e.target.value }))}
                  className="w-full bg-navy-900 border border-navy-600 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-electric-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Email contatto <span className="text-red-400">*</span></label>
                <input
                  type="email"
                  placeholder="es. info@azienda.it"
                  value={manualForm.owner_email}
                  onChange={e => setManualForm(f => ({ ...f, owner_email: e.target.value }))}
                  className="w-full bg-navy-900 border border-navy-600 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-electric-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Nome referente</label>
                <input
                  type="text"
                  placeholder="es. Mario Rossi"
                  value={manualForm.owner_name}
                  onChange={e => setManualForm(f => ({ ...f, owner_name: e.target.value }))}
                  className="w-full bg-navy-900 border border-navy-600 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-electric-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Città</label>
                <input
                  type="text"
                  placeholder="es. Milano"
                  value={manualForm.city}
                  onChange={e => setManualForm(f => ({ ...f, city: e.target.value }))}
                  className="w-full bg-navy-900 border border-navy-600 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-electric-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Telefono</label>
                <input
                  type="text"
                  placeholder="es. +39 02 1234567"
                  value={manualForm.phone}
                  onChange={e => setManualForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full bg-navy-900 border border-navy-600 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-electric-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Sito web</label>
                <input
                  type="text"
                  placeholder="es. www.azienda.it"
                  value={manualForm.website}
                  onChange={e => setManualForm(f => ({ ...f, website: e.target.value }))}
                  className="w-full bg-navy-900 border border-navy-600 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-electric-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Categoria</label>
                <input
                  type="text"
                  placeholder="es. officina meccanica"
                  value={manualForm.category}
                  onChange={e => setManualForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full bg-navy-900 border border-navy-600 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-electric-500"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={submitManualLead}
                disabled={manualSubmitting || !manualForm.company_name.trim() || !manualForm.owner_email.trim()}
                className="flex items-center gap-2 px-6 py-2.5 bg-electric-500 hover:bg-electric-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-xl text-sm transition-colors"
              >
                {manualSubmitting ? <><RefreshCw className="w-4 h-4 animate-spin" /> Salvataggio...</> : <><UserPlus className="w-4 h-4" /> Salva lead</>}
              </button>
              <button
                onClick={() => setShowManualForm(false)}
                className="px-4 py-2.5 text-sm text-slate-400 hover:text-white bg-navy-900 border border-navy-700 rounded-xl transition-colors"
              >
                Annulla
              </button>
            </div>
          </div>
        )}

        {/* Toolbar: Enrich All + bulk actions */}
        <div className="flex items-center justify-between mb-3">
          {selectedIds.size > 0 ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400 px-3 py-1.5 bg-navy-800 border border-navy-700 rounded-xl">
                Selezionati: <span className="text-white font-medium">{selectedIds.size}</span>
              </span>
              <button
                onClick={deselectAll}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-navy-800 border border-navy-700 rounded-xl transition-colors"
              >
                Deseleziona
              </button>
              <button
                onClick={sendBulkOutreach}
                disabled={bulkOutreaching}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-electric-500/10 border border-electric-500/30 hover:bg-electric-500/20 disabled:opacity-40 disabled:cursor-not-allowed text-electric-400 rounded-xl text-sm font-medium transition-colors"
              >
                {bulkOutreaching
                  ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Invio in corso...</>
                  : <><Mail className="w-3.5 h-3.5" /> Outreach selezionati ({selectedIds.size})</>
                }
              </button>
            </div>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowManualForm(v => !v)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-sm transition-colors ${
                showManualForm
                  ? 'bg-electric-500/10 border-electric-500/40 text-electric-400'
                  : 'bg-navy-800 border-navy-700 hover:border-electric-500/50 text-slate-300 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" /> Aggiungi lead manuale
            </button>
            <button
              onClick={enrichAll}
              disabled={enrichingAll}
              className="flex items-center gap-2 px-4 py-2 bg-navy-800 border border-navy-700 hover:border-electric-500/50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 hover:text-white rounded-xl text-sm transition-colors"
            >
              {enrichingAll
                ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Enrichment in corso...</>
                : <><Zap className="w-3.5 h-3.5 text-electric-400" /> Enrich All (Hunter.io)</>
              }
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-navy-800 border border-navy-700 rounded-xl p-1 w-fit">
          <button
            onClick={() => { setActiveTab('search'); setSelectedIds(new Set()) }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'search' ? 'bg-navy-700 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Risultati ricerca {newResults.length > 0 && `(${newResults.length})`}
          </button>
          <button
            onClick={() => { setActiveTab('saved'); setSelectedIds(new Set()) }}
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
                <LeadTable
                  leads={newResults}
                  onStatusChange={updateStatus}
                  onEnrich={enrichLead}
                  onOutreach={sendOutreach}
                  outreachSending={outreachSending}
                  selectedIds={selectedIds}
                  onToggleSelect={toggleSelect}
                  onSelectAll={() => selectAll(newResults)}
                  allWithEmailSelected={allWithEmailSelected}
                />
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
              <LeadTable
                leads={savedLeads}
                onStatusChange={updateStatus}
                onEnrich={enrichLead}
                onOutreach={sendOutreach}
                outreachSending={outreachSending}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
                onSelectAll={() => selectAll(savedLeads)}
                allWithEmailSelected={allWithEmailSelected}
              />
            )}
          </div>
        )}
      </main>
    </div>
  )
}

function LeadTable({ leads, onStatusChange, onEnrich, onOutreach, outreachSending, selectedIds, onToggleSelect, onSelectAll, allWithEmailSelected }: {
  leads: ProspectingLead[]
  onStatusChange: (id: string, status: string) => void
  onEnrich: (id: string) => Promise<void>
  onOutreach: (lead: ProspectingLead) => Promise<void>
  outreachSending: string | null
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onSelectAll: () => void
  allWithEmailSelected: boolean
}) {
  const [enrichingId, setEnrichingId] = useState<string | null>(null)

  async function handleEnrich(id: string) {
    setEnrichingId(id)
    await onEnrich(id)
    setEnrichingId(null)
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-navy-700">
            <th className="pb-3 pr-3 w-8">
              <input
                type="checkbox"
                checked={allWithEmailSelected}
                onChange={onSelectAll}
                title="Seleziona tutti con email"
                className="w-3.5 h-3.5 accent-electric-500 cursor-pointer"
              />
            </th>
            <th className="text-left text-slate-400 font-medium pb-3 pr-4">Azienda</th>
            <th className="text-left text-slate-400 font-medium pb-3 pr-4">Contatti</th>
            <th className="text-left text-slate-400 font-medium pb-3 pr-4">Decision Maker</th>
            <th className="text-left text-slate-400 font-medium pb-3 pr-4">Rating</th>
            <th className="text-left text-slate-400 font-medium pb-3 pr-4">Status</th>
            <th className="text-left text-slate-400 font-medium pb-3">Azioni</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-navy-700">
          {leads.map(lead => (
            <tr key={lead.id} className={`hover:bg-navy-900/30 transition-colors ${lead.status === 'dismissed' ? 'opacity-40' : ''} ${selectedIds.has(lead.id) ? 'bg-electric-500/5' : ''}`}>
              <td className="py-3 pr-3">
                <input
                  type="checkbox"
                  checked={selectedIds.has(lead.id)}
                  onChange={() => onToggleSelect(lead.id)}
                  className="w-3.5 h-3.5 accent-electric-500 cursor-pointer"
                />
              </td>
              <td className="py-3 pr-4">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white">{lead.company_name}</span>
                  {lead.source === 'manual' && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-slate-700 text-slate-400 font-medium">Manuale</span>
                  )}
                </div>
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
              <td className="py-3 pr-4 min-w-[180px]">
                {lead.owner_name || lead.owner_email ? (
                  <div className="space-y-0.5">
                    {lead.owner_name && (
                      <div className="text-white text-xs font-medium">{lead.owner_name}</div>
                    )}
                    {lead.owner_position && (
                      <div className="text-slate-500 text-xs">{lead.owner_position}</div>
                    )}
                    {lead.owner_email && (
                      <a href={`mailto:${lead.owner_email}`} className="flex items-center gap-1 text-electric-400 text-xs hover:underline">
                        <Mail className="w-3 h-3" /> {lead.owner_email}
                      </a>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => handleEnrich(lead.id)}
                    disabled={enrichingId === lead.id || !lead.website}
                    title={!lead.website ? 'Nessun sito web disponibile' : 'Cerca decision maker su Hunter.io'}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-navy-600 hover:border-electric-500/50 text-slate-500 hover:text-electric-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs"
                  >
                    {enrichingId === lead.id
                      ? <><RefreshCw className="w-3 h-3 animate-spin" /> Ricerca...</>
                      : <><Zap className="w-3 h-3" /> Enrich</>
                    }
                  </button>
                )}
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
                <div className="space-y-1">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_CONFIG[lead.status]?.color ?? 'text-slate-400'}`}>
                    {STATUS_CONFIG[lead.status]?.label ?? lead.status}
                  </span>
                  {lead.outreach_sent_at && (
                    <div className="text-xs text-green-400/70 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Contattato il {formatOutreachDate(lead.outreach_sent_at)}
                    </div>
                  )}
                </div>
              </td>
              <td className="py-3">
                <div className="flex items-center gap-1">
                  {/* Bottone Outreach */}
                  {lead.status !== 'converted' && (
                    <button
                      onClick={() => onOutreach(lead)}
                      disabled={outreachSending === lead.id}
                      title={lead.outreach_sent_at ? 'Email già inviata — reinvia' : 'Invia email outreach con link survey'}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        lead.outreach_sent_at
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20'
                          : 'bg-electric-500/10 text-electric-400 border border-electric-500/20 hover:bg-electric-500/20'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {outreachSending === lead.id
                        ? <><RefreshCw className="w-3 h-3 animate-spin" /> Invio...</>
                        : lead.outreach_sent_at
                          ? <><CheckCircle className="w-3 h-3" /> Inviata</>
                          : <><Mail className="w-3 h-3" /> Outreach</>
                      }
                    </button>
                  )}
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
