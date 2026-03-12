interface QuestionCardProps {
  section: string
  question: string
  subtitle?: string
  children: React.ReactNode
}

export function QuestionCard({ section, question, subtitle, children }: QuestionCardProps) {
  return (
    <div className="w-full max-w-2xl">
      <div className="text-electric-400 text-xs font-semibold uppercase tracking-widest mb-4">
        {section}
      </div>
      <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">{question}</h2>
      {subtitle && <p className="text-slate-400 mb-8">{subtitle}</p>}
      {!subtitle && <div className="mb-8" />}
      {children}
    </div>
  )
}
