// modules/identity/application/use-cases/login.ts
import type { UserRepository, AuthRepository } from '../../domain/repositories'
import type { Session } from '../../domain/entities'
import { Errors } from '../errors'

export interface LoginInput {
  readonly email: string
  readonly password: string
}

export interface LoginOutput {
  readonly session: Session
  readonly mustChangePassword: boolean
}

export function createLoginUseCase(userRepo: UserRepository, authRepo: AuthRepository) {
  return async function login(input: LoginInput): Promise<LoginOutput> {
    const authId = await authRepo.verifyCredentials(input.email, input.password)
    if (!authId) throw Errors.invalidCredentials()

    const user = await userRepo.findByAuthId(authId)
    if (!user) throw Errors.invalidCredentials()

    if (user.status === 'inactive') throw Errors.userInactive()

    const session: Session = {
      userId: user.id,
      authId: user.authId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      organizationId: user.organizationId,
      status: user.status,
      mustChangePassword: user.mustChangePassword,
    }

    return { session, mustChangePassword: user.mustChangePassword }
  }
}
