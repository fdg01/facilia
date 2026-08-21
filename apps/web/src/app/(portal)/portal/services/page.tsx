// src/app/(portal)/portal/services/page.tsx
import { requireClient } from '@/lib/portal-session'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { SupabaseServiceReader } from '@modules/portal/infrastructure'
import { createListServicesUseCase } from '@modules/portal/application/use-cases/portal-complete-use-cases'
import { ServiceList } from '@modules/portal/presentation/components/ServiceList'

export default async function ServicesPage() {
  const session = await requireClient()
  const supabase = await createServerSupabaseClient()
  const listServices = createListServicesUseCase(new SupabaseServiceReader(supabase))
  const services = await listServices(session.organizationId)
  return <ServiceList services={services} />
}
