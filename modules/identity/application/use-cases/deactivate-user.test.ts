// modules/identity/application/use-cases/deactivate-user.test.ts
import { describe, it, expect, vi } from 'vitest'
import { createDeactivateUserUseCase } from './deactivate-user'
import { Errors } from '../errors'
import type { User, UserRepository } from '../../domain/repositories'

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

describe('deactivateUser use case', () => {
  it('deactivates another user when requester is admin', async () => {
    const admin = makeUser({ id: 'admin-1', role: 'admin' })
    const target = makeUser({ id: 'user-2', role: 'employee' })
    const updateStatus = vi.fn().mockResolvedValue({ ...target, status: 'inactive' as const })
    const userRepo = {
      findById: vi.fn().mockResolvedValue(target),
      updateStatus,
    } as unknown as UserRepository

    const useCase = createDeactivateUserUseCase(userRepo)

    const result = await useCase({ requester: admin, targetUserId: 'user-2' })

    expect(result.status).toBe('inactive')
    expect(updateStatus).toHaveBeenCalledWith('user-2', 'inactive')
  })

  it('throws cannotDeactivateSelf when admin tries to deactivate themselves', async () => {
    const admin = makeUser({ id: 'admin-1', role: 'admin' })
    const userRepo = {
      findById: vi.fn().mockResolvedValue(admin),
    } as unknown as UserRepository

    const useCase = createDeactivateUserUseCase(userRepo)

    await expect(
      useCase({ requester: admin, targetUserId: 'admin-1' }),
    ).rejects.toThrow(Errors.cannotDeactivateSelf())
  })

  it('throws forbidden when employee tries to deactivate', async () => {
    const employee = makeUser({ id: 'emp-1', role: 'employee' })
    const target = makeUser({ id: 'user-2', role: 'client', organizationId: 'org-1' })
    const userRepo = {
      findById: vi.fn().mockResolvedValue(target),
    } as unknown as UserRepository

    const useCase = createDeactivateUserUseCase(userRepo)

    await expect(
      useCase({ requester: employee, targetUserId: 'user-2' }),
    ).rejects.toThrow(Errors.forbidden())
  })

  it('throws userNotFound when target does not exist', async () => {
    const admin = makeUser({ id: 'admin-1', role: 'admin' })
    const userRepo = {
      findById: vi.fn().mockResolvedValue(null),
    } as unknown as UserRepository

    const useCase = createDeactivateUserUseCase(userRepo)

    await expect(
      useCase({ requester: admin, targetUserId: 'nonexistent' }),
    ).rejects.toThrow(Errors.userNotFound())
  })
})
