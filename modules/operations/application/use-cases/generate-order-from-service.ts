// modules/operations/application/use-cases/generate-order-from-service.ts
import type { ScheduledServiceRepository, WorkOrderRepository } from '../../domain/repositories'
import type { WorkOrder } from '../../domain/entities'

export function createGenerateOrderFromServiceUseCase(
  serviceRepo: ScheduledServiceRepository,
  orderRepo: WorkOrderRepository,
) {
  return async function generateOrderFromService(serviceId: string): Promise<WorkOrder> {
    const service = await serviceRepo.findById(serviceId)
    if (!service) throw new Error('Scheduled service not found')

    const year = new Date().getFullYear()
    const number = await orderRepo.getNextNumber()

    const order = await orderRepo.create({
      scheduledServiceId: service.id,
      operationalPlanId: service.operationalPlanId,
      organizationId: service.organizationId,
      number,
      title: service.activity,
      description: null,
      location: service.location ?? '',
      scheduledDate: service.scheduledDate,
      estimatedDurationMin: service.estimatedDurationMin,
    })

    await serviceRepo.updateStatus(service.id, 'generated')
    return order
  }
}
