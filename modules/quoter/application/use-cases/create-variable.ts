// modules/quoter/application/use-cases/create-variable.ts
import type { VariableRepository } from '../../domain/repositories'
import type { User } from '../../../identity/domain/entities'
import type { Variable } from '../../domain/entities'
import { canEditDag } from '../../domain/services'

type CreateVariableInput = {
  type: Variable['type']
  code: string
  label: string
  performanceM2PerHour?: number | null
  supplyCostPerM2?: number | null
  visitsPerMonth?: number | null
}

export function createCreateVariableUseCase(variableRepo: VariableRepository) {
  return async function createVariable(requester: User, input: CreateVariableInput): Promise<Variable> {
    if (!canEditDag(requester)) throw new Error('FORBIDDEN')
    return variableRepo.save(input)
  }
}
