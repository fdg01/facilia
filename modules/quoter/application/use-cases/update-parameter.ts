// modules/quoter/application/use-cases/update-parameter.ts
import type { ParameterRepository, UpdateParameterInput } from '../../domain/repositories'
import type { User } from '../../../identity/domain/entities'
import type { Parameter } from '../../domain/entities'
import { canEditDag } from '../../domain/services'

export function createUpdateParameterUseCase(parameterRepo: ParameterRepository) {
  return async function updateParameter(requester: User, input: UpdateParameterInput): Promise<Parameter> {
    if (!canEditDag(requester)) throw new Error('FORBIDDEN')
    return parameterRepo.update(input, requester.id)
  }
}
