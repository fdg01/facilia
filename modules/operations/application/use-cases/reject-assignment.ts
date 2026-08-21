// modules/operations/application/use-cases/reject-assignment.ts
import type { AssignmentRepository, WorkOrderRepository } from '../../domain/repositories'
import type { Assignment } from '../../domain/entities'
import { canRejectAssignment, isValidOrderTransition } from '../../domain/services'

export function createRejectAssignmentUseCase(
  assignRepo: AssignmentRepository,
  orderRepo: WorkOrderRepository,
) {
  return async function rejectAssignment(
    assignmentId: string,
    employeeId: string,
    rejectionReason: string,
  ): Promise<Assignment> {
    const assignment = await assignRepo.findById(assignmentId)
    if (!assignment) throw new Error('Assignment not found')

    if (!canRejectAssignment(employeeId, assignment)) {
      throw new Error('FORBIDDEN')
    }

    const updated = await assignRepo.updateStatus(assignmentId, 'rejected', {
      rejectedAt: new Date(),
      rejectionReason,
    })

    // Check if there are other active assignments for this order
    const allAssignments = await assignRepo.findByWorkOrder(assignment.workOrderId)
    const hasActive = allAssignments.some(
      (a) => a.id !== assignmentId && (a.status === 'pending' || a.status === 'accepted'),
    )

    if (!hasActive) {
      const order = await orderRepo.findById(assignment.workOrderId)
      if (order && isValidOrderTransition(order.status, 'created')) {
        await orderRepo.updateStatus(order.id, 'created')
      }
    }

    return updated
  }
}
