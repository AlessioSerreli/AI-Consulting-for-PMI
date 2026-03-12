import React from 'react'

interface StatsCardProps {
  label: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  iconColor?: string
}

export function StatsCard({ label, value, icon: Icon, iconColor = 'text-electric-400' }: StatsCardProps) {
  return (
    <div className="bg-navy-800 border border-navy-700 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-slate-400 text-sm">{label}</span>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div className="text-3xl font-bold text-white">{value}</div>
    </div>
  )
}
