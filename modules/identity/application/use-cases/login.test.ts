// modules/identity/application/use-cases/login.test.ts
import { describe, it, expect, vi } from 'vitest'
import { createLoginUseCase } from './login'
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

function makeMockRepos(userOverrides: Partial<User> = {}) {
  const user = makeUser(userOverrides)
  const userRepo: Pick<UserRepository, 'findByAuthId'> = {
    async findByAuthId(authId: string) {
      if (authId === user.authId) return user
      return null
    },
  }
  const authRepo: Pick<AuthRepository, 'verifyCredentials'> = {
    async verifyCredentials(email: string, _password: string) {
      if (email === user.email) return user.authId
      return null
    },
  }
  return { user, userRepo: userRepo as UserRepository, authRepo: authRepo as AuthRepository }
}

describe('login use case', () => {
  it('returns session on valid credentials', async () => {
    const { userRepo, authRepo } = makeMockRepos()
    const login = createLoginUseCase(userRepo, authRepo)

    const result = await login({ email: 'test@test.com', password: 'password123' })

    expect(result.session.email).toBe('test@test.com')
    expect(result.session.role).toBe('admin')
    expect(result.mustChangePassword).toBe(false)
  })

  it('throws invalidCredentials on wrong password', async () => {
    const { userRepo } = makeMockRepos()
    const authRepo: Pick<AuthRepository, 'verifyCredentials'> = {
      async verifyCredentials() {
        return null
      },
    }
    const login = createLoginUseCase(userRepo, authRepo as AuthRepository)

    await expect(
      login({ email: 'test@test.com', password: 'wrong' }),
    ).rejects.toThrow(Errors.invalidCredentials())
  })

  it('throws invalidCredentials when user not found after auth', async () => {
    const userRepo: Pick<UserRepository, 'findByAuthId'> = {
      async findByAuthId() {
        return null
      },
    }
    const authRepo: Pick<AuthRepository, 'verifyCredentials'> = {
      async verifyCredentials() {
        return 'auth-1'
      },
    }
    const login = createLoginUseCase(userRepo as UserRepository, authRepo as AuthRepository)

    await expect(
      login({ email: 'test@test.com', password: 'password123' }),
    ).rejects.toThrow(Errors.invalidCredentials())
  })

  it('throws userInactive when user is inactive', async () => {
    const { userRepo, authRepo } = makeMockRepos({ status: 'inactive' })
    const login = createLoginUseCase(userRepo, authRepo)

    await expect(
      login({ email: 'test@test.com', password: 'password123' }),
    ).rejects.toThrow(Errors.userInactive())
  })

  it('returns mustChangePassword=true when flag is set', async () => {
    const { userRepo, authRepo } = makeMockRepos({ mustChangePassword: true })
    const login = createLoginUseCase(userRepo, authRepo)

    const result = await login({ email: 'test@test.com', password: 'password123' })

    expect(result.mustChangePassword).toBe(true)
    expect(result.session.mustChangePassword).toBe(true)
  })
})
