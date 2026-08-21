// modules/identity/application/use-cases/admin-change-password.test.ts
import { describe, it, expect, vi } from 'vitest'
import { createAdminChangePasswordUseCase } from './admin-change-password'
import { Errors } from '../errors'
import type { User, UserRepository, AuthRepository } from '../../domain/repositories'

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    authId: 'auth-1',
    email: 'test@test.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'admin',
    status: 'active',
    organizationId: null,
    phone: null,
    mustChangePassword: false,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  }
}

describe('adminChangePassword use case', () => {
  it('admin changes another user password and sets mustChangePassword', async () => {
    const admin = makeUser({ id: 'admin-1', role: 'admin' })
    const target = makeUser({ id: 'user-2', role: 'employee', authId: 'auth-2' })
    const adminSetPassword = vi.fn().mockResolvedValue(undefined)
    const setMustChange = vi.fn().mockResolvedValue(undefined)
    const userRepo = {
      findById: vi.fn().mockResolvedValue(target),
      setMustChangePassword: setMustChange,
    } as unknown as UserRepository
    const authRepo = {
      adminSetPassword,
    } as unknown as AuthRepository

    const useCase = createAdminChangePasswordUseCase(userRepo, authRepo)

    await useCase({
      requester: admin,
      targetUserId: 'user-2',
      newPassword: 'NewPass123',
    })

    expect(adminSetPassword).toHaveBeenCalledWith('auth-2', 'NewPass123')
    expect(setMustChange).toHaveBeenCalledWith('user-2', true)
  })

  it('throws forbidden when employee tries to change password', async () => {
    const employee = makeUser({ id: 'emp-1', role: 'employee' })
    const target = makeUser({ id: 'user-2', role: 'client' })
    const userRepo = {
      findById: vi.fn().mockResolvedValue(target),
    } as unknown as UserRepository
    const authRepo = {} as AuthRepository

    const useCase = createAdminChangePasswordUseCase(userRepo, authRepo)

    await expect(
      useCase({ requester: employee, targetUserId: 'user-2', newPassword: 'NewPass123' }),
    ).rejects.toThrow(Errors.forbidden())
  })

  it('throws passwordTooShort when password < 8', async () => {
    const admin = makeUser({ role: 'admin' })
    const userRepo = {} as UserRepository
    const authRepo = {} as AuthRepository

    const useCase = createAdminChangePasswordUseCase(userRepo, authRepo)

    await expect(
      useCase({ requester: admin, targetUserId: 'user-2', newPassword: 'short' }),
    ).rejects.toThrow(Errors.passwordTooShort())
  })

  it('throws userNotFound when target does not exist', async () => {
    const admin = makeUser({ role: 'admin' })
    const userRepo = {
      findById: vi.fn().mockResolvedValue(null),
    } as unknown as UserRepository
    const authRepo = {} as AuthRepository

    const useCase = createAdminChangePasswordUseCase(userRepo, authRepo)

    await expect(
      useCase({ requester: admin, targetUserId: 'nonexistent', newPassword: 'NewPass123' }),
    ).rejects.toThrow(Errors.userNotFound())
  })
})
