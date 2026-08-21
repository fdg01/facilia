// src/app/(portal)/portal/page.tsx
import { requireClient } from '@/lib/portal-session'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { SupabaseExtendedDashboardRepository } from '@modules/portal/infrastructure'
import { createGetExtendedDashboardUseCase } from '@modules/portal/application/use-cases/portal-complete-use-cases'
import { DashboardSummary } from '@modules/portal/presentation/components/DashboardSummary'

export default async function PortalDashboardPage() {
  const session = await requireClient()
  const supabase = await createServerSupabaseClient()
  const dashboardRepo = new SupabaseExtendedDashboardRepository(supabase)
  const getDashboard = createGetExtendedDashboardUseCase(dashboardRepo)

  const data = await getDashboard(session.organizationId)

  return (
    <DashboardSummary
      data={data}
      userName={`${session.firstName} ${session.lastName}`}
    />
  )
}
