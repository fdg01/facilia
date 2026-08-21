// modules/portal/application/use-cases/get-lead.ts
import type { PortalLeadRepository } from '../../domain/repositories'
import type { LeadDetail } from '../../domain/types'

export function createGetLeadUseCase(leadRepo: PortalLeadRepository) {
  return async function getLead(id: string, organizationId: string): Promise<LeadDetail | null> {
    if (!organizationId) return null
    return leadRepo.findByIdAndOrganization(id, organizationId)
  }
}
