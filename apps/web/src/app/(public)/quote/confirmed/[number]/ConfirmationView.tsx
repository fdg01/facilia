'use client'

interface ConfirmationViewProps {
  number: string
  name: string
  totalMonthly: number
  totalPerVisit: number
  mainLine: string | null
  giftIncluded: boolean
  giftDescription: string | null
  pdfUrl: string | null
}

const lineLabels: Record<string, string> = {
  clean: 'FACILIA Clean',
  care: 'FACILIA Care',
  continuity: 'FACILIA Continuity',
}

export function ConfirmationView({
  number, name, totalMonthly, totalPerVisit, mainLine,
  giftIncluded, giftDescription, pdfUrl,
}: ConfirmationViewProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-green-700">¡Presupuesto confirmado!</h1>
        <p className="text-gray-600">
          Hemos registrado tu solicitud. Tu número de presupuesto es:
        </p>
        <p className="text-3xl font-mono font-bold tracking-wider bg-green-50 py-3 px-6 rounded-lg inline-block">
          {number}
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-lg mb-2">Resumen</h2>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Cliente:</span>
              <span className="font-medium">{name}</span>
            </div>
            {mainLine && (
              <div className="flex justify-between">
                <span className="text-gray-600">Línea:</span>
                <span className="font-medium">{lineLabels[mainLine] ?? mainLine}</span>
              </div>
            )}
            <div className="flex justify-between border-t pt-2 mt-2">
              <span className="text-gray-600">Costo mensual:</span>
              <span className="font-bold text-lg">${totalMonthly.toFixed(2)}</span>
            </div>
            {totalPerVisit > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Costo por visita:</span>
                <span className="font-semibold">${totalPerVisit.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>

        {giftIncluded && giftDescription && (
          <div className="p-4 bg-amber-50 rounded-lg">
            <p className="font-semibold text-amber-800 text-sm">REGALO DE BIENVENIDA</p>
            <p className="text-amber-700 text-sm mt-1">{giftDescription} (sin costo)</p>
          </div>
        )}

        {pdfUrl && (
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 transition font-medium"
          >
            Descargar PDF del presupuesto
          </a>
        )}
      </div>

      <div className="text-center space-y-2">
        <p className="text-sm text-gray-600">
          Guardá este número para consultar tu presupuesto en el futuro.
        </p>
        <a href="/cotizador" className="text-blue-600 hover:underline text-sm">
          Cotizar otro servicio
        </a>
      </div>
    </div>
  )
}
