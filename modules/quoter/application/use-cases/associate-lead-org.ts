// modules/quoter/application/use-cases/associate-lead-org.ts
import type { LeadRepository } from '../../domain/repositories'
import type { User } from '../../../identity/domain/entities'
import type { Lead } from '../../domain/entities'
import { canAssociateOrganization } from '../../domain/services'

interface AssociateOrgInput {
  readonly requester: User
  readonly leadId: string
  readonly organizationId: string
}

export function createAssociateLeadOrgUseCase(leadRepo: LeadRepository) {
  return async function associateLeadOrg(input: AssociateOrgInput): Promise<Lead> {
    if (!canAssociateOrganization(input.requester)) throw new Error('FORBIDDEN')
    return leadRepo.associateOrganization(input.leadId, input.organizationId)
  }
}
