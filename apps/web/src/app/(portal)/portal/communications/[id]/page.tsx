// src/app/(portal)/portal/communications/[id]/page.tsx
import { requireClient } from '@/lib/portal-session'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { SupabaseCommunicationRepository } from '@modules/portal/infrastructure'
import { createReadCommunicationUseCase } from '@modules/portal/application/use-cases/portal-complete-use-cases'
import { CommunicationDetail } from '@modules/portal/presentation/components/CommunicationDetail'

export default async function CommunicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await requireClient()
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const readCommunication = createReadCommunicationUseCase(new SupabaseCommunicationRepository(supabase))
  const communication = await readCommunication(id, session.organizationId)
  if (!communication) {
    return <div className="text-center text-gray-500 py-12">Comunicación no encontrada</div>
  }
  return <CommunicationDetail communication={communication} />
}
