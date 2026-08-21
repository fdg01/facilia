// modules/operations/application/use-cases/accept-assignment.ts
import type { AssignmentRepository, WorkOrderRepository } from '../../domain/repositories'
import type { Assignment } from '../../domain/entities'
import { canAcceptAssignment, isValidOrderTransition } from '../../domain/services'

export function createAcceptAssignmentUseCase(
  assignRepo: AssignmentRepository,
  orderRepo: WorkOrderRepository,
) {
  return async function acceptAssignment(assignmentId: string, employeeId: string): Promise<Assignment> {
    const assignment = await assignRepo.findById(assignmentId)
    if (!assignment) throw new Error('Assignment not found')

    if (!canAcceptAssignment(employeeId, assignment)) {
      throw new Error('FORBIDDEN')
    }

    const updated = await assignRepo.updateStatus(assignmentId, 'accepted', {
      acceptedAt: new Date(),
    })

    const order = await orderRepo.findById(assignment.workOrderId)
    if (order && isValidOrderTransition(order.status, 'accepted')) {
      await orderRepo.updateStatus(order.id, 'accepted')
    }

    return updated
  }
}
