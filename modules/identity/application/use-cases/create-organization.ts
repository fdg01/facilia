// modules/identity/application/use-cases/create-organization.ts
import type { OrganizationRepository } from '../../domain/repositories'
import type { Organization } from '../../domain/entities'

export interface CreateOrganizationInput {
  readonly name: string
  readonly taxId?: string
  readonly email?: string
  readonly phone?: string
}

export function createCreateOrganizationUseCase(orgRepo: OrganizationRepository) {
  return async function createOrganization(input: CreateOrganizationInput): Promise<Organization> {
    return orgRepo.save({
      id: crypto.randomUUID(),
      name: input.name,
      taxId: input.taxId ?? null,
      email: input.email ?? null,
      phone: input.phone ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }
}
