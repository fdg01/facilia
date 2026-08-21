// modules/operations/application/use-cases/assign-personnel.ts
import type { AssignmentRepository, WorkOrderRepository } from '../../domain/repositories'
import type { Assignment } from '../../domain/entities'
import { isValidOrderTransition } from '../../domain/services'

interface AssignInput {
  readonly workOrderId: string
  readonly organizationId: string
  readonly employeeIds: string[]
  readonly crewRoles?: string[]
}

export function createAssignPersonnelUseCase(
  assignRepo: AssignmentRepository,
  orderRepo: WorkOrderRepository,
) {
  return async function assignPersonnel(input: AssignInput): Promise<Assignment[]> {
    const order = await orderRepo.findById(input.workOrderId)
    if (!order) throw new Error('Work order not found')

    if (!isValidOrderTransition(order.status, 'assigned') && order.status !== 'assigned') {
      throw new Error(`Cannot assign from status ${order.status}`)
    }

    const assignments: Assignment[] = []
    for (let i = 0; i < input.employeeIds.length; i++) {
      const assignment = await assignRepo.create({
        workOrderId: input.workOrderId,
        employeeId: input.employeeIds[i],
        organizationId: input.organizationId,
        crewRole: input.crewRoles?.[i] ?? 'worker',
      })
      assignments.push(assignment)
    }

    if (order.status === 'created') {
      await orderRepo.updateStatus(input.workOrderId, 'assigned')
    }

    return assignments
  }
}
