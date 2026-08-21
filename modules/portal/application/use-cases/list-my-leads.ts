// modules/portal/application/use-cases/list-my-leads.ts
import type { PortalLeadRepository } from '../../domain/repositories'
import type { LeadSummary, LeadStatus } from '../../domain/types'

export function createListMyLeadsUseCase(leadRepo: PortalLeadRepository) {
  return async function listMyLeads(
    organizationId: string,
    filters: { page: number; pageSize: number; status?: LeadStatus },
  ): Promise<{ data: LeadSummary[]; total: number }> {
    if (!organizationId) {
      return { data: [], total: 0 }
    }
    return leadRepo.listByOrganization(organizationId, filters)
  }
}
