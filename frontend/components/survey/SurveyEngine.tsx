'use client'

// SurveyEngine — wrapper component for survey state management
// Main survey logic lives in app/survey/page.tsx
// This component can be used to embed the survey in other contexts

import { useState } from 'react'

interface SurveyEngineProps {
  onComplete?: (answers: Record<string, any>) => void
}

export function SurveyEngine({ onComplete }: SurveyEngineProps) {
  const [isComplete, setIsComplete] = useState(false)

  if (isComplete) {
    return (
      <div className="text-center py-12">
        <p className="text-green-400 font-semibold">Survey completata!</p>
      </div>
    )
  }

  return (
    <div className="survey-engine">
      {/* Survey content rendered via app/survey/page.tsx */}
    </div>
  )
}
