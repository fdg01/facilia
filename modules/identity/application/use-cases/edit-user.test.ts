// modules/identity/application/use-cases/edit-user.test.ts
import { describe, it, expect, vi } from 'vitest'
import { createEditUserUseCase } from './edit-user'
import type { UserRepository, UpdateUserInput } from '../../domain/repositories'
import type { User } from '../../domain/entities'
import { IdentityError } from '../errors'

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
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

function makeMockRepo(overrides: Partial<UserRepository> = {}): UserRepository {
  return {
    findById: vi.fn(async () => makeUser({ id: 'target-1', role: 'employee' })),
    findByEmail: vi.fn(),
    findByAuthId: vi.fn(),
    list: vi.fn(),
    save: vi.fn(),
    updateStatus: vi.fn(),
    update: vi.fn(async (_id: string, input: UpdateUserInput) =>
      makeUser({ id: 'target-1', role: 'employee', ...input } as User),
    ),
    setMustChangePassword: vi.fn(),
    ...overrides,
  }
}

describe('editUser', () => {
  it('admin edits another user successfully', async () => {
    const repo = makeMockRepo()
    const editUser = createEditUserUseCase(repo)
    const result = await editUser({
      requester: makeUser({ id: 'admin-1' }),
      targetUserId: 'target-1',
      updates: { firstName: 'NewName' },
    })
    expect(result.firstName).toBe('NewName')
    expect(repo.update).toHaveBeenCalledWith('target-1', { firstName: 'NewName' })
  })

  it('non-admin cannot edit users', async () => {
    const repo = makeMockRepo()
    const editUser = createEditUserUseCase(repo)
    await expect(
      editUser({
        requester: makeUser({ id: 'emp-1', role: 'employee' }),
        targetUserId: 'target-1',
        updates: { firstName: 'NewName' },
      }),
    ).rejects.toThrow(IdentityError)
  })

  it('admin cannot remove own admin role', async () => {
    const repo = makeMockRepo({
      findById: vi.fn(async () => makeUser({ id: 'admin-1', role: 'admin' })),
    })
    const editUser = createEditUserUseCase(repo)
    await expect(
      editUser({
        requester: makeUser({ id: 'admin-1', role: 'admin' }),
        targetUserId: 'admin-1',
        updates: { role: 'employee' },
      }),
    ).rejects.toThrow(IdentityError)
  })

  it('admin can change another admin to employee', async () => {
    const repo = makeMockRepo({
      findById: vi.fn(async () => makeUser({ id: 'target-1', role: 'admin' })),
    })
    const editUser = createEditUserUseCase(repo)
    const result = await editUser({
      requester: makeUser({ id: 'admin-1' }),
      targetUserId: 'target-1',
      updates: { role: 'employee' },
    })
    expect(result.role).toBe('employee')
  })

  it('rejects invalid organization assignment (client without org)', async () => {
    const repo = makeMockRepo()
    const editUser = createEditUserUseCase(repo)
    await expect(
      editUser({
        requester: makeUser({ id: 'admin-1' }),
        targetUserId: 'target-1',
        updates: { role: 'client', organizationId: null },
      }),
    ).rejects.toThrow(IdentityError)
  })

  it('rejects invalid organization assignment (employee with org)', async () => {
    const repo = makeMockRepo()
    const editUser = createEditUserUseCase(repo)
    await expect(
      editUser({
        requester: makeUser({ id: 'admin-1' }),
        targetUserId: 'target-1',
        updates: { role: 'employee', organizationId: 'org-1' },
      }),
    ).rejects.toThrow(IdentityError)
  })

  it('throws USER_NOT_FOUND when target does not exist', async () => {
    const repo = makeMockRepo({ findById: vi.fn(async () => null) })
    const editUser = createEditUserUseCase(repo)
    await expect(
      editUser({
        requester: makeUser({ id: 'admin-1' }),
        targetUserId: 'nonexistent',
        updates: { firstName: 'NewName' },
      }),
    ).rejects.toThrow(IdentityError)
  })
})
