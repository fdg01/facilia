// modules/quoter/application/use-cases/get-lead.ts
import type { LeadRepository } from '../../domain/repositories'
import type { LeadWithDetail } from '../../domain/entities'

export function createGetLeadUseCase(leadRepo: LeadRepository) {
  return async function getLead(id: string): Promise<LeadWithDetail | null> {
    return leadRepo.findById(id)
  }
}
