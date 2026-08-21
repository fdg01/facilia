// modules/quoter/application/use-cases/edit-variable.ts
import type { VariableRepository } from '../../domain/repositories'
import type { User } from '../../../identity/domain/entities'
import type { Variable } from '../../domain/entities'
import { canEditDag } from '../../domain/services'

export function createEditVariableUseCase(variableRepo: VariableRepository) {
  return async function editVariable(requester: User, id: string, input: Partial<Variable>): Promise<Variable> {
    if (!canEditDag(requester)) throw new Error('FORBIDDEN')
    return variableRepo.update(id, input)
  }
}
