// modules/operations/domain/calendar.test.ts
import { describe, it, expect } from 'vitest'
import { generateCalendar } from './calendar'
import type { PlanActivity, Holiday } from './entities'

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function makeActivity(overrides: Partial<PlanActivity> = {}): PlanActivity {
  return {
    activity: 'Limpieza de oficinas',
    description: 'Limpieza general',
    frequency: 'daily',
    cronRule: null,
    location: 'Oficina central',
    estimatedDurationMin: 120,
    ...overrides,
  }
}

function makeHoliday(overrides: Partial<Holiday> = {}): Holiday {
  return {
    id: 'holiday-1',
    date: new Date(2026, 0, 1),
    description: 'Año Nuevo',
    scope: 'national',
    organizationId: null,
    createdAt: new Date(),
    ...overrides,
  }
}

describe('generateCalendar', () => {
  it('generates daily services excluding holidays', () => {
    const activity = makeActivity({ frequency: 'daily' })
    const holidays = [makeHoliday({ id: 'h1', date: new Date(2026, 0, 2) })]
    const result = generateCalendar(activity, new Date(2026, 0, 1), new Date(2026, 0, 3), holidays, 'org-1')
    expect(result).toHaveLength(2) // Jan 1 and Jan 3 (Jan 2 is holiday)
    expect(formatDate(result[0].scheduledDate)).toBe('2026-01-01')
    expect(formatDate(result[1].scheduledDate)).toBe('2026-01-03')
  })

  it('generates weekly services', () => {
    const activity = makeActivity({ frequency: 'weekly' })
    const result = generateCalendar(activity, new Date(2026, 0, 1), new Date(2026, 0, 29), [], 'org-1')
    expect(result).toHaveLength(5) // Jan 1, 8, 15, 22, 29
  })

  it('generates biweekly services', () => {
    const activity = makeActivity({ frequency: 'biweekly' })
    const result = generateCalendar(activity, new Date(2026, 0, 1), new Date(2026, 0, 29), [], 'org-1')
    expect(result).toHaveLength(3) // Jan 1, 15, 29
  })

  it('generates monthly services', () => {
    const activity = makeActivity({ frequency: 'monthly' })
    const result = generateCalendar(activity, new Date(2026, 0, 15), new Date(2026, 3, 15), [], 'org-1')
    expect(result).toHaveLength(4) // Jan 15, Feb 15, Mar 15, Apr 15
  })

  it('generates first_friday_of_month special rule', () => {
    const activity = makeActivity({ frequency: 'special_rule', cronRule: 'first_friday_of_month' })
    const result = generateCalendar(activity, new Date(2026, 0, 1), new Date(2026, 2, 31), [], 'org-1')
    expect(result).toHaveLength(3) // First Friday of Jan, Feb, Mar 2026
    expect(formatDate(result[0].scheduledDate)).toBe('2026-01-02')
    expect(formatDate(result[1].scheduledDate)).toBe('2026-02-06')
    expect(formatDate(result[2].scheduledDate)).toBe('2026-03-06')
  })

  it('excludes organization-specific holidays only for that organization', () => {
    const activity = makeActivity({ frequency: 'daily' })
    const holidays = [
      makeHoliday({ id: 'h1', date: new Date(2026, 0, 2), scope: 'organization', organizationId: 'org-1' }),
      makeHoliday({ id: 'h2', date: new Date(2026, 0, 3), scope: 'organization', organizationId: 'org-2' }),
    ]
    const result = generateCalendar(activity, new Date(2026, 0, 1), new Date(2026, 0, 4), holidays, 'org-1')
    expect(result).toHaveLength(3) // Jan 1, 3, 4
  })

  it('excludes national and departmental holidays for all organizations', () => {
    const activity = makeActivity({ frequency: 'daily' })
    const holidays = [
      makeHoliday({ id: 'h1', date: new Date(2026, 0, 2), scope: 'national' }),
      makeHoliday({ id: 'h2', date: new Date(2026, 0, 3), scope: 'departmental' }),
    ]
    const result = generateCalendar(activity, new Date(2026, 0, 1), new Date(2026, 0, 4), holidays, 'org-1')
    expect(result).toHaveLength(2) // Jan 1, 4
  })

  it('returns empty for unknown special rule', () => {
    const activity = makeActivity({ frequency: 'special_rule', cronRule: 'unknown_rule' })
    const result = generateCalendar(activity, new Date(2026, 0, 1), new Date(2026, 0, 31), [], 'org-1')
    expect(result).toHaveLength(0)
  })

  it('returns empty for special_rule with null cronRule', () => {
    const activity = makeActivity({ frequency: 'special_rule', cronRule: null })
    const result = generateCalendar(activity, new Date(2026, 0, 1), new Date(2026, 0, 31), [], 'org-1')
    expect(result).toHaveLength(0)
  })
})
