// modules/operations/domain/services.ts
import type { WorkOrder, Assignment, WorkOrderStatus, ChecklistItem, IncidentSeverity } from './entities'

export function isValidOrderTransition(current: WorkOrderStatus, target: WorkOrderStatus): boolean {
  const transitions: Record<WorkOrderStatus, WorkOrderStatus[]> = {
    created: ['assigned', 'cancelled'],
    assigned: ['accepted', 'created', 'cancelled'],
    accepted: ['in_progress', 'cancelled'],
    in_progress: ['completed', 'with_incidents', 'cancelled'],
    with_incidents: ['in_progress', 'cancelled'],
    completed: ['validated'],
    validated: [],
    cancelled: [],
  }
  return transitions[current].includes(target)
}

export function canAcceptAssignment(employeeId: string, assignment: Assignment): boolean {
  return assignment.employeeId === employeeId && assignment.status === 'pending'
}

export function canRejectAssignment(employeeId: string, assignment: Assignment): boolean {
  return assignment.employeeId === employeeId && assignment.status === 'pending'
}

export function canStartOrder(employeeId: string, order: WorkOrder, assignments: Assignment[]): boolean {
  if (order.status !== 'accepted') return false
  return assignments.some(
    (a) => a.employeeId === employeeId && a.status === 'accepted' && a.workOrderId === order.id,
  )
}

export function canCompleteOrder(order: WorkOrder, checklistItems: ChecklistItem[]): boolean {
  if (order.status !== 'in_progress' && order.status !== 'with_incidents') return false
  const uncheckedRequired = checklistItems.filter((i) => i.required && !i.checked)
  return uncheckedRequired.length === 0
}

export function calculateSla(
  actualDurationMin: number,
  estimatedDurationMin: number,
  timeWindow: { start: Date; end: Date } | null,
  finishedAt: Date | null,
): boolean {
  if (actualDurationMin <= estimatedDurationMin) return true
  if (timeWindow && finishedAt && finishedAt <= timeWindow.end) return true
  return false
}

export function calculateActualDurationMin(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / 60000)
}

export function shouldEscalateToWithIncidents(severity: IncidentSeverity): boolean {
  return severity === 'high' || severity === 'critical'
}
