// modules/quoter/application/use-cases/change-lead-status.ts
import type { LeadRepository } from '../../domain/repositories'
import type { User } from '../../../identity/domain/entities'
import type { Lead, LeadStatus } from '../../domain/entities'
import { canChangeLeadStatus } from '../../domain/services'

interface ChangeStatusInput {
  readonly requester: User
  readonly leadId: string
  readonly newStatus: LeadStatus
  readonly notes?: string
}

export function createChangeLeadStatusUseCase(leadRepo: LeadRepository) {
  return async function changeLeadStatus(input: ChangeStatusInput): Promise<Lead> {
    const lead = await leadRepo.findById(input.leadId)
    if (!lead) throw new Error('LEAD_NOT_FOUND')

    if (!canChangeLeadStatus(input.requester, lead, input.newStatus)) {
      throw new Error('INVALID_TRANSITION')
    }

    return leadRepo.updateStatus(input.leadId, input.newStatus, input.notes)
  }
}
