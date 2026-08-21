// modules/operations/application/use-cases/start-order.ts
import type {
  WorkOrderRepository, AssignmentRepository, ExecutionRepository,
} from '../../domain/repositories'
import type { WorkOrder, Execution } from '../../domain/entities'
import { canStartOrder, isValidOrderTransition } from '../../domain/services'

export function createStartOrderUseCase(
  orderRepo: WorkOrderRepository,
  assignRepo: AssignmentRepository,
  executionRepo: ExecutionRepository,
) {
  return async function startOrder(orderId: string, employeeId: string): Promise<{ order: WorkOrder; execution: Execution }> {
    const order = await orderRepo.findById(orderId)
    if (!order) throw new Error('Work order not found')

    const assignments = await assignRepo.findByWorkOrder(orderId)
    if (!canStartOrder(employeeId, order, assignments)) {
      throw new Error('FORBIDDEN')
    }

    if (!isValidOrderTransition(order.status, 'in_progress')) {
      throw new Error(`Cannot start order in status ${order.status}`)
    }

    const now = new Date()
    const updatedOrder = await orderRepo.updateStatus(orderId, 'in_progress')
    await orderRepo.updateTiming(orderId, { startedAt: now })

    const execution = await executionRepo.create({
      workOrderId: orderId,
      organizationId: order.organizationId,
      employeeId,
    })

    return { order: updatedOrder, execution }
  }
}
