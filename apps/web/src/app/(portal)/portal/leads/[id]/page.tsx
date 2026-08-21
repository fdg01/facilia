// src/app/(portal)/portal/leads/[id]/page.tsx
import { requireClient } from '@/lib/portal-session'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { SupabasePortalLeadRepository } from '@modules/portal/infrastructure'
import { createGetLeadUseCase } from '@modules/portal/application/use-cases'
import { LeadDetail } from '@modules/portal/presentation/components/LeadDetail'
import Link from 'next/link'

interface Props {
  params: Promise<{ id: string }>
}

export default async function PortalLeadDetailPage({ params }: Props) {
  const { id } = await params
  const session = await requireClient()
  const supabase = await createServerSupabaseClient()
  const leadRepo = new SupabasePortalLeadRepository(supabase)
  const getLead = createGetLeadUseCase(leadRepo)

  const lead = await getLead(id, session.organizationId)

  if (!lead) {
    return (
      <div className="text-center py-12 space-y-4">
        <h1 className="text-xl font-bold text-gray-900">Cotización no encontrada</h1>
        <p className="text-gray-600">La cotización que buscás no existe o no pertenece a tu organización.</p>
        <Link href="/portal/leads" className="inline-block text-blue-600 hover:underline">
          ← Volver a mis cotizaciones
        </Link>
      </div>
    )
  }

  return <LeadDetail lead={lead} />
}
