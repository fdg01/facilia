// modules/operations/application/use-cases/complete-order.ts
import type {
  WorkOrderRepository, AssignmentRepository, ChecklistRepository, ExecutionRepository,
} from '../../domain/repositories'
import type { WorkOrder } from '../../domain/entities'
import { canCompleteOrder, calculateActualDurationMin, isValidOrderTransition } from '../../domain/services'

export function createCompleteOrderUseCase(
  orderRepo: WorkOrderRepository,
  assignRepo: AssignmentRepository,
  checklistRepo: ChecklistRepository,
  executionRepo: ExecutionRepository,
) {
  return async function completeOrder(
    orderId: string,
    employeeId: string,
    observations?: string,
  ): Promise<WorkOrder> {
    const order = await orderRepo.findById(orderId)
    if (!order) throw new Error('Work order not found')

    // Validate employee is assigned
    const assignments = await assignRepo.findByWorkOrder(orderId)
    const isAssigned = assignments.some(
      (a) => a.employeeId === employeeId && (a.status === 'accepted' || a.status === 'pending'),
    )
    if (!isAssigned) throw new Error('FORBIDDEN')

    // Validate checklists
    const checklistItems = await checklistRepo.listItemsByWorkOrder(orderId)
    if (!canCompleteOrder(order, checklistItems)) {
      throw new Error('CHECKLIST_INCOMPLETE')
    }

    if (!isValidOrderTransition(order.status, 'completed')) {
      throw new Error(`Cannot complete order in status ${order.status}`)
    }

    const now = new Date()
    const startedAt = order.startedAt ?? now
    const actualDuration = calculateActualDurationMin(startedAt, now)

    const updatedOrder = await orderRepo.updateStatus(orderId, 'completed')
    const finalOrder = await orderRepo.updateTiming(orderId, {
      finishedAt: now,
      actualDurationMin: actualDuration,
    })

    // Update execution
    const execution = await executionRepo.findByWorkOrder(orderId)
    if (execution) {
      await executionRepo.update(execution.id, {
        observations: observations ?? null,
        progress: 100,
        completedAt: now,
      })
    }

    return finalOrder
  }
}
