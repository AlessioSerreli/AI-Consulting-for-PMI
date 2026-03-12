interface ProgressBarProps {
  value: number
  max?: number
  color?: string
  className?: string
}

export function ProgressBar({ value, max = 100, color = 'bg-electric-500', className = '' }: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
  return (
    <div className={`h-2 bg-navy-700 rounded-full overflow-hidden ${className}`}>
      <div
        className={`h-full ${color} rounded-full transition-all duration-500`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}
