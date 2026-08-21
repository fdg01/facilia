// modules/operations/application/use-cases/reassign-personnel.ts
import type { AssignmentRepository } from '../../domain/repositories'
import type { Assignment } from '../../domain/entities'

interface ReassignInput {
  readonly workOrderId: string
  readonly organizationId: string
  readonly employeeIds: string[]
  readonly reason?: string
}

export function createReassignPersonnelUseCase(assignRepo: AssignmentRepository) {
  return async function reassignPersonnel(input: ReassignInput): Promise<Assignment[]> {
    const existing = await assignRepo.findByWorkOrder(input.workOrderId)
    const activeAssignments = existing.filter((a) => a.status === 'pending' || a.status === 'accepted')

    for (const assignment of activeAssignments) {
      await assignRepo.updateStatus(assignment.id, 'reassigned')
    }

    const newAssignments: Assignment[] = []
    for (const employeeId of input.employeeIds) {
      const assignment = await assignRepo.create({
        workOrderId: input.workOrderId,
        employeeId,
        organizationId: input.organizationId,
        crewRole: 'worker',
      })
      newAssignments.push(assignment)
    }

    return newAssignments
  }
}
