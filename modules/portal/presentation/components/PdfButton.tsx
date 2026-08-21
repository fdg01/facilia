// modules/portal/presentation/components/PdfButton.tsx
'use client'

import { useState } from 'react'

interface PdfButtonProps {
  leadId: string
}

export function PdfButton({ leadId }: PdfButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/portal/leads/${leadId}/pdf`)
      if (!res.ok) throw new Error('Error al generar PDF')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
      setTimeout(() => URL.revokeObjectURL(url), 60000)
    } catch {
      // Silent fail for UX; server logs the error
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-6 py-3 text-white text-sm hover:bg-gray-800 transition disabled:opacity-50"
    >
      {loading ? (
        <>
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Generando...
        </>
      ) : (
        <>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Ver PDF
        </>
      )}
    </button>
  )
}
