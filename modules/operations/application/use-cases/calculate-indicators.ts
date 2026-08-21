// modules/operations/application/use-cases/calculate-indicators.ts
import type { IndicatorsRepository } from '../../domain/repositories'

interface IndicatorsInput {
  readonly organizationId?: string
  readonly employeeId?: string
  readonly fromDate?: Date
  readonly toDate?: Date
}

export function createCalculateIndicatorsUseCase(indicatorsRepo: IndicatorsRepository) {
  return async function calculateIndicators(input: IndicatorsInput) {
    return indicatorsRepo.calculate(input)
  }
}
