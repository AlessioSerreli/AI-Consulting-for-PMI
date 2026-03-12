interface Dimension {
  score: number
  analysis: string
  improvement: string
}

interface ScorecardData {
  overall_score: number
  dimensions: {
    efficienza_operativa: Dimension
    digitalizzazione: Dimension
    gestione_dati: Dimension
    comunicazione_interna: Dimension
    velocita_decisionale: Dimension
  }
  quick_wins: string[]
  executive_summary: string
}

interface ScoreCardProps {
  scorecard: ScorecardData
  companyName: string
}

const DIM_LABELS: Record<string, string> = {
  efficienza_operativa: 'Efficienza Operativa',
  digitalizzazione: 'Digitalizzazione',
  gestione_dati: 'Gestione Dati',
  comunicazione_interna: 'Comunicazione Interna',
  velocita_decisionale: 'Velocità Decisionale',
}

export function ScoreCard({ scorecard, companyName }: ScoreCardProps) {
  return (
    <div className="bg-navy-800 border border-navy-700 rounded-2xl p-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">{companyName}</h2>
        <div className="text-5xl font-bold text-electric-400">{scorecard.overall_score}/100</div>
        <p className="text-slate-400 mt-2">Punteggio Complessivo</p>
      </div>

      <div className="space-y-4 mb-8">
        {Object.entries(scorecard.dimensions).map(([key, dim]) => (
          <div key={key} className="bg-navy-900/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-medium text-sm">{DIM_LABELS[key]}</span>
              <span className="text-electric-400 font-bold">{dim.score}/100</span>
            </div>
            <div className="h-2 bg-navy-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-electric-500 rounded-full transition-all"
                style={{ width: `${dim.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div>
        <h3 className="font-semibold text-white mb-3">Quick Win Prioritari</h3>
        <div className="space-y-2">
          {scorecard.quick_wins.map((win, i) => (
            <div key={i} className="flex items-start gap-3 bg-navy-900/50 rounded-xl p-3">
              <span className="w-6 h-6 bg-electric-500 rounded-md flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {i + 1}
              </span>
              <span className="text-slate-300 text-sm">{win}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
