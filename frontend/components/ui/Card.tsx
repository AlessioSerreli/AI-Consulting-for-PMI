import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-navy-800 border border-navy-700 rounded-2xl p-6 ${className}`}>
      {children}
    </div>
  )
}
