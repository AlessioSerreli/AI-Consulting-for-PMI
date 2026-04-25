'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import Link from 'next/link'
import {
  Brain, Users, TrendingUp, Search, MapPin, Phone, Globe, Star,
  Target, CheckCircle, XCircle, Clock, RefreshCw, Mail, Zap,
  UserPlus, MessageSquare, Copy, ChevronDown, Settings, Send,
  Eye, Filter, Edit3, Download, Trash2,
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const CALENDLY_URL = 'https://calendly.com/aiconsultingpmi/30min'

const NAV_ITEMS = [
  { href: '/admin',              label: 'Dashboard',     icon: TrendingUp },
  { href: '/admin/leads',        label: 'Pipeline Lead', icon: Users },
  { href: '/admin/clients',      label: 'Clienti Attivi',icon: Brain },
  { href: '/admin/prospecting',  label: 'Prospecting',   icon: Target },
]

type RunStatus = 'idle' | 'running' | 'succeeded' | 'failed'

interface ProspectingLead {
  id: string
  company_name: string
  category: string
  address: string
  city: string
  phone: string
  website: string | null
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
  contact_channel: string | null
  instagram_handle: string | null
  demo_url: string | null
}

interface EmailPreviewState {
  lead: ProspectingLead
  subject: string
  body: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  new:        { label: 'Nuovo',       color: 'bg-electric-500/10 text-electric-400' },
  contacted:  { label: 'Contattato',  color: 'bg-yellow-500/10 text-yellow-400' },
  interested: { label: 'Interessato', color: 'bg-orange-500/10 text-orange-400' },
  converted:  { label: 'Convertito',  color: 'bg-green-500/10 text-green-400' },
  archived:   { label: 'Archiviato',  color: 'bg-slate-500/10 text-slate-500' },
  dismissed:  { label: 'Scartato',    color: 'bg-slate-500/10 text-slate-500' },
}

const STATUS_OPTIONS = [
  { value: 'new',        label: 'Nuovo' },
  { value: 'contacted',  label: 'Contattato' },
  { value: 'interested', label: 'Interessato' },
  { value: 'converted',  label: 'Convertito' },
  { value: 'archived',   label: 'Archiviato' },
]


function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`
}

function replaceVars(text: string, lead: ProspectingLead): string {
  const firstName = ((lead.owner_name || lead.company_name || '').split(' ')[0]) || 'Titolare'
  return text
    .replace(/\{\{company_name\}\}/g, lead.company_name || '')
    .replace(/\{\{owner_name\}\}/g, firstName)
    .replace(/\{\{calendly_url\}\}/g, CALENDLY_URL)
}

// ─────────────────────────────────────────────────────────────────────────────

export default function ProspectingPage() {
  // ── Search states ──
  const [query, setQuery]               = useState('')
  const [city, setCity]                 = useState('')
  const [maxResults, setMaxResults]     = useState(20)
  const [noWebsiteOnly, setNoWebsiteOnly] = useState(true)
  const noWebsiteOnlyRef                = useRef(true)

  const [runStatus, setRunStatus]       = useState<RunStatus>('idle')
  const [runId, setRunId]               = useState<string | null>(null)
  const [searchLabel, setSearchLabel]   = useState('')
  const [newResults, setNewResults]     = useState<ProspectingLead[]>([])
  const [error, setError]               = useState<string | null>(null)
  const pollingRef                      = useRef<NodeJS.Timeout | null>(null)

  // ── Pipeline states ──
  const [savedLeads, setSavedLeads]     = useState<ProspectingLead[]>([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [activeTab, setActiveTab]       = useState<'search' | 'pipeline'>('search')
  const [searchQuery, setSearchQuery]   = useState('')
  const [filterCity, setFilterCity]     = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterHasEmail, setFilterHasEmail] = useState(false)
  const [enrichingAll, setEnrichingAll] = useState(false)

  // ── Template states ──
  const [templateSubject, setTemplateSubject] = useState('Ho visto {{company_name}} su Google Maps')
  const [templateBody, setTemplateBody]       = useState(
    'Ciao {{owner_name}},\n\nHo notato che {{company_name}} non ha ancora un sito web.\n\nLavoro con piccole imprese per portarle online con strumenti AI, velocemente e senza costi fissi.\n\nSe sei curioso/a, ci vogliono 15 minuti — prenota una call gratuita:\n{{calendly_url}}\n\nNessun impegno.\n\nA presto,\nLuigi & Alessio\nRESTART'
  )
  const [showTemplateEditor, setShowTemplateEditor] = useState(false)
  const [templateSaving, setTemplateSaving]         = useState(false)
  const [templateSaved, setTemplateSaved]           = useState(false)

  // ── Email preview / send ──
  const [emailPreview, setEmailPreview]   = useState<EmailPreviewState | null>(null)
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null)

  // ── Delete / selection ──
  const [selectedIds, setSelectedIds]     = useState<Set<string>>(new Set())
  const [deleteConfirm, setDeleteConfirm] = useState<{ ids: string[] } | null>(null)
  const [deleting, setDeleting]           = useState(false)

  // ── Bulk email ──
  const [bulkEmailConfirm, setBulkEmailConfirm] = useState(false)
  const [bulkSending, setBulkSending]           = useState(false)

  // ── Misc ──
  const [showManualForm, setShowManualForm] = useState(false)
  const [manualForm, setManualForm]       = useState({
    company_name: '', owner_email: '', owner_name: '',
    city: '', phone: '', website: '', category: '',
  })
  const [manualSubmitting, setManualSubmitting] = useState(false)
  const [copiedId, setCopiedId]           = useState<string | null>(null)

  // ── Init ──
  useEffect(() => {
    loadSavedLeads()
    loadTemplate()
    return () => { if (pollingRef.current) clearInterval(pollingRef.current) }
  }, [])

  // ── Template ──
  async function loadTemplate() {
    const saved = localStorage.getItem('outreach_template')
    if (saved) {
      try {
        const { subject, body } = JSON.parse(saved)
        if (subject) setTemplateSubject(subject)
        if (body) setTemplateBody(body)
        return
      } catch {}
    }
    const res = await fetch(`${API_URL}/prospecting/template`).catch(() => null)
    if (res?.ok) {
      const data = await res.json()
      setTemplateSubject(data.subject)
      setTemplateBody(data.body)
    }
  }

  async function saveTemplate() {
    setTemplateSaving(true)
    localStorage.setItem('outreach_template', JSON.stringify({ subject: templateSubject, body: templateBody }))
    await fetch(`${API_URL}/prospecting/template`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject: templateSubject, body: templateBody }),
    }).catch(() => null)
    setTemplateSaving(false)
    setTemplateSaved(true)
    setTimeout(() => setTemplateSaved(false), 2500)
  }

  // ── Leads ──
  async function loadSavedLeads() {
    const res = await fetch(`${API_URL}/prospecting/leads?limit=1000`).catch(() => null)
    if (res?.ok) setSavedLeads(await res.json())
  }

  // ── Search ──
  async function startSearch() {
    if (!query.trim() || !city.trim()) return
    setError(null)
    setRunStatus('running')
    setNewResults([])
    noWebsiteOnlyRef.current = noWebsiteOnly

    setSearchLabel(`${query} · ${city}${noWebsiteOnly ? ' · senza sito' : ''}`)

    const res = await fetch(`${API_URL}/prospecting/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: query.trim(), city: city.trim(),
        max_results: maxResults,
      }),
    }).catch(() => null)

    if (!res?.ok) {
      setError('Errore avvio ricerca. Verifica APIFY_API_TOKEN nel .env.')
      setRunStatus('failed')
      return
    }
    const data = await res.json()
    setRunId(data.run_id)
    pollStatus(data.run_id, noWebsiteOnlyRef.current)
  }

  function pollStatus(id: string, noWebsite: boolean) {
    pollingRef.current = setInterval(async () => {
      const res = await fetch(`${API_URL}/prospecting/runs/${id}/status`).catch(() => null)
      if (!res?.ok) return
      const data = await res.json()
      if (data.status === 'SUCCEEDED') {
        clearInterval(pollingRef.current!)
        fetchResults(id, noWebsite)
      } else if (data.status === 'FAILED' || data.status === 'TIMED-OUT') {
        clearInterval(pollingRef.current!)
        setRunStatus('failed')
        setError(`Scraping fallito: ${data.status}`)
      }
    }, 4000)
  }

  async function fetchResults(id: string, noWebsite: boolean) {
    const param = noWebsite ? '&no_website_only=true' : ''
    const res = await fetch(`${API_URL}/prospecting/runs/${id}/results?save=true${param}`).catch(() => null)
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

  // ── Status / enrichment ──
  async function updateStatus(id: string, status: string) {
    await fetch(`${API_URL}/prospecting/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setSavedLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l))
    setNewResults(prev  => prev.map(l => l.id === id ? { ...l, status } : l))
  }

  async function enrichAll() {
    setEnrichingAll(true)
    const res = await fetch(`${API_URL}/prospecting/leads/enrich-all?limit=20`, { method: 'POST' }).catch(() => null)
    setEnrichingAll(false)
    if (res?.ok) await loadSavedLeads()
  }

  async function bulkSendEmail() {
    setBulkEmailConfirm(false)
    setBulkSending(true)
    const ids = Array.from(selectedIds)
    const res = await fetch(`${API_URL}/prospecting/leads/bulk-outreach`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_ids: ids, subject_tmpl: templateSubject, body_tmpl: templateBody }),
    }).catch(() => null)
    setBulkSending(false)
    if (res?.ok) {
      const now = new Date().toISOString()
      setSavedLeads(prev => prev.map(l =>
        ids.includes(l.id) ? { ...l, status: 'contacted', outreach_sent_at: now } : l
      ))
      setSelectedIds(new Set())
    } else {
      alert('Errore invio bulk. Controlla i log del backend.')
    }
  }

  async function enrichLead(id: string) {
    const res = await fetch(`${API_URL}/prospecting/leads/${id}/enrich`, { method: 'POST' }).catch(() => null)
    if (!res?.ok) return
    const data = await res.json()
    if (data.enriched && data.contact) {
      const patch = {
        owner_name:     data.contact.owner_name,
        owner_email:    data.contact.owner_email,
        owner_position: data.contact.owner_position,
      }
      setSavedLeads(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l))
      setNewResults(prev  => prev.map(l => l.id === id ? { ...l, ...patch } : l))
    }
  }

  // ── Email ──
  function openEmailPreview(lead: ProspectingLead) {
    setEmailPreview({
      lead,
      subject: replaceVars(templateSubject, lead),
      body:    replaceVars(templateBody, lead),
    })
  }

  async function confirmSendEmail() {
    if (!emailPreview) return
    const lead = emailPreview.lead
    setSendingEmailId(lead.id)
    setEmailPreview(null)
    const res = await fetch(`${API_URL}/prospecting/leads/${lead.id}/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject_tmpl: templateSubject, body_tmpl: templateBody }),
    }).catch(() => null)
    setSendingEmailId(null)
    if (res?.ok) {
      const now = new Date().toISOString()
      setSavedLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: 'contacted', outreach_sent_at: now } : l))
    } else {
      alert('Errore invio email. Controlla i log del backend.')
    }
  }

  // ── WhatsApp open ──
  function copyWAMessage(lead: ProspectingLead) {
    const msg = `Ciao! Ho visto ${lead.company_name} su Google Maps.\nNoto che non hai un sito — ti faccio vedere qualcosa di veloce?\n15 minuti di call gratuita: ${CALENDLY_URL}`
    const phone = (lead.phone || '').replace(/\D/g, '')
    if (phone) {
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank')
    } else {
      const ta = document.createElement('textarea')
      ta.value = msg
      ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0'
      document.body.appendChild(ta)
      ta.focus()
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopiedId(lead.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // ── CSV export ──
  function downloadCSV() {
    const headers = ['Azienda', 'Città', 'Categoria', 'Telefono', 'Sito', 'Email', 'Nome contatto', 'Posizione', 'Rating', 'Recensioni', 'Stato', 'Note', 'Outreach inviato']
    const escape = (v: string | number | null | undefined) => {
      if (v == null) return ''
      const s = String(v).replace(/"/g, '""')
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s}"` : s
    }
    const rows = filteredLeads.map(l => [
      l.company_name, l.city, l.category, l.phone, l.website,
      l.owner_email || l.email, l.owner_name, l.owner_position,
      l.rating, l.review_count, l.status, l.notes,
      l.outreach_sent_at ? formatDate(l.outreach_sent_at) : '',
    ].map(escape).join(','))
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `prospecting_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Manual lead ──
  async function submitManualLead() {
    if (!manualForm.company_name.trim() || !manualForm.owner_email.trim()) return
    setManualSubmitting(true)
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
      setActiveTab('pipeline')
    } else {
      alert('Errore nel salvataggio del lead.')
    }
  }

  // ── Delete ──
  async function confirmDelete() {
    if (!deleteConfirm) return
    setDeleting(true)
    const ids = deleteConfirm.ids
    let ok = false
    if (ids.length === 1) {
      const res = await fetch(`${API_URL}/prospecting/leads/${ids[0]}`, { method: 'DELETE' }).catch(() => null)
      ok = !!res?.ok
    } else {
      const res = await fetch(`${API_URL}/prospecting/leads/bulk-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_ids: ids }),
      }).catch(() => null)
      ok = !!res?.ok
    }
    setDeleting(false)
    setDeleteConfirm(null)
    if (ok) {
      setSavedLeads(prev => prev.filter(l => !ids.includes(l.id)))
      setSelectedIds(new Set())
    }
  }

  const uniqueCities = useMemo(() => {
    const seen = new Set<string>()
    savedLeads.forEach(l => { if (l.city) seen.add(l.city) })
    return Array.from(seen).sort()
  }, [savedLeads])
  const uniqueCategories = useMemo(() => {
    const seen = new Set<string>()
    savedLeads.forEach(l => { if (l.category) seen.add(l.category) })
    return Array.from(seen).sort()
  }, [savedLeads])

  const filteredLeads = useMemo(() =>
    savedLeads.filter(l => {
      const matchesStatus   = statusFilter === 'all' || l.status === statusFilter
      const matchesSearch   = !searchQuery || l.company_name?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCity     = !filterCity || l.city === filterCity
      const matchesCategory = !filterCategory || l.category === filterCategory
      const matchesEmail    = !filterHasEmail || !!(l.owner_email || l.email)
      return matchesStatus && matchesSearch && matchesCity && matchesCategory && matchesEmail
    }),
    [savedLeads, statusFilter, searchQuery, filterCity, filterCategory, filterHasEmail]
  )

  const statusCounts = STATUS_OPTIONS.reduce((acc, s) => {
    acc[s.value] = savedLeads.filter(l => l.status === s.value).length
    return acc
  }, {} as Record<string, number>)

  // ── Render ──
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
          {NAV_ITEMS.map(item => (
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
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Prospecting</h1>
            <p className="text-slate-400 text-sm mt-1">Trova microimprese senza sito web e gestisci l&apos;outreach</p>
          </div>
          <button
            onClick={() => setShowTemplateEditor(v => !v)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm border transition-colors ${
              showTemplateEditor
                ? 'bg-electric-500/10 border-electric-500/40 text-electric-400'
                : 'bg-navy-800 border-navy-700 text-slate-400 hover:text-white hover:border-electric-500/40'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            Template email
          </button>
        </div>

        {/* ── Template Editor ── */}
        {showTemplateEditor && (
          <div className="bg-navy-800 border border-electric-500/20 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-electric-400" />
                Modifica template email
              </h2>
              <p className="text-xs text-slate-500">Variabili: <code className="text-electric-400">{'{{company_name}}'}</code> <code className="text-electric-400">{'{{owner_name}}'}</code> <code className="text-electric-400">{'{{calendly_url}}'}</code></p>
            </div>
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Oggetto</label>
                <input
                  type="text"
                  value={templateSubject}
                  onChange={e => setTemplateSubject(e.target.value)}
                  className="w-full bg-navy-900 border border-navy-600 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-electric-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Corpo</label>
                <textarea
                  value={templateBody}
                  onChange={e => setTemplateBody(e.target.value)}
                  rows={10}
                  className="w-full bg-navy-900 border border-navy-600 rounded-xl px-4 py-3 text-white text-sm font-mono focus:outline-none focus:border-electric-500 resize-y"
                />
              </div>
            </div>
            <button
              onClick={saveTemplate}
              disabled={templateSaving}
              className="flex items-center gap-2 px-5 py-2.5 bg-electric-500 hover:bg-electric-600 disabled:opacity-40 text-white font-medium rounded-xl text-sm transition-colors"
            >
              {templateSaving
                ? <><RefreshCw className="w-4 h-4 animate-spin" /> Salvataggio...</>
                : templateSaved
                  ? <><CheckCircle className="w-4 h-4" /> Salvato!</>
                  : <><Send className="w-4 h-4" /> Salva template</>
              }
            </button>
          </div>
        )}

        {/* ── Search Section ── */}
        <div className="bg-navy-800 border border-navy-700 rounded-2xl p-6 mb-6">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Search className="w-4 h-4 text-electric-400" />
            Nuova ricerca
          </h2>
          <div className="grid grid-cols-3 gap-4 mb-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Categoria / settore</label>
              <input
                type="text"
                placeholder="es. panificio, fiorista, parrucchiere"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && startSearch()}
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
                onKeyDown={e => e.key === 'Enter' && startSearch()}
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

          <div className="mb-4">
            <label className="flex items-center gap-2.5 cursor-pointer group w-fit">
              <div
                onClick={() => setNoWebsiteOnly(v => { noWebsiteOnlyRef.current = !v; return !v })}
                className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${noWebsiteOnly ? 'bg-electric-500' : 'bg-navy-600'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${noWebsiteOnly ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                Solo senza sito web
              </span>
            </label>
          </div>

          <div className="flex items-center gap-3">
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
            {noWebsiteOnly && (
              <span className="text-xs text-electric-400 bg-electric-500/10 px-3 py-1.5 rounded-lg border border-electric-500/20">
                Filtro attivo: solo aziende senza sito
              </span>
            )}
          </div>
          {error && <p className="mt-3 text-red-400 text-sm">{error}</p>}
        </div>

        {/* ── Manual Lead Form ── */}
        {showManualForm && (
          <div className="bg-navy-800 border border-navy-700 rounded-2xl p-6 mb-6">
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-electric-400" />
              Aggiungi lead manuale
            </h2>
            <div className="grid grid-cols-3 gap-4 mb-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Azienda <span className="text-red-400">*</span></label>
                <input type="text" placeholder="es. Panificio Rossi" value={manualForm.company_name}
                  onChange={e => setManualForm(f => ({ ...f, company_name: e.target.value }))}
                  className="w-full bg-navy-900 border border-navy-600 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-electric-500" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Email contatto <span className="text-red-400">*</span></label>
                <input type="email" placeholder="es. info@panificio.it" value={manualForm.owner_email}
                  onChange={e => setManualForm(f => ({ ...f, owner_email: e.target.value }))}
                  className="w-full bg-navy-900 border border-navy-600 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-electric-500" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Nome referente</label>
                <input type="text" placeholder="es. Mario Rossi" value={manualForm.owner_name}
                  onChange={e => setManualForm(f => ({ ...f, owner_name: e.target.value }))}
                  className="w-full bg-navy-900 border border-navy-600 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-electric-500" />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4 mb-4">
              {(['city', 'phone', 'website', 'category'] as const).map(field => (
                <div key={field}>
                  <label className="text-xs text-slate-400 mb-1 block capitalize">{field === 'city' ? 'Città' : field === 'phone' ? 'Telefono' : field === 'website' ? 'Sito web' : 'Categoria'}</label>
                  <input type="text" value={manualForm[field]}
                    onChange={e => setManualForm(f => ({ ...f, [field]: e.target.value }))}
                    className="w-full bg-navy-900 border border-navy-600 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-electric-500" />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <button onClick={submitManualLead}
                disabled={manualSubmitting || !manualForm.company_name.trim() || !manualForm.owner_email.trim()}
                className="flex items-center gap-2 px-6 py-2.5 bg-electric-500 hover:bg-electric-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-xl text-sm transition-colors">
                {manualSubmitting ? <><RefreshCw className="w-4 h-4 animate-spin" /> Salvataggio...</> : <><UserPlus className="w-4 h-4" /> Salva lead</>}
              </button>
              <button onClick={() => setShowManualForm(false)}
                className="px-4 py-2.5 text-sm text-slate-400 hover:text-white bg-navy-900 border border-navy-700 rounded-xl transition-colors">
                Annulla
              </button>
            </div>
          </div>
        )}

        {/* ── Bulk email confirm dialog ── */}
        {bulkEmailConfirm && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-navy-800 border border-navy-600 rounded-2xl p-6 max-w-sm w-full mx-4">
              <h3 className="text-white font-semibold mb-2">Invia email a {selectedIds.size} lead?</h3>
              <p className="text-slate-400 text-sm mb-5">Verranno saltati i lead già contattati. Questa azione non è reversibile.</p>
              <div className="flex gap-3">
                <button onClick={bulkSendEmail}
                  className="flex-1 py-2 rounded-xl bg-electric-500 hover:bg-electric-600 text-white text-sm font-medium transition-colors">
                  Conferma invio
                </button>
                <button onClick={() => setBulkEmailConfirm(false)}
                  className="flex-1 py-2 rounded-xl bg-navy-700 hover:bg-navy-600 text-slate-300 text-sm transition-colors">
                  Annulla
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Toolbar ── */}
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <button onClick={() => setShowManualForm(v => !v)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-sm transition-colors ${
              showManualForm
                ? 'bg-electric-500/10 border-electric-500/40 text-electric-400'
                : 'bg-navy-800 border-navy-700 hover:border-electric-500/50 text-slate-300 hover:text-white'
            }`}>
            <UserPlus className="w-3.5 h-3.5" /> Aggiungi manuale
          </button>
          <button onClick={enrichAll} disabled={enrichingAll}
            className="flex items-center gap-2 px-4 py-2 border border-navy-700 rounded-xl text-sm bg-navy-800 hover:border-electric-500/50 text-slate-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {enrichingAll
              ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Ricerca email...</>
              : <><Zap className="w-3.5 h-3.5 text-electric-400" /> Enrich All</>}
          </button>
          {selectedIds.size > 0 && (
            <>
              <button
                onClick={() => setBulkEmailConfirm(true)}
                disabled={bulkSending}
                className="flex items-center gap-2 px-4 py-2 border border-electric-500/40 rounded-xl text-sm text-electric-400 hover:bg-electric-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {bulkSending
                  ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Invio...</>
                  : <><Send className="w-3.5 h-3.5" /> Invia email ({selectedIds.size})</>}
              </button>
              <button
                onClick={() => setDeleteConfirm({ ids: Array.from(selectedIds) })}
                className="flex items-center gap-2 px-4 py-2 border border-red-500/40 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Elimina ({selectedIds.size})
              </button>
            </>
          )}
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 mb-4 bg-navy-800 border border-navy-700 rounded-xl p-1 w-fit">
          <button
            onClick={() => setActiveTab('search')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'search' ? 'bg-navy-700 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Risultati ricerca {newResults.length > 0 && `(${newResults.length})`}
          </button>
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'pipeline' ? 'bg-navy-700 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Pipeline {savedLeads.length > 0 && `(${savedLeads.length})`}
          </button>
        </div>

        {/* ── Search Results Tab ── */}
        {activeTab === 'search' && (
          <div className="bg-navy-800 border border-navy-700 rounded-2xl p-6">
            {runStatus === 'idle' && (
              <div className="text-center py-16 text-slate-500">
                <Target className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>Inserisci categoria e città per trovare nuovi prospect</p>
                {noWebsiteOnly && <p className="text-xs mt-1 text-electric-400/50">Filtro attivo: solo senza sito web</p>}
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
                <p>Nessun risultato. Prova ad allargare i criteri di ricerca.</p>
              </div>
            )}
            {runStatus === 'succeeded' && newResults.length > 0 && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-slate-400 text-sm">{newResults.length} aziende trovate · {searchLabel}</p>
                </div>
                <SearchResultsTable leads={newResults} />
              </>
            )}
          </div>
        )}

        {/* ── Pipeline Tab ── */}
        {activeTab === 'pipeline' && (
          <div className="bg-navy-800 border border-navy-700 rounded-2xl p-6">
            {/* Status filter bar */}
            <div className="flex items-center gap-2 mb-5 flex-wrap">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                  statusFilter === 'all'
                    ? 'bg-navy-700 text-white border-navy-600'
                    : 'text-slate-400 border-transparent hover:text-white hover:bg-navy-700'
                }`}
              >
                Tutti ({savedLeads.length})
              </button>
              {STATUS_OPTIONS.map(s => (
                <button
                  key={s.value}
                  onClick={() => setStatusFilter(s.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                    statusFilter === s.value
                      ? 'bg-navy-700 text-white border-navy-600'
                      : 'text-slate-400 border-transparent hover:text-white hover:bg-navy-700'
                  }`}
                >
                  {s.label} {statusCounts[s.value] > 0 && `(${statusCounts[s.value]})`}
                </button>
              ))}
            </div>

            {/* Search + filter row */}
            <div className="flex items-center gap-3 mb-5 flex-wrap">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Cerca per nome azienda..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-navy-900 border border-navy-600 rounded-xl pl-8 pr-4 py-2 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-electric-500"
                />
              </div>
              <select
                value={filterCity}
                onChange={e => setFilterCity(e.target.value)}
                className="bg-navy-900 border border-navy-600 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-electric-500"
              >
                <option value="">Tutte le città</option>
                {uniqueCities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                className="bg-navy-900 border border-navy-600 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-electric-500"
              >
                <option value="">Tutte le categorie</option>
                {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <span className="text-xs text-slate-500 flex-shrink-0">
                {filteredLeads.length} lead
              </span>
              <button
                onClick={downloadCSV}
                disabled={filteredLeads.length === 0}
                title="Scarica CSV"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs border border-navy-600 hover:border-electric-500/50 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex-shrink-0"
              >
                <Download className="w-3.5 h-3.5" /> CSV
              </button>
              {(searchQuery || filterCity || filterCategory) && (
                <button
                  onClick={() => { setSearchQuery(''); setFilterCity(''); setFilterCategory('') }}
                  className="text-xs text-slate-500 hover:text-white transition-colors flex items-center gap-1"
                >
                  <XCircle className="w-3.5 h-3.5" /> Reset filtri
                </button>
              )}
            </div>

            {filteredLeads.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <p>{savedLeads.length === 0 ? 'Nessun prospect salvato ancora. Avvia una ricerca.' : 'Nessun risultato con i filtri applicati.'}</p>
              </div>
            ) : (
              <PipelineTable
                leads={filteredLeads}
                onStatusChange={updateStatus}
                onEnrich={enrichLead}
                onOpenEmailPreview={openEmailPreview}
                onCopyWA={copyWAMessage}
                sendingEmailId={sendingEmailId}
                copiedId={copiedId}
                selectedIds={selectedIds}
                onToggleSelect={id => setSelectedIds(prev => {
                  const next = new Set(prev)
                  next.has(id) ? next.delete(id) : next.add(id)
                  return next
                })}
                onToggleSelectAll={() => setSelectedIds(prev =>
                  prev.size === filteredLeads.length
                    ? new Set()
                    : new Set(filteredLeads.map(l => l.id))
                )}
                onDeleteSingle={id => setDeleteConfirm({ ids: [id] })}
              />
            )}
          </div>
        )}
      </main>

      {/* ── Delete Confirm Modal ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-navy-800 border border-navy-700 rounded-2xl w-full max-w-sm shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Conferma eliminazione</h3>
                <p className="text-slate-400 text-sm mt-0.5">
                  {deleteConfirm.ids.length === 1
                    ? 'Vuoi eliminare questo lead? L\'azione è irreversibile.'
                    : `Vuoi eliminare ${deleteConfirm.ids.length} lead? L'azione è irreversibile.`}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white font-medium rounded-xl text-sm transition-colors"
              >
                {deleting ? <><RefreshCw className="w-4 h-4 animate-spin" /> Eliminazione...</> : <><Trash2 className="w-4 h-4" /> Elimina</>}
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="px-5 py-2.5 text-slate-400 hover:text-white bg-navy-900 border border-navy-700 rounded-xl text-sm transition-colors"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Email Preview Modal ── */}
      {emailPreview && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-navy-800 border border-navy-700 rounded-2xl w-full max-w-xl shadow-2xl">
            <div className="p-6 border-b border-navy-700">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-electric-400" />
                Anteprima email
              </h3>
              <p className="text-slate-500 text-xs mt-1">A: {emailPreview.lead.owner_email || emailPreview.lead.email}</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Oggetto</p>
                <p className="text-white text-sm font-medium bg-navy-900 rounded-lg px-3 py-2">{emailPreview.subject}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Corpo</p>
                <pre className="text-slate-300 text-sm bg-navy-900 rounded-lg px-3 py-3 whitespace-pre-wrap font-sans leading-relaxed max-h-64 overflow-y-auto">{emailPreview.body}</pre>
              </div>
            </div>
            <div className="p-6 border-t border-navy-700 flex gap-3">
              <button
                onClick={confirmSendEmail}
                className="flex items-center gap-2 px-5 py-2.5 bg-electric-500 hover:bg-electric-600 text-white font-medium rounded-xl text-sm transition-colors"
              >
                <Send className="w-4 h-4" /> Invia ora
              </button>
              <button
                onClick={() => setEmailPreview(null)}
                className="px-5 py-2.5 text-slate-400 hover:text-white bg-navy-900 border border-navy-700 rounded-xl text-sm transition-colors"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Search Results Table (lightweight — just show & save)
// ─────────────────────────────────────────────────────────────────────────────

function SearchResultsTable({ leads }: { leads: ProspectingLead[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-navy-700">
            <th className="text-left text-slate-400 font-medium pb-3 pr-4">Azienda</th>
            <th className="text-left text-slate-400 font-medium pb-3 pr-4">Contatti</th>
            <th className="text-left text-slate-400 font-medium pb-3 pr-4">Rating</th>
            <th className="text-left text-slate-400 font-medium pb-3 pr-4">Sito</th>
            <th className="text-left text-slate-400 font-medium pb-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-navy-700">
          {leads.map(lead => (
            <tr key={lead.id} className="hover:bg-navy-900/30 transition-colors">
              <td className="py-3 pr-4">
                <div className="font-medium text-white">{lead.company_name}</div>
                <div className="text-slate-500 text-xs flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3" /> {lead.city || lead.address || '—'}
                  {lead.category && <span className="ml-1 text-slate-600">· {lead.category}</span>}
                </div>
              </td>
              <td className="py-3 pr-4">
                <div className="space-y-0.5">
                  {lead.phone && (
                    <div className="flex items-center gap-1 text-slate-300 text-xs">
                      <Phone className="w-3 h-3 text-slate-500" /> {lead.phone}
                    </div>
                  )}
                  {lead.google_maps_url && (
                    <a href={lead.google_maps_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-slate-500 text-xs hover:text-slate-300">
                      <MapPin className="w-3 h-3" /> Maps
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
                ) : <span className="text-slate-600 text-xs">—</span>}
              </td>
              <td className="py-3 pr-4">
                {lead.website
                  ? <a href={lead.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-electric-400 text-xs hover:underline"><Globe className="w-3 h-3" /> sito</a>
                  : <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">Nessun sito</span>
                }
              </td>
              <td className="py-3">
                <span className="text-xs text-slate-600">salvato</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Pipeline Table (full-featured: status dropdown, WA copy, email send, notes)
// ─────────────────────────────────────────────────────────────────────────────

function PipelineTable({ leads, onStatusChange, onEnrich, onOpenEmailPreview, onCopyWA, sendingEmailId, copiedId, selectedIds, onToggleSelect, onToggleSelectAll, onDeleteSingle }: {
  leads: ProspectingLead[]
  onStatusChange: (id: string, status: string) => void
  onEnrich: (id: string) => Promise<void>
  onOpenEmailPreview: (lead: ProspectingLead) => void
  onCopyWA: (lead: ProspectingLead) => void
  sendingEmailId: string | null
  copiedId: string | null
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onToggleSelectAll: () => void
  onDeleteSingle: (id: string) => void
}) {
  const [enrichingId, setEnrichingId]   = useState<string | null>(null)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [noteValue, setNoteValue]         = useState('')
  const [savingNoteId, setSavingNoteId]   = useState<string | null>(null)
  const [localLeads, setLocalLeads]       = useState<ProspectingLead[]>(leads)

  useEffect(() => { setLocalLeads(leads) }, [leads])

  async function handleEnrich(id: string) {
    setEnrichingId(id)
    await onEnrich(id)
    setEnrichingId(null)
  }

  function startEditNote(lead: ProspectingLead) {
    setEditingNoteId(lead.id)
    setNoteValue(lead.notes || '')
  }

  async function saveNote(id: string) {
    setSavingNoteId(id)
    await fetch(`${API_URL}/prospecting/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: noteValue }),
    }).catch(() => null)
    setLocalLeads(prev => prev.map(l => l.id === id ? { ...l, notes: noteValue } : l))
    setSavingNoteId(null)
    setEditingNoteId(null)
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-navy-700">
            <th className="pb-3 pr-3 w-8">
              <input
                type="checkbox"
                checked={leads.length > 0 && selectedIds.size === leads.length}
                onChange={onToggleSelectAll}
                className="rounded border-navy-600 bg-navy-900 accent-electric-500 cursor-pointer"
              />
            </th>
            <th className="text-left text-slate-400 font-medium pb-3 pr-4">Azienda</th>
            <th className="text-left text-slate-400 font-medium pb-3 pr-4">Contatti</th>
            <th className="text-left text-slate-400 font-medium pb-3 pr-4">Note</th>
            <th className="text-left text-slate-400 font-medium pb-3 pr-4">Rating</th>
            <th className="text-left text-slate-400 font-medium pb-3 pr-4">Stato</th>
            <th className="text-left text-slate-400 font-medium pb-3">Azioni</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-navy-700">
          {localLeads.map(lead => (
            <tr key={lead.id} className={`hover:bg-navy-900/30 transition-colors ${lead.status === 'archived' || lead.status === 'dismissed' ? 'opacity-40' : ''}`}>
              {/* Checkbox */}
              <td className="py-3 pr-3">
                <input
                  type="checkbox"
                  checked={selectedIds.has(lead.id)}
                  onChange={() => onToggleSelect(lead.id)}
                  className="rounded border-navy-600 bg-navy-900 accent-electric-500 cursor-pointer"
                />
              </td>
              {/* Azienda */}
              <td className="py-3 pr-4 min-w-[180px]">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white">{lead.company_name}</span>
                  {!lead.website && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 flex-shrink-0">No sito</span>
                  )}
                  {lead.source === 'manual' && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-slate-700 text-slate-400">Manuale</span>
                  )}
                </div>
                <div className="text-slate-500 text-xs flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3" /> {lead.city || lead.address || '—'}
                  {lead.category && <span className="ml-1 text-slate-600">· {lead.category}</span>}
                </div>
                {lead.google_maps_url && (
                  <a href={lead.google_maps_url} target="_blank" rel="noopener noreferrer" className="text-slate-600 text-xs hover:text-slate-400 mt-0.5 inline-block">↗ Maps</a>
                )}
              </td>

              {/* Contatti */}
              <td className="py-3 pr-4 min-w-[160px]">
                <div className="space-y-0.5">
                  {lead.phone && (
                    <a href={`tel:${lead.phone}`} className="flex items-center gap-1 text-slate-300 text-xs hover:text-white">
                      <Phone className="w-3 h-3 text-slate-500" /> {lead.phone}
                    </a>
                  )}
                  {lead.owner_email && (
                    <a href={`mailto:${lead.owner_email}`} className="flex items-center gap-1 text-electric-400 text-xs hover:underline">
                      <Mail className="w-3 h-3" /> {lead.owner_email}
                    </a>
                  )}
                  {lead.owner_name && (
                    <div className="text-slate-500 text-xs">{lead.owner_name}{lead.owner_position ? ` · ${lead.owner_position}` : ''}</div>
                  )}
                  {!lead.owner_email && (
                    <button onClick={() => handleEnrich(lead.id)} disabled={enrichingId === lead.id}
                      className="flex items-center gap-1 px-2 py-1 rounded border border-navy-600 hover:border-electric-500/50 text-slate-500 hover:text-electric-400 disabled:opacity-30 transition-colors text-xs mt-1">
                      {enrichingId === lead.id ? <><RefreshCw className="w-3 h-3 animate-spin" /> Ricerca...</> : <><Zap className="w-3 h-3" /> Trova email</>}
                    </button>
                  )}
                </div>
              </td>

              {/* Note */}
              <td className="py-3 pr-4 min-w-[160px]">
                {editingNoteId === lead.id ? (
                  <div className="flex items-end gap-1">
                    <textarea
                      value={noteValue}
                      onChange={e => setNoteValue(e.target.value)}
                      rows={2}
                      className="w-full bg-navy-900 border border-electric-500/40 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none resize-none"
                      autoFocus
                    />
                    <div className="flex flex-col gap-1 flex-shrink-0">
                      <button onClick={() => saveNote(lead.id)} disabled={savingNoteId === lead.id}
                        className="p-1 rounded bg-electric-500/20 text-electric-400 hover:bg-electric-500/30 transition-colors">
                        {savingNoteId === lead.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                      </button>
                      <button onClick={() => setEditingNoteId(null)}
                        className="p-1 rounded bg-navy-700 text-slate-500 hover:text-slate-300 transition-colors">
                        <XCircle className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => startEditNote(lead)}
                    className="text-left w-full group min-h-[32px]">
                    {lead.notes
                      ? <p className="text-slate-400 text-xs group-hover:text-slate-200 transition-colors line-clamp-2">{lead.notes}</p>
                      : <p className="text-slate-600 text-xs group-hover:text-slate-400 transition-colors">+ aggiungi nota</p>
                    }
                  </button>
                )}
              </td>

              {/* Rating */}
              <td className="py-3 pr-4">
                {lead.rating ? (
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    <span className="text-white text-xs font-medium">{lead.rating.toFixed(1)}</span>
                    <span className="text-slate-500 text-xs">({lead.review_count})</span>
                  </div>
                ) : <span className="text-slate-600 text-xs">—</span>}
              </td>

              {/* Stato dropdown */}
              <td className="py-3 pr-4">
                <div className="space-y-1">
                  <div className="relative">
                    <select
                      value={lead.status}
                      onChange={e => onStatusChange(lead.id, e.target.value)}
                      className="appearance-none bg-navy-900 border border-navy-600 rounded-lg pl-2.5 pr-6 py-1 text-xs text-white focus:outline-none focus:border-electric-500 cursor-pointer"
                    >
                      {STATUS_OPTIONS.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
                  </div>
                  {lead.outreach_sent_at && (
                    <div className="text-xs text-green-400/70 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> {formatDate(lead.outreach_sent_at)}
                    </div>
                  )}
                </div>
              </td>

              {/* Azioni */}
              <td className="py-3">
                <div className="flex items-center gap-1">
                  {/* Send email */}
                  <button
                    onClick={() => onOpenEmailPreview(lead)}
                    disabled={sendingEmailId === lead.id || (!lead.owner_email && !lead.email)}
                    title={!lead.owner_email && !lead.email ? 'Nessuna email — esegui Enrich prima' : 'Invia email dal template'}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                      lead.outreach_sent_at
                        ? 'bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20'
                        : 'bg-electric-500/10 border-electric-500/20 text-electric-400 hover:bg-electric-500/20'
                    }`}
                  >
                    {sendingEmailId === lead.id
                      ? <><RefreshCw className="w-3 h-3 animate-spin" /> Invio...</>
                      : <><Mail className="w-3 h-3" /> Email</>
                    }
                  </button>

                  {/* Copy WhatsApp */}
                  <button
                    onClick={() => onCopyWA(lead)}
                    title={lead.phone ? 'Apri WhatsApp con messaggio pre-compilato' : 'Copia messaggio WhatsApp'}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs border border-navy-600 hover:border-green-500/40 text-slate-500 hover:text-green-400 transition-colors"
                  >
                    {copiedId === lead.id
                      ? <><CheckCircle className="w-3 h-3" /> Copiato!</>
                      : <><MessageSquare className="w-3 h-3" /> WA</>
                    }
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => onDeleteSingle(lead.id)}
                    title="Elimina lead"
                    className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
