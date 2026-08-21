// modules/quoter/domain/services.test.ts
import { describe, it, expect } from 'vitest'
import { canEditDag, canViewCommercialPanel, canChangeLeadStatus, canAssociateOrganization, generateLeadNumber } from './services'
import type { User } from '../../identity/domain/entities'
import type { Lead } from './entities'

function makeUser(role: User['role']): User {
  return {
    id: 'u1', authId: 'a1', email: 'test@test.com', firstName: 'Test', lastName: 'User',
    role, status: 'active', organizationId: null, phone: null, mustChangePassword: false,
    createdAt: new Date(), updatedAt: new Date(),
  }
}

function makeLead(status: Lead['status']): Lead {
  return {
    id: 'l1', number: 'FAC-2026-000001', status, name: 'Test', email: 't@t.com',
    phone: '12345678', organizationId: null, userId: null, totalMonthly: 100,
    totalPerVisit: 10, parametersSnapshot: null, dagVersion: null,
    giftIncluded: true, giftDescription: null, mainLine: 'clean', notes: null,
    createdAt: new Date(), updatedAt: new Date(),
  }
}

describe('canEditDag', () => {
  it('admin can edit', () => expect(canEditDag(makeUser('admin'))).toBe(true))
  it('employee cannot edit', () => expect(canEditDag(makeUser('employee'))).toBe(false))
  it('client cannot edit', () => expect(canEditDag(makeUser('client'))).toBe(false))
})

describe('canViewCommercialPanel', () => {
  it('admin can view', () => expect(canViewCommercialPanel(makeUser('admin'))).toBe(true))
  it('employee cannot view', () => expect(canViewCommercialPanel(makeUser('employee'))).toBe(false))
})

describe('canChangeLeadStatus', () => {
  it('admin: sent → accepted is valid', () => {
    expect(canChangeLeadStatus(makeUser('admin'), makeLead('sent'), 'accepted')).toBe(true)
  })
  it('admin: sent → lost is valid', () => {
    expect(canChangeLeadStatus(makeUser('admin'), makeLead('sent'), 'lost')).toBe(true)
  })
  it('admin: sent → confirmed is invalid', () => {
    expect(canChangeLeadStatus(makeUser('admin'), makeLead('sent'), 'confirmed')).toBe(false)
  })
  it('admin: accepted → confirmed is valid', () => {
    expect(canChangeLeadStatus(makeUser('admin'), makeLead('accepted'), 'confirmed')).toBe(true)
  })
  it('admin: lost → sent is valid (reopen)', () => {
    expect(canChangeLeadStatus(makeUser('admin'), makeLead('lost'), 'sent')).toBe(true)
  })
  it('admin: confirmed → anything is invalid', () => {
    expect(canChangeLeadStatus(makeUser('admin'), makeLead('confirmed'), 'sent')).toBe(false)
  })
  it('employee cannot change status', () => {
    expect(canChangeLeadStatus(makeUser('employee'), makeLead('sent'), 'accepted')).toBe(false)
  })
})

describe('canAssociateOrganization', () => {
  it('admin can', () => expect(canAssociateOrganization(makeUser('admin'))).toBe(true))
  it('employee cannot', () => expect(canAssociateOrganization(makeUser('employee'))).toBe(false))
})

describe('generateLeadNumber', () => {
  it('formats with padding', () => {
    expect(generateLeadNumber(2026, 1)).toBe('FAC-2026-000001')
    expect(generateLeadNumber(2026, 42)).toBe('FAC-2026-000042')
    expect(generateLeadNumber(2026, 999999)).toBe('FAC-2026-999999')
  })
})
