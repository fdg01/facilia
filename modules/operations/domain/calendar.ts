// modules/operations/domain/calendar.ts
import type { ServiceFrequency, PlanActivity, Holiday } from './entities'

function formatLocalDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function toLocalMidnight(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export interface GeneratedService {
  readonly activity: string
  readonly location: string | null
  readonly frequency: ServiceFrequency
  readonly cronRule: string | null
  readonly scheduledDate: Date
  readonly estimatedDurationMin: number
}

/**
 * Generates scheduled service dates for a given activity within a date range,
 * excluding applicable holidays.
 */
export function generateCalendar(
  activity: PlanActivity,
  fromDate: Date,
  toDate: Date,
  holidays: Holiday[],
  organizationId: string,
): GeneratedService[] {
  const applicableHolidays = holidays.filter(
    (h) => h.scope === 'national'
      || h.scope === 'departmental'
      || (h.scope === 'organization' && h.organizationId === organizationId),
  )

  const holidayDates = new Set(
    applicableHolidays.map((h) => formatLocalDate(h.date)),
  )

  const dates = generateDates(activity.frequency, activity.cronRule, fromDate, toDate)
  const filtered = dates.filter((d) => {
    const dateStr = formatLocalDate(d)
    return !holidayDates.has(dateStr)
  })

  return filtered.map((date) => ({
    activity: activity.activity,
    location: activity.location,
    frequency: activity.frequency,
    cronRule: activity.cronRule,
    scheduledDate: date,
    estimatedDurationMin: activity.estimatedDurationMin,
  }))
}

function generateDates(
  frequency: ServiceFrequency,
  cronRule: string | null,
  fromDate: Date,
  toDate: Date,
): Date[] {
  switch (frequency) {
    case 'daily':
      return eachDay(fromDate, toDate)
    case 'weekly':
      return eachWeek(fromDate, toDate)
    case 'biweekly':
      return eachBiweekly(fromDate, toDate)
    case 'monthly':
      return eachMonth(fromDate, toDate)
    case 'special_rule':
      return specialRule(cronRule, fromDate, toDate)
    default:
      return []
  }
}

function eachDay(from: Date, to: Date): Date[] {
  const dates: Date[] = []
  const current = toLocalMidnight(from)
  const end = toLocalMidnight(to)
  while (current <= end) {
    dates.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }
  return dates
}

function eachWeek(from: Date, to: Date): Date[] {
  const dates: Date[] = []
  const current = toLocalMidnight(from)
  const end = toLocalMidnight(to)
  while (current <= end) {
    dates.push(new Date(current))
    current.setDate(current.getDate() + 7)
  }
  return dates
}

function eachBiweekly(from: Date, to: Date): Date[] {
  const dates: Date[] = []
  const current = toLocalMidnight(from)
  const end = toLocalMidnight(to)
  while (current <= end) {
    dates.push(new Date(current))
    current.setDate(current.getDate() + 14)
  }
  return dates
}

function eachMonth(from: Date, to: Date): Date[] {
  const dates: Date[] = []
  const current = toLocalMidnight(from)
  const end = toLocalMidnight(to)
  while (current <= end) {
    dates.push(new Date(current))
    current.setMonth(current.getMonth() + 1)
  }
  return dates
}

function specialRule(cronRule: string | null, from: Date, to: Date): Date[] {
  if (!cronRule) return []
  if (cronRule === 'first_friday_of_month') {
    return firstFridayOfMonth(from, to)
  }
  // Unknown special rule → no dates
  return []
}

function firstFridayOfMonth(from: Date, to: Date): Date[] {
  const dates: Date[] = []
  const current = new Date(from.getFullYear(), from.getMonth(), 1)
  const end = new Date(to)
  end.setHours(0, 0, 0, 0)
  while (current <= end) {
    // Find first Friday of current month
    const firstDay = new Date(current.getFullYear(), current.getMonth(), 1)
    const dayOfWeek = firstDay.getDay() // 0=Sun, 5=Fri
    const daysUntilFriday = (5 - dayOfWeek + 7) % 7
    const firstFriday = new Date(current.getFullYear(), current.getMonth(), 1 + daysUntilFriday)
    if (firstFriday >= from && firstFriday <= end) {
      dates.push(firstFriday)
    }
    current.setMonth(current.getMonth() + 1)
  }
  return dates
}
