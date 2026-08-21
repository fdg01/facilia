// modules/portal/application/use-cases/get-dashboard.ts
import type { PortalDashboardRepository } from '../../domain/repositories'
import type { DashboardData } from '../../domain/types'

export function createGetDashboardUseCase(dashboardRepo: PortalDashboardRepository) {
  return async function getDashboard(organizationId: string): Promise<DashboardData> {
    if (!organizationId) {
      return { totalLeads: 0, recentLeads: [], pendingLeads: 0 }
    }
    return dashboardRepo.getSummary(organizationId)
  }
}
