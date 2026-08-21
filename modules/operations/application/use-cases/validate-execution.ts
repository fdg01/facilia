// modules/operations/application/use-cases/validate-execution.ts
import type { WorkOrderRepository } from '../../domain/repositories'
import type { WorkOrder } from '../../domain/entities'
import { calculateSla, isValidOrderTransition } from '../../domain/services'

export function createValidateExecutionUseCase(orderRepo: WorkOrderRepository) {
  return async function validateExecution(orderId: string): Promise<WorkOrder> {
    const order = await orderRepo.findById(orderId)
    if (!order) throw new Error('Work order not found')

    if (!isValidOrderTransition(order.status, 'validated')) {
      throw new Error(`Cannot validate order in status ${order.status}`)
    }

    const actualDuration = order.actualDurationMin ?? 0
    const slaMet = calculateSla(
      actualDuration,
      order.estimatedDurationMin,
      order.timeWindow,
      order.finishedAt,
    )

    await orderRepo.updateTiming(orderId, { slaMet })
    return orderRepo.updateStatus(orderId, 'validated')
  }
}
