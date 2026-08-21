// src/app/(portal)/portal/services/[id]/page.tsx
import { requireClient } from '@/lib/portal-session'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { SupabaseServiceReader, SupabaseServiceEventRepository } from '@modules/portal/infrastructure'
import { createGetServiceUseCase } from '@modules/portal/application/use-cases/portal-complete-use-cases'
import { ServiceDetail } from '@modules/portal/presentation/components/ServiceDetail'

export default async function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireClient()
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const getService = createGetServiceUseCase(
    new SupabaseServiceReader(supabase),
    new SupabaseServiceEventRepository(supabase),
  )
  const result = await getService(id, session.organizationId)
  if (!result) {
    return <div className="text-center text-gray-500 py-12">Servicio no encontrado</div>
  }
  return <ServiceDetail service={result.service} events={result.events} />
}
