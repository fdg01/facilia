// src/app/(portal)/portal/communications/page.tsx
import { requireClient } from '@/lib/portal-session'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { SupabaseCommunicationRepository } from '@modules/portal/infrastructure'
import { createListCommunicationsUseCase } from '@modules/portal/application/use-cases/portal-complete-use-cases'
import { CommunicationList } from '@modules/portal/presentation/components/CommunicationList'

export default async function CommunicationsPage() {
  const session = await requireClient()
  const supabase = await createServerSupabaseClient()
  const listCommunications = createListCommunicationsUseCase(new SupabaseCommunicationRepository(supabase))
  const result = await listCommunications(session.organizationId)
  return <CommunicationList communications={result.data} unread={result.unread} />
}
