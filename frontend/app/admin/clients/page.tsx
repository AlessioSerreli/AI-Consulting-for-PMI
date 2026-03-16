'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Brain, Users, TrendingUp, CheckCircle, Target, FileText, Save } from 'lucide-react'

const PHASES = [
  { key: 'audit', label: 'Audit' },
  { key: 'implementazione', label: 'Implementazione' },
  { key: 'formazione', label: 'Formazione' },
  { key: 'manutenzione', label: 'Manutenzione' },
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

function ClientCard({ client, apiUrl }: { client: any; apiUrl: string }) {
  const [phase, setPhase] = useState<string>(client.project_phase || 'audit')
  const [notes, setNotes] = useState<string>(client.notes || '')
  const [contractValue, setContractValue] = useState<string>(
    client.estimated_value != null ? String(client.estimated_value) : ''
  )
  const [savingNotes, setSavingNotes] = useState(false)
  const [savingValue, setSavingValue] = useState(false)
  const [savedNotes, setSavedNotes] = useState(false)
  const [savedValue, setSavedValue] = useState(false)
  const [errorNotes, setErrorNotes] = useState(false)
  const [errorValue, setErrorValue] = useState(false)
  const [valueInvalid, setValueInvalid] = useState(false)

  async function patch(data: Record<string, unknown>) {
    const res = await fetch(`${apiUrl}/crm/leads/${client.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error(`PATCH failed: ${res.status}`)
  }

  async function handlePhaseClick(key: string) {
    const prev = phase
    setPhase(key)
    try {
      await patch({ project_phase: key })
    } catch {
      setPhase(prev)
    }
  }

  async function handleSaveNotes() {
    setSavingNotes(true)
    setErrorNotes(false)
    try {
      await patch({ notes })
      setSavedNotes(true)
      setTimeout(() => setSavedNotes(false), 2000)
    } catch {
      setErrorNotes(true)
      setTimeout(() => setErrorNotes(false), 3000)
    } finally {
      setSavingNotes(false)
    }
  }

  async function handleSaveValue() {
    setValueInvalid(false)
    const val = contractValue === '' ? null : parseFloat(contractValue)
    if (contractValue !== '' && isNaN(val as number)) {
      setValueInvalid(true)
      return
    }
    setSavingValue(true)
    setErrorValue(false)
    try {
      await patch({ estimated_value: val })
      setSavedValue(true)
      setTimeout(() => setSavedValue(false), 2000)
    } catch {
      setErrorValue(true)
      setTimeout(() => setErrorValue(false), 3000)
    } finally {
      setSavingValue(false)
    }
  }

  function openPdf() {
    window.open(`${apiUrl}/crm/leads/${client.id}/pdf`, '_blank')
  }

  return (
    <div className="bg-navy-800 border border-navy-700 rounded-2xl p-6 hover:border-electric-500/30 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-semibold text-white text-lg">{client.company_name}</h3>
          <p className="text-slate-400 text-xs font-mono mt-1">{client.contact_email} · {client.sector}</p>
        </div>
        <div className="flex items-center gap-3">
          {client.has_pdf && (
            <button
              onClick={openPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-navy-700 text-slate-300 border border-navy-600 hover:border-electric-500/40 hover:text-electric-400 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              PDF
            </button>
          )}
          <div className="font-display text-4xl text-electric-500 tracking-wide">
            {client.overall_score}<span className="text-slate-600 text-xl">/100</span>
          </div>
        </div>
      </div>

      {/* Phase selector */}
      <div className="flex gap-2 mb-5">
        {PHASES.map((p) => {
          const active = phase === p.key
          return (
            <button
              key={p.key}
              onClick={() => handlePhaseClick(p.key)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors border ${
                active
                  ? 'bg-electric-500/10 text-electric-400 border-electric-500/20'
                  : 'bg-navy-700 text-slate-500 border-navy-600 hover:text-slate-300 hover:border-navy-500'
              }`}
            >
              {active && <CheckCircle className="w-3 h-3" />}
              {p.label}
            </button>
          )
        })}
      </div>

      {/* Bottom row: notes + contract value */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Notes */}
        <div>
          <label className="block text-xs font-mono text-slate-500 mb-1.5 uppercase tracking-widest">Note</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            placeholder="Note operative sul cliente…"
            className="w-full bg-navy-900 border border-navy-600 rounded-xl px-3 py-2 text-sm text-slate-300 placeholder:text-slate-600 font-mono resize-none focus:outline-none focus:border-electric-500/40 transition-colors"
          />
          <button
            onClick={handleSaveNotes}
            disabled={savingNotes}
            className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-navy-700 border border-navy-600 text-slate-400 hover:text-electric-400 hover:border-electric-500/40 transition-colors disabled:opacity-50"
          >
            <Save className="w-3 h-3" />
            {savingNotes ? 'Salvataggio…' : errorNotes ? 'Errore ✗' : savedNotes ? 'Salvato ✓' : 'Salva note'}
          </button>
        </div>

        {/* Contract value */}
        <div>
          <label className="block text-xs font-mono text-slate-500 mb-1.5 uppercase tracking-widest">Valore contratto</label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-mono">€</span>
              <input
                type="number"
                value={contractValue}
                onChange={e => { setContractValue(e.target.value); setValueInvalid(false) }}
                placeholder="0"
                className={`w-full bg-navy-900 border rounded-xl pl-7 pr-3 py-2 text-sm text-slate-300 placeholder:text-slate-600 font-mono focus:outline-none transition-colors ${valueInvalid ? 'border-red-500/60' : 'border-navy-600 focus:border-electric-500/40'}`}
              />
            </div>
          </div>
          <button
            onClick={handleSaveValue}
            disabled={savingValue}
            className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-navy-700 border border-navy-600 text-slate-400 hover:text-electric-400 hover:border-electric-500/40 transition-colors disabled:opacity-50"
          >
            <Save className="w-3 h-3" />
            {savingValue ? 'Salvataggio…' : errorValue ? 'Errore ✗' : valueInvalid ? 'Numero non valido' : savedValue ? 'Salvato ✓' : 'Salva valore'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  useEffect(() => {
    fetch(`${apiUrl}/crm/leads?status=client`)
      .then(r => { if (!r.ok) throw new Error(String(r.status)); return r.json() })
      .then(data => { setClients(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => { setFetchError(true); setLoading(false) })
  }, [apiUrl])

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
          <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-48 bg-navy-800 rounded-2xl animate-pulse" />)}</div>
        ) : fetchError ? (
          <div className="text-center py-24 text-slate-500">
            <p className="font-display text-3xl text-red-600/50 tracking-wide">ERRORE DI CONNESSIONE</p>
            <p className="text-sm font-mono mt-3">Impossibile caricare i clienti. Verifica che il backend sia attivo.</p>
          </div>
        ) : clients.length === 0 ? (
          <div className="text-center py-24 text-slate-500">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-display text-3xl text-slate-600 tracking-wide">NESSUN CLIENTE</p>
            <p className="text-sm font-mono mt-3">Converti i lead dalla pipeline per vederli qui!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {clients.map((c: any) => (
              <ClientCard key={c.id} client={c} apiUrl={apiUrl} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
