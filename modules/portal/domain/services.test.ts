// modules/portal/domain/services.test.ts
import { describe, it, expect } from 'vitest'
import { canViewLead, isReadOnly, formatStatus } from './services'
import type { User } from '../../identity/domain/entities'

function makeClient(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    authId: 'auth-1',
    email: 'client@test.com',
    firstName: 'Test',
    lastName: 'Client',
    phone: '+59899999999',
    role: 'client',
    status: 'active',
    organizationId: 'org-1',
    mustChangePassword: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

describe('canViewLead', () => {
  it('allows client to view lead of own organization', () => {
    const client = makeClient()
    expect(canViewLead(client, { organizationId: 'org-1' })).toBe(true)
  })

  it('denies client to view lead of another organization', () => {
    const client = makeClient()
    expect(canViewLead(client, { organizationId: 'org-2' })).toBe(false)
  })

  it('denies admin (not client role)', () => {
    const admin = makeClient({ role: 'admin' })
    expect(canViewLead(admin, { organizationId: 'org-1' })).toBe(false)
  })

  it('denies employee (not client role)', () => {
    const employee = makeClient({ role: 'employee' })
    expect(canViewLead(employee, { organizationId: 'org-1' })).toBe(false)
  })

  it('denies inactive client', () => {
    const inactive = makeClient({ status: 'inactive' })
    expect(canViewLead(inactive, { organizationId: 'org-1' })).toBe(false)
  })

  it('denies if lead has null organizationId', () => {
    const client = makeClient()
    expect(canViewLead(client, { organizationId: null })).toBe(false)
  })
})

describe('isReadOnly', () => {
  it('returns false for draft', () => {
    expect(isReadOnly('draft')).toBe(false)
  })

  it('returns true for sent', () => {
    expect(isReadOnly('sent')).toBe(true)
  })

  it('returns true for accepted', () => {
    expect(isReadOnly('accepted')).toBe(true)
  })

  it('returns true for lost', () => {
    expect(isReadOnly('lost')).toBe(true)
  })

  it('returns true for confirmed', () => {
    expect(isReadOnly('confirmed')).toBe(true)
  })
})

describe('formatStatus', () => {
  it('formats draft with navy color', () => {
    expect(formatStatus('draft')).toEqual({ label: 'Borrador', color: 'navy' })
  })

  it('formats sent with orange color', () => {
    expect(formatStatus('sent')).toEqual({ label: 'Enviado', color: 'orange' })
  })

  it('formats accepted with blue color', () => {
    expect(formatStatus('accepted')).toEqual({ label: 'Aceptado', color: 'blue' })
  })

  it('formats lost with red color', () => {
    expect(formatStatus('lost')).toEqual({ label: 'Perdido', color: 'red' })
  })

  it('formats confirmed with green color', () => {
    expect(formatStatus('confirmed')).toEqual({ label: 'Confirmado', color: 'green' })
  })
})
