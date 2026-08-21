// modules/operations/application/use-cases/create-adhoc-order.ts
import type { WorkOrderRepository } from '../../domain/repositories'
import type { WorkOrder } from '../../domain/entities'

interface CreateAdhocOrderInput {
  readonly operationalPlanId: string
  readonly organizationId: string
  readonly title: string
  readonly description: string | null
  readonly location: string
  readonly scheduledDate: Date
  readonly estimatedDurationMin: number
}

export function createCreateAdhocOrderUseCase(orderRepo: WorkOrderRepository) {
  return async function createAdhocOrder(input: CreateAdhocOrderInput): Promise<WorkOrder> {
    const number = await orderRepo.getNextNumber()
    return orderRepo.create({
      scheduledServiceId: null,
      operationalPlanId: input.operationalPlanId,
      organizationId: input.organizationId,
      number,
      title: input.title,
      description: input.description,
      location: input.location,
      scheduledDate: input.scheduledDate,
      estimatedDurationMin: input.estimatedDurationMin,
    })
  }
}
