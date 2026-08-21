// modules/quoter/application/use-cases/list-leads.ts
import type { LeadRepository, LeadFilters, Paginated } from '../../domain/repositories'
import type { Lead } from '../../domain/entities'

export function createListLeadsUseCase(leadRepo: LeadRepository) {
  return async function listLeads(filters: LeadFilters): Promise<Paginated<Lead>> {
    return leadRepo.list(filters)
  }
}
