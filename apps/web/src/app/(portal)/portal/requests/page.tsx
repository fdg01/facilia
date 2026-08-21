// src/app/(portal)/portal/requests/page.tsx
import { requireClient } from '@/lib/portal-session'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { SupabaseRequestRepository } from '@modules/portal/infrastructure'
import { createListRequestsUseCase } from '@modules/portal/application/use-cases/portal-complete-use-cases'
import { RequestList } from '@modules/portal/presentation/components/RequestList'

export default async function RequestsPage() {
  const session = await requireClient()
  const supabase = await createServerSupabaseClient()
  const listRequests = createListRequestsUseCase(new SupabaseRequestRepository(supabase))
  const requests = await listRequests(session.organizationId)
  return <RequestList requests={requests} />
}
