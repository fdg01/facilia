// modules/portal/domain/portal-services.test.ts
import { describe, it, expect } from 'vitest'
import {
  validateNewRequest,
  canClientReadRequest,
  isCommunicationUnread,
  filterAuthorizedEvidence,
} from './portal-services'
import type { ClientRequest } from './portal-entities'

describe('validateNewRequest', () => {
  it('validates a correct request', () => {
    const result = validateNewRequest({
      type: 'extra_service',
      subject: 'Necesito limpieza extra',
      description: 'Necesito una limpieza extra para el evento del viernes',
    })
    expect(result.valid).toBe(true)
  })

  it('rejects invalid type', () => {
    const result = validateNewRequest({
      type: 'invalid',
      subject: 'Asunto válido',
      description: 'Descripción suficientemente larga',
    })
    expect(result.valid).toBe(false)
  })

  it('rejects short subject', () => {
    const result = validateNewRequest({
      type: 'inquiry',
      subject: 'abc',
      description: 'Descripción suficientemente larga',
    })
    expect(result.valid).toBe(false)
  })

  it('rejects long subject (>200)', () => {
    const result = validateNewRequest({
      type: 'inquiry',
      subject: 'a'.repeat(201),
      description: 'Descripción suficientemente larga',
    })
    expect(result.valid).toBe(false)
  })

  it('rejects short description (<10)', () => {
    const result = validateNewRequest({
      type: 'inquiry',
      subject: 'Asunto válido',
      description: 'corta',
    })
    expect(result.valid).toBe(false)
  })

  it('rejects long description (>2000)', () => {
    const result = validateNewRequest({
      type: 'inquiry',
      subject: 'Asunto válido',
      description: 'a'.repeat(2001),
    })
    expect(result.valid).toBe(false)
  })

  it('rejects invalid priority', () => {
    const result = validateNewRequest({
      type: 'inquiry',
      subject: 'Asunto válido',
      description: 'Descripción suficientemente larga',
      priority: 'invalid',
    })
    expect(result.valid).toBe(false)
  })

  it('accepts valid priority', () => {
    const result = validateNewRequest({
      type: 'inquiry',
      subject: 'Asunto válido',
      description: 'Descripción suficientemente larga',
      priority: 'urgent',
    })
    expect(result.valid).toBe(true)
  })
})

describe('canClientReadRequest', () => {
  function makeRequest(organizationId: string): ClientRequest {
    return {
      id: 'r1',
      organizationId,
      createdBy: 'u1',
      type: 'inquiry',
      subject: 'Test',
      description: 'Test description',
      status: 'open',
      priority: 'normal',
      assignedTo: null,
      resolution: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      resolvedAt: null,
    }
  }

  it('allows when organization matches', () => {
    expect(canClientReadRequest(makeRequest('org-1'), 'org-1')).toBe(true)
  })

  it('denies when organization differs', () => {
    expect(canClientReadRequest(makeRequest('org-1'), 'org-2')).toBe(false)
  })
})

describe('isCommunicationUnread', () => {
  it('returns true when read is false', () => {
    expect(isCommunicationUnread({ read: false })).toBe(true)
  })
  it('returns false when read is true', () => {
    expect(isCommunicationUnread({ read: true })).toBe(false)
  })
})

describe('filterAuthorizedEvidence', () => {
  it('filters only authorized evidence for the organization', () => {
    const evidence = [
      { id: 'e1', organizationId: 'org-1' },
      { id: 'e2', organizationId: 'org-1' },
      { id: 'e3', organizationId: 'org-1' },
    ]
    const visibility = [
      { evidenceId: 'e1', organizationId: 'org-1' },
      { evidenceId: 'e3', organizationId: 'org-1' },
      { evidenceId: 'e2', organizationId: 'org-2' },
    ]
    const result = filterAuthorizedEvidence(evidence, visibility, 'org-1')
    expect(result).toHaveLength(2)
    expect(result[0].id).toBe('e1')
    expect(result[1].id).toBe('e3')
  })

  it('returns empty when no visibility records', () => {
    const evidence = [{ id: 'e1', organizationId: 'org-1' }]
    const result = filterAuthorizedEvidence(evidence, [], 'org-1')
    expect(result).toHaveLength(0)
  })

  it('returns empty when visibility is for another organization', () => {
    const evidence = [{ id: 'e1', organizationId: 'org-1' }]
    const visibility = [{ evidenceId: 'e1', organizationId: 'org-2' }]
    const result = filterAuthorizedEvidence(evidence, visibility, 'org-1')
    expect(result).toHaveLength(0)
  })
})
