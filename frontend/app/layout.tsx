import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI Consulting PMI — Porta l\'AI nella tua azienda',
  description: 'Consulenza AI su misura per piccole e medie imprese italiane. Scopri il potenziale della tua azienda con la nostra Efficiency Scorecard gratuita.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it">
      <body className="bg-navy-900 text-white antialiased">{children}</body>
    </html>
  )
}
