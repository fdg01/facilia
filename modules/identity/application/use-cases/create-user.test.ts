// modules/identity/application/use-cases/create-user.test.ts
import { describe, it, expect, vi } from 'vitest'
import { createCreateUserUseCase } from './create-user'
import { Errors } from '../errors'
import type { User, UserRepository, AuthRepository, OrganizationRepository } from '../../domain/repositories'

function makeAdmin(overrides: Partial<User> = {}): User {
  return {
    id: 'admin-1',
    authId: 'auth-admin',
    email: 'admin@test.com',
    firstName: 'Admin',
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

function makeMockRepos() {
  const savedUsers = new Map<string, User>()

  const userRepo = {
    findByEmail: vi.fn(async (email: string) => savedUsers.get(email) ?? null),
    findByAuthId: vi.fn(async (authId: string) => {
      for (const u of savedUsers.values()) {
        if (u.authId === authId) return u
      }
      return null
    }),
    findById: vi.fn(async (id: string) => {
      for (const u of savedUsers.values()) {
        if (u.id === id) return u
      }
      return null
    }),
    update: vi.fn(async (id: string, input: any) => {
      for (const u of savedUsers.values()) {
        if (u.id === id) {
          const updated = { ...u, ...input, updatedAt: new Date() }
          savedUsers.set(u.email, updated)
          return updated
        }
      }
      return null as any
    }),
    save: vi.fn(),
    list: vi.fn(),
    updateStatus: vi.fn(),
    setMustChangePassword: vi.fn(),
  } as unknown as UserRepository

  const authRepo = {
    createAuthUser: vi.fn(async (email: string) => {
      const authId = `auth-${email}`
      // Simulate trigger creating the public.users row
      savedUsers.set(email, {
        id: `user-${email}`,
        authId,
        email,
        firstName: '',
        lastName: '',
        role: 'client', // default from trigger
        status: 'active',
        organizationId: null,
        phone: null,
        mustChangePassword: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      return authId
    }),
    changePassword: vi.fn(),
    verifyCredentials: vi.fn(),
    invalidateSessions: vi.fn(),
    adminSetPassword: vi.fn(),
  } as unknown as AuthRepository

  const orgRepo = {
    findById: vi.fn(async (id: string) => {
      if (id === 'org-1') {
        return {
          id: 'org-1',
          name: 'Test Org',
          taxId: null,
          email: null,
          phone: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }
      return null
    }),
    list: vi.fn(),
    save: vi.fn(),
  } as unknown as OrganizationRepository

  return { userRepo, authRepo, orgRepo }
}

describe('createUser use case', () => {
  it('creates a client user with organization', async () => {
    const { userRepo, authRepo, orgRepo } = makeMockRepos()
    const useCase = createCreateUserUseCase(userRepo, authRepo, orgRepo)
    const admin = makeAdmin()

    const result = await useCase({
      requester: admin,
      email: 'client@test.com',
      firstName: 'Client',
      lastName: 'User',
      role: 'client',
      organizationId: 'org-1',
      phone: '12345678',
      temporaryPassword: 'TempPass123',
    })

    expect(result.email).toBe('client@test.com')
    expect(result.role).toBe('client')
    expect(result.organizationId).toBe('org-1')
    expect(result.firstName).toBe('Client')
  })

  it('creates an admin user without organization', async () => {
    const { userRepo, authRepo, orgRepo } = makeMockRepos()
    const useCase = createCreateUserUseCase(userRepo, authRepo, orgRepo)
    const admin = makeAdmin()

    const result = await useCase({
      requester: admin,
      email: 'newadmin@test.com',
      firstName: 'New',
      lastName: 'Admin',
      role: 'admin',
      temporaryPassword: 'TempPass123',
    })

    expect(result.role).toBe('admin')
    expect(result.organizationId).toBeNull()
  })

  it('throws forbidden when requester is not admin', async () => {
    const { userRepo, authRepo, orgRepo } = makeMockRepos()
    const useCase = createCreateUserUseCase(userRepo, authRepo, orgRepo)
    const employee = makeAdmin({ role: 'employee' })

    await expect(
      useCase({
        requester: employee,
        email: 'x@test.com',
        firstName: 'X',
        lastName: 'Y',
        role: 'client',
        organizationId: 'org-1',
        temporaryPassword: 'TempPass123',
      }),
    ).rejects.toThrow(Errors.forbidden())
  })

  it('throws passwordTooShort when temp password < 8', async () => {
    const { userRepo, authRepo, orgRepo } = makeMockRepos()
    const useCase = createCreateUserUseCase(userRepo, authRepo, orgRepo)
    const admin = makeAdmin()

    await expect(
      useCase({
        requester: admin,
        email: 'x@test.com',
        firstName: 'X',
        lastName: 'Y',
        role: 'employee',
        temporaryPassword: 'short',
      }),
    ).rejects.toThrow(Errors.passwordTooShort())
  })

  it('throws invalidOrganization when client has no organization', async () => {
    const { userRepo, authRepo, orgRepo } = makeMockRepos()
    const useCase = createCreateUserUseCase(userRepo, authRepo, orgRepo)
    const admin = makeAdmin()

    await expect(
      useCase({
        requester: admin,
        email: 'x@test.com',
        firstName: 'X',
        lastName: 'Y',
        role: 'client',
        temporaryPassword: 'TempPass123',
      }),
    ).rejects.toThrow(Errors.invalidOrganization())
  })

  it('throws invalidOrganization when admin has organization', async () => {
    const { userRepo, authRepo, orgRepo } = makeMockRepos()
    const useCase = createCreateUserUseCase(userRepo, authRepo, orgRepo)
    const admin = makeAdmin()

    await expect(
      useCase({
        requester: admin,
        email: 'x@test.com',
        firstName: 'X',
        lastName: 'Y',
        role: 'admin',
        organizationId: 'org-1',
        temporaryPassword: 'TempPass123',
      }),
    ).rejects.toThrow(Errors.invalidOrganization())
  })

  it('throws organizationNotFound when org does not exist', async () => {
    const { userRepo, authRepo, orgRepo } = makeMockRepos()
    const useCase = createCreateUserUseCase(userRepo, authRepo, orgRepo)
    const admin = makeAdmin()

    await expect(
      useCase({
        requester: admin,
        email: 'x@test.com',
        firstName: 'X',
        lastName: 'Y',
        role: 'client',
        organizationId: 'nonexistent',
        temporaryPassword: 'TempPass123',
      }),
    ).rejects.toThrow(Errors.organizationNotFound())
  })

  it('throws emailExists when email is already registered', async () => {
    const { userRepo, authRepo, orgRepo } = makeMockRepos()
    const useCase = createCreateUserUseCase(userRepo, authRepo, orgRepo)
    const admin = makeAdmin()

    // Pre-create a user
    ;(userRepo.findByEmail as any).mockResolvedValueOnce(makeAdmin({ email: 'existing@test.com' }))

    await expect(
      useCase({
        requester: admin,
        email: 'existing@test.com',
        firstName: 'X',
        lastName: 'Y',
        role: 'employee',
        temporaryPassword: 'TempPass123',
      }),
    ).rejects.toThrow(Errors.emailExists())
  })
})
