// modules/identity/application/use-cases/change-own-password.ts
import type { UserRepository, AuthRepository } from '../../domain/repositories'
import { Errors } from '../errors'

export interface ChangeOwnPasswordInput {
  readonly authId: string
  readonly currentPassword: string
  readonly newPassword: string
}

export function createChangeOwnPasswordUseCase(userRepo: UserRepository, authRepo: AuthRepository) {
  return async function changeOwnPassword(input: ChangeOwnPasswordInput): Promise<void> {
    if (input.newPassword.length < 8) throw Errors.passwordTooShort()

    const user = await userRepo.findByAuthId(input.authId)
    if (!user) throw Errors.userNotFound()

    // Verify current password
    const verifiedAuthId = await authRepo.verifyCredentials(user.email, input.currentPassword)
    if (!verifiedAuthId || verifiedAuthId !== input.authId) {
      throw Errors.invalidCredentials()
    }

    await authRepo.changePassword(input.authId, input.newPassword)
    await userRepo.setMustChangePassword(user.id, false)
  }
}
