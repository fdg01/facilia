// modules/identity/application/use-cases/list-users.test.ts
import { describe, it, expect, vi } from 'vitest'
import { createListUsersUseCase } from './list-users'
import { Errors } from '../errors'
import type { User, UserRepository, Paginated } from '../../domain/repositories'

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

describe('listUsers use case', () => {
  it('returns paginated users when requester is admin', async () => {
    const admin = makeUser({ role: 'admin' })
    const expected: Paginated<User> = {
      data: [makeUser({ id: 'u1' }), makeUser({ id: 'u2' })],
      meta: { page: 1, pageSize: 20, total: 2 },
    }
    const userRepo = {
      list: vi.fn().mockResolvedValue(expected),
    } as unknown as UserRepository

    const useCase = createListUsersUseCase(userRepo)

    const result = await useCase({ requester: admin, filters: { page: 1, pageSize: 20 } })

    expect(result.data).toHaveLength(2)
    expect(result.meta.total).toBe(2)
  })

  it('throws forbidden when requester is employee', async () => {
    const employee = makeUser({ role: 'employee' })
    const userRepo = {} as UserRepository

    const useCase = createListUsersUseCase(userRepo)

    await expect(
      useCase({ requester: employee, filters: {} }),
    ).rejects.toThrow(Errors.forbidden())
  })

  it('throws forbidden when requester is client', async () => {
    const client = makeUser({ role: 'client', organizationId: 'org-1' })
    const userRepo = {} as UserRepository

    const useCase = createListUsersUseCase(userRepo)

    await expect(
      useCase({ requester: client, filters: {} }),
    ).rejects.toThrow(Errors.forbidden())
  })
})
