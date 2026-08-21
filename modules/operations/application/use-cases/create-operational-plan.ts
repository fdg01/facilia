// modules/operations/application/use-cases/create-operational-plan.ts
import type { OperationalPlanRepository } from '../../domain/repositories'
import type { PlanActivity } from '../../domain/entities'

interface CreatePlanInput {
  readonly contractId: string
  readonly organizationId: string
  readonly activities: PlanActivity[]
}

export function createCreateOperationalPlanUseCase(planRepo: OperationalPlanRepository) {
  return async function createPlan(input: CreatePlanInput) {
    return planRepo.create(input)
  }
}
