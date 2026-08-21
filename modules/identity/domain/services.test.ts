// modules/identity/domain/services.test.ts
import { describe, it, expect } from 'vitest'
import {
  canDeactivate,
  canChangeRole,
  canRemoveAdminRole,
  isClient,
  canAccessOrganization,
  validateOrganizationAssignment,
  canCreateUser,
  canChangeOtherPassword,
  canChangeOwnPassword,
} from './services'
import type { User } from './entities'

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

describe('canDeactivate', () => {
  it('allows admin to deactivate another user', () => {
    const admin = makeUser({ id: 'admin-1', role: 'admin' })
    const target = makeUser({ id: 'user-2', role: 'employee' })
    expect(canDeactivate(admin, target)).toBe(true)
  })

  it('prevents admin from deactivating themselves', () => {
    const admin = makeUser({ id: 'admin-1', role: 'admin' })
    expect(canDeactivate(admin, admin)).toBe(false)
  })

  it('prevents employee from deactivating anyone', () => {
    const employee = makeUser({ id: 'emp-1', role: 'employee' })
    const target = makeUser({ id: 'user-2', role: 'client' })
    expect(canDeactivate(employee, target)).toBe(false)
  })

  it('prevents client from deactivating anyone', () => {
    const client = makeUser({ id: 'client-1', role: 'client', organizationId: 'org-1' })
    const target = makeUser({ id: 'user-2', role: 'employee' })
    expect(canDeactivate(client, target)).toBe(false)
  })
})

describe('canChangeRole', () => {
  it('allows admin to change roles', () => {
    const admin = makeUser({ role: 'admin' })
    expect(canChangeRole(admin, 'employee')).toBe(true)
  })

  it('prevents employee from changing roles', () => {
    const employee = makeUser({ role: 'employee' })
    expect(canChangeRole(employee, 'admin')).toBe(false)
  })
})

describe('canRemoveAdminRole', () => {
  it('allows admin to change another admin to employee', () => {
    const admin = makeUser({ id: 'admin-1', role: 'admin' })
    const target = makeUser({ id: 'admin-2', role: 'admin' })
    expect(canRemoveAdminRole(admin, target, 'employee')).toBe(true)
  })

  it('prevents admin from removing their own admin role', () => {
    const admin = makeUser({ id: 'admin-1', role: 'admin' })
    expect(canRemoveAdminRole(admin, admin, 'employee')).toBe(false)
  })

  it('allows admin to keep their own admin role', () => {
    const admin = makeUser({ id: 'admin-1', role: 'admin' })
    expect(canRemoveAdminRole(admin, admin, 'admin')).toBe(true)
  })

  it('prevents employee from removing admin role', () => {
    const employee = makeUser({ id: 'emp-1', role: 'employee' })
    const target = makeUser({ id: 'admin-1', role: 'admin' })
    expect(canRemoveAdminRole(employee, target, 'employee')).toBe(false)
  })
})

describe('isClient', () => {
  it('returns true for client', () => {
    const client = makeUser({ role: 'client', organizationId: 'org-1' })
    expect(isClient(client)).toBe(true)
  })

  it('returns false for admin', () => {
    const admin = makeUser({ role: 'admin' })
    expect(isClient(admin)).toBe(false)
  })

  it('returns false for employee', () => {
    const employee = makeUser({ role: 'employee' })
    expect(isClient(employee)).toBe(false)
  })
})

describe('canAccessOrganization', () => {
  it('allows admin to access any organization', () => {
    const admin = makeUser({ role: 'admin' })
    expect(canAccessOrganization(admin, 'org-1')).toBe(true)
    expect(canAccessOrganization(admin, 'org-2')).toBe(true)
  })

  it('allows client to access their own organization only', () => {
    const client = makeUser({ role: 'client', organizationId: 'org-1' })
    expect(canAccessOrganization(client, 'org-1')).toBe(true)
    expect(canAccessOrganization(client, 'org-2')).toBe(false)
  })

  it('prevents employee from accessing any organization', () => {
    const employee = makeUser({ role: 'employee' })
    expect(canAccessOrganization(employee, 'org-1')).toBe(false)
  })
})

describe('validateOrganizationAssignment', () => {
  it('requires organization for client', () => {
    expect(validateOrganizationAssignment('client', 'org-1')).toBe(true)
    expect(validateOrganizationAssignment('client', null)).toBe(false)
  })

  it('forbids organization for admin', () => {
    expect(validateOrganizationAssignment('admin', null)).toBe(true)
    expect(validateOrganizationAssignment('admin', 'org-1')).toBe(false)
  })

  it('forbids organization for employee', () => {
    expect(validateOrganizationAssignment('employee', null)).toBe(true)
    expect(validateOrganizationAssignment('employee', 'org-1')).toBe(false)
  })
})

describe('canCreateUser', () => {
  it('allows admin to create users', () => {
    const admin = makeUser({ role: 'admin' })
    expect(canCreateUser(admin)).toBe(true)
  })

  it('prevents employee from creating users', () => {
    const employee = makeUser({ role: 'employee' })
    expect(canCreateUser(employee)).toBe(false)
  })

  it('prevents client from creating users', () => {
    const client = makeUser({ role: 'client', organizationId: 'org-1' })
    expect(canCreateUser(client)).toBe(false)
  })
})

describe('canChangeOtherPassword', () => {
  it('allows admin to change any user password', () => {
    const admin = makeUser({ id: 'admin-1', role: 'admin' })
    const target = makeUser({ id: 'user-2', role: 'employee' })
    expect(canChangeOtherPassword(admin, target)).toBe(true)
  })

  it('prevents employee from changing other password', () => {
    const employee = makeUser({ id: 'emp-1', role: 'employee' })
    const target = makeUser({ id: 'user-2', role: 'client' })
    expect(canChangeOtherPassword(employee, target)).toBe(false)
  })
})

describe('canChangeOwnPassword', () => {
  it('allows user to change own password', () => {
    const user = makeUser({ id: 'user-1', role: 'employee' })
    expect(canChangeOwnPassword(user, user)).toBe(true)
  })

  it('prevents user from changing another user password', () => {
    const user = makeUser({ id: 'user-1', role: 'employee' })
    const other = makeUser({ id: 'user-2', role: 'employee' })
    expect(canChangeOwnPassword(user, other)).toBe(false)
  })
})
