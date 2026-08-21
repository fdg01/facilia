// src/app/(portal)/portal/requests/[id]/page.tsx
import { requireClient } from '@/lib/portal-session'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import {
  SupabaseRequestRepository, SupabaseRequestEventRepository,
} from '@modules/portal/infrastructure'
import { createGetRequestUseCase } from '@modules/portal/application/use-cases/portal-complete-use-cases'
import { RequestDetail } from '@modules/portal/presentation/components/RequestDetail'

export default async function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireClient()
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const getRequest = createGetRequestUseCase(
    new SupabaseRequestRepository(supabase),
    new SupabaseRequestEventRepository(supabase),
  )
  const result = await getRequest(id, session.organizationId)
  if (!result) {
    return <div className="text-center text-gray-500 py-12">Solicitud no encontrada</div>
  }
  return <RequestDetail request={result.request} events={result.events} />
}
