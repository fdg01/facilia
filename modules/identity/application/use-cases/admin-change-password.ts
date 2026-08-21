// modules/identity/application/use-cases/admin-change-password.ts
import type { User, UserRepository, AuthRepository } from '../../domain/repositories'
import type { Role } from '../../domain/entities'
import { canChangeOtherPassword } from '../../domain/services'
import { Errors } from '../errors'

export interface AdminChangePasswordInput {
  readonly requester: User
  readonly targetUserId: string
  readonly newPassword: string
}

export function createAdminChangePasswordUseCase(userRepo: UserRepository, authRepo: AuthRepository) {
  return async function adminChangePassword(input: AdminChangePasswordInput): Promise<void> {
    if (input.newPassword.length < 8) throw Errors.passwordTooShort()

    const target = await userRepo.findById(input.targetUserId)
    if (!target) throw Errors.userNotFound()

    if (!canChangeOtherPassword(input.requester, target)) throw Errors.forbidden()

    await authRepo.adminSetPassword(target.authId, input.newPassword)
    await userRepo.setMustChangePassword(target.id, true)
  }
}
