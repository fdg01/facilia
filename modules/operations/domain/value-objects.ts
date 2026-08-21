// modules/operations/domain/value-objects.ts
export interface TimeWindow {
  readonly start: Date
  readonly end: Date
}

export interface DurationMin {
  readonly value: number
}

export function createDurationMin(minutes: number): DurationMin {
  if (minutes < 0) throw new Error('Duration cannot be negative')
  return { value: Math.round(minutes) }
}

export interface ContractNumber {
  readonly value: string
}

export function generateContractNumber(year: number, seq: number): string {
  return `CTR-${year}-${String(seq).padStart(6, '0')}`
}

export interface WorkOrderNumber {
  readonly value: string
}

export function generateWorkOrderNumber(year: number, seq: number): string {
  return `OT-${year}-${String(seq).padStart(6, '0')}`
}
