// modules/identity/application/use-cases/deactivate-user.ts
import type { User, UserRepository } from '../../domain/repositories'
import { canDeactivate } from '../../domain/services'
import { Errors } from '../errors'

export interface DeactivateUserRequest {
  readonly requester: User
  readonly targetUserId: string
}

export function createDeactivateUserUseCase(userRepo: UserRepository) {
  return async function deactivateUser(input: DeactivateUserRequest): Promise<User> {
    const target = await userRepo.findById(input.targetUserId)
    if (!target) throw Errors.userNotFound()

    if (!canDeactivate(input.requester, target)) {
      if (input.requester.id === input.targetUserId) throw Errors.cannotDeactivateSelf()
      throw Errors.forbidden()
    }

    return userRepo.updateStatus(input.targetUserId, 'inactive')
  }
}
