// modules/identity/application/use-cases/list-organizations.ts
import type { OrganizationRepository } from '../../domain/repositories'
import type { Organization } from '../../domain/entities'

export function createListOrganizationsUseCase(orgRepo: OrganizationRepository) {
  return async function listOrganizations(): Promise<Organization[]> {
    return orgRepo.list()
  }
}
