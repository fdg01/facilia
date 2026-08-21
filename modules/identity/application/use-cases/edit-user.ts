// modules/identity/application/use-cases/edit-user.ts
import type { User, UserRepository, UpdateUserInput } from '../../domain/repositories'
import type { Role } from '../../domain/entities'
import { canChangeRole, canRemoveAdminRole, validateOrganizationAssignment } from '../../domain/services'
import { Errors } from '../errors'

export interface EditUserRequest {
  readonly requester: User
  readonly targetUserId: string
  readonly updates: UpdateUserInput
}

export function createEditUserUseCase(userRepo: UserRepository) {
  return async function editUser(input: EditUserRequest): Promise<User> {
    const target = await userRepo.findById(input.targetUserId)
    if (!target) throw Errors.userNotFound()

    if (input.requester.role !== 'admin') throw Errors.forbidden()

    // Prevent admin from removing own admin role
    if (input.updates.role !== undefined && input.updates.role !== 'admin') {
      if (!canRemoveAdminRole(input.requester, target, input.updates.role)) {
        throw Errors.cannotRemoveOwnAdmin()
      }
    }

    // Validate organization assignment if role or organization is changing
    const newRole: Role = input.updates.role ?? target.role
    const newOrgId: string | null = input.updates.organizationId !== undefined
      ? input.updates.organizationId
      : target.organizationId

    if (!validateOrganizationAssignment(newRole, newOrgId)) {
      throw Errors.invalidOrganization()
    }

    return userRepo.update(input.targetUserId, input.updates)
  }
}
