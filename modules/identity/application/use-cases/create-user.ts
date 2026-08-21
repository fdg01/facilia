// modules/identity/application/use-cases/create-user.ts
import type { User, UserRepository, AuthRepository, OrganizationRepository } from '../../domain/repositories'
import type { Role } from '../../domain/entities'
import { canCreateUser, validateOrganizationAssignment } from '../../domain/services'
import { Errors } from '../errors'

export interface CreateUserRequest {
  readonly requester: User
  readonly email: string
  readonly firstName: string
  readonly lastName: string
  readonly role: Role
  readonly organizationId?: string
  readonly phone?: string
  readonly temporaryPassword: string
}

export function createCreateUserUseCase(
  userRepo: UserRepository,
  authRepo: AuthRepository,
  orgRepo: OrganizationRepository,
) {
  return async function createUser(input: CreateUserRequest): Promise<User> {
    if (!canCreateUser(input.requester)) throw Errors.forbidden()

    if (input.temporaryPassword.length < 8) throw Errors.passwordTooShort()

    if (!validateOrganizationAssignment(input.role, input.organizationId ?? null)) {
      throw Errors.invalidOrganization()
    }

    // If client, verify organization exists
    if (input.role === 'client' && input.organizationId) {
      const org = await orgRepo.findById(input.organizationId)
      if (!org) throw Errors.organizationNotFound()
    }

    // Check email uniqueness
    const existing = await userRepo.findByEmail(input.email)
    if (existing) throw Errors.emailExists()

    // Create auth user
    const authId = await authRepo.createAuthUser(input.email, input.temporaryPassword, {
      first_name: input.firstName,
      last_name: input.lastName,
      role: input.role,
    })

    // The handle_new_user trigger creates the public.users row automatically.
    // We need to update it with the correct role, organization, and must_change_password.
    const created = await userRepo.findByAuthId(authId)
    if (!created) throw Errors.userNotFound()

    return userRepo.update(created.id, {
      firstName: input.firstName,
      lastName: input.lastName,
      role: input.role,
      organizationId: input.organizationId ?? null,
      phone: input.phone,
    })
  }
}
