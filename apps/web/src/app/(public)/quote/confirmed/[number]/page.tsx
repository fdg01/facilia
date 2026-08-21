// src/app/(public)/quote/confirmed/[number]/page.tsx
import { createServiceRoleSupabaseClient, getSignedPdfUrl } from '@modules/quoter/infrastructure'
import { ConfirmationView } from './ConfirmationView'

interface Props {
  params: Promise<{ number: string }>
}

export default async function ConfirmationPage({ params }: Props) {
  const { number } = await params
  const serviceClient = createServiceRoleSupabaseClient()

  // Find lead by number
  const { data, error } = await serviceClient
    .from('leads')
    .select('*')
    .eq('number', number)
    .maybeSingle()

  if (error || !data) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center p-8">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold text-red-700">Presupuesto no encontrado</h1>
          <p className="text-gray-600">
            El número <span className="font-mono">{number}</span> no corresponde a un presupuesto válido.
          </p>
          <a href="/cotizador" className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 transition">
            Volver al cotizador
          </a>
        </div>
      </main>
    )
  }

  // Generate fresh signed URL for PDF
  let pdfUrl: string | null = null
  try {
    pdfUrl = await getSignedPdfUrl(serviceClient, data.id)
  } catch {
    // PDF might not be available
  }

  return (
    <main className="flex flex-1 flex-col p-4 md:p-8 max-w-2xl mx-auto">
      <ConfirmationView
        number={data.number}
        name={data.name}
        totalMonthly={Number(data.total_monthly ?? 0)}
        totalPerVisit={Number(data.total_per_visit ?? 0)}
        mainLine={data.main_line}
        giftIncluded={data.gift_included}
        giftDescription={data.gift_description}
        pdfUrl={pdfUrl}
      />
    </main>
  )
}
