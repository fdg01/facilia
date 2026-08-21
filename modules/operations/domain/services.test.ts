// modules/operations/domain/services.test.ts
import { describe, it, expect } from 'vitest'
import {
  isValidOrderTransition,
  canAcceptAssignment,
  canRejectAssignment,
  canStartOrder,
  canCompleteOrder,
  calculateSla,
  calculateActualDurationMin,
  shouldEscalateToWithIncidents,
} from './services'
import type { WorkOrder, Assignment, ChecklistItem } from './entities'

function makeOrder(status: WorkOrder['status']): WorkOrder {
  return {
    id: 'order-1',
    scheduledServiceId: null,
    operationalPlanId: 'plan-1',
    organizationId: 'org-1',
    number: 'OT-2026-000001',
    title: 'Test',
    description: null,
    location: 'Test',
    scheduledDate: new Date('2026-01-15'),
    timeWindow: null,
    estimatedDurationMin: 60,
    status,
    startedAt: null,
    finishedAt: null,
    actualDurationMin: null,
    slaMet: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

function makeAssignment(overrides: Partial<Assignment> = {}): Assignment {
  return {
    id: 'assign-1',
    workOrderId: 'order-1',
    employeeId: 'emp-1',
    organizationId: 'org-1',
    crewRole: 'worker',
    status: 'pending',
    acceptedAt: null,
    rejectedAt: null,
    rejectionReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

function makeItem(overrides: Partial<ChecklistItem> = {}): ChecklistItem {
  return {
    id: 'item-1',
    checklistId: 'check-1',
    description: 'Test item',
    required: true,
    checked: false,
    checkedAt: null,
    sortOrder: 0,
    ...overrides,
  }
}

describe('isValidOrderTransition', () => {
  it('allows created → assigned', () => {
    expect(isValidOrderTransition('created', 'assigned')).toBe(true)
  })
  it('allows created → cancelled', () => {
    expect(isValidOrderTransition('created', 'cancelled')).toBe(true)
  })
  it('allows assigned → accepted', () => {
    expect(isValidOrderTransition('assigned', 'accepted')).toBe(true)
  })
  it('allows assigned → created', () => {
    expect(isValidOrderTransition('assigned', 'created')).toBe(true)
  })
  it('allows accepted → in_progress', () => {
    expect(isValidOrderTransition('accepted', 'in_progress')).toBe(true)
  })
  it('allows in_progress → completed', () => {
    expect(isValidOrderTransition('in_progress', 'completed')).toBe(true)
  })
  it('allows in_progress → with_incidents', () => {
    expect(isValidOrderTransition('in_progress', 'with_incidents')).toBe(true)
  })
  it('allows with_incidents → in_progress', () => {
    expect(isValidOrderTransition('with_incidents', 'in_progress')).toBe(true)
  })
  it('allows completed → validated', () => {
    expect(isValidOrderTransition('completed', 'validated')).toBe(true)
  })
  it('denies created → in_progress (skip assigned)', () => {
    expect(isValidOrderTransition('created', 'in_progress')).toBe(false)
  })
  it('denies validated → anything (terminal)', () => {
    expect(isValidOrderTransition('validated', 'completed')).toBe(false)
  })
  it('denies cancelled → anything (terminal)', () => {
    expect(isValidOrderTransition('cancelled', 'created')).toBe(false)
  })
})

describe('canAcceptAssignment', () => {
  it('allows correct employee with pending status', () => {
    expect(canAcceptAssignment('emp-1', makeAssignment({ employeeId: 'emp-1', status: 'pending' }))).toBe(true)
  })
  it('denies wrong employee', () => {
    expect(canAcceptAssignment('emp-2', makeAssignment({ employeeId: 'emp-1', status: 'pending' }))).toBe(false)
  })
  it('denies non-pending status', () => {
    expect(canAcceptAssignment('emp-1', makeAssignment({ employeeId: 'emp-1', status: 'accepted' }))).toBe(false)
  })
})

describe('canRejectAssignment', () => {
  it('allows correct employee with pending status', () => {
    expect(canRejectAssignment('emp-1', makeAssignment({ employeeId: 'emp-1', status: 'pending' }))).toBe(true)
  })
  it('denies wrong employee', () => {
    expect(canRejectAssignment('emp-2', makeAssignment({ employeeId: 'emp-1', status: 'pending' }))).toBe(false)
  })
})

describe('canStartOrder', () => {
  it('allows when order accepted and employee has accepted assignment', () => {
    const order = makeOrder('accepted')
    const assignments = [makeAssignment({ employeeId: 'emp-1', status: 'accepted', workOrderId: 'order-1' })]
    expect(canStartOrder('emp-1', order, assignments)).toBe(true)
  })
  it('denies when order not accepted', () => {
    const order = makeOrder('created')
    const assignments = [makeAssignment({ employeeId: 'emp-1', status: 'accepted' })]
    expect(canStartOrder('emp-1', order, assignments)).toBe(false)
  })
  it('denies when employee has no accepted assignment', () => {
    const order = makeOrder('accepted')
    const assignments = [makeAssignment({ employeeId: 'emp-2', status: 'accepted' })]
    expect(canStartOrder('emp-1', order, assignments)).toBe(false)
  })
  it('denies when employee assignment is pending (not accepted)', () => {
    const order = makeOrder('accepted')
    const assignments = [makeAssignment({ employeeId: 'emp-1', status: 'pending' })]
    expect(canStartOrder('emp-1', order, assignments)).toBe(false)
  })
})

describe('canCompleteOrder', () => {
  it('allows in_progress with all required items checked', () => {
    const order = makeOrder('in_progress')
    const items = [makeItem({ required: true, checked: true })]
    expect(canCompleteOrder(order, items)).toBe(true)
  })
  it('denies in_progress with unchecked required item', () => {
    const order = makeOrder('in_progress')
    const items = [makeItem({ required: true, checked: false })]
    expect(canCompleteOrder(order, items)).toBe(false)
  })
  it('allows with_incidents status', () => {
    const order = makeOrder('with_incidents')
    const items = [makeItem({ required: true, checked: true })]
    expect(canCompleteOrder(order, items)).toBe(true)
  })
  it('denies completed status (already completed)', () => {
    const order = makeOrder('completed')
    const items = [makeItem({ required: true, checked: true })]
    expect(canCompleteOrder(order, items)).toBe(false)
  })
  it('allows unchecked non-required items', () => {
    const order = makeOrder('in_progress')
    const items = [makeItem({ required: false, checked: false }), makeItem({ id: 'item-2', required: true, checked: true })]
    expect(canCompleteOrder(order, items)).toBe(true)
  })
})

describe('calculateSla', () => {
  it('returns true when actual <= estimated', () => {
    expect(calculateSla(50, 60, null, null)).toBe(true)
  })
  it('returns true when actual > estimated but within time window', () => {
    const window = { start: new Date('2026-01-15T09:00:00'), end: new Date('2026-01-15T11:00:00') }
    const finishedAt = new Date('2026-01-15T10:30:00')
    expect(calculateSla(70, 60, window, finishedAt)).toBe(true)
  })
  it('returns false when actual > estimated and outside time window', () => {
    const window = { start: new Date('2026-01-15T09:00:00'), end: new Date('2026-01-15T11:00:00') }
    const finishedAt = new Date('2026-01-15T12:00:00')
    expect(calculateSla(70, 60, window, finishedAt)).toBe(false)
  })
  it('returns false when actual > estimated and no time window', () => {
    expect(calculateSla(70, 60, null, null)).toBe(false)
  })
})

describe('calculateActualDurationMin', () => {
  it('calculates minutes between start and end', () => {
    const start = new Date('2026-01-15T09:00:00')
    const end = new Date('2026-01-15T10:30:00')
    expect(calculateActualDurationMin(start, end)).toBe(90)
  })
  it('rounds 30 seconds to 1 minute (rounds up)', () => {
    const start = new Date('2026-01-15T09:00:00')
    const end = new Date('2026-01-15T09:00:30')
    expect(calculateActualDurationMin(start, end)).toBe(1)
  })

  it('rounds 90 seconds to 2 minutes', () => {
    const start = new Date('2026-01-15T09:00:00')
    const end = new Date('2026-01-15T09:01:30')
    expect(calculateActualDurationMin(start, end)).toBe(2)
  })
})

describe('shouldEscalateToWithIncidents', () => {
  it('returns true for high severity', () => {
    expect(shouldEscalateToWithIncidents('high')).toBe(true)
  })
  it('returns true for critical severity', () => {
    expect(shouldEscalateToWithIncidents('critical')).toBe(true)
  })
  it('returns false for low severity', () => {
    expect(shouldEscalateToWithIncidents('low')).toBe(false)
  })
  it('returns false for medium severity', () => {
    expect(shouldEscalateToWithIncidents('medium')).toBe(false)
  })
})
