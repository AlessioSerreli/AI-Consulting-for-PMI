'use client'

interface Lead {
  id: string
  company_name: string
  contact_email: string
  sector: string
  status: string
  overall_score?: number
}

interface LeadPipelineProps {
  leads: Lead[]
  onStatusChange?: (leadId: string, newStatus: string) => void
}

const STATUS_LABELS: Record<string, string> = {
  new: 'Nuovo',
  survey_done: 'Survey Completata',
  call_scheduled: 'Call Schedulata',
  offer_sent: 'Offerta Inviata',
  client: 'Cliente',
  lost: 'Perso',
}

export function LeadPipeline({ leads, onStatusChange }: LeadPipelineProps) {
  return (
    <div className="space-y-3">
      {leads.map((lead) => (
        <div key={lead.id} className="bg-navy-800 border border-navy-700 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="font-semibold text-white">{lead.company_name}</p>
            <p className="text-slate-400 text-sm">{lead.contact_email}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">{STATUS_LABELS[lead.status] || lead.status}</span>
            {lead.overall_score && (
              <span className="text-electric-400 font-bold text-sm">{lead.overall_score}/100</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
