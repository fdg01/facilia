// modules/operations/application/use-cases/cancel-order.ts
import type { WorkOrderRepository } from '../../domain/repositories'
import type { WorkOrder } from '../../domain/entities'
import { isValidOrderTransition } from '../../domain/services'

export function createCancelOrderUseCase(orderRepo: WorkOrderRepository) {
  return async function cancelOrder(orderId: string): Promise<WorkOrder> {
    const order = await orderRepo.findById(orderId)
    if (!order) throw new Error('Work order not found')

    if (!isValidOrderTransition(order.status, 'cancelled')) {
      throw new Error(`Cannot cancel order in status ${order.status}`)
    }

    return orderRepo.updateStatus(orderId, 'cancelled')
  }
}
