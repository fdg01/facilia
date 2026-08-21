// modules/operations/application/use-cases/register-incident.ts
import type {
  IncidentRepository, WorkOrderRepository, AssignmentRepository, ExecutionRepository,
} from '../../domain/repositories'
import type { Incident, IncidentSeverity } from '../../domain/entities'
import { shouldEscalateToWithIncidents, isValidOrderTransition } from '../../domain/services'

interface RegisterIncidentInput {
  readonly workOrderId: string
  readonly organizationId: string
  readonly employeeId: string
  readonly severity: IncidentSeverity
  readonly title: string
  readonly description: string
}

export function createRegisterIncidentUseCase(
  incidentRepo: IncidentRepository,
  orderRepo: WorkOrderRepository,
  assignRepo: AssignmentRepository,
  executionRepo: ExecutionRepository,
) {
  return async function registerIncident(input: RegisterIncidentInput): Promise<Incident> {
    // Validate assignment
    const assignments = await assignRepo.findByWorkOrder(input.workOrderId)
    const isAssigned = assignments.some(
      (a) => a.employeeId === input.employeeId && (a.status === 'accepted' || a.status === 'pending'),
    )
    if (!isAssigned) throw new Error('FORBIDDEN')

    // Get execution if exists
    const execution = await executionRepo.findByWorkOrder(input.workOrderId)

    const incident = await incidentRepo.create({
      workOrderId: input.workOrderId,
      executionId: execution?.id ?? null,
      organizationId: input.organizationId,
      reportedBy: input.employeeId,
      severity: input.severity,
      title: input.title,
      description: input.description,
    })

    // Escalate order to with_incidents if high/critical
    if (shouldEscalateToWithIncidents(input.severity)) {
      const order = await orderRepo.findById(input.workOrderId)
      if (order && isValidOrderTransition(order.status, 'with_incidents')) {
        await orderRepo.updateStatus(order.id, 'with_incidents')
      }
    }

    return incident
  }
}
