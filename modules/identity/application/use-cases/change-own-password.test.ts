// modules/identity/application/use-cases/change-own-password.test.ts
import { describe, it, expect, vi } from 'vitest'
import { createChangeOwnPasswordUseCase } from './change-own-password'
import { Errors } from '../errors'
import type { User, UserRepository, AuthRepository } from '../../domain/repositories'

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    authId: 'auth-1',
    email: 'test@test.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'employee',
    status: 'active',
    organizationId: null,
    phone: null,
    mustChangePassword: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  }
}

describe('changeOwnPassword use case', () => {
  it('changes password and clears mustChangePassword', async () => {
    const user = makeUser()
    const changePassword = vi.fn().mockResolvedValue(undefined)
    const setMustChange = vi.fn().mockResolvedValue(undefined)
    const userRepo = {
      findByAuthId: vi.fn().mockResolvedValue(user),
      setMustChangePassword: setMustChange,
    } as unknown as UserRepository
    const authRepo = {
      verifyCredentials: vi.fn().mockResolvedValue(user.authId),
      changePassword,
    } as unknown as AuthRepository

    const useCase = createChangeOwnPasswordUseCase(userRepo, authRepo)

    await useCase({
      authId: user.authId,
      currentPassword: 'oldPass123',
      newPassword: 'newPass456',
    })

    expect(changePassword).toHaveBeenCalledWith(user.authId, 'newPass456')
    expect(setMustChange).toHaveBeenCalledWith(user.id, false)
  })

  it('throws passwordTooShort when new password < 8 chars', async () => {
    const userRepo = {} as UserRepository
    const authRepo = {} as AuthRepository
    const useCase = createChangeOwnPasswordUseCase(userRepo, authRepo)

    await expect(
      useCase({ authId: 'auth-1', currentPassword: 'old', newPassword: 'short' }),
    ).rejects.toThrow(Errors.passwordTooShort())
  })

  it('throws invalidCredentials when current password is wrong', async () => {
    const user = makeUser()
    const userRepo = {
      findByAuthId: vi.fn().mockResolvedValue(user),
    } as unknown as UserRepository
    const authRepo = {
      verifyCredentials: vi.fn().mockResolvedValue(null),
    } as unknown as AuthRepository

    const useCase = createChangeOwnPasswordUseCase(userRepo, authRepo)

    await expect(
      useCase({ authId: user.authId, currentPassword: 'wrong', newPassword: 'newPass456' }),
    ).rejects.toThrow(Errors.invalidCredentials())
  })

  it('throws userNotFound when user does not exist', async () => {
    const userRepo = {
      findByAuthId: vi.fn().mockResolvedValue(null),
    } as unknown as UserRepository
    const authRepo = {} as AuthRepository

    const useCase = createChangeOwnPasswordUseCase(userRepo, authRepo)

    await expect(
      useCase({ authId: 'unknown', currentPassword: 'old', newPassword: 'newPass456' }),
    ).rejects.toThrow(Errors.userNotFound())
  })
})
